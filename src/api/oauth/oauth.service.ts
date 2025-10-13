import { NotFound } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { errors } from 'src/common/const/errors';
import { OauthAuthorizeDto } from 'src/common/dto/oauth/authorize.dto';
import { OauthGetTokenDto } from 'src/common/dto/oauth/get-token.dto';
import { ApplicationEntity } from 'src/common/entities/application/application.entity';
import { RedirectURIEntity } from 'src/common/entities/application/redirect-uri.entity';
import { AgreedScopeEntity } from 'src/common/entities/oauth/agreed-scope.entity';
import { OauthConnectInfoEntity } from 'src/common/entities/oauth/connect.entity';
import { OauthRequireScopeEntity } from 'src/common/entities/oauth/require-scope.entity';
import { OauthScopeEntity } from 'src/common/entities/oauth/scope.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource, In } from 'typeorm';
import bcrypt from 'bcrypt';
import { OauthRefreshEntity } from 'src/common/entities/oauth/refresh.entity';
import { isUUID } from 'class-validator';
import { RefreshTokenPayloadDto } from 'src/common/dto/auth/refresh-payload.dto';
import { JwtPayloadDto } from 'src/common/dto/auth/jwt-payload.dto';
import { OauthOIDTokenPayload } from 'src/common/dto/oauth/oid-payload.dto';

const CLIENT_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 유저의 토큰을 검증합니다.
   * @param type 토큰의 타입을 입력합니다. 현재 Bearer만 지원합니다.
   * @param value 토큰의 값을 입력합니다.
   * @returns 결과를 리턴합니다.
   */
  private async verifyAuthorization(
    type: string,
    value: string,
    accept: string[] = ['Bearer'],
  ): Promise<{
    type: string;
    verified: boolean;
  }> {
    this.logger.debug(`
      Verifing authorization - Type : ${type}, Accept: ${accept.join(',')}`);
    if (!accept.includes(type)) {
      this.logger.warn(
        `Authorization verification failed: Unsupported type ${type}`,
      );
      throw new BadRequestException(errors.INVALID_AUTHORIZATION_TYPE);
    }
    if (type === 'Bearer') {
      try {
        const verified = await this.jwtService.verify(value);
        this.logger.debug(
          `Bearer token verified successfully for user ${verified.user_id}`,
        );
        return { type: 'Bearer', verified: verified };
      } catch (error) {
        this.logger.warn(`Token verification failed: ${error.message}`);
        throw new UnauthorizedException(errors.INVALID_TOKEN);
      }
    }
    this.logger.warn(`Invalid token type: ${type}`);
    throw new BadRequestException(errors.INVALID_AUTHORIZATION_TYPE);
  }

  /**
   * 입력받은 클라이언트 아이디로 클라이언트를 검증합니다.
   * @param clientId 클라이언트 아이디를 입력합니다.
   * @returns 클라이언트 정보를 리턴합니다.
   */
  private async verifyClient(clientId: string): Promise<ApplicationEntity> {
    if (!CLIENT_ID_REGEX.test(clientId)) {
      this.logger.warn(`Invalid client ID format: ${clientId}`);
      throw new NotFoundException(errors.INVALID_CLIENT);
    }
    const client = await this.dataSource
      .getRepository(ApplicationEntity)
      .findOne({
        where: { id: clientId },
        relations: {
          require_scope: true,
        },
      });
    if (!client) throw new NotFoundException(errors.INVALID_CLIENT);
    return client;
  }

  private async handleAuthorizationCode() {}

  /**
   * 애플리케이션의 정보를 가져옵니다.
   * @param appId 정보를 가져올 애플리케이션의 아이디를 받아옵니다.
   * @returns 애플리케이션 정보를 리턴합니다.
   */
  async getApplicationData(appId: string) {
    if (!CLIENT_ID_REGEX.test(appId)) throw new NotFoundException();
    const applicationRepository =
      this.dataSource.getRepository(ApplicationEntity);
    const app = await applicationRepository.findOne({
      where: {
        id: appId,
      },
      relations: {
        require_scope: {
          scope: true,
        },
      },
    });
    if (!app) throw new NotFoundException();
    const require_scope = app.require_scope.map((item) => ({
      scope_id: item.scope_id,
      title: item.scope.title,
      description: item.scope.description,
      is_essential: item.is_essential,
    }));
    return {
      title: app.title,
      profile: app.profile,
      require_scope,
      is_arcadia: app.is_arcadia,
      is_partnership: app.is_partnership,
    };
  }

  /**
   * 새로운 클라이언트와 유저의 연결을 생성합니다.
   * @param authorizeDto 인증에 필요한 정보들을 입력합니다.
   * @param userId 유저의 아이디를 리턴합니다.
   */
  async authorize(authorizeDto: OauthAuthorizeDto, userId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let code: string;
    try {
      const repositories = {
        user: queryRunner.manager.getRepository(UserEntity),
        app: queryRunner.manager.getRepository(ApplicationEntity),
        scope: queryRunner.manager.getRepository(OauthScopeEntity),
        connect: queryRunner.manager.getRepository(OauthConnectInfoEntity),
        requires: queryRunner.manager.getRepository(OauthRequireScopeEntity),
        agreed: queryRunner.manager.getRepository(AgreedScopeEntity),
      };
      const [user, application] = await Promise.all([
        repositories.user.findOne({
          where: { id: userId },
        }),
        this.verifyClient(authorizeDto.client_id),
      ]);
      if (!user) throw new BadRequestException(errors.INVALID_USER);
      const essentialScopeIds = application.require_scope
        .filter((item) => item.is_essential)
        .map((item) => item.scope_id);
      const agreedEssentialIds = authorizeDto.agreed.filter((id) =>
        essentialScopeIds.includes(id),
      );
      if (agreedEssentialIds.length < essentialScopeIds.length) {
        throw new NotAcceptableException('Essential scopes not agreed.');
      }
      let connectInfo = await repositories.connect.findOne({
        where: {
          user: { id: user.id },
          application: { id: application.id },
        },
        relations: ['agreed', 'agreed.scope'],
      });
      const requestedScopes = await repositories.scope.find({
        where: { id: In(authorizeDto.agreed) },
      });
      if (connectInfo) {
        const existingAgreedScopeIds = connectInfo.agreed.map(
          (a) => a.scope.id,
        );
        const scopesToAdd = requestedScopes.filter(
          (s) => !existingAgreedScopeIds.includes(s.id),
        );
        if (scopesToAdd.length === 0) {
          throw new NotAcceptableException(errors.NOTHING_TO_DO);
        }
        const newAgreedItems = scopesToAdd.map((scope) => {
          if (!connectInfo) throw new ConflictException();
          return repositories.agreed.create({
            connection: connectInfo,
            scope: scope,
          });
        });
        await repositories.agreed.save(newAgreedItems); // 새로 추가될 항목들만 저장
        code = connectInfo.id;
      } else {
        connectInfo = repositories.connect.create({
          application,
          user,
          connected_at: new Date(),
        });
        await repositories.connect.save(connectInfo);
        const newAgreedItems = requestedScopes.map((scope) => {
          if (!connectInfo) throw new ConflictException();
          return repositories.agreed.create({
            connection: connectInfo,
            scope: scope,
          });
        });
        await repositories.agreed.save(newAgreedItems);
        code = connectInfo.id;
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error(`Oauth2 authorization failed: ${error.message}`);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
    return {
      status: 'success',
      message: 'Authorization successful.',
      code,
    };
  }

  /**
   * oauth의 연결 정보를 가져옵니다.
   * @param clientId 클라이언트 아이디를 받아옵니다.
   * @param userId 유저 아이디를 받아옵니다
   * @returns 연결 id, 동의 항목을 리턴합니다.
   */
  async getConnectionInfo(clientId: string, userId: number) {
    if (!CLIENT_ID_REGEX.test(clientId)) return { found: false };
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const repositories = {
      user: queryRunner.manager.getRepository(UserEntity),
      client: queryRunner.manager.getRepository(ApplicationEntity),
      connection: queryRunner.manager.getRepository(OauthConnectInfoEntity),
    };
    let connectInfo: OauthConnectInfoEntity;
    try {
      const client = await repositories.client.findOneBy({ id: clientId });
      const user = await repositories.user.findOneBy({ id: userId });
      if (!client || !user) throw new BadRequestException(errors.INVALID_USER);
      const tempConnectInfo = await repositories.connection.findOne({
        where: {
          user,
          application: client,
        },
        relations: {
          agreed: true,
        },
      });
      if (!tempConnectInfo) return { found: false };
      connectInfo = tempConnectInfo;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    } finally {
      queryRunner.release();
    }
    return {
      found: true,
      connect_id: connectInfo.id,
      agreed: connectInfo.agreed,
    };
  }

  async createOpenIDToken(
    connect: OauthConnectInfoEntity,
    clientId: string,
  ): Promise<{ id_token: string; id_token_expires_in: number }> {
    const now = new Date();
    const expiresIn = this.configService.get<string>('OAUTH_OID_EXPIRES_IN');
    const expiresDate = new Date(now.getTime() + parseInt(expiresIn ?? '0'));
    let payload: OauthOIDTokenPayload = {
      iss: 'https://account.arcadiasofts.com',
      aud: clientId,
      sub: connect.user.id.toString(),
      iat: new Date().getTime(),
      exp: expiresDate.getTime(),
      auth_time: now.getTime(),
      nonce: connect.nonce,
    };
    const tempAgreed = connect.agreed.map((item) => item.scope.value);
    const agreed = [...new Set(tempAgreed)];
    const user = connect.user;
    if (agreed.includes('user.profile')) payload.profile_picture = user.profile;
    if (agreed.includes('user.nickname')) payload.nickname = user.nickname;
    if (agreed.includes('user.email')) payload.email = user.email;
    const id_token = await this.jwtService.signAsync(payload, {
      expiresIn,
    });
    return {
      id_token,
      id_token_expires_in: expiresDate.getTime(),
    };
  }

  /**
   * Oauth 인증을 위한 액세스 토큰을 생성합니다.
   * @param userId 유저 아이디를 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  async createAccessToken(
    connect: OauthConnectInfoEntity,
  ): Promise<{ access_token: string; access_token_expires_in }> {
    const payload: JwtPayloadDto = {
      id: connect.user.id,
    };
    const expiresIn = this.configService.get<string>('OAUTH_JWT_EXPIRES_IN');
    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn,
    });
    const expiresDate = new Date(
      new Date().getTime() + parseInt(expiresIn ?? '0'),
    );
    return {
      access_token,
      access_token_expires_in: expiresDate.getTime(),
    };
  }

  /**
   * Oauth 인증을 위한 리프래시 토큰을 생성합니다.
   * @param userId 유저 아이디를 받아옵니다.
   * @param connect 연결 정보를 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  private async createRefreshToken(
    connect: OauthConnectInfoEntity,
  ): Promise<{ refresh_token: string; refresh_token_expires_in: number }> {
    const payload: RefreshTokenPayloadDto = {
      id: connect.user.id,
    };
    const refreshRepository = this.dataSource.getRepository(OauthRefreshEntity);
    const expiresIn = this.configService.get<string>(
      'OAUTH_REFRESH_EXPIRES_IN',
    );
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const token = await this.jwtService.signAsync(payload, {
      expiresIn,
      secret,
    });
    const expiresDate = new Date(
      new Date().getTime() + parseInt(expiresIn ?? '0'),
    );
    const refresh = refreshRepository.create({
      value: token,
      expires_on: expiresDate,
      connect,
    });
    await refreshRepository.save(refresh);
    return {
      refresh_token: token,
      refresh_token_expires_in: expiresDate.getTime(),
    };
  }

  /**
   * 애플리케이션이 토큰을 요청할 때, 해당 토큰을 생성힌 후 반환합니다.
   * @param getTokenDto 필요한 정보들을 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  async getToken(getTokenDto: OauthGetTokenDto) {
    const clientRepository = this.dataSource.getRepository(ApplicationEntity);
    const connectRepository = this.dataSource.getRepository(
      OauthConnectInfoEntity,
    );
    const client = await clientRepository.findOneBy({
      id: getTokenDto.client_id,
    });
    if (!getTokenDto.code || !getTokenDto.redirect_uri)
      throw new BadRequestException('Invalid params.');
    if (!isUUID(getTokenDto.client_id) || !isUUID(getTokenDto.code))
      throw new BadRequestException('Invalid client id or code.');
    if (!client) throw new NotFoundException('Application not found.');
    const redirectURIRepository =
      this.dataSource.getRepository(RedirectURIEntity);
    const redirectURI = await redirectURIRepository.findOneBy({
      application: client,
      value: getTokenDto.redirect_uri,
    });
    if (!redirectURI) throw new NotAcceptableException('Invalid redirect uri.');
    const isPwCorrect = await bcrypt.compare(
      getTokenDto.client_secret,
      client.secret,
    );
    if (!isPwCorrect) throw new UnauthorizedException('Invalid client secret.');
    const connect = await connectRepository.findOne({
      where: {
        id: getTokenDto.code,
      },
      relations: {
        user: true,
        agreed: {
          scope: true,
        },
      },
    });
    if (!connect) throw new NotFoundException('Connection info not found.');
    const { id_token, id_token_expires_in } = await this.createOpenIDToken(
      connect,
      getTokenDto.client_id,
    );
    const { access_token, access_token_expires_in } =
      await this.createAccessToken(connect);
    const { refresh_token, refresh_token_expires_in } =
      await this.createRefreshToken(connect);
    const scope = connect.agreed.map((item) => item.scope.title).join(',');
    return {
      token_type: 'bearer',
      id_token,
      id_token_expires_in,
      access_token,
      access_token_expires_in,
      refresh_token,
      refresh_token_expires_in,
      scope,
    };
  }
}
