import { IsNotEmpty } from 'class-validator';

export class RefreshTokenPayloadDto {
  @IsNotEmpty()
  id: number;
}
