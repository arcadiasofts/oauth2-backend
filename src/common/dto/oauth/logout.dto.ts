import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OauthLogoutDto {
  @IsOptional()
  @IsNumber()
  target_id: number;

  @IsOptional()
  @IsString()
  target_id_type: string;
}
