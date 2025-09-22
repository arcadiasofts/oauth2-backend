import { Entity, JoinTable, ManyToOne, PrimaryColumn } from 'typeorm';
import { OauthConnectInfoEntity } from './connect.entity';
import { ApplicationEntity } from '../application/application.entity';

@Entity('agreed-scope')
export class AgreedScopeEntity {
  @PrimaryColumn()
  @ManyToOne(() => OauthConnectInfoEntity, (connect) => connect.agreed)
  @JoinTable({ name: 'connection_id' })
  connection: OauthConnectInfoEntity;

  @PrimaryColumn()
  @ManyToOne(() => ApplicationEntity, (application) => application.connect)
  @JoinTable({ name: 'application_id' })
  application: ApplicationEntity;
}
