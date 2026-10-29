import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import {
  sendAfricaTalkingSms,
  testAfricaTalkingSandboxConnection,
  normalizeKenyanPhoneNumber,
} from './africasTalking.ts';
import { calculateBusinessHealth } from './healthCheck.ts';
import { handleUssdRequest } from './ussd.ts';

export const apiRouter = Router();

// =================== USSD GATEWAY ===================
/**
 * Africa's Talking USSD Callback Endpoint
 * POST /api/ussd
 * Accepts urlencoded or json with: sessionId, serviceCode, phoneNumber, text
 * Returns text/plain with CON or END prefix
 */
apiRouter.post('/ussd', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const settings = db.getSettings();
    const responseText = await handleUssdRequest({
      sessionId: payload.sessionId,
      serviceCode: payload.serviceCode || settings.ussd_service_code || '*384*88924#',
      phoneNumber: payload.phoneNumber || '+254712345678',
      text: payload.text || '',
    });

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(responseText);
  } catch (err: any) {
    console.error('[USSD Error]', err);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(`END System error: ${err.message}`);
  }
});

// =================== DASHBOARD ===================
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    const sales = db.getSales();
    const debts = db.getDebts();
    const alerts = db.getAlerts();
    const smsLogs = db.getSmsLogs();
    const settings = db.getSettings();

    const now = new Date();
    const selectedDate = (req.query.date as string) || now.toISOString().split('T')[0];

    // Filter sales for the selected date
    const dateSales = sales.filter((s) => s.sale_date === selectedDate);
    const totalSales = dateSales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = dateSales.reduce((sum, s) => sum + s.profit_amount, 0);
    const salesCount = dateSales.length;

    // Debt metrics
    const openDebts = debts.filter((d) => d.status === 'open' || d.status === 'partial' || d.status === 'overdue');
    const totalOutstandingDebt = openDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
    const overdueDebts = openDebts.filter((d) => d.status === 'overdue' || new Date(d.due_date) < now);
    const overdueDebtsCount = overdueDebts.length;
    const overdueDebtsAmount = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

    // Stock metrics
    const lowStockProducts = products.filter((p) => p.current_stock <= p.low_stock_threshold);
    const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;

    // Recent activity
    const recentSales = sales.slice(0, 5);
    const recentSms = smsLogs.slice(0, 5);
    const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged);

    res.json({
      date: selectedDate,
      metrics: {
        totalSales,
        salesCount,
        totalProfit,
        totalOutstandingDebt,
        overdueDebtsCount,
        overdueDebtsAmount,
        lowStockCount: lowStockProducts.length,
        outOfStockCount,
      },
      lowStockProducts,
      recentSales,
      recentSms,
      alerts: unacknowledgedAlerts,
      settings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== PRODUCTS ===================
apiRouter.get('/products', (_req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/products', (req: Request, res: Response) => {
  try {
    const { name, sku, category, cost_price, selling_price, current_stock, low_stock_threshold, unit } = req.body;
    if (!name || cost_price === undefined || selling_price === undefined || current_stock === undefined) {
      return res.status(400).json({ error: 'Name, cost price, selling price, and stock are required' });
    }

    const numCost = Number(cost_price);
    const numSell = Number(selling_price);
    const numStock = Number(current_stock);
    const numThreshold = Number(low_stock_threshold || 5);

    if (numCost < 0 || numSell < 0 || numStock < 0) {
      return res.status(400).json({ error: 'Prices and stock cannot be negative' });
    }

    const product = db.addProduct({
      name: name.trim(),
      sku: (sku || `SKU-${Date.now().toString().slice(-6)}`).toUpperCase(),
      category: category || 'General',
      cost_price: numCost,
      selling_price: numSell,
      current_stock: numStock,
      low_stock_threshold: numThreshold,
      unit: unit || 'item',
    });

    res.status(201).json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateProduct(id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =================== SALES ===================
apiRouter.get('/sales', (_req: Request, res: Response) => {
  try {
    res.json(db.getSales());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/sales', (req: Request, res: Response) => {
  try {
    const { items, paymentMethod, customerId, debtDueDate, debtNotes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale must include at least one product' });
    }

    const result = db.recordSale({
      items,
      paymentMethod: paymentMethod || 'cash',
      customerId,
      debtDueDate,
      debtNotes,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// =================== CUSTOMERS ===================
apiRouter.get('/customers', (_req: Request, res: Response) => {
  try {
    res.json(db.getCustomers());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  try {
    const { name, phone, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Customer name and phone number are required' });
    }

    const validation = normalizeKenyanPhoneNumber(phone);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const customer = db.addCustomer({
      name,
      phone: validation.normalized,
      notes,
    });

    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== DEBTS ===================
apiRouter.get('/debts', (_req: Request, res: Response) => {
  try {
    res.json(db.getDebts());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/debts/:id/repay', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, receiptReference } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Repayment amount must be greater than zero' });
    }

    const result = db.recordDebtRepayment(
      id,
      Number(amount),
      paymentMethod || 'cash',
      receiptReference
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Sends a polite debt reminder SMS via Africa's Talking Sandbox
 */
apiRouter.post('/debts/:id/remind', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const debt = db.getDebt(id);
    if (!debt) {
      return res.status(404).json({ error: 'Debt record not found' });
    }

    if (debt.remaining_amount <= 0) {
      return res.status(400).json({ error: 'Debt is already fully paid' });
    }

    const settings = db.getSettings();
    const shopName = settings.shop_name || 'Mama Boi Duka';

    // Format polite reminder according to brief
    const message = `Hello ${debt.customer_name}, this is a friendly reminder that your balance at ${shopName} is KES ${debt.remaining_amount.toLocaleString()}. Kindly arrange payment by ${debt.due_date}. If you have already paid, please disregard this message. Thank you.`;

    const smsResult = await sendAfricaTalkingSms({
      to: debt.customer_phone,
      message,
      purpose: 'debt_reminder',
      recipientName: debt.customer_name,
    });

    if (smsResult.success) {
      db.recordDebtReminderSent(debt.id);
    }

    res.json({
      success: smsResult.success,
      smsLog: smsResult.smsLog,
      rawResponse: smsResult.rawResponse,
      error: smsResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== ALERTS & STOCK NOTIFICATIONS ===================
apiRouter.get('/alerts', (_req: Request, res: Response) => {
  try {
    res.json(db.getAlerts());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/alerts/:id/ack', (req: Request, res: Response) => {
  try {
    db.acknowledgeAlert(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Sends a stock alert SMS to the shopkeeper's registered phone number
 */
apiRouter.post('/alerts/:id/send-sms', async (req: Request, res: Response) => {
  try {
    const alert = db.getAlerts().find((a) => a.id === req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const settings = db.getSettings();
    const shopkeeperPhone = settings.shopkeeper_phone;

    let productName = 'Item';
    let currentStock = 'low';
    if (alert.reference_id) {
      const prod = db.getProduct(alert.reference_id);
      if (prod) {
        productName = prod.name;
        currentStock = `${prod.current_stock} ${prod.unit}s`;
      }
    }

    const message = `DukaShield Alert: ${productName} is running low. Current stock: ${currentStock}. Reorder soon to avoid running out.`;

    const smsResult = await sendAfricaTalkingSms({
      to: shopkeeperPhone,
      message,
      purpose: 'stock_alert',
      recipientName: `${settings.shop_name} Shopkeeper`,
    });

    if (smsResult.success) {
      db.markAlertSmsSent(alert.id);
    }

    res.json({
      success: smsResult.success,
      smsLog: smsResult.smsLog,
      rawResponse: smsResult.rawResponse,
      error: smsResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== DAILY BUSINESS SUMMARY ===================
apiRouter.get('/summary/daily', (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const sales = db.getSales().filter((s) => s.sale_date === date);
    const debts = db.getDebts();
    const products = db.getProducts();

    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit_amount, 0);
    const transactionCount = sales.length;

    const openDebts = debts.filter((d) => d.status === 'open' || d.status === 'partial' || d.status === 'overdue');
    const totalOutstandingDebt = openDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
    const overdueDebts = openDebts.filter((d) => d.status === 'overdue');

    const lowStockProducts = products.filter((p) => p.current_stock <= p.low_stock_threshold);

    res.json({
      date,
      totalSales,
      totalProfit,
      transactionCount,
      totalOutstandingDebt,
      overdueDebtsCount: overdueDebts.length,
      overdueDebtsAmount: overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0),
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Sends a Daily Summary SMS to the shopkeeper phone via Africa's Talking Sandbox
 */
apiRouter.post('/summary/send-sms', async (req: Request, res: Response) => {
  try {
    const date = (req.body.date as string) || new Date().toISOString().split('T')[0];
    const sales = db.getSales().filter((s) => s.sale_date === date);
    const debts = db.getDebts();
    const products = db.getProducts();
    const settings = db.getSettings();

    const totalSales = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.profit_amount, 0);
    const transactionCount = sales.length;

    const openDebts = debts.filter((d) => d.status === 'open' || d.status === 'partial' || d.status === 'overdue');
    const totalOutstandingDebt = openDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
    const overdueDebts = openDebts.filter((d) => d.status === 'overdue');

    const lowStockCount = products.filter((p) => p.current_stock <= p.low_stock_threshold).length;

    const message = `DukaShield Daily Summary (${date}) for ${settings.shop_name}: Sales KES ${totalSales.toLocaleString()} (${transactionCount} txns), Est. Profit KES ${totalProfit.toLocaleString()}, Unpaid Debt KES ${totalOutstandingDebt.toLocaleString()} (${overdueDebts.length} overdue), Low-Stock Items: ${lowStockCount}. Have a restful evening!`;

    const smsResult = await sendAfricaTalkingSms({
      to: settings.shopkeeper_phone,
      message,
      purpose: 'daily_summary',
      recipientName: `${settings.shop_name} Shopkeeper`,
    });

    res.json({
      success: smsResult.success,
      smsLog: smsResult.smsLog,
      rawResponse: smsResult.rawResponse,
      error: smsResult.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== BUSINESS HEALTH CHECK ===================
apiRouter.get('/health-check', (_req: Request, res: Response) => {
  try {
    const health = calculateBusinessHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SMS ACTIVITY & TESTING ===================
apiRouter.get('/sms/logs', (req: Request, res: Response) => {
  try {
    const filter = (req.query.filter as string) || 'all';
    let logs = db.getSmsLogs();

    if (filter === 'success') {
      logs = logs.filter((l) => !l.is_demo_simulation && (l.provider_status === 'Success' || l.status_code === 101));
    } else if (filter === 'failed') {
      logs = logs.filter((l) => !l.is_demo_simulation && (l.provider_status !== 'Success' && l.status_code !== 101));
    } else if (filter === 'delivered') {
      logs = logs.filter((l) => l.delivery_status === 'delivered');
    } else if (filter === 'pending') {
      logs = logs.filter((l) => l.delivery_status === 'pending');
    } else if (filter === 'demo') {
      logs = logs.filter((l) => l.is_demo_simulation);
    }

    // Calculate separate counters as requested by prompt
    const allLogs = db.getSmsLogs();
    const realLogs = allLogs.filter((l) => !l.is_demo_simulation);
    const counters = {
      realApiAttempts: realLogs.length,
      apiAccepted: realLogs.filter((l) => l.provider_status === 'Success' || l.status_code === 101).length,
      realProviderFailures: realLogs.filter((l) => l.provider_status !== 'Success' && l.status_code !== 101).length,
      confirmedDeliveries: allLogs.filter((l) => l.delivery_status === 'delivered').length,
      demoSimulatedFailures: allLogs.filter((l) => l.is_demo_simulation).length,
    };

    res.json({ logs, counters });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Real Send Test SMS endpoint
 * Can send real SMS or trigger clearly labelled demo-only simulation
 */
apiRouter.post('/sms/send-test', async (req: Request, res: Response) => {
  try {
    const { to, message, simulateFailureDemo } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'Recipient phone number and message are required' });
    }

    const result = await sendAfricaTalkingSms({
      to,
      message,
      purpose: 'test',
      recipientName: 'Test Recipient',
      simulateFailureDemo: Boolean(simulateFailureDemo),
    });

    res.json({
      success: result.success,
      smsLog: result.smsLog,
      rawResponse: result.rawResponse,
      error: result.error,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Africa's Talking Delivery Report Callback Endpoint
 * Format documented by Africa's Talking:
 * POST /api/sms/delivery-report
 * Parameters (url-encoded or json): id, status, phoneNumber, networkCode, failureReason
 */
apiRouter.post('/sms/delivery-report', (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const { id, status, phoneNumber, networkCode, failureReason } = payload;

    if (!id || !status) {
      return res.status(400).send('Bad Request: Missing id or status');
    }

    const updatedLog = db.updateDeliveryReport(id, status, failureReason, payload);

    if (!updatedLog) {
      console.warn(`[DLR Callback] No matching SMS found for messageId: ${id}`);
    } else {
      console.log(`[DLR Callback] Updated message ${id} status to ${status} for ${phoneNumber}`);
    }

    // Africa's Talking expects standard 200 OK
    res.status(200).send('OK');
  } catch (err: any) {
    console.error('[DLR Callback Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

apiRouter.get('/sms/test-connection', async (_req: Request, res: Response) => {
  try {
    const conn = await testAfricaTalkingSandboxConnection();
    res.json(conn);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== SETTINGS ===================
apiRouter.get('/settings', (_req: Request, res: Response) => {
  try {
    res.json(db.getSettings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  try {
    const { shop_name, shopkeeper_phone, ussd_service_code } = req.body;
    const updates: any = {};
    if (shop_name) updates.shop_name = shop_name.trim();
    if (ussd_service_code !== undefined) updates.ussd_service_code = ussd_service_code.trim();
    if (shopkeeper_phone) {
      const val = normalizeKenyanPhoneNumber(shopkeeper_phone);
      if (!val.valid) {
        return res.status(400).json({ error: val.reason });
      }
      updates.shopkeeper_phone = val.normalized;
    }

    const updated = db.updateSettings(updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Allows the user to paste and save their AFRICASTALKING_API_KEY directly to the server environment
 */
apiRouter.post('/settings/api-key', async (req: Request, res: Response) => {
  try {
    const { apiKey, username } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({ error: 'API Key is required' });
    }

    const cleanKey = apiKey.trim();
    process.env.AFRICASTALKING_API_KEY = cleanKey;

    const updates: any = {
      at_api_key_configured: true,
      stored_api_key: cleanKey,
    };

    if (username && typeof username === 'string' && username.trim() !== '') {
      updates.at_username = username.trim();
      process.env.AFRICASTALKING_USERNAME = username.trim();
    }

    db.updateSettings(updates);

    // Test connection with the new credentials immediately
    const testResult = await testAfricaTalkingSandboxConnection();

    res.json({
      success: true,
      message: 'API Key saved to server successfully',
      testResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// =================== RESET SEED (FOR LIVE DEMO) ===================
apiRouter.post('/demo/reset-seed', (_req: Request, res: Response) => {
  try {
    const data = db.resetToSeed();
    res.json({ success: true, message: 'Database reset to default Kenyan duka demo dataset' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
