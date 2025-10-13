import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  employeeId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isHOD: boolean;

  @Column({ type: 'int', default: 20 })
  maxDailySlots: number;

  @Column({ type: 'text', nullable: true })
  availableSlots: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('Ticket', 'assignedToDoctor')
  assignedTickets: any[];

  @OneToMany('Ticket', 'processedByDoctor')
  processedTickets: any[];

  @OneToMany('Appointment', 'assignedToDoctor')
  appointments: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

