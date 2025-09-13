import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DigitalTouristId } from './digital-tourist-id.entity';

@Entity('access_logs')
@Index(['digitalTouristId', 'accessedAt'])
@Index(['accessorId', 'accessedAt'])
@Index(['emergencyAccess'])
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => DigitalTouristId, digitalId => digitalId.accessLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'digital_tourist_id' })
  digitalTouristId!: DigitalTouristId;

  @Column()
  accessorId!: string;

  @Column()
  accessorRole!: string;

  @Column()
  accessorWallet!: string;

  @Column({ type: 'text' })
  accessReason!: string;

  @Column({ type: 'boolean', default: false })
  emergencyAccess!: boolean;

  @CreateDateColumn()
  accessedAt!: Date;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ type: 'json', nullable: true })
  dataAccessed?: string[]; // Array of data fields that were accessed

  @Column({ type: 'json', nullable: true })
  accessMetadata?: any; // Additional access context
}