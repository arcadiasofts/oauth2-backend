import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RefreshTokenEntity } from './refresh-token';
import { AgreedPolicyEntity } from '../policy/agreed.entity';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0, nullable: true })
  authority?: number;

  @Column()
  @Index()
  handle: string;

  @Column()
  @Index()
  nickname: string;

  @Column()
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  gender?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  @Index()
  tel?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ default: false, nullable: true })
  is_developer?: boolean;

  @Column({ default: false, nullable: true })
  is_company?: string;

  @OneToMany(() => RefreshTokenEntity, (refresh) => refresh.user)
  refresh_token: RefreshTokenEntity[];

  @OneToMany(() => AgreedPolicyEntity, (agreed) => agreed.user)
  agreed_policy: AgreedPolicyEntity[];
}
