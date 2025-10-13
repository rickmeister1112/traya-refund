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
import { Customer } from './customer.entity';
import { Doctor } from './doctor.entity';

@Entity('customer_prescriptions')
export class CustomerPrescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  prescriptionNumber: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  kitId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid', nullable: true })
  treatmentPlanId: string;

  @ManyToOne('TreatmentPlan', 'prescriptions', { nullable: true })
  @JoinColumn({ name: 'treatmentPlanId' })
  treatmentPlan: any;

  @Column({ type: 'uuid', nullable: true })
  prescribedByDoctorId: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: 'prescribedByDoctorId' })
  prescribedByDoctor: Doctor;

  @Column({ type: 'int' })
  treatmentDurationMonths: number;

  @Column({ type: 'int' })
  requiredKits: number;

  @Column({ type: 'varchar', length: 100 })
  planType: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp' })
  prescribedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  planStartedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedCompletionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualCompletionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('PrescriptionProduct', 'prescription')
  prescribedProducts: any[];

  @OneToMany('OrderHistory', 'prescription')
  orderHistory: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

