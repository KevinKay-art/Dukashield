import {
  Product,
  Customer,
  Sale,
  Debt,
  DebtPayment,
  SmsLog,
  BusinessAlert,
  ShopSettings,
  HealthCheckRecommendation,
} from '../types/index.ts';

export interface DashboardData {
  date: string;
  metrics: {
    totalSales: number;
    salesCount: number;
    totalProfit: number;
    totalOutstandingDebt: number;
    overdueDebtsCount: number;
    overdueDebtsAmount: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  lowStockProducts: Product[];
  recentSales: Sale[];
  recentSms: SmsLog[];
  alerts: BusinessAlert[];
  settings: ShopSettings;
}

export interface SmsActivityResponse {
  logs: SmsLog[];
  counters: {
    realApiAttempts: number;
    apiAccepted: number;
    realProviderFailures: number;
    confirmedDeliveries: number;
    demoSimulatedFailures: number;
  };
}

export interface HealthCheckData {
  overallStatus: 'healthy' | 'attention_needed' | 'action_required';
  score: number;
  metrics: {
    todaySales: number;
    yesterdaySales: number;
    salesGrowthPercent: number | null;
    todayProfit: number;
    yesterdayProfit: number;
    profitGrowthPercent: number | null;
    grossMarginPercent: number;
    totalOutstandingDebt: number;
    overdueDebtsCount: number;
    overdueDebtsAmount: number;
    lowStockCount: number;
    outOfStockCount: number;
    healthyStockCount: number;
    cashDebtRatio: number;
  };
  recommendations: HealthCheckRecommendation[];
  calculatedAt: string;
}

export interface DailySummaryData {
  date: string;
  totalSales: number;
  totalProfit: number;
  transactionCount: number;
  totalOutstandingDebt: number;
  overdueDebtsCount: number;
  overdueDebtsAmount: number;
  lowStockCount: number;
  lowStockProducts: Product[];
}

export const api = {
  async getDashboard(date?: string): Promise<DashboardData> {
    const url = date ? `/api/dashboard?date=${date}` : '/api/dashboard';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create product' }));
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update product' }));
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  async getSales(): Promise<Sale[]> {
    const res = await fetch('/api/sales');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async recordSale(payload: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'cash' | 'mpesa' | 'debt';
    customerId?: string;
    debtDueDate?: string;
    debtNotes?: string;
  }): Promise<{ sale: Sale; debt?: Debt; alertsTriggered: BusinessAlert[] }> {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Sale could not be processed' }));
      throw new Error(err.error || 'Failed to record sale');
    }
    return res.json();
  },

  async getCustomers(): Promise<Customer[]> {
    const res = await fetch('/api/customers');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async createCustomer(data: { name: string; phone: string; notes?: string }): Promise<Customer> {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create customer' }));
      throw new Error(err.error || 'Failed to register customer');
    }
    return res.json();
  },

  async getDebts(): Promise<Debt[]> {
    const res = await fetch('/api/debts');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async repayDebt(
    debtId: string,
    amount: number,
    paymentMethod: 'cash' | 'mpesa',
    receiptReference?: string
  ): Promise<{ debt: Debt; payment: DebtPayment }> {
    const res = await fetch(`/api/debts/${debtId}/repay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod, receiptReference }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to record repayment' }));
      throw new Error(err.error || 'Repayment failed');
    }
    return res.json();
  },

  async sendDebtReminder(debtId: string): Promise<{
    success: boolean;
    smsLog: SmsLog;
    rawResponse?: any;
    error?: string;
  }> {
    const res = await fetch(`/api/debts/${debtId}/remind`, {
      method: 'POST',
    });
    const data = await res.json();
    return data;
  },

  async getAlerts(): Promise<BusinessAlert[]> {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    await fetch(`/api/alerts/${alertId}/ack`, { method: 'POST' });
  },

  async sendStockAlertSms(alertId: string): Promise<{
    success: boolean;
    smsLog: SmsLog;
    rawResponse?: any;
    error?: string;
  }> {
    const res = await fetch(`/api/alerts/${alertId}/send-sms`, { method: 'POST' });
    return res.json();
  },

  async getDailySummary(date?: string): Promise<DailySummaryData> {
    const url = date ? `/api/summary/daily?date=${date}` : '/api/summary/daily';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async sendDailySummarySms(date?: string): Promise<{
    success: boolean;
    smsLog: SmsLog;
    rawResponse?: any;
    error?: string;
  }> {
    const res = await fetch('/api/summary/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    return res.json();
  },

  async getHealthCheck(): Promise<HealthCheckData> {
    const res = await fetch('/api/health-check');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async getSmsLogs(filter: string = 'all'): Promise<SmsActivityResponse> {
    const res = await fetch(`/api/sms/logs?filter=${filter}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async sendTestSms(payload: {
    to: string;
    message: string;
    simulateFailureDemo?: boolean;
  }): Promise<{
    success: boolean;
    smsLog: SmsLog;
    rawResponse?: any;
    error?: string;
  }> {
    const res = await fetch('/api/sms/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async testSandboxConnection(): Promise<{
    configured: boolean;
    username: string;
    hasApiKey: boolean;
    apiKeyPreview?: string;
    canConnect?: boolean;
    balance?: string;
    error?: string;
  }> {
    const res = await fetch('/api/sms/test-connection');
    return res.json();
  },

  async getSettings(): Promise<ShopSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async updateSettings(updates: Partial<ShopSettings>): Promise<ShopSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update settings' }));
      throw new Error(err.error || 'Failed to update settings');
    }
    return res.json();
  },

  async saveApiKey(apiKey: string, username?: string): Promise<{ success: boolean; message: string; testResult: any }> {
    const res = await fetch('/api/settings/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save API key' }));
      throw new Error(err.error || 'Failed to save API key');
    }
    return res.json();
  },

  async resetSeed(): Promise<void> {
    const res = await fetch('/api/demo/reset-seed', { method: 'POST' });
    if (!res.ok) throw new Error(await res.text());
  },
};
