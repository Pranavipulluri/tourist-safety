import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tourist } from './tourist.entity';

@Entity('digital_ids')
export class DigitalId {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  blockchainHash: string;

  @Column({ unique: true })
  digitalIdNumber: string;

  @Column('text')
  encryptedKycData: string;

  @Column()
  encryptionIv: string;

  @Column()
  encryptionAuthTag: string;

  @Column()
  passportNumber: string;

  @Column()
  nationality: string;

  @Column('date')
  dateOfBirth: Date;

  @Column('date')
  issueDate: Date;

  @Column('date')
  expiryDate: Date;

  @Column({ default: true })
  isValid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('uuid')
  touristId: string;

  @ManyToOne(() => Tourist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'touristId' })
  tourist: Tourist;
}
