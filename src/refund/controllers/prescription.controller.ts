import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ConflictException,
  Patch,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CustomerPrescription,
  PrescriptionProduct,
  Product,
  Customer,
  Doctor,
  TreatmentPlan,
} from '../entities';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(
    @InjectRepository(CustomerPrescription)
    private prescriptionRepository: Repository<CustomerPrescription>,
    @InjectRepository(PrescriptionProduct)
    private prescriptionProductRepository: Repository<PrescriptionProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(TreatmentPlan)
    private treatmentPlanRepository: Repository<TreatmentPlan>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPrescription(
    @Body()
    data: {
      customerId: string;
      prescribedByDoctorId?: string;
      treatmentPlanId: string;
      products: Array<{
        productId: string;
        kitNumber: number;
        quantity: number;
        isRequired: boolean;
        frequency?: string;
        instructions?: string;
      }>;
    },
  ) {

    await this.prescriptionRepository.update(
      { customerId: data.customerId, isActive: true },
      { isActive: false },
    );

    const treatmentPlan = await this.treatmentPlanRepository.findOne({
      where: { id: data.treatmentPlanId },
    });

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found');
    }

    const prescriptionNumber = `PRX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const kitId = `${treatmentPlan.kitIdPrefix}-${timestamp}-${random}`;

    const prescription = this.prescriptionRepository.create({
      prescriptionNumber,
      kitId,
      customerId: data.customerId,
      prescribedByDoctorId: data.prescribedByDoctorId,
      treatmentPlanId: treatmentPlan.id,
      treatmentDurationMonths: treatmentPlan.treatmentDurationMonths,
      requiredKits: treatmentPlan.requiredKits,
      planType: treatmentPlan.planType,
      prescribedAt: new Date(),
      isActive: true,
    });

    const savedPrescription = await this.prescriptionRepository.save(
      prescription,
    );

    const prescriptionProducts = data.products.map((p) => {
      return this.prescriptionProductRepository.create({
        prescriptionId: savedPrescription.id,
        productId: p.productId,
        kitNumber: p.kitNumber,
        quantity: p.quantity || 1,
        isRequired: p.isRequired !== false,
        frequency: p.frequency,
        instructions: p.instructions,
      });
    });

    await this.prescriptionProductRepository.save(prescriptionProducts);

    return await this.prescriptionRepository.findOne({
      where: { id: savedPrescription.id },
      relations: ['prescribedProducts', 'customer', 'prescribedByDoctor'],
    });
  }

  @Get()
  async getAllPrescriptions() {
    return await this.prescriptionRepository.find({
      relations: ['customer', 'prescribedByDoctor'],
      order: { prescribedAt: 'DESC' },
    });
  }

  @Get(':id')
  async getPrescription(@Param('id') id: string) {
    return await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['customer', 'prescribedByDoctor', 'prescribedProducts', 'orderHistory'],
    });
  }

  @Get(':id/products')
  async getPrescriptionProducts(@Param('id') prescriptionId: string) {
    return await this.prescriptionProductRepository.find({
      where: { prescriptionId },
      relations: ['product'],
      order: { kitNumber: 'ASC' },
    });
  }

  @Get('customer/:customerId')
  async getPrescriptionByCustomer(@Param('customerId') customerId: string) {
    return await this.prescriptionRepository.find({
      where: { customerId },
      relations: ['prescribedByDoctor', 'prescribedProducts'],
      order: { prescribedAt: 'DESC' },
    });
  }

  @Get('customer/:customerId/active')
  async getActivePrescription(@Param('customerId') customerId: string) {
    return await this.prescriptionRepository.findOne({
      where: { customerId, isActive: true },
      relations: ['prescribedByDoctor', 'prescribedProducts', 'treatmentPlan'],
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updatePrescription(
    @Param('id') id: string,
    @Body()
    data: {
      treatmentPlanId?: string;
      prescribedByDoctorId?: string;
      products?: Array<{
        productId: string;
        kitNumber: number;
        quantity: number;
        isRequired: boolean;
        frequency?: string;
        instructions?: string;
      }>;
    },
  ) {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
    });

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (data.treatmentPlanId && data.treatmentPlanId !== prescription.treatmentPlanId) {
      const treatmentPlan = await this.treatmentPlanRepository.findOne({
        where: { id: data.treatmentPlanId },
      });

      if (!treatmentPlan) {
        throw new Error('Treatment plan not found');
      }

      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newKitId = `${treatmentPlan.kitIdPrefix}-${timestamp}-${random}`;

      prescription.kitId = newKitId;
      prescription.treatmentPlanId = treatmentPlan.id;
      prescription.treatmentDurationMonths = treatmentPlan.treatmentDurationMonths;
      prescription.requiredKits = treatmentPlan.requiredKits;
      prescription.planType = treatmentPlan.planType;
    }

    if (data.prescribedByDoctorId) {
      prescription.prescribedByDoctorId = data.prescribedByDoctorId;
    }

    await this.prescriptionRepository.save(prescription);

    if (data.products && data.products.length > 0) {

      await this.prescriptionProductRepository.delete({
        prescriptionId: id,
      });

      const prescriptionProducts = data.products.map((p) => {
        return this.prescriptionProductRepository.create({
          prescriptionId: id,
          productId: p.productId,
          kitNumber: p.kitNumber,
          quantity: p.quantity || 1,
          isRequired: p.isRequired !== false,
          frequency: p.frequency,
          instructions: p.instructions,
        });
      });

      await this.prescriptionProductRepository.save(prescriptionProducts);
    }

    return await this.prescriptionRepository.findOne({
      where: { id },
      relations: ['prescribedByDoctor', 'prescribedProducts', 'treatmentPlan', 'customer'],
    });
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivatePrescription(@Param('id') id: string) {
    await this.prescriptionRepository.update(id, { isActive: false });
    return {
      message: 'Prescription deactivated. Customer can now get a new prescription.',
    };
  }
}

