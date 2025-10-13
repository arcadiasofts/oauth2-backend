import { Injectable, NotFoundException } from '@nestjs/common';
import { errors } from 'src/common/const/errors';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  async getUserIdWithEmail(email: string) {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      email,
    });
    if (!user) throw new NotFoundException(errors.INVALID_USER);
    return {
      user: user.id,
    };
  }
}
