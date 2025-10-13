import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateRegistrationOptionsDto } from 'src/common/dto/passkey/generate-registration-options.dto';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';
import { errors } from 'src/common/const/errors';
import {
  AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  VerifiedAuthenticationResponse,
  VerifiedRegistrationResponse,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
// 'bcrypt'는 이미 import 되어 있다고 가정합니다.
import * as bcrypt from 'bcrypt';
import {
  ChallengeType,
  PasskeyChallengeEntity,
} from 'src/common/entities/user/passkey-challenge.entity';
import {
  VerifyRegisterPasskeyDto,
  VerifyAuthenticationPasskeyDto,
} from 'src/common/dto/passkey/verify-passkey.dto';
import { PasskeyEntity } from 'src/common/entities/user/passkey.entity';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 패스키를 생성하기 위한 등록 옵션을 생성합니다.
   * @param generateRegistrationOptionsDto 패스키 생성을 위한 정보를 입력받습니다.
   * @param userId 유저의 아이디를 입력받습니다.
   * @returns 등록 옵션을 리턴합니다.
   */
  async generateRegistrationOptions(
    generateRegistrationOptionsDto: GenerateRegistrationOptionsDto,
    userId: number,
  ) {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const challengeRepository = this.dataSource.getRepository(
      PasskeyChallengeEntity,
    );

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: { passkeys: true },
    });
    if (!user) throw new UnauthorizedException();

    const isPwCorrect = await bcrypt.compare(
      generateRegistrationOptionsDto.user_password,
      user.password,
    );
    if (!isPwCorrect) throw new BadRequestException(errors.INVALID_PASSWORD);

    // BUG FIX 1: userID를 문자열 변환 후 Buffer로 생성
    const userIDBuffer = Buffer.from(user.id.toString());

    const options = await generateRegistrationOptions({
      rpID: this.configService.get('PASSKEY_RP_ID')!,
      rpName: this.configService.get('PASSKEY_RP_NAME')!,
      userID: userIDBuffer,
      userName: user.email,
      attestationType: 'none',
      excludeCredentials:
        this.configService.get<string>('NODE_ENV') === 'PROD'
          ? user.passkeys.map((passkey) => ({
              id: passkey.id,
              type: 'public-key',
              transports: passkey.transports
                ? (passkey.transports.split(
                    ',',
                  ) as AuthenticatorTransportFuture[])
                : undefined,
            }))
          : undefined,
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000, // 1분으로 타임아웃 조정 (권장)
    });

    const expires_at = new Date(Date.now() + 60000); // 타임아웃과 일치

    // 기존 챌린지 삭제
    const oldChallenge = await challengeRepository.findOneBy({
      user_id: user.id,
      type: ChallengeType.REGISTRATION,
    });
    if (oldChallenge) await challengeRepository.remove(oldChallenge);

    const challenge = challengeRepository.create({
      challenge: options.challenge,
      expires_at,
      type: ChallengeType.REGISTRATION,
      user_id: user.id,
    });
    await challengeRepository.save(challenge);

    return options;
  }

  /**
   * 패스키 등록 요청 검증 이후, 패스키를 저장합니다.
   * @param verifyRegistrationDto 패스키 정보를 입력받습니다.
   * @param userId 유저 아이디를 입력받습니다.
   * @returns 결과를 리턴합니다.
   */
  async verifyRegistration(
    verifyRegistrationDto: VerifyRegisterPasskeyDto,
    userId: number,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const challengeRepository = queryRunner.manager.getRepository(
      PasskeyChallengeEntity,
    );
    const passkeyRepository = queryRunner.manager.getRepository(PasskeyEntity);
    const userRepository = queryRunner.manager.getRepository(UserEntity);

    try {
      const user = await userRepository.findOneBy({ id: userId });
      if (!user) throw new UnauthorizedException();

      const savedChallenge = await challengeRepository.findOneBy({
        user_id: userId,
        type: ChallengeType.REGISTRATION,
      });
      if (!savedChallenge)
        throw new ConflictException(errors.INVALID_CHALLENGE);

      // 사용한 챌린지는 즉시 삭제
      await challengeRepository.remove(savedChallenge);

      let verification: VerifiedRegistrationResponse;
      try {
        verification = await verifyRegistrationResponse({
          response: verifyRegistrationDto.response,
          expectedChallenge: savedChallenge.challenge,
          expectedOrigin: this.configService.get<string>('FRONTEND_ORIGIN')!,
          expectedRPID: this.configService.get('PASSKEY_RP_ID')!,
          requireUserVerification: true,
        });
      } catch (error: any) {
        this.logger.error(
          `Passkey registration verification failed: ${error.message}`,
        );
        throw new NotAcceptableException(error.message);
      }

      if (verification.verified && verification.registrationInfo) {
        const { credential, credentialDeviceType, credentialBackedUp } =
          verification.registrationInfo;

        const newPasskey = passkeyRepository.create({
          user,
          // userHandle을 저장할 수도 있지만, 여기서는 user 엔티티와 관계를 맺었으므로 생략
          webauthn_user_id: userId.toString(),
          id: credential.id,
          // BUG FIX 3: publicKey를 Buffer 형태로 저장 (DB 컬럼은 bytea 또는 blob 타입이어야 함)
          public_key: Buffer.from(credential.publicKey),
          counter: credential.counter,
          transports: credential.transports?.join(',') ?? '',
          backed_up: credentialBackedUp,
          device_type: credentialDeviceType,
          created_at: new Date(),
          last_used: new Date(),
        });
        await passkeyRepository.save(newPasskey);
        await queryRunner.commitTransaction();
      } else {
        // 검증 실패 시 롤백
        throw new NotAcceptableException('Passkey verification failed.');
      }

      return { verified: verification.verified };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // 에러를 다시 던져서 NestJS가 처리하도록 함
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 인증을 하기 위한 인증 옵션을 생성합니다.
   * @param userId 유저 아이디를 받아옵니다.
   * @returns 생성한 옵션을 리턴합니다.
   */
  async generateAuthenticationOptions(userId: number) {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const challengeRepository = this.dataSource.getRepository(
      PasskeyChallengeEntity,
    );

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: { passkeys: true },
    });
    if (!user) throw new UnauthorizedException();

    // BUG FIX 4: 조건문 구문 오류 수정
    if (!user.passkeys || user.passkeys.length === 0) {
      throw new NotFoundException('No passkeys found for this user.');
    }

    const options = await generateAuthenticationOptions({
      rpID: this.configService.get('PASSKEY_RP_ID')!,
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.id,
        type: 'public-key', // BUG FIX: 'public_key' -> 'public-key'
        transports: passkey.transports
          ? (passkey.transports.split(',') as AuthenticatorTransportFuture[])
          : undefined,
      })),
      userVerification: 'preferred',
      timeout: 60000,
    });

    const expires_at = new Date(Date.now() + 60000);

    // BUG FIX 6: 올바른 타입의 챌린지 삭제
    const oldChallenge = await challengeRepository.findOneBy({
      user_id: user.id,
      type: ChallengeType.AUTHENTICATION,
    });
    if (oldChallenge) await challengeRepository.remove(oldChallenge);

    const challenge = challengeRepository.create({
      challenge: options.challenge,
      expires_at,
      type: ChallengeType.AUTHENTICATION,
      user_id: user.id,
    });
    await challengeRepository.save(challenge);

    return options;
  }

  /**
   * 패스키 인증을 검증하고, 성공 시 로그인 처리(토큰 발급)를 합니다.
   * @param verifyAuthenticationDto
   * @returns { accessToken: string, refreshToken: string }
   */
  async verifyAuthentication(
    verifyAuthenticationDto: VerifyAuthenticationPasskeyDto,
    ip: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const challengeRepository = queryRunner.manager.getRepository(
      PasskeyChallengeEntity,
    );
    const passkeyRepository = queryRunner.manager.getRepository(PasskeyEntity);

    try {
      // credential ID로 passkey를 먼저 찾음
      const passkey = await passkeyRepository.findOne({
        where: { id: verifyAuthenticationDto.response.id },
        relations: { user: true }, // 유저 정보도 함께 로드
      });
      if (!passkey) throw new NotAcceptableException(errors.INVALID_PASSKEY);

      // passkey에 연결된 user ID로 챌린지를 찾음
      const savedChallenge = await challengeRepository.findOneBy({
        user_id: passkey.user.id,
        type: ChallengeType.AUTHENTICATION,
      });
      if (!savedChallenge)
        throw new NotFoundException(
          'Authentication challenge not found or expired.',
        );

      // 사용한 챌린지는 즉시 삭제
      await challengeRepository.remove(savedChallenge);

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse({
          response: verifyAuthenticationDto.response,
          expectedChallenge: savedChallenge.challenge,
          expectedOrigin: this.configService.get<string>('FRONTEND_ORIGIN')!,
          expectedRPID: this.configService.get('PASSKEY_RP_ID')!,
          requireUserVerification: true, // 보안을 위해 true 권장
          credential: {
            id: passkey.id,
            publicKey: new Uint8Array(passkey.public_key), // DB에서 Buffer로 바로 읽어옴
            counter: passkey.counter,
            transports: passkey.transports
              ? (passkey.transports.split(
                  ',',
                ) as AuthenticatorTransportFuture[])
              : undefined,
          },
        });
      } catch (error: any) {
        this.logger.error(
          `Passkey authentication verification failed: ${error.message}`,
        );
        throw new NotAcceptableException(errors.INVALID_PASSKEY);
      }

      if (!verification.verified) {
        throw new NotAcceptableException(errors.INVALID_PASSKEY);
      }

      // BUG FIX 2 (CRITICAL): 인증 카운터 업데이트
      const { newCounter } = verification.authenticationInfo;
      passkey.counter = newCounter;
      passkey.last_used = new Date(); // 마지막 사용 시간 업데이트
      await passkeyRepository.save(passkey);

      // BUG FIX 5: 로그인 처리 및 토큰 발급
      const access_token = await this.authService.generateAccessToken(
        passkey.user,
      );
      const refresh_token = await this.authService.generateRefreshToken(
        passkey.user,
        {
          device_id: verifyAuthenticationDto.device_id,
          email: verifyAuthenticationDto.email,
          os: verifyAuthenticationDto.os,
          password: 'none',
        },
        ip,
      );
      await queryRunner.commitTransaction();

      return { access_token, refresh_token };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
