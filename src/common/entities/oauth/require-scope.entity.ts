import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OauthScopeEntity } from './scope.entity';
import { ApplicationEntity } from '../application/application.entity';

@Entity('oauth-require-scope')
export class OauthRequireScopeEntity {
  @PrimaryColumn()
  scope_id: number;

  @PrimaryColumn()
  application_id: string;

  @ManyToOne(() => OauthScopeEntity, (scope) => scope.require_application, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scope_id' })
  scope: OauthScopeEntity;

  @ManyToOne(
    () => ApplicationEntity,
    (application) => application.require_scope,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'application_id' })
  application: ApplicationEntity;

  @Column({ default: false })
  is_essential: boolean;
}
