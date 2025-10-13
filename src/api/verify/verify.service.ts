import { Injectable, Logger } from '@nestjs/common';
import { ApplicationEntity } from 'src/common/entities/application/application.entity';
import { RedirectURIEntity } from 'src/common/entities/application/redirect-uri.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 받아온 핸들이 사용 가능한 상태인지 리턴합니다.
   * @param handle 검증할 핸들을 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  async isHandleAvailable(handle: string): Promise<{ is_available: boolean }> {
    if (!handle) return { is_available: false };
    const regex = /^[a-zA-Z0-9._]+$/;
    if (!regex.test(handle)) return { is_available: false };
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      handle,
    });
    if (user) return { is_available: false };
    else return { is_available: true };
  }

  /**
   * 요청된 Redirect URI가 사용 가능한지 검증합니다.
   * @param clientId 클라이언트 아이디를 받아옵니다
   * @param uri 리다이렉트할 URI를 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  async isOauthRedirectURIAvailable(
    clientId: string,
    uri: string,
  ): Promise<{
    is_available: boolean;
  }> {
    const applicationRepository =
      this.dataSource.getRepository(ApplicationEntity);
    const redirectURIRepository =
      this.dataSource.getRepository(RedirectURIEntity);
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId))
      return {
        is_available: false,
      };
    const app = await applicationRepository.findOneBy({
      id: clientId,
    });
    if (!app) return { is_available: false };
    const redirectURI = await redirectURIRepository.findOneBy({
      value: uri,
      application: app,
    });
    if (!redirectURI) return { is_available: false };
    return {
      is_available: true,
    };
  }
}
