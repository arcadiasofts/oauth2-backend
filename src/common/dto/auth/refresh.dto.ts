import { IsNotEmpty, IsString } from 'class-validator';

export class JwtRefreshDto {
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}
