import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequireScopeEntity } from '../oauth/require-scope.entity';
import { AgreedScopeEntity } from '../oauth/agreed-scope.entity';

@Entity('application')
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  secret: string;

  @Column({ nullable: true })
  profile?: string;

  @Column({ default: false })
  is_arcadia: boolean;

  @Column({ default: false })
  is_partnership: boolean;

  @OneToMany(() => RequireScopeEntity, (require) => require.application)
  require_scope: RequireScopeEntity;

  @OneToMany(() => AgreedScopeEntity, (agreed) => agreed.application)
  connect: AgreedScopeEntity[];
}
