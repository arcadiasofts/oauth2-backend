import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('passkey')
export class PasskeyEntity {
  @PrimaryColumn()
  id: string;

  @Column('bytea')
  public_key: Buffer;

  @Column()
  webauthn_user_id: string;

  @Column()
  counter: number;

  @Column()
  backed_up: boolean;

  @Column()
  transports: string;

  @Column()
  device_type: string;

  @Column()
  created_at: Date;

  @Column()
  last_used: Date;

  @ManyToOne(() => UserEntity, (user) => user.passkeys, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;
}
