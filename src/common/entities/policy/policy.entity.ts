import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AgreedPolicyEntity } from './agreed.entity';

@Entity('policy')
export class PolicyEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  href: string;

  @Column()
  edited_at: Date;

  @OneToMany(() => AgreedPolicyEntity, (user) => user.policy)
  agreed_user: AgreedPolicyEntity;
}
