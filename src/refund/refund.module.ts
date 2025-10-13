import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketController } from './controllers/ticket.controller';
import { DoctorController } from './controllers/doctor.controller';
import { AgentController } from './controllers/agent.controller';
import { CustomerController } from './controllers/customer.controller';
import { OrderController } from './controllers/order.controller';
import { CallLogController } from './controllers/call-log.controller';
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
import {
  Customer,
  Order,
  Ticket,
  Transaction,
  CallLog,
  Appointment,
  BankDetails,
  Communication,
  Doctor,
  Agent,
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
  EligibilityEngineService,
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Order,
      Ticket,
      Transaction,
      CallLog,
      Appointment,
      BankDetails,
      Communication,
      Doctor,
      Agent,
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
    AgentController,
    HairCoachController,
    UserController,
    UserTypeController,
    TransactionController,
    CustomerController,
    OrderController,
    CallLogController,
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
    EligibilityEngineService,
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
  ],
  exports: [
    EligibilityEngineService,
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

