import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OauthRequireScopeEntity } from './require-scope.entity';
import { AgreedScopeEntity } from './agreed-scope.entity';

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

  @OneToMany(() => OauthRequireScopeEntity, (application) => application.scope)
  require_application: OauthRequireScopeEntity[];

  @OneToMany(() => AgreedScopeEntity, (agreed) => agreed.scope)
  agreed: AgreedScopeEntity[];
}
