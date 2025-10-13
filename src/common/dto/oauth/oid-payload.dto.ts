import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class OauthOIDTokenPayload {
  @IsNotEmpty()
  @IsString()
  iss: string;

  @IsNotEmpty()
  @IsString()
  aud: string;

  @IsNotEmpty()
  @IsString()
  sub: string;

  @IsNotEmpty()
  @IsNumber()
  iat: number;

  @IsNotEmpty()
  @IsNumber()
  exp: number;

  @IsNotEmpty()
  @IsNumber()
  auth_time: number;

  @IsString()
  @IsOptional()
  nonce?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  profile_picture?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
