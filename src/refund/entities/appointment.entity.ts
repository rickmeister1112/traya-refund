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
import { Agent } from './agent.entity';
import { HairCoach } from './hair-coach.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  ticketId: string;

  @ManyToOne('Ticket', 'appointments')
  @JoinColumn({ name: 'ticketId' })
  ticket: any;

  @Column({ type: 'varchar', length: 50 })
  slotType: string;

  @Column({ type: 'timestamp' })
  slotTime: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToDoctorId: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { nullable: true })
  @JoinColumn({ name: 'assignedToDoctorId' })
  assignedToDoctor: Doctor;

  @Column({ type: 'uuid', nullable: true })
  assignedToAgentId: string;

  @ManyToOne(() => Agent, (agent) => agent.appointments, { nullable: true })
  @JoinColumn({ name: 'assignedToAgentId' })
  assignedToAgent: Agent;

  @Column({ type: 'uuid', nullable: true })
  assignedToHairCoachId: string;

  @ManyToOne(() => HairCoach, (hairCoach) => hairCoach.appointments, { nullable: true })
  @JoinColumn({ name: 'assignedToHairCoachId' })
  assignedToHairCoach: HairCoach;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status: string;

  @Column({ type: 'boolean', default: false })
  reminderSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminderSentAt: Date;

  @Column({ type: 'int', default: 0 })
  attemptNumber: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  callPurpose: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

