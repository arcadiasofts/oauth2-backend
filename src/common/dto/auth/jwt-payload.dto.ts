import { IsNotEmpty } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  id: number;
}
