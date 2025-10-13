import { IsNotEmpty, IsUUID } from 'class-validator';

export class ApplicationAdminKeyPayload {
  @IsNotEmpty()
  @IsUUID()
  client_id: string;

  @IsNotEmpty()
  client_secret: string;
}
