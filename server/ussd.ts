import { db } from './db.ts';
import { sendAfricaTalkingSms } from './africasTalking.ts';

export interface UssdPayload {
  sessionId?: string;
  serviceCode?: string;
  phoneNumber?: string;
  text?: string;
}

/**
 * Handles Africa's Talking USSD protocol.
 * Africa's Talking sends POST with:
 * - sessionId
 * - serviceCode (e.g. *384*88924#)
 * - phoneNumber (+254...)
 * - text (empty on initial dial, then "1", "1*2", etc.)
 *
 * Responses MUST start with:
 * - "CON " to continue session and prompt user
 * - "END " to terminate session with final display
 */
export async function handleUssdRequest(payload: UssdPayload): Promise<string> {
  const text = (payload.text || '').trim();
  const phoneNumber = payload.phoneNumber || '+254712345678';
  const parts = text === '' ? [] : text.split('*');

  const settings = db.getSettings();
  const shopName = settings.shop_name || 'Mama Boi Duka';
  const products = db.getProducts();
  const sales = db.getSales();
  const debts = db.getDebts();

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.sale_date === todayStr);
  const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalProfitAmount = todaySales.reduce((sum, s) => sum + s.profit_amount, 0);

  const openDebts = debts.filter((d) => d.remaining_amount > 0);
  const overdueDebts = openDebts.filter((d) => d.status === 'overdue' || new Date(d.due_date) < new Date());
  const lowStockProducts = products.filter((p) => p.current_stock <= p.low_stock_threshold);

  // LEVEL 0: Main Menu
  if (parts.length === 0) {
    return (
      `CON DukaShield — ${shopName}\n` +
      `1. Today's Sales & Profit\n` +
      `2. Check Low Stock Items\n` +
      `3. Overdue Customer Debts\n` +
      `4. Record Quick Cash Sale\n` +
      `5. Send Debt Reminder SMS\n` +
      `6. Request Daily Summary SMS`
    );
  }

  const choice = parts[0];

  // 1. TODAY'S SALES & PROFIT
  if (choice === '1') {
    return (
      `END DukaShield Sales Summary (${todayStr})\n` +
      `• Total Sales: KES ${totalSalesAmount.toLocaleString()}\n` +
      `• Est. Profit: KES ${totalProfitAmount.toLocaleString()}\n` +
      `• Sales Count: ${todaySales.length} txns\n` +
      `• Active Credit: KES ${openDebts.reduce((sum, d) => sum + d.remaining_amount, 0).toLocaleString()}`
    );
  }

  // 2. CHECK LOW STOCK ITEMS
  if (choice === '2') {
    if (lowStockProducts.length === 0) {
      return `END DukaShield Inventory:\nAll products are well stocked above threshold!`;
    }
    const lines = lowStockProducts
      .slice(0, 4)
      .map((p, idx) => `${idx + 1}. ${p.name.split(' ')[0]}: ${p.current_stock} left (min ${p.low_stock_threshold})`)
      .join('\n');

    return (
      `END Low Stock Alert (${lowStockProducts.length} items):\n` +
      lines +
      `\nRestock soon to avoid lost sales.`
    );
  }

  // 3. OVERDUE CUSTOMER DEBTS
  if (choice === '3') {
    if (overdueDebts.length === 0) {
      return `END DukaShield Debts:\nNo overdue debts! All customer balances are within payment terms.`;
    }
    const lines = overdueDebts
      .slice(0, 4)
      .map((d, idx) => `${idx + 1}. ${d.customer_name}: KES ${d.remaining_amount.toLocaleString()}`)
      .join('\n');

    const totalOverdue = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

    return (
      `END Overdue Debts (${overdueDebts.length}):\n` +
      lines +
      `\nTotal Overdue: KES ${totalOverdue.toLocaleString()}`
    );
  }

  // 4. RECORD QUICK CASH SALE (Multi-step USSD)
  if (choice === '4') {
    // Top 4 fast moving items
    const topProducts = products.slice(0, 4);

    if (parts.length === 1) {
      const menu = topProducts
        .map((p, idx) => `${idx + 1}. ${p.name.split(' ')[0]} (KES ${p.selling_price})`)
        .join('\n');
      return `CON Select Product to Sell:\n${menu}`;
    }

    if (parts.length === 2) {
      const prodIndex = parseInt(parts[1], 10) - 1;
      const selectedProd = topProducts[prodIndex];
      if (!selectedProd) {
        return `END Invalid selection. Please redial.`;
      }
      return `CON ${selectedProd.name}\nEnter Quantity to sell (Max ${selectedProd.current_stock}):`;
    }

    if (parts.length === 3) {
      const prodIndex = parseInt(parts[1], 10) - 1;
      const selectedProd = topProducts[prodIndex];
      const qty = parseInt(parts[2], 10);

      if (!selectedProd || isNaN(qty) || qty <= 0) {
        return `END Invalid quantity entered. Transaction cancelled.`;
      }

      if (qty > selectedProd.current_stock) {
        return `END Insufficient stock! Available: ${selectedProd.current_stock} ${selectedProd.unit}s.`;
      }

      try {
        const result = db.recordSale({
          items: [{ productId: selectedProd.id, quantity: qty }],
          paymentMethod: 'cash',
        });

        return (
          `END Sale Recorded via USSD!\n` +
          `Receipt: ${result.sale.receipt_number}\n` +
          `Product: ${selectedProd.name}\n` +
          `Qty: ${qty} | Total: KES ${result.sale.total_amount.toLocaleString()}\n` +
          `Stock remaining: ${selectedProd.current_stock - qty}`
        );
      } catch (err: any) {
        return `END Transaction failed: ${err.message}`;
      }
    }
  }

  // 5. SEND DEBT REMINDER SMS
  if (choice === '5') {
    if (openDebts.length === 0) {
      return `END No active customer debts to remind.`;
    }

    const targetDebts = openDebts.slice(0, 4);

    if (parts.length === 1) {
      const menu = targetDebts
        .map((d, idx) => `${idx + 1}. ${d.customer_name} (KES ${d.remaining_amount.toLocaleString()})`)
        .join('\n');
      return `CON Select Customer to Send SMS Reminder:\n${menu}`;
    }

    if (parts.length === 2) {
      const debtIdx = parseInt(parts[1], 10) - 1;
      const selectedDebt = targetDebts[debtIdx];
      if (!selectedDebt) {
        return `END Invalid customer choice.`;
      }

      const msg = `Hello ${selectedDebt.customer_name}, friendly reminder that your balance at ${shopName} is KES ${selectedDebt.remaining_amount.toLocaleString()}. Kindly arrange payment by ${selectedDebt.due_date}. Thank you.`;

      // Trigger actual Africa's Talking SMS in background
      sendAfricaTalkingSms({
        to: selectedDebt.customer_phone,
        message: msg,
        purpose: 'debt_reminder',
        recipientName: selectedDebt.customer_name,
      }).catch(console.error);

      db.recordDebtReminderSent(selectedDebt.id);

      return (
        `END Reminder Dispatched!\n` +
        `Customer: ${selectedDebt.customer_name}\n` +
        `Phone: ${selectedDebt.customer_phone}\n` +
        `Amount: KES ${selectedDebt.remaining_amount.toLocaleString()}\n` +
        `Sent via Africa's Talking Sandbox.`
      );
    }
  }

  // 6. REQUEST DAILY SUMMARY SMS
  if (choice === '6') {
    const summaryMsg = `DukaShield Daily Summary (${todayStr}) for ${shopName}: Sales KES ${totalSalesAmount.toLocaleString()} (${todaySales.length} txns), Est. Profit KES ${totalProfitAmount.toLocaleString()}, Unpaid Debt KES ${openDebts.reduce((sum, d) => sum + d.remaining_amount, 0).toLocaleString()}, Low Stock: ${lowStockProducts.length}.`;

    sendAfricaTalkingSms({
      to: settings.shopkeeper_phone,
      message: summaryMsg,
      purpose: 'daily_summary',
      recipientName: `${shopName} Shopkeeper`,
    }).catch(console.error);

    return (
      `END Daily Summary SMS Queued!\n` +
      `Summary for ${todayStr} sent to your registered phone (${settings.shopkeeper_phone}) via Africa's Talking.`
    );
  }

  return `END Invalid option. Dial ${settings.ussd_service_code || '*384*88924#'} to start again.`;
}
