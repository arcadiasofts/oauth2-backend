import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailCertDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  for: string;
}
