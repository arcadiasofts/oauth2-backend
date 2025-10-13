import { Test, TestingModule } from '@nestjs/testing';
import { OauthService } from './oauth.service';
import { DataSource } from 'typeorm';

describe('OauthService', () => {
  let service: OauthService;

  const mockDataSource = {
    getRepository: jest.fn(() => ({
      findOneBy: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OauthService>(OauthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});