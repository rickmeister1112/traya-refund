import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Doctor } from './doctor.entity';
import { CallStatus } from '../enums';

@Entity('doctor_calls')
export class DoctorCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column({ type: 'uuid', nullable: true })
  ticketId: string;

  @ManyToOne('Ticket')
  @JoinColumn({ name: 'ticketId' })
  ticket: any;

  @Column({ type: 'varchar', length: 100, nullable: true })
  engagementId: string;

  @Column({ type: 'varchar', length: 50 })
  callPurpose: string;

  @Column({
    type: 'enum',
    enum: CallStatus,
  })
  status: CallStatus;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: false })
  isConnected: boolean;

  @Column({ type: 'int', default: 1 })
  attemptNumber: number;

  @Column({ type: 'timestamp' })
  callTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recordingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

