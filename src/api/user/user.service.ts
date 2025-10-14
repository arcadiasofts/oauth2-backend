import { Injectable, NotFoundException } from '@nestjs/common';
import { errors } from 'src/common/const/errors';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UserService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 이메일로 유저의 아이디를 가져옵니다.
   * @param email 유저의 이메일을 입력받습니다.
   * @returns 유저의 아이디를 리턴합니다.
   */
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
