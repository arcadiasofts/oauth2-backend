import {
  CopyObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { errors } from 'src/common/const/errors';
import { UpdateProfileDto } from 'src/common/dto/preference/update-profile.dto';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(PreferenceService.name);
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 프로필 정보를 새로운 이미지로 업데이트하고 '/profile' 접두사를 제거합니다.
   * @param updateDto 새로운 이미지의 원본 키 (예: 'profile/userId/uuid')
   * @param userId 유저의 아이디
   */
  async setProfile(updateDto: UpdateProfileDto, userId: number) {
    const profileBucket =
      this.configService.get<string>('AWS_PROFILE_BUCKET') || '';
    const tempBucket = this.configService.get<string>('AWS_TEMP_BUCKET');
    const resizedBucket =
      this.configService.get<string>('AWS_RESIZED_BUCKET') || '';
    const sizes = [64, 128, 256, 512];
    const splitted = updateDto.key.split('.');
    const ext = '.' + splitted[splitted.length - 1];
    const sourceKeyPrefix = updateDto.key.replace(ext, '');
    const destKeyPrefix = sourceKeyPrefix.replace(/^profile\//, '');
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(errors.INVALID_USER);
    }
    const oldProfileKey = user.profile;
    try {
      const res = await axios.post(
        `${this.configService.get<string>('AWS_LAMBDA_URI')}/api/resize-image`,
        {
          key: updateDto.key,
          src_bucket: tempBucket,
          dst_bucket: resizedBucket,
        },
      );
      if (res.status !== 200)
        throw new InternalServerErrorException(
          `Image resize failed: ${res.statusText}`,
        );
      const copyPromises = sizes.map((size) => {
        const sourceKey = `${sourceKeyPrefix}/${size}x${size}.png`;
        const destKey = `${destKeyPrefix}/${size}x${size}.png`;
        const command = new CopyObjectCommand({
          Bucket: profileBucket,
          Key: destKey,
          CopySource: `${resizedBucket}/${sourceKey}`,
          ContentType: 'image/png',
        });
        return this.s3.send(command);
      });
      await Promise.all(copyPromises);
      this.logger.log(`Copied new profile images to key: ${destKeyPrefix}`);
    } catch (e) {
      this.logger.error(`Failed to copy new profile images: ${e.message}`);
      console.log(e.response.data);
      throw new InternalServerErrorException(
        'Failed to process new profile image.',
      );
    }
    try {
      await userRepository.update(
        { id: userId },
        { profile: 'profile/' + destKeyPrefix },
      );
    } catch (dbError) {
      this.logger.error(
        `Failed to update user profile in DB: ${dbError.message}`,
      );
      await this.deleteProfileImages(profileBucket, destKeyPrefix, sizes);
      throw new InternalServerErrorException('Failed to update user profile.');
    }
    if (oldProfileKey && oldProfileKey !== destKeyPrefix) {
      try {
        await this.deleteProfileImages(profileBucket, oldProfileKey, sizes);
        this.logger.log(`Deleted old profile images for key: ${oldProfileKey}`);
      } catch (deleteError) {
        this.logger.warn(
          `Failed to delete old profile images for key ${oldProfileKey}: ${deleteError.message}`,
        );
      }
    }

    return { success: true };
  }

  /**
   * 지정된 키와 사이즈의 프로필 이미지들을 S3에서 삭제하는 헬퍼 함수
   */
  private async deleteProfileImages(
    bucket: string,
    key: string,
    sizes: number[],
  ) {
    const deletePromises = sizes.map((size) => {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: `${key}/${size}x${size}.png`,
      });
      return this.s3.send(command);
    });
    await Promise.all(deletePromises);
  }
}
