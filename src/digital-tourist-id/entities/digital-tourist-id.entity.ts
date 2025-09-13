import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { AccessLog } from './access-log.entity';

@Entity('digital_tourist_ids')
@Index(['touristId', 'status'])
@Index(['blockchainId'], { unique: true })
@Index(['touristWallet'])
@Index(['status', 'expiresAt'])
export class DigitalTouristId {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  blockchainId!: string;

  @Column()
  touristId!: string;

  @Column()
  touristName!: string;

  @Column()
  touristWallet!: string;

  @Column({ type: 'text' })
  personalDataHash!: string;

  @Column({ type: 'text' })
  encryptionKey!: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'EXPIRED', 'REVOKED', 'LOST', 'REPLACED'],
    default: 'ACTIVE'
  })
  status!: string;

  @Column()
  issuerId!: string;

  @Column()
  issuerRole!: string;

  @Column({ type: 'int' })
  validityDays!: number;

  @CreateDateColumn()
  issuedAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkoutTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessed?: Date;

  @Column({ type: 'boolean', default: false })
  emergencyOverride!: boolean;

  @Column({ type: 'int', default: 0 })
  accessCount!: number;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  replacesId?: string; // ID of the Digital ID this replaces (for lost/stolen cases)

  @Column({ type: 'json', nullable: true })
  metadata?: any; // Additional metadata like biometric hashes, etc.

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => AccessLog, accessLog => accessLog.digitalTouristId)
  accessLogs!: AccessLog[];
}