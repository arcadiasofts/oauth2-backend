import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('email-cert')
export class EmailCertEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  value: string;

  @Column({ default: false })
  verified: boolean;

  @Column()
  expired_on: Date;

  @Column()
  for?: string;
}
