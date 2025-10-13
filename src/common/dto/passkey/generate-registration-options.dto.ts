import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateRegistrationOptionsDto {
  @IsNotEmpty()
  @IsString()
  user_password: string;
}
