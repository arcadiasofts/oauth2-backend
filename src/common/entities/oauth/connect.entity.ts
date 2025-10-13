import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AgreedScopeEntity } from './agreed-scope.entity';
import { ApplicationEntity } from '../application/application.entity';
import { UserEntity } from '../user/user.entity';
import { OauthRefreshEntity } from './refresh.entity';

@Entity('oauth-connect')
export class OauthConnectInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  connected_at: Date;

  @Column({ nullable: true })
  nonce?: string;

  @OneToMany(() => AgreedScopeEntity, (agreed) => agreed.connection)
  agreed: AgreedScopeEntity[];

  @ManyToOne(() => ApplicationEntity, (app) => app.connects, {
    onDelete: 'CASCADE',
  })
  application: ApplicationEntity;

  @ManyToOne(() => UserEntity, (user) => user.connects, {
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @OneToMany(() => OauthRefreshEntity, (refresh) => refresh.connect)
  refresh: OauthRefreshEntity[];
}
