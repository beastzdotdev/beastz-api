import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty } from 'class-validator';
import { NoAuth } from '../decorator/no-auth.decorator';
import { MailService } from './@global/mail/mail.service';
import { MultiFormFileToBodyParserInterceptor } from '../interceptor/multi-form-data-parser.interceptor';
import { IsMulterFile } from '../decorator/class-validator.decorator';

class TestUpload3 {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  file1: Express.Multer.File;

  @IsNotEmpty()
  @IsMulterFile()
  file2: Express.Multer.File;
}

@Controller()
export class AppController {
  constructor(private readonly mailService: MailService) {}

  @NoAuth()
  @Get('health')
  healthCheck() {
    return 'ok';
  }

  @Get('secure/health')
  checkHealthForAuth() {
    return 'ok';
  }

  @NoAuth()
  @Post('upload/3')
  @UseInterceptors(AnyFilesInterceptor(), MultiFormFileToBodyParserInterceptor)
  uploadFile3(@Body() x: TestUpload3) {
    console.log(x);
  }
}
