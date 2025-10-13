import { Test, TestingModule } from '@nestjs/testing';
import { CertService } from './cert.service';
import { DataSource } from 'typeorm';

describe('CertService', () => {
  let service: CertService;

  const mockDataSource = {
    getRepository: jest.fn(() => ({
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CertService>(CertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});