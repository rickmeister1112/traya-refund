import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserType } from './user-type.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  employeeId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'uuid' })
  userTypeId: string;

  @ManyToOne(() => UserType, (userType) => userType.users)
  @JoinColumn({ name: 'userTypeId' })
  userType: UserType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  designation: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  team: string;

  @Column({ type: 'int', nullable: true })
  maxDailyTickets: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('Ticket', 'assignedToUser')
  assignedTickets: any[];

  @OneToMany('Ticket', 'processedByUser')
  processedTickets: any[];

  @OneToMany('Appointment', 'assignedToUser')
  appointments: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

