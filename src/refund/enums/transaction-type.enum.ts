export enum TransactionType {
  PAYMENT = 'payment',   // Customer pays for order (money IN)
  REFUND = 'refund',     // Refund to customer (money OUT)
  CREDIT = 'credit',     // Manual credit/adjustment (money IN)
  DEBIT = 'debit',       // Manual debit/charge (money OUT)
}

