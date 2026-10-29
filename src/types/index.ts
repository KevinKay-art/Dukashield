export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_threshold: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  total_debt_accumulated: number;
  total_debt_repaid: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  subtotal: number;
  profit: number;
}

export interface Sale {
  id: string;
  receipt_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
  payment_method: 'cash' | 'mpesa' | 'debt';
  sale_date: string; // YYYY-MM-DD
  created_at: string;
  items: SaleItem[];
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'mpesa';
  receipt_reference?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  sale_id?: string | null;
  initial_amount: number;
  paid_amount: number;
  remaining_amount: number;
  incurred_date: string;
  due_date: string;
  status: 'open' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  last_reminder_sent_at?: string | null;
  created_at: string;
  payments: DebtPayment[];
}

export type SmsPurpose = 'debt_reminder' | 'stock_alert' | 'daily_summary' | 'test';

export type SmsDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'rejected' | 'sent' | 'unknown';

export interface SmsLog {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  purpose: SmsPurpose;
  message_text: string;
  provider_message_id?: string | null;
  provider_status: string; // e.g. "Success", "Failed", "Accepted", "Rejected"
  status_code?: number | null; // e.g. 101
  cost?: string | null; // e.g. "KES 0.8000"
  delivery_status: SmsDeliveryStatus;
  delivery_timestamp?: string | null;
  failure_reason?: string | null;
  is_demo_simulation: boolean;
  raw_response?: any;
  created_at: string;
}

export interface BusinessAlert {
  id: string;
  type: 'low_stock' | 'overdue_debt' | 'daily_milestone';
  title: string;
  message: string;
  severity: 'warning' | 'critical' | 'info';
  reference_id?: string | null;
  acknowledged: boolean;
  sms_sent: boolean;
  last_sms_sent_at?: string | null;
  created_at: string;
}

export interface ShopSettings {
  shop_name: string;
  shopkeeper_phone: string;
  currency: string;
  at_username: string;
  at_api_key_configured: boolean;
  app_url: string;
  stored_api_key?: string;
  ussd_service_code?: string;
}

export interface HealthCheckRecommendation {
  id: string;
  category: 'inventory' | 'debts' | 'sales' | 'profitability';
  severity: 'good' | 'warning' | 'alert' | 'info';
  title: string;
  message: string;
  metric: string;
  reason: string;
  action_label?: string;
  action_type?: string;
  action_payload?: any;
}
