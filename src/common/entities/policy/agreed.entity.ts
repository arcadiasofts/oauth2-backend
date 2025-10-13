import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { PolicyEntity } from './policy.entity';
import { UserEntity } from '../user/user.entity';

@Entity('agreed-policy')
export class AgreedPolicyEntity {
  @PrimaryColumn()
  policy_id: number;

  @PrimaryColumn()
  user_id: number;

  @ManyToOne(() => PolicyEntity, (policy) => policy.agreed_user, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policy_id', referencedColumnName: 'id' })
  policy: PolicyEntity;

  @ManyToOne(() => UserEntity, (user) => user.agreed_policy, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity;

  @Column()
  agreed_at: Date;
}
