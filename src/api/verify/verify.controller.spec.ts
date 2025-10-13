import { Test, TestingModule } from '@nestjs/testing';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

describe('VerifyController', () => {
  let controller: VerifyController;

  const mockVerifyService = {
    isHandleAvailable: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerifyController],
      providers: [{ provide: VerifyService, useValue: mockVerifyService }],
    }).compile();

    controller = module.get<VerifyController>(VerifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});