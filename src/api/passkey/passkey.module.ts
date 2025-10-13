import { Module } from '@nestjs/common';
import { PasskeyController } from './passkey.controller';
import { PasskeyService } from './passkey.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [PasskeyController],
  providers: [PasskeyService, AuthService],
})
export class PasskeyModule {}
