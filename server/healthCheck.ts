import { HealthCheckRecommendation } from '../src/types/index.ts';
import { db } from './db.ts';

export interface HealthCheckSummary {
  overallStatus: 'healthy' | 'attention_needed' | 'action_required';
  score: number; // 0 - 100 calculated from objective metrics
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
    cashDebtRatio: number; // today's sales / total debt
  };
  recommendations: HealthCheckRecommendation[];
  calculatedAt: string;
}

export function calculateBusinessHealth(): HealthCheckSummary {
  const products = db.getProducts();
  const sales = db.getSales();
  const debts = db.getDebts();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 1. Sales & Profit calculations
  const todaySalesList = sales.filter((s) => s.sale_date === todayStr);
  const yesterdaySalesList = sales.filter((s) => s.sale_date === yesterdayStr);

  const todaySales = todaySalesList.reduce((sum, s) => sum + s.total_amount, 0);
  const todayProfit = todaySalesList.reduce((sum, s) => sum + s.profit_amount, 0);

  const yesterdaySales = yesterdaySalesList.reduce((sum, s) => sum + s.total_amount, 0);
  const yesterdayProfit = yesterdaySalesList.reduce((sum, s) => sum + s.profit_amount, 0);

  let salesGrowthPercent: number | null = null;
  if (yesterdaySales > 0) {
    salesGrowthPercent = Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100);
  }

  let profitGrowthPercent: number | null = null;
  if (yesterdayProfit > 0) {
    profitGrowthPercent = Math.round(((todayProfit - yesterdayProfit) / yesterdayProfit) * 100);
  }

  const grossMarginPercent = todaySales > 0 ? Math.round((todayProfit / todaySales) * 100) : 0;

  // 2. Debts calculations
  const openDebts = debts.filter((d) => d.status === 'open' || d.status === 'partial' || d.status === 'overdue');
  const totalOutstandingDebt = openDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

  const overdueDebts = openDebts.filter((d) => d.status === 'overdue' || new Date(d.due_date) < now);
  const overdueDebtsCount = overdueDebts.length;
  const overdueDebtsAmount = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);

  // 3. Stock calculations
  const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
  const lowStockCount = products.filter((p) => p.current_stock > 0 && p.current_stock <= p.low_stock_threshold).length;
  const healthyStockCount = products.filter((p) => p.current_stock > p.low_stock_threshold).length;

  const cashDebtRatio = totalOutstandingDebt > 0 ? Number((todaySales / totalOutstandingDebt).toFixed(2)) : 10;

  // 4. Generate deterministic, mathematically grounded recommendations
  const recommendations: HealthCheckRecommendation[] = [];

  // A. Low Stock & Fast Moving Items
  // Find products sold today
  const productSalesMap: Record<string, { qty: number; name: string }> = {};
  for (const s of todaySalesList) {
    for (const item of s.items) {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = { qty: 0, name: item.product_name };
      }
      productSalesMap[item.product_id].qty += item.quantity;
    }
  }

  for (const prod of products) {
    const soldToday = productSalesMap[prod.id]?.qty || 0;
    if (prod.current_stock === 0) {
      recommendations.push({
        id: `rec-out-${prod.id}`,
        category: 'inventory',
        severity: 'alert',
        title: `${prod.name} is completely out of stock`,
        message: `Current stock is 0 ${prod.unit}s. Customers asking for this cannot be served, directly losing daily revenue.`,
        metric: `0 ${prod.unit} left`,
        reason: `Inventory count reached zero. Minimum threshold was ${prod.low_stock_threshold}.`,
        action_label: 'Restock Product',
        action_type: 'navigate_inventory',
        action_payload: { productId: prod.id },
      });
    } else if (prod.current_stock <= prod.low_stock_threshold) {
      recommendations.push({
        id: `rec-low-${prod.id}`,
        category: 'inventory',
        severity: 'warning',
        title: `${prod.name} is running low`,
        message: `${prod.name} has only ${prod.current_stock} ${prod.unit}(s) left. ${soldToday > 0 ? `You sold ${soldToday} today alone.` : ''} Reorder soon to avoid running out.`,
        metric: `${prod.current_stock} / ${prod.low_stock_threshold} threshold`,
        reason: `Current stock (${prod.current_stock}) has dropped below your reorder threshold (${prod.low_stock_threshold}).`,
        action_label: 'Send Supplier Alert',
        action_type: 'send_stock_alert_sms',
        action_payload: { productId: prod.id, productName: prod.name, currentStock: prod.current_stock },
      });
    }
  }

  if (lowStockCount === 0 && outOfStockCount === 0) {
    recommendations.push({
      id: 'rec-stock-healthy',
      category: 'inventory',
      severity: 'good',
      title: 'Inventory levels are healthy',
      message: 'All products currently have stock above their reorder thresholds. Keep monitoring fast-moving morning staples.',
      metric: `${healthyStockCount} items stocked`,
      reason: 'No active stock alerts detected across your catalog.',
    });
  }

  // B. Overdue Debts
  if (overdueDebtsCount > 0) {
    const oldestOverdue = [...overdueDebts].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    recommendations.push({
      id: 'rec-overdue-debts',
      category: 'debts',
      severity: 'alert',
      title: `${overdueDebtsCount} customer debt${overdueDebtsCount > 1 ? 's are' : ' is'} overdue`,
      message: `KES ${overdueDebtsAmount.toLocaleString()} is locked in overdue balances. Review them today and send polite SMS reminders.`,
      metric: `KES ${overdueDebtsAmount.toLocaleString()} overdue`,
      reason: `Debts from ${overdueDebts.map((d) => d.customer_name).join(', ')} passed their agreed due date.`,
      action_label: `Remind ${oldestOverdue.customer_name}`,
      action_type: 'send_debt_reminder_sms',
      action_payload: { debtId: oldestOverdue.id },
    });
  } else if (totalOutstandingDebt > 0) {
    recommendations.push({
      id: 'rec-debts-active',
      category: 'debts',
      severity: 'info',
      title: 'Outstanding debts are within due dates',
      message: `You have KES ${totalOutstandingDebt.toLocaleString()} in active credit given to trusted customers, none overdue yet.`,
      metric: `KES ${totalOutstandingDebt.toLocaleString()} open credit`,
      reason: 'All customer balances are currently within their payment terms.',
    });
  } else {
    recommendations.push({
      id: 'rec-debts-zero',
      category: 'debts',
      severity: 'good',
      title: 'Zero outstanding customer debts',
      message: 'All previous debts are fully settled. 100% of your sales are collected in cash or M-Pesa.',
      metric: 'KES 0 debt',
      reason: 'No active credit balances on record.',
    });
  }

  // C. Sales Velocity & Trends
  if (salesGrowthPercent !== null) {
    if (salesGrowthPercent > 0) {
      recommendations.push({
        id: 'rec-sales-growth',
        category: 'sales',
        severity: 'good',
        title: `Sales increased by ${salesGrowthPercent}% compared with yesterday`,
        message: `Today's revenue is KES ${todaySales.toLocaleString()} vs KES ${yesterdaySales.toLocaleString()} yesterday. Customer foot traffic is strong.`,
        metric: `+${salesGrowthPercent}% revenue`,
        reason: `Comparison of today's total sales (KES ${todaySales}) against yesterday's sales (KES ${yesterdaySales}).`,
      });
    } else if (salesGrowthPercent < 0) {
      recommendations.push({
        id: 'rec-sales-decline',
        category: 'sales',
        severity: 'warning',
        title: `Sales are down ${Math.abs(salesGrowthPercent)}% compared with yesterday`,
        message: `Today's sales total KES ${todaySales.toLocaleString()} compared to KES ${yesterdaySales.toLocaleString()} by this time yesterday.`,
        metric: `${salesGrowthPercent}% revenue`,
        reason: `Today's sales (KES ${todaySales}) are lower than yesterday's baseline (KES ${yesterdaySales}).`,
      });
    }
  }

  // D. Profit Margin Health
  if (todaySales > 0) {
    if (grossMarginPercent >= 20) {
      recommendations.push({
        id: 'rec-profit-healthy',
        category: 'profitability',
        severity: 'good',
        title: `Strong profit margin: ${grossMarginPercent}% gross profit`,
        message: `You earned KES ${todayProfit.toLocaleString()} gross profit on KES ${todaySales.toLocaleString()} revenue today.`,
        metric: `${grossMarginPercent}% gross margin`,
        reason: `Calculated from (Today's Profit KES ${todayProfit} / Today's Sales KES ${todaySales}) * 100.`,
      });
    } else {
      recommendations.push({
        id: 'rec-profit-low',
        category: 'profitability',
        severity: 'warning',
        title: `Gross profit margin is ${grossMarginPercent}%`,
        message: 'Your gross margin is under 20%. Consider promoting higher-margin items like tea, spices, and cooking oils to lift profits.',
        metric: `${grossMarginPercent}% margin`,
        reason: 'Sales today were heavily weighted toward lower-margin price-controlled staples.',
      });
    }
  }

  // Score Calculation (0 - 100)
  let score = 70;
  if (outOfStockCount > 0) score -= outOfStockCount * 15;
  if (lowStockCount > 0) score -= lowStockCount * 5;
  if (overdueDebtsCount > 0) score -= overdueDebtsCount * 10;
  if (salesGrowthPercent !== null && salesGrowthPercent > 0) score += 10;
  if (salesGrowthPercent !== null && salesGrowthPercent < 0) score -= 5;
  if (grossMarginPercent >= 20) score += 10;
  score = Math.max(10, Math.min(100, score));

  let overallStatus: 'healthy' | 'attention_needed' | 'action_required' = 'healthy';
  if (score < 50 || outOfStockCount > 0 || overdueDebtsCount >= 2) {
    overallStatus = 'action_required';
  } else if (score < 75 || lowStockCount > 0 || overdueDebtsCount > 0) {
    overallStatus = 'attention_needed';
  }

  return {
    overallStatus,
    score,
    metrics: {
      todaySales,
      yesterdaySales,
      salesGrowthPercent,
      todayProfit,
      yesterdayProfit,
      profitGrowthPercent,
      grossMarginPercent,
      totalOutstandingDebt,
      overdueDebtsCount,
      overdueDebtsAmount,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      cashDebtRatio,
    },
    recommendations,
    calculatedAt: now.toISOString(),
  };
}
