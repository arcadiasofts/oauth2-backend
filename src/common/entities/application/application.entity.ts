import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OauthRequireScopeEntity } from '../oauth/require-scope.entity';
import { AgreedScopeEntity } from '../oauth/agreed-scope.entity';
import { RedirectURIEntity } from './redirect-uri.entity';
import { OauthConnectInfoEntity } from '../oauth/connect.entity';
import { OauthRefreshEntity } from '../oauth/refresh.entity';

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

  @OneToMany(() => OauthRequireScopeEntity, (require) => require.application)
  require_scope: OauthRequireScopeEntity[];

  @OneToMany(
    () => OauthConnectInfoEntity,
    (connection) => connection.application,
  )
  connects: OauthConnectInfoEntity[];

  @OneToMany(() => RedirectURIEntity, (redirect) => redirect.application)
  redirectURI: RedirectURIEntity[];
}
