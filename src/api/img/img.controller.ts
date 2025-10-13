import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ImgService } from './img.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';
import { ImageUploadDto } from 'src/common/dto/img/upload.dto';

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: '/(jpg|jpeg|png)' }),
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Query('for') uploadFor: string,
    @User('id') userId: number,
  ) {
    return await this.imgService.uploadImages(
      files,
      {
        for: uploadFor,
      },
      userId,
    );
  }
}
