import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tourist } from '../../entities/tourist.entity';

export enum AlertType {
  SOS = 'SOS',
  PANIC = 'PANIC',
  GEOFENCE = 'GEOFENCE',
  SAFETY_CHECK = 'SAFETY_CHECK',
  EMERGENCY = 'EMERGENCY'
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
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

  @Column({
    type: 'enum',
    enum: AlertType,
    default: AlertType.SOS
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status: AlertStatus;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM
  })
  severity: AlertSeverity;

  @Column('text')
  message: string;

  @Column('decimal', { precision: 10, scale: 8 })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  longitude: number;

  @Column('text', { nullable: true })
  address: string;

  @Column('uuid')
  touristId: string;

  @ManyToOne(() => Tourist)
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;

  @Column('text', { nullable: true })
  acknowledgedBy: string;

  @Column('timestamp', { nullable: true })
  acknowledgedAt: Date;

  @Column('text', { nullable: true })
  resolvedBy: string;

  @Column('timestamp', { nullable: true })
  resolvedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}