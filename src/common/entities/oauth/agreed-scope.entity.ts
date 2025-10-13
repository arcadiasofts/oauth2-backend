import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ApplicationEntity } from '../application/application.entity';
import { OauthConnectInfoEntity } from './connect.entity';
import { OauthScopeEntity } from './scope.entity';

@Entity('oauth-agreed-scope')
export class AgreedScopeEntity {
  @PrimaryColumn()
  connection_id: string;

  @ManyToOne(() => OauthConnectInfoEntity, (connect) => connect.agreed, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'connection_id' })
  connection: OauthConnectInfoEntity;

  @PrimaryColumn()
  scope_id: number;

  @ManyToOne(() => OauthScopeEntity, (scope) => scope, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scope_id' })
  scope: OauthScopeEntity;
}
