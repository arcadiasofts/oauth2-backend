import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationEntity } from '../application/application.entity';
import { OauthConnectInfoEntity } from './connect.entity';

@Entity('oauth-refresh')
export class OauthRefreshEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @Column()
  expires_on: Date;

  @ManyToOne(() => OauthConnectInfoEntity, (connect) => connect.refresh, {
    onDelete: 'CASCADE',
  })
  connect: OauthConnectInfoEntity;
}
