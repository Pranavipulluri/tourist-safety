import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tourist } from './tourist.entity';

export enum AlertType {
  SOS = 'SOS',
  PANIC = 'PANIC',
  EMERGENCY = 'EMERGENCY',
  MEDICAL = 'MEDICAL',
  ACCIDENT = 'ACCIDENT',
  CRIME = 'CRIME',
  NATURAL_DISASTER = 'NATURAL_DISASTER',
  GEOFENCE_VIOLATION = 'GEOFENCE_VIOLATION',
  HEALTH_EMERGENCY = 'HEALTH_EMERGENCY',
  SECURITY_THREAT = 'SECURITY_THREAT',
  SAFETY_CHECK = 'SAFETY_CHECK'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'enum', enum: AlertSeverity })
  severity: AlertSeverity;

  @Column()
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @Column()
  touristId: string;

  @ManyToOne(() => Tourist)
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
