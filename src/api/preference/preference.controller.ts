import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PreferenceService } from './preference.service';
import { UpdateProfileDto } from 'src/common/dto/preference/update-profile.dto';
import { User } from 'src/common/decorator/get-user';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('preference')
export class PreferenceController {
  constructor(private readonly preferanceService: PreferenceService) {}

  @Post('update-profile')
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @User('id') userId: number,
  ) {
    return await this.preferanceService.setProfile(updateProfileDto, userId);
  }
}
