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
import { OrderStatus } from '../enums';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  products: string;

  @Column({ type: 'int', default: 0 })
  productCount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 50, default: 'prepaid' })
  paymentMode: string;

  @Column({ type: 'boolean', default: false })
  isDelivered: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'boolean', default: false })
  isVoid: boolean;

  @Column({ type: 'boolean', default: false })
  isCODNonVoid: boolean;

  @Column({ type: 'int', comment: 'Treatment duration in months' })
  treatmentDurationMonths: number;

  @Column({ type: 'int', comment: 'Number of consecutive months completed' })
  monthsCompleted: number;

  @Column({ type: 'boolean', default: false })
  isRegular: boolean;

  @Column({ type: 'boolean', default: false })
  isRecommendedKit: boolean;

  @Column({ type: 'boolean', default: false })
  isFreeKit: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany('Ticket', 'order')
  tickets: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}

