import {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class VerifyRegisterPasskeyDto {
  response: RegistrationResponseJSON;
}

export class VerifyAuthenticationPasskeyDto {
  response: AuthenticationResponseJSON;

  @IsNotEmpty()
  @IsString()
  device_id: string;

  @IsNotEmpty()
  @IsString()
  os: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
