import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh-token')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  value: string;

  @Column()
  ipv4: string;

  @Column()
  os: string;

  @Column()
  device_id: string;

  @Column()
  created_at: string;

  @Column()
  expired_on: Date;

  @ManyToOne(() => UserEntity, (user) => user, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;
}
