import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/common/dto/auth/login.dto';
import RegisterDto from 'src/common/dto/auth/register.dto';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { errors } from 'src/common/const/errors';
import { DataSource } from 'typeorm';
import { JwtPayloadDto } from 'src/common/dto/auth/jwt-payload.dto';
import { RefreshTokenEntity } from 'src/common/entities/user/refresh-token.entity';
import { RefreshTokenPayloadDto } from 'src/common/dto/auth/refresh-payload.dto';
import { JwtRefreshDto } from 'src/common/dto/auth/refresh.dto';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입을 진행합니다.
   * @param registerDto  회원가입에 필요한 정보를 담아옵니다.
   * @returns  진행 결과를 리턴합니다.
   */
  async register(registerDto: RegisterDto): Promise<{ registered: boolean }> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const certRepository = this.dataSource.getRepository(EmailCertEntity);
    const certInfo = await certRepository.findOneBy({
      email: registerDto.email,
      for: 'register',
    });
    const checkValid =
      !certInfo || !certInfo.verified || new Date() > certInfo.expired_on;
    if (checkValid) throw new BadRequestException(errors.INVALID_CERTIFICATION);
    const user = userRepository.create({
      ...registerDto,
    });
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);
    user.password = hashedPassword;
    await userRepository.save(user);
    this.logger.log(`Created new user data : ${user.nickname}.`);
    return { registered: true };
  }

  /**
   * 로그인 정보를 검증한 이후, 유저 정보를 리턴합니다.
   * @param loginDto 로그인에 필요한 입력 정보를 받아옵니다.
   * @returns 유저 정보를 리턴합니다.
   */
  async validateUser(loginDto: LoginDto): Promise<UserEntity> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      email: loginDto.email,
    });
    if (!user) throw new NotFoundException(errors.INVALID_CREDENTIAL);
    const validatePw = await bcrypt.compare(loginDto.password, user.password);
    if (!validatePw) throw new UnauthorizedException(errors.INVALID_CREDENTIAL);
    return user;
  }

  /**
   * 유저 정보를 바탕으로 액세스 토큰을 생성합니다.
   * @param user 유저 정보를 받아옵니다.
   * @returns 생성된 토큰 정보를 리턴합니다.
   */
  async generateAccessToken(user: UserEntity): Promise<string> {
    const payload: JwtPayloadDto = {
      id: user.id,
    };
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN');
    const token = await this.jwtService.signAsync(payload, { expiresIn });
    this.logger.log(`Generated new access token for ${user.id}.`);
    return token;
  }

  /**
   * 받아온 정보로 리프래시 토큰을 생성합니다.
   * @param user 유저 정보를 받아옵니다.
   * @param loginDto 로그인 정보를 받아옵니다.
   * @param ip 아이피 정보를 받아옵니다.
   * @returns 생성된 리프래시 토큰을 리턴합니다.
   */
  async generateRefreshToken(
    user: UserEntity,
    loginDto: LoginDto,
    ip: string,
  ): Promise<string> {
    const refreshRepository = this.dataSource.getRepository(RefreshTokenEntity);
    const existingToken = await refreshRepository.find({
      where: {
        user: { id: user.id },
        device_id: loginDto.device_id,
      },
    });
    if (existingToken.length > 0) return existingToken[0].value;
    const payload: RefreshTokenPayloadDto = {
      id: user.id,
    };
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN');
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const token = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret,
    });
    const currentDate = new Date();
    const tokenExpiresAt = new Date(
      currentDate.getTime() + parseInt(expiresIn || ''),
    );
    const generate = refreshRepository.create({
      value: token,
      created_at: new Date().toString(),
      ipv4: ip,
      user: user,
      device_id: loginDto.device_id,
      os: loginDto.os,
      expired_on: tokenExpiresAt,
    });
    await refreshRepository.save(generate);
    this.logger.log(`Generated new refresh token for ${user.id}`);
    return token;
  }

  /**
   * 토큰을 갱신하고, 리프래시 토큰 갱신 기간이 1달 이내로 남았다면 새로 발급합니다.
   * @param refreshDto 리프래시 토큰을 받아옵니다.
   * @returns 액세스 토큰 정보와, 가능하면 리프래시 토큰 정보도 함께 리턴합니다.
   */
  async refresh(
    refreshDto: JwtRefreshDto,
    ip: string,
  ): Promise<{
    access_token: string;
    refresh_token?: string;
  }> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const refreshRepository = this.dataSource.getRepository(RefreshTokenEntity);
    const token = refreshDto.refresh_token;
    let decoded: RefreshTokenPayloadDto;
    try {
      decoded = this.jwtService.verify(token);
    } catch (error) {
      this.logger.warn(
        `Failed to verify refresh token cause : ${error.message}`,
      );
      throw new UnauthorizedException(errors.INVALID_TOKEN);
    }
    const user = await userRepository.findOneBy({ id: decoded.id });
    if (!user) throw new UnauthorizedException(errors.INVALID_TOKEN);
    const refreshData = await refreshRepository.findOneBy({
      user: user,
      value: token,
    });
    if (!refreshData) throw new UnauthorizedException(errors.INVALID_TOKEN);
    if (refreshData.expired_on < new Date())
      throw new UnauthorizedException(errors.INVALID_TOKEN);
    const access_token = await this.generateAccessToken(user);
    refreshData.ipv4 = ip;
    await refreshRepository.save(refreshData);
    let refresh_token: string | undefined;
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    if (refreshData.expired_on < oneMonthLater) {
      refresh_token = await this.generateRefreshToken(
        user,
        { email: user.email, password: '', ...refreshData },
        ip,
      );
      refreshRepository.delete(refreshData);
    }
    this.logger.log(`Generated new access token of ${user.id}`);
    return { access_token, refresh_token };
  }

  /**
   * 현재 세션 정보를 가져옵니다.
   * @param userId 현재 세션의 유저 아이디를 받아옵니다.
   * @returns 세션 정보를 리턴합니다.
   */
  async getSessionInfo(userId: number): Promise<{
    id: number;
    nickname: string;
    handle: string;
    profile: any;
    authority: number;
  }> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) throw new ConflictException('Could not find user information.');
    const profile = {};
    [16, 64, 256, 512].map((i) => {
      profile[i.toString()] =
        `${this.configService.get<string>('USERCDN_URI')}/${user.profile}/${i}x${i}.png`;
    });
    return {
      id: user.id,
      nickname: user.nickname,
      handle: user.handle,
      profile,
      authority: user.authority || 0,
    };
  }
}
