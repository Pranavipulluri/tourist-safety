import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum GeofenceType {
  SAFE_ZONE = 'safe_zone',
  RESTRICTED_ZONE = 'restricted_zone',
  TOURIST_AREA = 'tourist_area',
  EMERGENCY_ZONE = 'emergency_zone'
}

@Entity('geofences')
export class Geofence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: GeofenceType })
  type: GeofenceType;

  @Column({ type: 'jsonb' })
  coordinates: {
    latitude: number;
    longitude: number;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  centerLatitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  centerLongitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  radius: number; // in meters

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  alertMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
