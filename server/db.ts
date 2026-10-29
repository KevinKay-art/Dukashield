import fs from 'fs';
import path from 'path';
import {
  Product,
  Customer,
  Sale,
  SaleItem,
  Debt,
  DebtPayment,
  SmsLog,
  BusinessAlert,
  ShopSettings,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'dukashield_db.json');

export interface DatabaseSchema {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  debts: Debt[];
  debt_payments: DebtPayment[];
  sms_logs: SmsLog[];
  business_alerts: BusinessAlert[];
  settings: ShopSettings;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getInitialSeedData(): DatabaseSchema {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'Unga wa Dola Maize Meal 2kg',
      sku: 'UNG-DOL-2KG',
      category: 'Flour & Grains',
      cost_price: 155,
      selling_price: 195,
      current_stock: 28,
      low_stock_threshold: 8,
      unit: 'packet',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-2',
      name: 'Fresha Whole Milk 500ml',
      sku: 'MLK-FRS-500',
      category: 'Dairy',
      cost_price: 52,
      selling_price: 65,
      current_stock: 3, // LOW STOCK TRIGGER!
      low_stock_threshold: 10,
      unit: 'pouch',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-3',
      name: 'Broadways Sliced White Bread 400g',
      sku: 'BRD-BDW-400',
      category: 'Bakery',
      cost_price: 55,
      selling_price: 65,
      current_stock: 14,
      low_stock_threshold: 6,
      unit: 'loaf',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-4',
      name: 'Rina Pure Vegetable Cooking Oil 1L',
      sku: 'OIL-RIN-1L',
      category: 'Oils & Fats',
      cost_price: 265,
      selling_price: 310,
      current_stock: 11,
      low_stock_threshold: 5,
      unit: 'bottle',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-5',
      name: 'Menengai Cream Bar Soap 800g',
      sku: 'SOP-MNG-800',
      category: 'Detergents & Soap',
      cost_price: 140,
      selling_price: 175,
      current_stock: 19,
      low_stock_threshold: 5,
      unit: 'bar',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-6',
      name: 'Mumias Sugar White 1kg',
      sku: 'SGR-MUM-1KG',
      category: 'Pantry',
      cost_price: 140,
      selling_price: 165,
      current_stock: 22,
      low_stock_threshold: 6,
      unit: 'packet',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-7',
      name: 'Kensalt Iodised Table Salt 1kg',
      sku: 'SLT-KEN-1KG',
      category: 'Pantry',
      cost_price: 35,
      selling_price: 45,
      current_stock: 42,
      low_stock_threshold: 10,
      unit: 'packet',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-8',
      name: 'Ketepa Chai Pride Loose Tea 250g',
      sku: 'TEA-KTP-250',
      category: 'Beverages',
      cost_price: 110,
      selling_price: 135,
      current_stock: 16,
      low_stock_threshold: 5,
      unit: 'box',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-9',
      name: 'Indomie Chicken Flavor 120g',
      sku: 'NDL-IND-120',
      category: 'Pantry',
      cost_price: 38,
      selling_price: 50,
      current_stock: 34,
      low_stock_threshold: 12,
      unit: 'packet',
      created_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'John Kamau',
      phone: '+254712345678',
      notes: 'Neighbor from Plot 4B, regular buyer of dairy and staples',
      total_debt_accumulated: 1450,
      total_debt_repaid: 0,
      created_at: new Date(now.getTime() - 40 * 86400000).toISOString(),
    },
    {
      id: 'cust-2',
      name: 'Grace Atieno',
      phone: '+254723456789',
      notes: 'Mama Kevin, operates tailoring shop opposite the road',
      total_debt_accumulated: 850,
      total_debt_repaid: 0,
      created_at: new Date(now.getTime() - 25 * 86400000).toISOString(),
    },
    {
      id: 'cust-3',
      name: 'Peter Mwangi',
      phone: '+254734567890',
      notes: 'Boda boda operator, Eldoret stage',
      total_debt_accumulated: 2100,
      total_debt_repaid: 1100,
      created_at: new Date(now.getTime() - 60 * 86400000).toISOString(),
    },
    {
      id: 'cust-4',
      name: 'Faith Chebet',
      phone: '+254745678901',
      notes: 'Teacher at St. Peter Academy, pays every end month via M-Pesa',
      total_debt_accumulated: 520,
      total_debt_repaid: 520,
      created_at: new Date(now.getTime() - 90 * 86400000).toISOString(),
    },
  ];

  const debts: Debt[] = [
    {
      id: 'debt-1',
      customer_id: 'cust-1',
      customer_name: 'John Kamau',
      customer_phone: '+254712345678',
      initial_amount: 1450,
      paid_amount: 0,
      remaining_amount: 1450,
      incurred_date: fourteenDaysAgo,
      due_date: fiveDaysAgo, // OVERDUE!
      status: 'overdue',
      notes: 'Unga wa Dola 2 bags + 2kg Sugar + cooking oil',
      last_reminder_sent_at: null,
      created_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
      payments: [],
    },
    {
      id: 'debt-2',
      customer_id: 'cust-2',
      customer_name: 'Grace Atieno',
      customer_phone: '+254723456789',
      initial_amount: 850,
      paid_amount: 0,
      remaining_amount: 850,
      incurred_date: threeDaysAgo,
      due_date: tomorrow,
      status: 'open',
      notes: 'Fresha Milk, Bread & Chai Pride tea packet',
      last_reminder_sent_at: null,
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      payments: [],
    },
    {
      id: 'debt-3',
      customer_id: 'cust-3',
      customer_name: 'Peter Mwangi',
      customer_phone: '+254734567890',
      initial_amount: 2100,
      paid_amount: 1100,
      remaining_amount: 1000,
      incurred_date: twentyDaysAgo,
      due_date: fiveDaysAgo,
      status: 'overdue',
      notes: 'Weekly groceries for family',
      last_reminder_sent_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      created_at: new Date(now.getTime() - 20 * 86400000).toISOString(),
      payments: [
        {
          id: 'pay-1',
          debt_id: 'debt-3',
          customer_id: 'cust-3',
          amount: 1100,
          payment_date: new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0],
          payment_method: 'mpesa',
          receipt_reference: 'QGK72910M',
          created_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
        },
      ],
    },
  ];

  const debt_payments: DebtPayment[] = debts.flatMap((d) => d.payments);

  // Sales: A few yesterday, a few today
  const sales: Sale[] = [
    // Yesterday's sales
    {
      id: 'sale-y1',
      receipt_number: 'RCP-20261027-001',
      customer_id: 'cust-4',
      customer_name: 'Faith Chebet',
      total_amount: 520,
      cost_amount: 415,
      profit_amount: 105,
      payment_method: 'mpesa',
      sale_date: yesterdayStr,
      created_at: new Date(yesterday.getTime() + 10 * 3600000).toISOString(),
      items: [
        {
          id: 'si-y1-1',
          sale_id: 'sale-y1',
          product_id: 'prod-1',
          product_name: 'Unga wa Dola Maize Meal 2kg',
          quantity: 2,
          cost_price: 155,
          selling_price: 195,
          subtotal: 390,
          profit: 80,
        },
        {
          id: 'si-y1-2',
          sale_id: 'sale-y1',
          product_id: 'prod-3',
          product_name: 'Broadways Sliced White Bread 400g',
          quantity: 2,
          cost_price: 55,
          selling_price: 65,
          subtotal: 130,
          profit: 20,
        },
      ],
    },
    {
      id: 'sale-y2',
      receipt_number: 'RCP-20261027-002',
      customer_id: null,
      customer_name: 'Walk-in Customer',
      total_amount: 620,
      cost_amount: 530,
      profit_amount: 90,
      payment_method: 'cash',
      sale_date: yesterdayStr,
      created_at: new Date(yesterday.getTime() + 14 * 3600000).toISOString(),
      items: [
        {
          id: 'si-y2-1',
          sale_id: 'sale-y2',
          product_id: 'prod-4',
          product_name: 'Rina Pure Vegetable Cooking Oil 1L',
          quantity: 2,
          cost_price: 265,
          selling_price: 310,
          subtotal: 620,
          profit: 90,
        },
      ],
    },
    // Today's sales
    {
      id: 'sale-t1',
      receipt_number: 'RCP-20261028-001',
      customer_id: null,
      customer_name: 'Walk-in Customer',
      total_amount: 325,
      cost_amount: 260,
      profit_amount: 65,
      payment_method: 'cash',
      sale_date: todayStr,
      created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
      items: [
        {
          id: 'si-t1-1',
          sale_id: 'sale-t1',
          product_id: 'prod-2',
          product_name: 'Fresha Whole Milk 500ml',
          quantity: 5,
          cost_price: 52,
          selling_price: 65,
          subtotal: 325,
          profit: 65,
        },
      ],
    },
    {
      id: 'sale-t2',
      receipt_number: 'RCP-20261028-002',
      customer_id: 'cust-2',
      customer_name: 'Grace Atieno',
      total_amount: 585,
      cost_amount: 465,
      profit_amount: 120,
      payment_method: 'mpesa',
      sale_date: todayStr,
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
      items: [
        {
          id: 'si-t2-1',
          sale_id: 'sale-t2',
          product_id: 'prod-1',
          product_name: 'Unga wa Dola Maize Meal 2kg',
          quantity: 1,
          cost_price: 155,
          selling_price: 195,
          subtotal: 195,
          profit: 40,
        },
        {
          id: 'si-t2-2',
          sale_id: 'sale-t2',
          product_id: 'prod-4',
          product_name: 'Rina Pure Vegetable Cooking Oil 1L',
          quantity: 1,
          cost_price: 265,
          selling_price: 310,
          subtotal: 310,
          profit: 45,
        },
        {
          id: 'si-t2-3',
          sale_id: 'sale-t2',
          product_id: 'prod-7',
          product_name: 'Kensalt Iodised Table Salt 1kg',
          quantity: 1,
          cost_price: 35,
          selling_price: 45,
          subtotal: 45,
          profit: 10,
        },
      ],
    },
    {
      id: 'sale-t3',
      receipt_number: 'RCP-20261028-003',
      customer_id: null,
      customer_name: 'Walk-in Customer',
      total_amount: 295,
      cost_amount: 247,
      profit_amount: 48,
      payment_method: 'cash',
      sale_date: todayStr,
      created_at: new Date(now.getTime() - 45 * 60000).toISOString(),
      items: [
        {
          id: 'si-t3-1',
          sale_id: 'sale-t3',
          product_id: 'prod-3',
          product_name: 'Broadways Sliced White Bread 400g',
          quantity: 2,
          cost_price: 55,
          selling_price: 65,
          subtotal: 130,
          profit: 20,
        },
        {
          id: 'si-t3-2',
          sale_id: 'sale-t3',
          product_id: 'prod-6',
          product_name: 'Mumias Sugar White 1kg',
          quantity: 1,
          cost_price: 140,
          selling_price: 165,
          subtotal: 165,
          profit: 25,
        },
      ],
    },
  ];

  const business_alerts: BusinessAlert[] = [
    {
      id: 'alert-1',
      type: 'low_stock',
      title: 'Fresha Milk is critically low',
      message: 'Fresha Whole Milk 500ml has only 3 pouches left. Threshold is 10.',
      severity: 'critical',
      reference_id: 'prod-2',
      acknowledged: false,
      sms_sent: false,
      created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
    },
    {
      id: 'alert-2',
      type: 'overdue_debt',
      title: 'John Kamau debt is 5 days overdue',
      message: 'John Kamau owes KES 1,450 since 2 weeks ago. Due date was 5 days ago.',
      severity: 'warning',
      reference_id: 'debt-1',
      acknowledged: false,
      sms_sent: false,
      created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
    },
  ];

  const sms_logs: SmsLog[] = [
    {
      id: 'sms-seed-1',
      recipient_phone: '+254712345678',
      recipient_name: 'Mama Boi (Shopkeeper)',
      purpose: 'test',
      message_text: 'DukaShield Sandbox Verification: SMS Gateway connected. Ready to protect your duka.',
      provider_message_id: 'ATXid_b49f28a8d9e7',
      provider_status: 'Success',
      status_code: 101,
      cost: 'KES 0.8000',
      delivery_status: 'delivered',
      delivery_timestamp: new Date(now.getTime() - 36 * 3600000).toISOString(),
      failure_reason: null,
      is_demo_simulation: false,
      raw_response: {
        SMSMessageData: {
          Message: 'Sent to 1/1 Total Cost: KES 0.8000',
          Recipients: [
            {
              cost: 'KES 0.8000',
              messageId: 'ATXid_b49f28a8d9e7',
              number: '+254712345678',
              status: 'Success',
              statusCode: 101,
            },
          ],
        },
      },
      created_at: new Date(now.getTime() - 36 * 3600000).toISOString(),
    },
  ];

  const settings: ShopSettings = {
    shop_name: process.env.SHOP_NAME || 'Mama Boi Duka & General Supplies',
    shopkeeper_phone: process.env.SHOPKEEPER_PHONE || '+254712345678',
    currency: 'KES',
    at_username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
    at_api_key_configured: Boolean(process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_API_KEY.trim() !== ''),
    app_url: process.env.APP_URL || 'https://ais-dev-bscnsuporyfwsoeqnzdi2x-51694486837.europe-west2.run.app',
    ussd_service_code: process.env.USSD_SERVICE_CODE || '*384*88924#',
  };

  return {
    products,
    customers,
    sales,
    debts,
    debt_payments,
    sms_logs,
    business_alerts,
    settings,
  };
}

class Database {
  private cache: DatabaseSchema | null = null;
  private isWriting = false;

  constructor() {
    ensureDataDir();
    this.load();
  }

  public load(): DatabaseSchema {
    ensureDataDir();
    if (this.cache) return this.cache;

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialSeedData();
      this.writeSync(initial);
      this.cache = initial;
      return initial;
    }

    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      this.cache = JSON.parse(data);
      if (!this.cache) {
        throw new Error('Parsed database was empty');
      }
      // Restore stored API key into process.env if available
      if (this.cache.settings.stored_api_key && !process.env.AFRICASTALKING_API_KEY) {
        process.env.AFRICASTALKING_API_KEY = this.cache.settings.stored_api_key;
      }
      // Sync settings with env vars dynamically
      this.cache.settings.at_api_key_configured = Boolean(
        (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_API_KEY.trim() !== '') ||
        (this.cache.settings.stored_api_key && this.cache.settings.stored_api_key.trim() !== '')
      );
      if (process.env.SHOPKEEPER_PHONE) {
        this.cache.settings.shopkeeper_phone = process.env.SHOPKEEPER_PHONE;
      }
      if (process.env.SHOP_NAME) {
        this.cache.settings.shop_name = process.env.SHOP_NAME;
      }
      if (!this.cache.settings.ussd_service_code) {
        this.cache.settings.ussd_service_code = process.env.USSD_SERVICE_CODE || '*384*88924#';
      }
      return this.cache;
    } catch (err) {
      console.error('Error reading DB, re-seeding:', err);
      const initial = getInitialSeedData();
      this.writeSync(initial);
      this.cache = initial;
      return initial;
    }
  }

  public write(data: DatabaseSchema): void {
    this.cache = data;
    ensureDataDir();
    const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  private writeSync(data: DatabaseSchema): void {
    ensureDataDir();
    const tmpFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  public resetToSeed(): DatabaseSchema {
    const seed = getInitialSeedData();
    this.write(seed);
    return seed;
  }

  // =================== PRODUCTS ===================
  public getProducts(): Product[] {
    return this.load().products;
  }

  public getProduct(id: string): Product | undefined {
    return this.load().products.find((p) => p.id === id);
  }

  public addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const db = this.load();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };
    db.products.push(newProduct);
    this.write(db);
    this.checkStockLevelAndAlert(newProduct);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>): Product {
    const db = this.load();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product ${id} not found`);

    const updated: Product = {
      ...db.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    db.products[idx] = updated;
    this.write(db);
    this.checkStockLevelAndAlert(updated);
    return updated;
  }

  // =================== SALES ===================
  public getSales(): Sale[] {
    return this.load().sales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSale(id: string): Sale | undefined {
    return this.load().sales.find((s) => s.id === id);
  }

  /**
   * Safe server-side sale recording with inventory deduction.
   * If any item exceeds available stock, rejects immediately.
   */
  public recordSale(payload: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'cash' | 'mpesa' | 'debt';
    customerId?: string;
    debtDueDate?: string;
    debtNotes?: string;
  }): { sale: Sale; debt?: Debt; alertsTriggered: BusinessAlert[] } {
    const db = this.load();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (!payload.items || payload.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    // 1. Validate all items exist and have sufficient stock
    const itemDetails: Array<{
      product: Product;
      quantity: number;
      cost: number;
      sell: number;
      subtotal: number;
      profit: number;
    }> = [];

    for (const item of payload.items) {
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be greater than zero');
      }
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (product.current_stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}". Available: ${product.current_stock}, Requested: ${item.quantity}`
        );
      }
      const subtotal = Math.round(product.selling_price * item.quantity);
      const costTotal = Math.round(product.cost_price * item.quantity);
      const profit = subtotal - costTotal;

      itemDetails.push({
        product,
        quantity: item.quantity,
        cost: product.cost_price,
        sell: product.selling_price,
        subtotal,
        profit,
      });
    }

    // 2. Compute totals
    const totalAmount = itemDetails.reduce((sum, i) => sum + i.subtotal, 0);
    const costAmount = itemDetails.reduce((sum, i) => sum + i.cost * i.quantity, 0);
    const profitAmount = totalAmount - costAmount;

    // Customer resolution
    let customerName = 'Walk-in Customer';
    let customer: Customer | undefined;
    if (payload.customerId) {
      customer = db.customers.find((c) => c.id === payload.customerId);
      if (customer) {
        customerName = customer.name;
      }
    }

    if (payload.paymentMethod === 'debt' && !customer) {
      throw new Error('A registered customer is required to record a sale on debt/credit');
    }

    const saleId = `sale-${Date.now()}`;
    const receiptNumber = `RCP-${todayStr.replace(/-/g, '')}-${String(db.sales.length + 1).padStart(3, '0')}`;

    // 3. Deduct stock safely
    const alertsTriggered: BusinessAlert[] = [];
    for (const detail of itemDetails) {
      const prodIdx = db.products.findIndex((p) => p.id === detail.product.id);
      db.products[prodIdx].current_stock -= detail.quantity;
      db.products[prodIdx].updated_at = now.toISOString();

      // Check if newly reached or below threshold
      const updatedProd = db.products[prodIdx];
      if (updatedProd.current_stock <= updatedProd.low_stock_threshold) {
        const existingAlert = db.business_alerts.find(
          (a) => a.type === 'low_stock' && a.reference_id === updatedProd.id && !a.acknowledged
        );
        if (!existingAlert) {
          const newAlert: BusinessAlert = {
            id: `alert-${Date.now()}-${updatedProd.id}`,
            type: 'low_stock',
            title: `${updatedProd.name} is running low`,
            message: `Current stock: ${updatedProd.current_stock} ${updatedProd.unit}(s). Low-stock threshold is ${updatedProd.low_stock_threshold}. Reorder soon!`,
            severity: updatedProd.current_stock === 0 ? 'critical' : 'warning',
            reference_id: updatedProd.id,
            acknowledged: false,
            sms_sent: false,
            created_at: now.toISOString(),
          };
          db.business_alerts.push(newAlert);
          alertsTriggered.push(newAlert);
        }
      }
    }

    // 4. Create Sale Items
    const saleItems: SaleItem[] = itemDetails.map((detail, idx) => ({
      id: `si-${saleId}-${idx + 1}`,
      sale_id: saleId,
      product_id: detail.product.id,
      product_name: detail.product.name,
      quantity: detail.quantity,
      cost_price: detail.cost,
      selling_price: detail.sell,
      subtotal: detail.subtotal,
      profit: detail.profit,
    }));

    const newSale: Sale = {
      id: saleId,
      receipt_number: receiptNumber,
      customer_id: payload.customerId || null,
      customer_name: customerName,
      total_amount: totalAmount,
      cost_amount: costAmount,
      profit_amount: profitAmount,
      payment_method: payload.paymentMethod,
      sale_date: todayStr,
      created_at: now.toISOString(),
      items: saleItems,
    };

    db.sales.unshift(newSale);

    // 5. If sale on debt, create Debt record
    let newDebt: Debt | undefined;
    if (payload.paymentMethod === 'debt' && customer) {
      const dueDate = payload.debtDueDate || new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
      newDebt = {
        id: `debt-${Date.now()}`,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        sale_id: saleId,
        initial_amount: totalAmount,
        paid_amount: 0,
        remaining_amount: totalAmount,
        incurred_date: todayStr,
        due_date: dueDate,
        status: new Date(dueDate) < now ? 'overdue' : 'open',
        notes: payload.debtNotes || `Sale ${receiptNumber}: ${saleItems.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}`,
        last_reminder_sent_at: null,
        created_at: now.toISOString(),
        payments: [],
      };
      db.debts.unshift(newDebt);

      // Update customer debt stats
      const custIdx = db.customers.findIndex((c) => c.id === customer!.id);
      if (custIdx !== -1) {
        db.customers[custIdx].total_debt_accumulated += totalAmount;
      }
    }

    this.write(db);
    return { sale: newSale, debt: newDebt, alertsTriggered };
  }

  // =================== CUSTOMERS & DEBTS ===================
  public getCustomers(): Customer[] {
    return this.load().customers;
  }

  public addCustomer(data: { name: string; phone: string; notes?: string }): Customer {
    const db = this.load();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      notes: data.notes?.trim(),
      total_debt_accumulated: 0,
      total_debt_repaid: 0,
      created_at: new Date().toISOString(),
    };
    db.customers.push(newCust);
    this.write(db);
    return newCust;
  }

  public getDebts(): Debt[] {
    const db = this.load();
    const now = new Date();
    // Update overdue status dynamically
    let updated = false;
    for (const d of db.debts) {
      if (d.remaining_amount > 0 && new Date(d.due_date) < now && d.status !== 'overdue') {
        d.status = 'overdue';
        updated = true;
      }
    }
    if (updated) this.write(db);
    return db.debts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getDebt(id: string): Debt | undefined {
    return this.getDebts().find((d) => d.id === id);
  }

  public recordDebtRepayment(
    debtId: string,
    amount: number,
    paymentMethod: 'cash' | 'mpesa',
    receiptReference?: string
  ): { debt: Debt; payment: DebtPayment } {
    const db = this.load();
    const debt = db.debts.find((d) => d.id === debtId);
    if (!debt) throw new Error('Debt not found');

    if (amount <= 0) throw new Error('Repayment amount must be positive');
    if (amount > debt.remaining_amount) {
      throw new Error(`Repayment KES ${amount} exceeds remaining debt balance of KES ${debt.remaining_amount}`);
    }

    const now = new Date().toISOString();
    const payment: DebtPayment = {
      id: `pay-${Date.now()}`,
      debt_id: debtId,
      customer_id: debt.customer_id,
      amount,
      payment_date: now.split('T')[0],
      payment_method: paymentMethod,
      receipt_reference: receiptReference || (paymentMethod === 'mpesa' ? `MPESA-${Date.now().toString().slice(-6)}` : 'CASH'),
      created_at: now,
    };

    debt.payments.push(payment);
    db.debt_payments.push(payment);
    debt.paid_amount += amount;
    debt.remaining_amount -= amount;

    if (debt.remaining_amount === 0) {
      debt.status = 'paid';
    } else {
      debt.status = 'partial';
    }

    const cust = db.customers.find((c) => c.id === debt.customer_id);
    if (cust) {
      cust.total_debt_repaid += amount;
    }

    this.write(db);
    return { debt, payment };
  }

  public recordDebtReminderSent(debtId: string): void {
    const db = this.load();
    const debt = db.debts.find((d) => d.id === debtId);
    if (debt) {
      debt.last_reminder_sent_at = new Date().toISOString();
      this.write(db);
    }
  }

  // =================== ALERTS ===================
  public getAlerts(): BusinessAlert[] {
    return this.load().business_alerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public acknowledgeAlert(alertId: string): void {
    const db = this.load();
    const alert = db.business_alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.write(db);
    }
  }

  public markAlertSmsSent(alertId: string): void {
    const db = this.load();
    const alert = db.business_alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.sms_sent = true;
      alert.last_sms_sent_at = new Date().toISOString();
      this.write(db);
    }
  }

  private checkStockLevelAndAlert(product: Product): void {
    const db = this.load();
    if (product.current_stock <= product.low_stock_threshold) {
      const existing = db.business_alerts.find(
        (a) => a.type === 'low_stock' && a.reference_id === product.id && !a.acknowledged
      );
      if (!existing) {
        db.business_alerts.push({
          id: `alert-${Date.now()}-${product.id}`,
          type: 'low_stock',
          title: `${product.name} is low on stock`,
          message: `Stock is at ${product.current_stock} ${product.unit}(s), below threshold of ${product.low_stock_threshold}.`,
          severity: product.current_stock === 0 ? 'critical' : 'warning',
          reference_id: product.id,
          acknowledged: false,
          sms_sent: false,
          created_at: new Date().toISOString(),
        });
        this.write(db);
      }
    }
  }

  // =================== SMS LOGS ===================
  public getSmsLogs(): SmsLog[] {
    return this.load().sms_logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addSmsLog(log: Omit<SmsLog, 'id' | 'created_at'>): SmsLog {
    const db = this.load();
    const newLog: SmsLog = {
      ...log,
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
    };
    db.sms_logs.unshift(newLog);
    this.write(db);
    return newLog;
  }

  public updateDeliveryReport(
    providerMessageId: string,
    status: 'Success' | 'Failed' | 'Rejected' | 'Sent' | 'Submitted' | string,
    failureReason?: string,
    rawPayload?: any
  ): SmsLog | null {
    const db = this.load();
    const log = db.sms_logs.find(
      (l) => l.provider_message_id === providerMessageId || (l.provider_message_id && l.provider_message_id.includes(providerMessageId))
    );

    if (!log) return null;

    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'success' || normalizedStatus === 'delivered') {
      log.delivery_status = 'delivered';
    } else if (normalizedStatus === 'failed') {
      log.delivery_status = 'failed';
    } else if (normalizedStatus === 'rejected') {
      log.delivery_status = 'rejected';
    } else if (normalizedStatus === 'sent' || normalizedStatus === 'submitted' || normalizedStatus === 'buffered') {
      log.delivery_status = 'sent';
    }

    log.delivery_timestamp = new Date().toISOString();
    if (failureReason) {
      log.failure_reason = failureReason;
    }
    if (rawPayload) {
      log.raw_response = { ...log.raw_response, callbackPayload: rawPayload };
    }

    this.write(db);
    return log;
  }

  // =================== SETTINGS ===================
  public getSettings(): ShopSettings {
    const db = this.load();
    db.settings.at_api_key_configured = Boolean(
      (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_API_KEY.trim() !== '') ||
      (db.settings.stored_api_key && db.settings.stored_api_key.trim() !== '')
    );
    return db.settings;
  }

  public updateSettings(updates: Partial<ShopSettings>): ShopSettings {
    const db = this.load();
    db.settings = { ...db.settings, ...updates };
    this.write(db);
    return db.settings;
  }
}

export const db = new Database();
