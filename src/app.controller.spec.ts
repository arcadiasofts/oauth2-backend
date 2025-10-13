import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return main page', () => {
      expect(appController.getHello()).toBe(
        '<html><head><title>Arcadiasofts Account.</title></head><body><h1>Arcadiasofts Account System v.0.0.1</h1></body></html>',
      );
    });
  });
});
