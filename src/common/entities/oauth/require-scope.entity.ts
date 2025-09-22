import { Column, Entity, JoinTable, ManyToOne, PrimaryColumn } from 'typeorm';
import { OauthScopeEntity } from './scope.entity';
import { ApplicationEntity } from '../application/application.entity';

@Entity('require-scope')
export class RequireScopeEntity {
  @PrimaryColumn()
  @ManyToOne(() => OauthScopeEntity, (scope) => scope.require_application, {
    onDelete: 'CASCADE',
  })
  @JoinTable({ name: 'scope_id' })
  scope: OauthScopeEntity;

  @PrimaryColumn()
  @ManyToOne(
    () => ApplicationEntity,
    (application) => application.require_scope,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinTable({ name: 'application_id' })
  application: ApplicationEntity;

  @Column({ default: false })
  is_essential: boolean;
}
