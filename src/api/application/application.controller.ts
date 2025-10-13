import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CreateApplicationDto } from 'src/common/dto/application/create-application.dto';
import { User } from 'src/common/decorator/get-user';

@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  async createApplciation(
    @Body() createApplcationDto: CreateApplicationDto,
    @User('id') userId: number,
  ) {
    return await this.applicationService.createApplication(
      createApplcationDto,
      userId,
    );
  }
}
