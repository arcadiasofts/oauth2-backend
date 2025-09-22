import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RequireScopeEntity } from './require-scope.entity';

@Entity('oauth-scope')
export class OauthScopeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  value: string;

  @OneToMany(() => RequireScopeEntity, (application) => application.scope)
  require_application;
}
