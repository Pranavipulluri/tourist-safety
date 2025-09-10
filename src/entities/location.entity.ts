import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tourist } from './tourist.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  accuracy: number;

  @Column()
  touristId: string;

  @ManyToOne(() => Tourist)
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;

  @CreateDateColumn()
  timestamp: Date;
}
