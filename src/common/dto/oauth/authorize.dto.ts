import {
  ArrayMinSize,
  arrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class OauthAuthorizeDto {
  @IsNotEmpty()
  @IsUUID()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  response_type: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  agreed: number[];

  @IsOptional()
  @IsString()
  nonce: string;
}
