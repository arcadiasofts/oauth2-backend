import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';
import { ApplicationEntity } from '../entities/application/application.entity';
import { ApplicationAdminKeyPayload } from '../dto/application/admin-key-payload.dto';

@Injectable()
export class OauthAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}
  async canActivate(context: ExecutionContext): Promise<any> {
    try {
      const request = context.switchToHttp().getRequest();
      const authorization: string[] | undefined = ({} = request.headers[
        'Authorization'
      ] as string).split(' ');
      if (!authorization)
        throw new Error("Couldn't find authorization header.");
      const type = authorization[0];
      if (type === 'ArcaID') {
        const clientInfo: ApplicationAdminKeyPayload =
          await this.jwtService.verify(authorization[1]);
        request.client = clientInfo;
        return true;
      } else if (type == 'Bearer') {
        const user = await this.jwtService.verify(authorization[1]);
        request.user = user;
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
}
