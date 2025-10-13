import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';
import RegisterDto from 'src/common/dto/auth/register.dto';
import bcrypt from 'bcrypt';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { errors } from 'src/common/const/errors';
import { LoginDto } from 'src/common/dto/auth/login.dto';

// Mocking bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let dataSource: DeepMocked<DataSource>;
  let jwtService: DeepMocked<JwtService>;
  let configService: DeepMocked<ConfigService>;
  let userRepository: MockRepository<UserEntity>;
  let certRepository: MockRepository<EmailCertEntity>;

  // Mock and DeepMock types for easier mocking
  type MockRepository<T = any> = Partial<Record<keyof T, jest.Mock>>;
  type DeepMocked<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any
      ? jest.Mock
      : DeepMocked<T[K]>;
  };

  const mockRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockDataSource = {
    getRepository: jest.fn(() => mockRepository),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dataSource = module.get(DataSource);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    userRepository = dataSource.getRepository(UserEntity) as any;
    certRepository = dataSource.getRepository(EmailCertEntity) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      nickname: 'tester',
      handle: 'tester_handle',
    };

    it('should register a new user successfully', async () => {
      const certInfo = {
        email: registerDto.email,
        verified: true,
        expiredOn: new Date(Date.now() + 1000 * 60 * 5), // 5 minutes from now
      };
      certRepository.findOneBy.mockResolvedValue(certInfo);
      userRepository.create.mockReturnValue(new UserEntity());
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepository.save.mockResolvedValue(new UserEntity());

      const result = await service.register(registerDto);

      expect(certRepository.findOneBy).toHaveBeenCalledWith({
        email: registerDto.email,
        for: 'register',
      });
      expect(userRepository.create).toHaveBeenCalledWith(registerDto);
      expect(bcrypt.hash).toHaveBeenCalledWith(
        registerDto.password,
        'salt',
      );
      expect(userRepository.save).toHaveBeenCalled();
      expect(result).toEqual({ registered: true });
    });

    it('should throw BadRequestException if certification is invalid', async () => {
      certRepository.findOneBy.mockResolvedValue(null); // No cert info

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException(errors.INVALID_CERTIFICATION),
      );
    });

    it('should throw BadRequestException if certification is not verified', async () => {
      const certInfo = {
        email: registerDto.email,
        verified: false, // Not verified
        expiredOn: new Date(Date.now() + 1000 * 60 * 5),
      };
      certRepository.findOneBy.mockResolvedValue(certInfo);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException(errors.INVALID_CERTIFICATION),
      );
    });

    it('should throw BadRequestException if certification is expired', async () => {
      const certInfo = {
        email: registerDto.email,
        verified: true,
        expiredOn: new Date(Date.now() - 1000), // Expired
      };
      certRepository.findOneBy.mockResolvedValue(certInfo);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException(errors.INVALID_CERTIFICATION),
      );
    });
  });

  describe('validateUser', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
      device_id: 'test-device'
    };
    const user = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
    } as UserEntity;

    it('should return user entity if validation is successful', async () => {
      userRepository.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(loginDto);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        new NotFoundException(errors.INVALID_CREDENTIAL),
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      userRepository.findOneBy.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Password mismatch

      await expect(service.validateUser(loginDto)).rejects.toThrow(
        new UnauthorizedException(errors.INVALID_CREDENTIAL),
      );
    });
  });
});