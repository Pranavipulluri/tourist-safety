import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  TOURIST = 'TOURIST',
  ADMIN = 'ADMIN'
}

@Entity('tourists')
export class Tourist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TOURIST })
  role: UserRole;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'jsonb', nullable: true })
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  passportNumber: string;

  @Column({ nullable: true })
  nationality: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
