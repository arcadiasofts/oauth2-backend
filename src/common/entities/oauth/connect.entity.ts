import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AgreedScopeEntity } from './agreed-scope.entity';

@Entity('oauth-connect')
export class OauthConnectInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  connected_at: Date;

  @OneToMany(() => AgreedScopeEntity, (agreed) => agreed.connection)
  agreed: AgreedScopeEntity[];
}
