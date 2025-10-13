import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errors } from 'src/common/const/errors';
import { CreateApplicationDto } from 'src/common/dto/application/create-application.dto';
import { ApplicationEntity } from 'src/common/entities/application/application.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { createRandomString } from 'src/common/util/create-random-string';
import { DataSource } from 'typeorm';
import bcrypt from 'bcrypt';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createApplication(
    createApplicationDto: CreateApplicationDto,
    userId: number,
  ) {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const applicationRepository =
      this.dataSource.getRepository(ApplicationEntity);
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) throw new BadRequestException(errors.INVALID_USER);
    if (!user.is_developer)
      throw new ForbiddenException(errors.REQUIRES_PERMISSIONS);
    const unHashedSecret = createRandomString(20);
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const secret = await bcrypt.hash(unHashedSecret, salt);
    const app = applicationRepository.create({
      ...createApplicationDto,
      secret,
    });
    await applicationRepository.save(app);
    return {
      success: true,
      applicataion_id: app.id,
      application_secret: unHashedSecret,
    };
  }
}
