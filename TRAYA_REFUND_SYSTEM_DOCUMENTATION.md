# 🏥 Traya Refund System - Complete Documentation

## 📋 Table of Contents
1. [API Endpoints](#api-endpoints)
2. [API Logic](#api-logic)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Eligibility Engine Test Cases](#eligibility-engine-test-cases)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [System Status](#system-status)

---

## 🔌 API Endpoints

### **Core Ticket Management**

#### Create Ticket
```http
POST /tickets
Content-Type: application/json

{
  "customerId": "uuid",
  "source": "app",
  "reason": "Treatment did not show expected results"
}
```

**Response:**
```json
{
  "ticket": {
    "id": "uuid",
    "ticketNumber": "TKT-MB-1761044531596-CFKLBF",
    "customerId": "uuid",
    "status": "assigned_to_complaints",
    "category": "category_b",
    "subcategory": "five_months_moneyback",
    "isEligible": false,
    "eligibleRefundAmount": "0.00",
    "assignedTo": "complaints@traya.health",
    "assignedToRole": "complaints_agent"
  },
  "eligibilityResult": {
    "isEligible": false,
    "reasons": ["Customer has only 1 genuine kits..."],
    "checks": {
      "alreadyReceivedRefund": true,
      "purchasedCompleteKits": false,
      "purchasedAllEssentialProducts": true,
      "kitsDeliveredInTimeframe": false,
      "completedThreeCalls": false,
      "raisedWithinWindow": false
    }
  }
}
```

#### Get Tickets
```http
GET /tickets?customerId=uuid&status=assigned_to_complaints&category=category_b
```

**Response:**
```json
[
  {
    "id": "uuid",
    "ticketNumber": "TKT-MB-1761044531596-CFKLBF",
    "customerId": "uuid",
    "status": "assigned_to_complaints",
    "isEligible": false,
    "eligibleRefundAmount": "0.00",
    "assignedTo": "complaints@traya.health",
    "assignedToRole": "complaints_agent"
  }
]
```

#### Get Ticket Details
```http
GET /tickets/:id
```

**Response:**
```json
{
  "id": "uuid",
  "ticketNumber": "TKT-MB-1761044531596-CFKLBF",
  "customerId": "uuid",
  "status": "approved",
  "isEligible": false,
  "eligibleRefundAmount": "0.00",
  "approvedRefundAmount": "25000.00",
  "isApproved": true,
  "isRejected": false,
  "assignedTo": "complaints@traya.health",
  "assignedToRole": "complaints_agent",
  "processedBy": "doctor@traya.health",
  "processedAt": "2025-10-21T11:05:26.000Z",
  "doctorComments": "Customer followed treatment plan properly",
  "hodComments": "Approved by HOD after review",
  "financeComments": "Refund processed successfully",
  "closedAt": "2025-10-21T11:06:07.000Z",
  "customer": { ... },
  "prescription": { ... },
  "appointments": [ ... ],
  "communications": [ ... ]
}
```

### **Eligibility Engine**

#### Check Customer Eligibility
```http
GET /tickets/eligibility/check/:customerId
```

**Response:**
```json
{
  "isEligible": false,
  "reasons": [
    "Customer has only 1 genuine kits (ordered at proper intervals) out of required 5 kits.",
    "Customer has completed only 0 calls with Hair Coach. Required: 3 calls.",
    "Customer has not yet placed the 5th kit order."
  ],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": false,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": false,
    "completedThreeCalls": false,
    "raisedWithinWindow": false
  },
  "eligibleRefundAmount": 0,
  "recommendedTreatmentPeriod": 5,
  "prescriptionId": "uuid",
  "missingEssentialProducts": []
}
```

#### Check if Customer Can Re-raise Ticket
```http
GET /tickets/eligibility/can-reraise/:customerId
```

**Response:**
```json
{
  "canRaise": true,
  "reason": ""
}
```

### **Doctor Workflow**

#### Doctor Disposition
```http
POST /tickets/:id/doctor-disposition
Content-Type: application/json

{
  "isApproved": true,
  "comments": "Customer followed treatment plan properly",
  "approvedAmount": 25000.00,
  "freeKitsOffered": 0,
  "processedBy": "doctor@traya.health"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "assigned_to_hod",
  "assignedTo": "hod@traya.health",
  "assignedToRole": "hod",
  "isApproved": true,
  "approvedRefundAmount": "25000.00",
  "doctorComments": "Customer followed treatment plan properly"
}
```

### **HOD Workflow**

#### HOD Approval
```http
POST /tickets/:id/hod-approval
Content-Type: application/json

{
  "isApproved": true,
  "comments": "Approved by HOD after review",
  "processedBy": "hod@traya.health"
}
```

**Response:**
```json
{
  "status": "assigned_to_finance",
  "assignedTo": "finance@traya.health",
  "assignedToRole": "finance",
  "approvedRefundAmount": "25000.00",
  "hodComments": "Approved by HOD after review"
}
```

### **Finance Workflow**

#### Finance Processing
```http
POST /tickets/:id/finance-processing
Content-Type: application/json

{
  "isProcessed": true,
  "processedBy": "finance@traya.health",
  "comments": "Refund processed successfully via bank transfer",
  "transactionNumber": "TXN-12345",
  "paymentGatewayTransactionId": "PG-67890",
  "bankAccountNumber": "XXXX1234"
}
```

**Response:**
```json
{
  "status": "approved",
  "processedBy": "finance@traya.health",
  "financeComments": "Refund processed successfully via bank transfer",
  "closedAt": "2025-10-21T11:06:07.179Z"
}
```

### **Threat Management**

#### Mark Legal Threat
```http
POST /tickets/:id/mark-threat
Content-Type: application/json

{
  "threatType": "legal"
}
```

**Response:**
```json
{
  "isLegalThreat": true,
  "isSocialMediaThreat": false,
  "status": "approved",
  "assignedTo": "complaints@traya.health",
  "assignedToRole": "complaints_agent"
}
```

#### Mark Social Media Threat
```http
POST /tickets/:id/mark-threat
Content-Type: application/json

{
  "threatType": "social_media"
}
```

**Response:**
```json
{
  "isLegalThreat": true,
  "isSocialMediaThreat": true,
  "status": "approved",
  "assignedTo": "complaints@traya.health",
  "assignedToRole": "complaints_agent"
}
```

### **Appointment Management**

#### Get Ticket Appointments
```http
GET /tickets/:id/appointments
```

**Response:**
```json
[
  {
    "id": "uuid",
    "customerId": "uuid",
    "ticketId": "uuid",
    "slotType": "agent",
    "slotTime": "2025-10-22T04:30:00.000Z",
    "assignedTo": "complaints@traya.health",
    "status": "scheduled",
    "attemptNumber": 1,
    "callPurpose": "refund_ticket"
  }
]
```

### **Communication Management**

#### Get Ticket Communications
```http
GET /tickets/:id/communications
```

**Response:**
```json
[
  {
    "id": "uuid",
    "customerId": "uuid",
    "ticketId": "uuid",
    "type": "whatsapp",
    "subject": "Money Back Refund Request Created",
    "message": "Dear Customer...",
    "status": "pending",
    "isSent": false
  }
]
```

### **Customer Management**

#### Get All Customers
```http
GET /customers
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "9876543210",
    "address": "123 Test Street, Mumbai",
    "isActive": true,
    "isDND": false
  }
]
```

### **Prescription Management**

#### Get Customer Prescriptions
```http
GET /prescriptions?customerId=uuid
```

**Response:**
```json
[
  {
    "id": "uuid",
    "prescriptionNumber": "PRX-1761043580031-XWXVGJ",
    "kitId": "KIT5M-1761043580031-EBCTYB",
    "customerId": "uuid",
    "treatmentDurationMonths": 5,
    "requiredKits": 5,
    "planType": "moneyback_guarantee",
    "isActive": true,
    "prescribedAt": "2025-10-21T10:46:20.000Z",
    "planStartedAt": "2025-10-21T10:46:20.000Z",
    "expectedCompletionDate": "2026-03-21T10:46:20.000Z"
  }
]
```

### **Order History**

#### Get Customer Order History
```http
GET /order-history?customerId=uuid
```

**Response:**
```json
[
  {
    "id": "uuid",
    "orderNumber": "ORD-1761043580060-0TQD3FMTK",
    "customerId": "uuid",
    "prescriptionId": "uuid",
    "productId": "uuid",
    "quantity": 1,
    "price": "800.00",
    "totalAmount": "800.00",
    "paymentMode": "prepaid",
    "orderStatus": "delivered",
    "isDelivered": true,
    "orderedAt": "2025-10-21T10:46:20.000Z",
    "deliveredAt": "2025-10-21T10:46:20.000Z",
    "product": {
      "id": "uuid",
      "sku": "TRY-DS-001",
      "name": "Defence Shampoo",
      "category": "shampoo",
      "price": "800.00"
    }
  }
]
```

---

## 🧠 API Logic

### **Ticket Creation Flow**

1. **Customer raises refund request** → `POST /tickets`
2. **System checks eligibility** → Eligibility Engine runs 6 checks
3. **Auto-assignment based on eligibility**:
   - If eligible → assigned to doctor
   - If ineligible → assigned to complaints agent
4. **Auto-appointment creation** → Scheduled call/consultation
5. **Auto-communication** → WhatsApp notification sent

### **Eligibility Engine Logic**

The eligibility engine performs 6 critical checks:

#### **Check 1: No Previous Refund**
```typescript
// Check if customer has received refund before
const previousRefund = await this.ticketRepository.findOne({
  where: { customerId, isApproved: true }
});
return !previousRefund; // true = eligible (no previous refund)
```

#### **Check 2: Complete Kits Purchase**
```typescript
// Check if customer purchased all required kits
const requiredKits = prescription.requiredKits; // 5, 8, or 12
const purchasedKits = await this.getPurchasedKitsCount(customerId, prescriptionId);
return purchasedKits >= requiredKits;
```

#### **Check 3: Essential Products**
```typescript
// Check if customer purchased all essential products
const essentialProducts = await this.getEssentialProducts(prescriptionId);
const purchasedProducts = await this.getPurchasedProducts(customerId);
return essentialProducts.every(product => 
  purchasedProducts.includes(product.id)
);
```

#### **Check 4: Delivery Timeframe**
```typescript
// Check if kits were delivered within proper timeframe
const orders = await this.getCustomerOrders(customerId);
const properDeliveryOrders = orders.filter(order => 
  this.isDeliveredInTimeframe(order)
);
return properDeliveryOrders.length >= requiredKits;
```

#### **Check 5: Hair Coach Calls**
```typescript
// Check if customer completed minimum 3 calls
const completedCalls = await this.getCompletedCallsCount(customerId);
return completedCalls >= 3;
```

#### **Check 6: Window Period**
```typescript
// Check if request raised within valid window
const treatmentStartDate = prescription.planStartedAt;
const currentDate = new Date();
const windowPeriod = this.getWindowPeriod(prescription.treatmentDurationMonths);
return (currentDate - treatmentStartDate) <= windowPeriod;
```

### **Refund Amount Calculation**

```typescript
calculateRefundAmount(customerId: string, prescriptionId: string): number {
  const prescription = await this.getPrescription(prescriptionId);
  const treatmentPeriod = prescription.treatmentDurationMonths;
  
  // Base refund amounts by treatment period
  const refundAmounts = {
    5: 26500,  // 5-month plan
    8: 42500,  // 8-month plan  
    12: 63500  // 12-month plan
  };
  
  return refundAmounts[treatmentPeriod] || 0;
}
```

### **Workflow State Transitions**

```typescript
// Ticket status flow
const statusFlow = {
  'pending': ['assigned_to_doctor', 'assigned_to_complaints'],
  'assigned_to_doctor': ['assigned_to_hod', 'rejected'],
  'assigned_to_hod': ['assigned_to_finance', 'rejected'],
  'assigned_to_finance': ['approved'],
  'assigned_to_complaints': ['closed', 'assigned_to_doctor'],
  'approved': [], // Terminal state
  'rejected': [], // Terminal state
  'closed': []    // Terminal state
};
```

### **Auto-Assignment Logic**

```typescript
async autoAssignTicket(ticket: Ticket): Promise<void> {
  const isEligible = await this.checkEligibility(ticket.customerId);
  
  if (isEligible) {
    // Assign to least loaded doctor
    const doctor = await this.getLeastLoadedDoctor();
    ticket.assignedTo = doctor.email;
    ticket.assignedToRole = 'doctor';
    ticket.assignedToDoctorId = doctor.id;
  } else {
    // Assign to complaints agent
    ticket.assignedTo = 'complaints@traya.health';
    ticket.assignedToRole = 'complaints_agent';
  }
}
```

---

## 🗄️ Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    CUSTOMERS    │    │   PRESCRIPTIONS │    │ TREATMENT_PLANS │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ customerId (FK) │    │ id (PK)         │
│ name            │    │ treatmentPlanId │◄───┤ name            │
│ email           │    │ prescribedBy    │    │ description     │
│ phone           │    │ treatmentDuration│    │ duration        │
│ address         │    │ requiredKits    │    │ planType        │
│ isActive        │    │ planType        │    │ isActive        │
│ isDND           │    │ isActive        │    │ createdAt       │
│ assignedHairCoach│   │ prescribedAt    │    │ updatedAt       │
│ createdAt       │    │ planStartedAt   │    └─────────────────┘
│ updatedAt       │    │ expectedCompletion│
│ deletedAt       │    │ createdAt       │
└─────────────────┘    │ updatedAt       │    ┌─────────────────┐
                       │ deletedAt       │    │    PRODUCTS     │
┌─────────────────┐    └─────────────────┘    ├─────────────────┤
│     TICKETS     │                           │ id (PK)         │
├─────────────────┤    ┌─────────────────┐    │ sku             │
│ id (PK)         │    │   ORDER_HISTORY │    │ name            │
│ ticketNumber    │    ├─────────────────┤    │ category        │
│ customerId (FK) │◄───┤ customerId (FK) │    │ subcategory     │
│ prescriptionId  │    │ prescriptionId  │    │ price           │
│ category        │    │ productId (FK)  │◄───┤ description     │
│ subcategory     │    │ quantity        │    │ isActive        │
│ source          │    │ price           │    │ isKitProduct    │
│ status          │    │ totalAmount     │    │ isMandatory     │
│ reason          │    │ paymentMode     │    │ durationDays    │
│ isEligible      │    │ orderStatus     │    │ ingredients     │
│ eligibleRefundAmount│ │ isDelivered     │    │ metadata        │
│ approvedRefundAmount│ │ orderedAt       │    │ createdAt       │
│ isApproved      │    │ deliveredAt     │    │ updatedAt       │
│ isRejected      │    │ createdAt       │    │ deletedAt       │
│ assignedTo      │    │ updatedAt       │    └─────────────────┘
│ assignedToRole  │    │ deletedAt       │
│ processedBy     │    └─────────────────┘
│ processedAt     │
│ doctorComments  │    ┌─────────────────┐
│ agentComments   │    │    DOCTORS      │
│ hodComments     │    ├─────────────────┤
│ financeComments │    │ id (PK)         │
│ freeKitsOffered │    │ employeeId      │
│ isLegalThreat   │    │ name            │
│ isSocialMediaThreat│ │ email           │
│ isDND           │    │ phone           │
│ estimatedTAT    │    │ specialization  │
│ closedAt        │    │ isActive        │
│ createdAt       │    │ isHOD           │
│ updatedAt       │    │ maxDailySlots   │
│ deletedAt       │    │ availableSlots  │
└─────────────────┘    │ createdAt       │
                       │ updatedAt       │
┌─────────────────┐    │ deletedAt       │
│  APPOINTMENTS   │    └─────────────────┘
├─────────────────┤
│ id (PK)         │    ┌─────────────────┐
│ customerId (FK) │    │      USERS      │
│ ticketId (FK)   │    ├─────────────────┤
│ slotType        │    │ id (PK)         │
│ slotTime        │    │ employeeId      │
│ assignedTo      │    │ name            │
│ assignedToDoctor│    │ email           │
│ assignedToUser  │    │ password        │
│ assignedToHairCoach│ │ phone           │
│ status          │    │ userTypeId (FK) │
│ reminderSent    │    │ department      │
│ attemptNumber   │    │ designation     │
│ callPurpose     │    │ team            │
│ notes           │    │ maxDailyTickets │
│ createdAt       │    │ isActive        │
│ updatedAt       │    │ createdAt       │
│ deletedAt       │    │ updatedAt       │
└─────────────────┘    │ deletedAt       │
                       └─────────────────┘
┌─────────────────┐
│ COMMUNICATIONS  │    ┌─────────────────┐
├─────────────────┤    │   HAIR_COACHES  │
│ id (PK)         │    ├─────────────────┤
│ customerId (FK) │    │ id (PK)         │
│ ticketId (FK)   │    │ employeeId      │
│ type            │    │ name            │
│ subject         │    │ email           │
│ message         │    │ phone           │
│ status          │    │ specialization  │
│ externalId      │    │ isActive        │
│ isSent          │    │ maxDailyCustomers│
│ sentAt          │    │ availableSlots  │
│ metadata        │    │ createdAt       │
│ createdAt       │    │ updatedAt       │
│ updatedAt       │    │ deletedAt       │
│ deletedAt       │    └─────────────────┘
└─────────────────┘
┌─────────────────┐
│  BANK_DETAILS   │    ┌─────────────────┐
├─────────────────┤    │HAIR_COACH_CALLS │
│ id (PK)         │    ├─────────────────┤
│ customerId (FK) │    │ id (PK)         │
│ ticketId (FK)   │    │ customerId (FK) │
│ accountHolderName│    │ hairCoachId (FK)│
│ accountNumber   │    │ engagementId    │
│ ifscCode        │    │ callPurpose     │
│ bankName        │    │ status          │
│ branchName      │    │ duration        │
│ isVerified      │    │ summary         │
│ isFormFilled    │    │ notes           │
│ formFilledAt    │    │ isConnected     │
│ formLink        │    │ callTime        │
│ createdAt       │    │ recordingUrl    │
│ updatedAt       │    │ createdAt       │
│ deletedAt       │    │ updatedAt       │
└─────────────────┘    │ deletedAt       │
                       └─────────────────┘
┌─────────────────┐
│PAYMENT_TRANSACTIONS│
├─────────────────┤
│ id (PK)         │
│ transactionNumber│
│ customerId (FK) │
│ orderNumber     │
│ ticketId (FK)   │
│ transactionType │
│ amount          │
│ paymentMode     │
│ paymentStatus   │
│ paymentGateway  │
│ bankDetails     │
│ refundDetails   │
│ settlementDetails│
│ metadata        │
│ failureTracking │
│ auditFields     │
│ voidDetails     │
│ createdAt       │
│ updatedAt       │
│ deletedAt       │
└─────────────────┘
```

### **Key Relationships**

1. **Customer → Prescription**: One-to-Many (customer can have multiple prescriptions)
2. **Prescription → Order History**: One-to-Many (prescription can have multiple orders)
3. **Customer → Tickets**: One-to-Many (customer can have multiple refund requests)
4. **Ticket → Appointments**: One-to-Many (ticket can have multiple appointments)
5. **Ticket → Communications**: One-to-Many (ticket can have multiple communications)
6. **Customer → Hair Coach Calls**: One-to-Many (customer can have multiple calls)
7. **Customer → Bank Details**: One-to-Many (customer can have multiple bank accounts)

---

## 🧪 Eligibility Engine Test Cases

### **Test Case 1: Happy Path - Eligible Customer**

**Setup:**
- Customer with 5-month treatment plan
- Purchased all 5 required kits
- Completed 3+ hair coach calls
- No previous refunds
- Raised request within window period

**Expected Result:**
```json
{
  "isEligible": true,
  "reasons": [],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  },
  "eligibleRefundAmount": 26500,
  "recommendedTreatmentPeriod": 5
}
```

### **Test Case 2: Previous Refund - Ineligible**

**Setup:**
- Customer with previous approved refund ticket
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Customer has already received a refund before."],
  "checks": {
    "alreadyReceivedRefund": false,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  }
}
```

### **Test Case 3: Incomplete Kit Purchase - Ineligible**

**Setup:**
- Customer with 5-month plan (requires 5 kits)
- Only purchased 3 kits
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Customer has only 3 genuine kits out of required 5 kits."],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": false,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  }
}
```

### **Test Case 4: Missing Essential Products - Ineligible**

**Setup:**
- Customer purchased all kits but missing essential products
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Customer has not purchased all essential products."],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": false,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  },
  "missingEssentialProducts": ["product-id-1", "product-id-2"]
}
```

### **Test Case 5: Late Delivery - Ineligible**

**Setup:**
- Customer purchased all kits but delivered outside timeframe
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Kits were not delivered within proper timeframe."],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": false,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  }
}
```

### **Test Case 6: Insufficient Hair Coach Calls - Ineligible**

**Setup:**
- Customer with only 2 completed hair coach calls
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Customer has completed only 2 calls with Hair Coach. Required: 3 calls."],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": false,
    "raisedWithinWindow": true
  }
}
```

### **Test Case 7: Outside Window Period - Ineligible**

**Setup:**
- Customer raised request after window period expired
- All other criteria met

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["Request raised outside valid window period."],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": false
  }
}
```

### **Test Case 8: No Active Prescription - Ineligible**

**Setup:**
- Customer without any active prescription

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": ["No active prescription found for this customer."],
  "checks": {
    "alreadyReceivedRefund": false,
    "purchasedCompleteKits": false,
    "purchasedAllEssentialProducts": false,
    "kitsDeliveredInTimeframe": false,
    "completedThreeCalls": false,
    "raisedWithinWindow": false
  },
  "eligibleRefundAmount": 0,
  "recommendedTreatmentPeriod": 0,
  "prescriptionId": null
}
```

### **Test Case 9: 8-Month Plan - Different Refund Amount**

**Setup:**
- Customer with 8-month treatment plan
- All criteria met

**Expected Result:**
```json
{
  "isEligible": true,
  "reasons": [],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  },
  "eligibleRefundAmount": 42500,
  "recommendedTreatmentPeriod": 8
}
```

### **Test Case 10: 12-Month Plan - Maximum Refund Amount**

**Setup:**
- Customer with 12-month treatment plan
- All criteria met

**Expected Result:**
```json
{
  "isEligible": true,
  "reasons": [],
  "checks": {
    "alreadyReceivedRefund": true,
    "purchasedCompleteKits": true,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": true,
    "raisedWithinWindow": true
  },
  "eligibleRefundAmount": 63500,
  "recommendedTreatmentPeriod": 12
}
```

### **Test Case 11: Multiple Failure Reasons**

**Setup:**
- Customer with previous refund
- Only purchased 2 out of 5 kits
- Completed only 1 hair coach call
- Raised request outside window

**Expected Result:**
```json
{
  "isEligible": false,
  "reasons": [
    "Customer has already received a refund before.",
    "Customer has only 2 genuine kits out of required 5 kits.",
    "Customer has completed only 1 call with Hair Coach. Required: 3 calls.",
    "Request raised outside valid window period."
  ],
  "checks": {
    "alreadyReceivedRefund": false,
    "purchasedCompleteKits": false,
    "purchasedAllEssentialProducts": true,
    "kitsDeliveredInTimeframe": true,
    "completedThreeCalls": false,
    "raisedWithinWindow": false
  }
}
```

---

## 🗄️ Database Setup & Migrations

### **Migration Files**
The system includes 18 migration files that create the complete database schema:

```
001_create_customers_table.sql
002_create_treatment_plans_table.sql
003_create_products_table.sql
004_create_customer_prescriptions_table.sql
005_create_order_history_table.sql
006_create_tickets_table.sql
007_add_call_purpose_to_appointments.sql
008_add_hair_coach_to_appointments.sql
009_add_payment_transactions_table.sql
010_create_doctors_table.sql
011_create_users_table.sql
012_create_user_types_table.sql
013_create_hair_coaches_table.sql
014_create_appointments_table.sql
015_create_communications_table.sql
016_create_bank_details_table.sql
017_create_hair_coach_calls_table.sql
018_create_transactions_table.sql
```

### **Database Management Commands**

```bash
# Run all migrations
npm run migration:run

# Check migration status
npm run migration:status

# Rollback last migration
npm run migration:rollback

# Create database
npm run db:create

# Drop database
npm run db:drop

# Test database connection
npm run db:test
```

### **Migration Runner**
The system includes a TypeScript migration runner (`scripts/run-migrations.ts`) that:
- Connects to MySQL database
- Tracks executed migrations
- Supports rollback functionality
- Provides status reporting

---

## ✅ System Status

### **Current State**
- ✅ **Server**: Running on port 3000
- ✅ **Database**: Connected and operational
- ✅ **Migrations**: All 18 migrations executed successfully
- ✅ **Eligibility Engine**: Fully functional and tested
- ✅ **API Endpoints**: All endpoints operational
- ✅ **Documentation**: Complete and up-to-date

### **Recent Fixes Applied**
1. **Database Cleanup**: Removed duplicate phone entries causing unique constraint violations
2. **Schema Synchronization**: Disabled TypeORM synchronize to prevent conflicts
3. **Code Cleanup**: Removed all unnecessary test files and documentation
4. **Migration Management**: Implemented proper migration runner and commands

### **Project Structure**
```
traya-refund-backend/
├── src/
│   ├── refund/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── entities/
│   │   ├── dto/
│   │   └── enums/
│   └── common/
├── migrations/
│   └── 001-018: All migration files
├── scripts/
│   └── run-migrations.ts
├── TRAYA_REFUND_SYSTEM_DOCUMENTATION.md
├── package.json
└── tsconfig.json
```

### **Environment Configuration**
```bash
# Required environment variables
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=traya_refund
NODE_ENV=development
```

---

## 🎯 Summary

This documentation provides a complete overview of the Traya Refund System including:

1. **API Endpoints**: All REST endpoints with request/response examples
2. **API Logic**: Core business logic and workflow implementations
3. **Entity Relationship Diagram**: Complete database schema with relationships
4. **Eligibility Engine Test Cases**: Comprehensive test scenarios covering all edge cases
5. **Database Setup & Migrations**: Complete migration system with management commands
6. **System Status**: Current operational state and recent fixes

The system handles refund requests through a structured workflow involving eligibility checks, doctor evaluation, HOD approval, and finance processing, with comprehensive threat management and communication tracking.

### **System Features**
- ✅ Complete refund workflow management
- ✅ Automated eligibility checking
- ✅ Multi-role approval system (Doctor → HOD → Finance)
- ✅ Threat management (Legal/Social Media)
- ✅ Appointment scheduling and management
- ✅ Communication tracking (WhatsApp, Email)
- ✅ Bank details collection and verification
- ✅ Payment transaction tracking
- ✅ Comprehensive audit trail
