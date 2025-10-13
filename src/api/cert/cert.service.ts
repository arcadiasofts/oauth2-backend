import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VerifyEmailDto } from 'src/common/dto/cert/verify-email.dto';
import { CreateEmailCertDto } from 'src/common/dto/cert/create-email-cert-info.dto';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';
import { errors } from 'src/common/const/errors';
import { DataSource } from 'typeorm';
import { UserEntity } from 'src/common/entities/user/user.entity';

@Injectable()
export class CertService {
  private readonly logger = new Logger(CertService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 새로운 이메일 인증 정보를 생성합니다.
   * @param certEmailDto 이메일 인증 정보 생성에 필요한 정보들을 입력받습니다.
   * @returns 결과를 리턴합니다.
   */
  async createEmailCertInfo(
    certEmailDto: CreateEmailCertDto,
  ): Promise<{ created: boolean; is_available: boolean }> {
    const certRepository = this.dataSource.getRepository(EmailCertEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      email: certEmailDto.email,
    });
    if (user) return { created: false, is_available: false };
    const oldCertInfo = await certRepository.findOneBy({
      email: certEmailDto.email,
      for: certEmailDto.for,
    });
    if (oldCertInfo) await certRepository.delete(oldCertInfo);
    const value = Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, '0');
    const expired_on = new Date();
    expired_on.setMinutes(expired_on.getMinutes() + 10);
    const certInfo = certRepository.create({
      email: certEmailDto.email,
      for: certEmailDto.for,
      value,
      expired_on,
      verified: false,
    });
    await certRepository.save(certInfo);
    return { created: true, is_available: true };
  }

  /**
   * 받아온 이메일과 인증번호를 활용해 이메일을 인증합니다.
   * @param certEmailDto 인증에 필요한 정보를 받아옵니다.
   * @returns 결과를 리턴합니다.
   */
  async verifyEmail(
    certEmailDto: VerifyEmailDto,
  ): Promise<{ verified: boolean }> {
    const certRepository = this.dataSource.getRepository(EmailCertEntity);
    const certInfo = await certRepository.findOneBy({
      email: certEmailDto.email,
      for: certEmailDto.for,
    });
    if (!certInfo) throw new NotFoundException(errors.INVALID_USER);
    if (certInfo.expired_on.getTime() < new Date().getTime())
      throw new BadRequestException(errors.TIMEOUT);
    if (certInfo.value !== certEmailDto.value || certInfo.verified)
      throw new BadRequestException(errors.INVALID_CERTIFICATION);
    certInfo.verified = true;
    const newExpiredDate = new Date();
    newExpiredDate.setDate(newExpiredDate.getDate() + 3);
    certInfo.expired_on = newExpiredDate;
    await certRepository.save(certInfo);
    return {
      verified: true,
    };
  }
}
