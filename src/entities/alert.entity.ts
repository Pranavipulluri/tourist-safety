import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tourist } from './tourist.entity';

export enum AlertType {
  SOS = 'sos',
  GEOFENCE_VIOLATION = 'geofence_violation',
  HEALTH_EMERGENCY = 'health_emergency',
  SECURITY_THREAT = 'security_threat'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
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
