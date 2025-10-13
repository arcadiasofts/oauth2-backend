import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class OauthGetTokenDto {
  @IsNotEmpty()
  @IsString()
  grant_type: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  client_secret: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  code?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  redirect_uri?: string;

  @IsOptional()
  @IsString()
  refresh_token: string;
}
