import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PolicyEntity } from './policy.entity';
import { UserEntity } from '../user/user.entity';

@Entity('agreed-policy')
export class AgreedPolicyEntity {
  @PrimaryColumn()
  @ManyToOne(() => PolicyEntity, (policy) => policy.agreed_user, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'policy_id' })
  policy: PolicyEntity;

  @PrimaryColumn()
  @ManyToOne(() => UserEntity, (user) => user.agreed_policy, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column()
  agreed_at: Date;
}
