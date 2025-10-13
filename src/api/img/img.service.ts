import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto'; // 👈 crypto 모듈 추가
import { ImageUploadDto } from 'src/common/dto/img/upload.dto';

@Injectable()
export class ImgService {
  private readonly logger = new Logger(ImgService.name);
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 임시 이미지 파일들을 S3 버킷에 업로드합니다. (최적화 버전)
   * @param files 업로드할 파일들
   * @param imageUploadDto 이미지 용도(for)
   * @param userId 유저 ID
   * @returns 업로드된 파일들의 정보와 고유 키 배열
   */
  async uploadImages(
    files: Express.Multer.File[],
    imageUploadDto: ImageUploadDto,
    userId: number,
  ) {
    const bucket = this.configService.get('AWS_TEMP_BUCKET') || '';
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const ext = file.originalname.split('.').pop() || '';
        const uuid = randomUUID();
        const key = `${imageUploadDto.for}/${userId}/${Date.now()}-${uuid}.${ext}`;
        this.logger.log(
          `Uploading ${file.originalname} to s3://${bucket}/${key}`,
        );
        try {
          await this.s3.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
        } catch (e: any) {
          this.logger.error(`Failed to upload ${key}: ${e.message}`);
          throw new InternalServerErrorException(
            `Failed to upload file: ${file.originalname}`,
          );
        }
        this.logger.log(`Successfully uploaded ${key} to ${bucket}`);
        return {
          originalname: file.originalname,
          key,
          size: file.size,
          type: file.mimetype,
        };
      }),
    );
    return {
      success: true,
      files: uploadedFiles,
    };
  }
}
