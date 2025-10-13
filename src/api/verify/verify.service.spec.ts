import { Test, TestingModule } from '@nestjs/testing';
import { VerifyService } from './verify.service';
import { DataSource } from 'typeorm';

describe('VerifyService', () => {
  let service: VerifyService;

  const mockDataSource = {
    getRepository: jest.fn(() => ({
      findOneBy: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<VerifyService>(VerifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});