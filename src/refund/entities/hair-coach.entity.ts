import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('hair_coaches')
export class HairCoach {
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

  @Column({ type: 'int', default: 30 })
  maxDailyCustomers: number;

  @Column({ type: 'text', nullable: true })
  availableSlots: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('HairCoachCall', 'hairCoach')
  calls: any[];

  @OneToMany('Customer', 'assignedHairCoach')
  assignedCustomers: any[];

  @OneToMany('Appointment', 'assignedToHairCoach')
  appointments: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

