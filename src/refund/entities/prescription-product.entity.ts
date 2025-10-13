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
import { Product } from './product.entity';

@Entity('prescription_products')
export class PrescriptionProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  prescriptionId: string;

  @ManyToOne('CustomerPrescription', 'prescribedProducts')
  @JoinColumn({ name: 'prescriptionId' })
  prescription: any;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  frequency: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'int', default: 30 })
  daysToExhaust: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

