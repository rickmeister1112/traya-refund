import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './controllers/ticket.controller';
import { DoctorController } from './controllers/doctor.controller';
import { CustomerController } from './controllers/customer.controller';
import { PrescriptionController } from './controllers/prescription.controller';
import { OrderHistoryController } from './controllers/order-history.controller';
import { ProductController } from './controllers/product.controller';
import { HairCoachController } from './controllers/hair-coach.controller';
import { UserController } from './controllers/user.controller';
import { UserTypeController } from './controllers/user-type.controller';
import { TransactionController } from './controllers/transaction.controller';
import { AuthModule } from './modules/auth.module';
import { PrescriptionTrackerController } from './controllers/prescription-tracker.controller';
import { ActivityController } from './controllers/activity.controller';
import { KitManagementController } from './controllers/kit-management.controller';
import { TreatmentPlanController } from './controllers/treatment-plan.controller';
import { AppointmentController } from './controllers/appointment.controller';
import { PaymentTransactionController } from './controllers/payment-transaction.controller';
import {
  Customer,
  Ticket,
  Transaction,
  PaymentTransaction,
  Appointment,
  BankDetails,
  Communication,
  Doctor,
  HairCoach,
  HairCoachCall,
  DoctorCall,
  UserType,
  User,
  Product,
  CustomerPrescription,
  PrescriptionProduct,
  OrderHistory,
  CustomerActivity,
  TreatmentPlan,
} from './entities';
import {
  TicketService,
  AppointmentService,
  CommunicationService,
} from './services';
import { SeedService } from './services/seed.service';
import { EligibilityEngineV2Service } from './services/eligibility-engine-v2.service';
import { SchedulerService } from './services/scheduler.service';
import { LLMService } from './services/llm.service';
import { PrescriptionTrackerService } from './services/prescription-tracker.service';
import { ActivityTrackerService } from './services/activity-tracker.service';
import { KitManagementService } from './services/kit-management.service';
import { KitValidationService } from './services/kit-validation.service';
import { PaymentTransactionService } from './services/payment-transaction.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Ticket,
      Transaction,
      PaymentTransaction,
      Appointment,
      BankDetails,
      Communication,
      Doctor,
      HairCoach,
      HairCoachCall,
      DoctorCall,
      UserType,
      User,
      Product,
      CustomerPrescription,
      PrescriptionProduct,
      OrderHistory,
      CustomerActivity,
      TreatmentPlan,
    ]),
    AuthModule,
  ],
  controllers: [
    TicketController,
    DoctorController,
    HairCoachController,
    UserController,
    UserTypeController,
    TransactionController,
    PaymentTransactionController,
    CustomerController,
    PrescriptionController,
    OrderHistoryController,
    ProductController,
    PrescriptionTrackerController,
    ActivityController,
    KitManagementController,
    TreatmentPlanController,
    AppointmentController,
  ],
  providers: [
    EligibilityEngineV2Service,
    TicketService,
    AppointmentService,
    CommunicationService,
    SeedService,
    SchedulerService,
    LLMService,
    PrescriptionTrackerService,
    ActivityTrackerService,
    KitManagementService,
    KitValidationService,
    PaymentTransactionService,
  ],
  exports: [
    EligibilityEngineV2Service,
    TicketService,
    AppointmentService,
    CommunicationService,
    PrescriptionTrackerService,
    ActivityTrackerService,
    KitManagementService,
  ],
})
export class RefundModule {}

