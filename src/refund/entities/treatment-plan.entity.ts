import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('treatment_plans')
export class TreatmentPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  planCode: string;

  @Column({ type: 'varchar', length: 255 })
  planName: string;

  @Column({ type: 'varchar', length: 100 })
  planType: string;

  @Column({ type: 'int' })
  treatmentDurationMonths: number;

  @Column({ type: 'int' })
  requiredKits: number;

  @Column({ type: 'int' })
  maxDeliveryMonths: number;

  @Column({ type: 'varchar', length: 50 })
  kitIdPrefix: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  returnPolicyData: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'int', default: 30 })
  refundWindowDays: number;

  @Column({ type: 'int', default: 3 })
  minimumCallsRequired: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @OneToMany('CustomerPrescription', 'treatmentPlan')
  prescriptions: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

