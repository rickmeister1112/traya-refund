import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor, Agent, Product, HairCoach, UserType, User } from '../entities';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(HairCoach)
    private hairCoachRepository: Repository<HairCoach>,
    @InjectRepository(UserType)
    private userTypeRepository: Repository<UserType>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedProducts();
    await this.seedUserTypes();
    await this.seedUsers();
    await this.seedHairCoaches();
    await this.seedDoctors();
    await this.seedAgents();
  }

  private async seedUserTypes() {
    const count = await this.userTypeRepository.count();
    if (count > 0) return;

    const userTypes = [
      {
        code: 'finance_team',
        name: 'Finance Team',
        description: 'Handles refund processing and financial operations',
        permissions: JSON.stringify(['process_refunds', 'view_transactions', 'view_bank_details']),
        isActive: true,
      },
      {
        code: 'operations',
        name: 'Operations Team',
        description: 'Manages order fulfillment and logistics',
        permissions: JSON.stringify(['create_orders', 'mark_delivered', 'manage_inventory']),
        isActive: true,
      },
      {
        code: 'admin',
        name: 'Admin',
        description: 'System administrators with full access',
        permissions: JSON.stringify(['all']),
        isActive: true,
      },
      {
        code: 'support',
        name: 'Support Team',
        description: 'Customer support and general queries',
        permissions: JSON.stringify(['view_tickets', 'view_customers', 'create_communications']),
        isActive: true,
      },
      {
        code: 'data_analyst',
        name: 'Data Analyst',
        description: 'Analytics and reporting team',
        permissions: JSON.stringify(['view_reports', 'view_analytics']),
        isActive: true,
      },
    ];

    await this.userTypeRepository.save(userTypes);
    console.log('✅ Seeded 5 user types');
  }

  private async seedUsers() {
    const count = await this.userRepository.count();
    if (count > 0) return;

    const financeType = await this.userTypeRepository.findOne({
      where: { code: 'finance_team' },
    });
    const operationsType = await this.userTypeRepository.findOne({
      where: { code: 'operations' },
    });
    const adminType = await this.userTypeRepository.findOne({
      where: { code: 'admin' },
    });

    const users = [

      {
        employeeId: 'FIN001',
        name: 'Rahul Finance',
        email: 'rahul.finance@traya.health',
        phone: '9876543250',
        userTypeId: financeType.id,
        department: 'finance',
        designation: 'finance_manager',
        isActive: true,
      },
      {
        employeeId: 'FIN002',
        name: 'Priya Finance',
        email: 'priya.finance@traya.health',
        phone: '9876543251',
        userTypeId: financeType.id,
        department: 'finance',
        designation: 'finance_executive',
        isActive: true,
      },
      {
        employeeId: 'FIN003',
        name: 'Finance Team Lead',
        email: 'finance@traya.health',
        phone: '9876543252',
        userTypeId: financeType.id,
        department: 'finance',
        designation: 'team_lead',
        isActive: true,
      },

      {
        employeeId: 'OPS001',
        name: 'Operations Manager',
        email: 'operations@traya.health',
        phone: '9876543260',
        userTypeId: operationsType.id,
        department: 'operations',
        designation: 'manager',
        isActive: true,
      },
      {
        employeeId: 'OPS002',
        name: 'Inventory Manager',
        email: 'inventory@traya.health',
        phone: '9876543261',
        userTypeId: operationsType.id,
        department: 'operations',
        designation: 'inventory_manager',
        isActive: true,
      },

      {
        employeeId: 'ADM001',
        name: 'System Admin',
        email: 'admin@traya.health',
        phone: '9876543270',
        userTypeId: adminType.id,
        department: 'admin',
        designation: 'admin',
        isActive: true,
      },
    ];

    await this.userRepository.save(users);
    console.log('✅ Seeded 6 users (3 finance, 2 operations, 1 admin)');
  }

  private async seedHairCoaches() {
    const count = await this.hairCoachRepository.count();
    if (count > 0) return;

    const coaches = [
      {
        employeeId: 'COACH001',
        name: 'Raveena Kapoor',
        email: 'coach.raveena@traya.health',
        phone: '9876543240',
        specialization: 'senior_coach',
        isActive: true,
        maxDailyCustomers: 35,
        availableSlots: JSON.stringify({
          monday: ['09:00-13:00', '14:00-18:00'],
          tuesday: ['09:00-13:00', '14:00-18:00'],
          wednesday: ['09:00-13:00', '14:00-18:00'],
          thursday: ['09:00-13:00', '14:00-18:00'],
          friday: ['09:00-13:00', '14:00-18:00'],
        }),
      },
      {
        employeeId: 'COACH002',
        name: 'Rahul Kumar',
        email: 'coach.rahul@traya.health',
        phone: '9876543241',
        specialization: 'junior_coach',
        isActive: true,
        maxDailyCustomers: 25,
        availableSlots: JSON.stringify({
          monday: ['10:00-14:00', '15:00-19:00'],
          wednesday: ['10:00-14:00', '15:00-19:00'],
          friday: ['10:00-14:00', '15:00-19:00'],
        }),
      },
      {
        employeeId: 'COACH003',
        name: 'Priya Sharma',
        email: 'coach.priya@traya.health',
        phone: '9876543242',
        specialization: 'senior_coach',
        isActive: true,
        maxDailyCustomers: 30,
        availableSlots: JSON.stringify({
          tuesday: ['09:00-13:00', '14:00-18:00'],
          thursday: ['09:00-13:00', '14:00-18:00'],
          saturday: ['09:00-13:00'],
        }),
      },
      {
        employeeId: 'COACH004',
        name: 'Hair Coach Lead',
        email: 'coach.lead@traya.health',
        phone: '9876543243',
        specialization: 'lead_coach',
        isActive: true,
        maxDailyCustomers: 40,
        availableSlots: JSON.stringify({
          monday: ['09:00-18:00'],
          tuesday: ['09:00-18:00'],
          wednesday: ['09:00-18:00'],
          thursday: ['09:00-18:00'],
          friday: ['09:00-18:00'],
        }),
      },
    ];

    await this.hairCoachRepository.save(coaches);
    console.log('✅ Seeded 4 hair coaches');
  }

  private async seedProducts() {
    const count = await this.productRepository.count();
    if (count > 0) return;

    const products = [

      {
        sku: 'TRY-HR-001',
        name: 'Hair Ras',
        category: 'supplement',
        subcategory: 'ayurvedic',
        price: 2000,
        description: 'Ayurvedic supplement for hair growth',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-HV-001',
        name: 'Hair Vitamin',
        category: 'supplement',
        subcategory: 'nutrition',
        price: 1500,
        description: 'Vitamin supplement for hair health',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-HT-001',
        name: 'Health Tatva',
        category: 'supplement',
        subcategory: 'ayurvedic',
        price: 1800,
        description: 'Complete health supplement',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-CV-001',
        name: 'Cholest Vati',
        category: 'supplement',
        subcategory: 'ayurvedic',
        price: 1200,
        description: 'Cholesterol management',
        isKitProduct: true,
        durationDays: 30,
      },

      {
        sku: 'TRY-DS-001',
        name: 'Defence Shampoo',
        category: 'shampoo',
        subcategory: 'dermatology',
        price: 800,
        description: 'Anti-hair fall shampoo',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-DC-001',
        name: 'Defence Conditioner',
        category: 'conditioner',
        subcategory: 'dermatology',
        price: 750,
        description: 'Strengthening conditioner',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-ADS-001',
        name: 'Anti-Dandruff Shampoo',
        category: 'shampoo',
        subcategory: 'dermatology',
        price: 850,
        description: 'Treats dandruff and scalp issues',
        isKitProduct: false,
        durationDays: 30,
      },

      {
        sku: 'TRY-SO-001',
        name: 'Scalp Oil',
        category: 'oil',
        subcategory: 'ayurvedic',
        price: 1000,
        description: 'Nourishing scalp oil',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-HAS-001',
        name: 'Hair Actives Serum',
        category: 'serum',
        subcategory: 'dermatology',
        price: 1200,
        description: 'Active ingredients for hair growth',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-NHO-001',
        name: 'Nourish Hair Oil',
        category: 'oil',
        subcategory: 'ayurvedic',
        price: 900,
        description: 'Deep nourishment oil',
        isKitProduct: false,
        durationDays: 45,
      },

      {
        sku: 'TRY-PCOS-001',
        name: 'PCOS Santulan',
        category: 'supplement',
        subcategory: 'women',
        price: 1600,
        description: 'PCOS management supplement',
        isKitProduct: true,
        durationDays: 30,
      },
      {
        sku: 'TRY-TS-001',
        name: 'Thyro Santulan',
        category: 'supplement',
        subcategory: 'women',
        price: 1600,
        description: 'Thyroid management supplement',
        isKitProduct: true,
        durationDays: 30,
      },
    ];

    await this.productRepository.save(products);
    console.log('✅ Seeded 12 products');
  }

  private async seedDoctors() {
    const count = await this.doctorRepository.count();
    if (count > 0) return;

    const doctors = [
      {
        employeeId: 'DOC001',
        name: 'Dr. Sharma',
        email: 'dr.sharma@traya.health',
        phone: '9876543210',
        specialization: 'dermatologist',
        isActive: true,
        isHOD: false,
        maxDailySlots: 25,
        availableSlots: JSON.stringify({
          monday: ['10:00-12:00', '14:00-17:00'],
          tuesday: ['10:00-12:00', '14:00-17:00'],
          wednesday: ['10:00-12:00', '14:00-17:00'],
          thursday: ['10:00-12:00', '14:00-17:00'],
          friday: ['10:00-12:00', '14:00-17:00'],
        }),
      },
      {
        employeeId: 'DOC002',
        name: 'Dr. Patel',
        email: 'dr.patel@traya.health',
        phone: '9876543211',
        specialization: 'trichologist',
        isActive: true,
        isHOD: false,
        maxDailySlots: 20,
        availableSlots: JSON.stringify({
          monday: ['09:00-13:00', '15:00-18:00'],
          wednesday: ['09:00-13:00', '15:00-18:00'],
          friday: ['09:00-13:00', '15:00-18:00'],
        }),
      },
      {
        employeeId: 'DOC003',
        name: 'Dr. Kumar (HOD)',
        email: 'hod@traya.health',
        phone: '9876543212',
        specialization: 'dermatologist',
        isActive: true,
        isHOD: true,
        maxDailySlots: 15,
        availableSlots: JSON.stringify({
          monday: ['11:00-13:00'],
          tuesday: ['11:00-13:00'],
          wednesday: ['11:00-13:00'],
          thursday: ['11:00-13:00'],
          friday: ['11:00-13:00'],
        }),
      },
    ];

    await this.doctorRepository.save(doctors);
    console.log('✅ Seeded 3 doctors');
  }

  private async seedAgents() {
    const count = await this.agentRepository.count();
    if (count > 0) return;

    const agents = [
      {
        employeeId: 'AGT001',
        name: 'Ravi Kumar',
        email: 'agent.ravi@traya.health',
        phone: '9876543220',
        role: 'complaints_agent',
        team: 'complaints',
        isActive: true,
        maxDailyTickets: 50,
      },
      {
        employeeId: 'AGT002',
        name: 'Priya Sharma',
        email: 'agent.priya@traya.health',
        phone: '9876543221',
        role: 'complaints_agent',
        team: 'complaints',
        isActive: true,
        maxDailyTickets: 50,
      },
      {
        employeeId: 'AGT003',
        name: 'Complaints Team Lead',
        email: 'complaints@traya.health',
        phone: '9876543222',
        role: 'complaints_lead',
        team: 'complaints',
        isActive: true,
        maxDailyTickets: 100,
      },
    ];

    await this.agentRepository.save(agents);
    console.log('✅ Seeded 3 agents');
  }

}

