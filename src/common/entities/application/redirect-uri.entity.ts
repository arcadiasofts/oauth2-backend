import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApplicationEntity } from './application.entity';

@Entity('redirect-uri')
export class RedirectURIEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title?: string;

  @Column()
  value: string;

  @ManyToOne(() => ApplicationEntity, (app) => app.redirectURI, {
    onDelete: 'CASCADE',
  })
  application: ApplicationEntity;
}
