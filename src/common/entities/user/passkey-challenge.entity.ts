import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ChallengeType {
  REGISTRATION = 'REGISTRATION',
  AUTHENTICATION = 'AUTHENTICATION',
}

@Entity('passkey-challenge')
export class PasskeyChallengeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  challenge: string;

  @Column()
  type: string;

  @Column()
  user_id: number;

  @Column()
  expires_at: Date;
}
