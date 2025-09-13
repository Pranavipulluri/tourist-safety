import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blockchain_events')
@Index(['eventType'])
@Index(['blockchainId'])
@Index(['timestamp'])
export class BlockchainEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  eventType!: string;

  @Column({ nullable: true })
  blockchainId?: string;

  @Column({ nullable: true })
  touristId?: string;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  timestamp!: Date;
}