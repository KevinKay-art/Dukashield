import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Send,
  Calendar,
  Sparkles,
  ShoppingBag,
  Package,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  PhoneCall,
} from 'lucide-react';
import { DashboardData } from '../services/api.ts';
import { Product, Sale, SmsLog } from '../types/index.ts';

interface DashboardViewProps {
  data: DashboardData;
  isLoading: boolean;
  onRefresh: (date?: string) => void;
  onNavigateTab: (tab: string) => void;
  onSendDailySummary: () => void;
  onSendStockAlert: (alertId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onQuickSale: () => void;
  onOpenUssd?: () => void;
  isSendingSms: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  isLoading,
  onRefresh,
  onNavigateTab,
  onSendDailySummary,
  onSendStockAlert,
  onAcknowledgeAlert,
  onQuickSale,
  onOpenUssd,
  isSendingSms,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(data.date || new Date().toISOString().split('T')[0]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    onRefresh(newDate);
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    onRefresh(today);
  };

  const handleYesterdayClick = () => {
    const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setSelectedDate(y);
    onRefresh(y);
  };

  const marginPercent = data.metrics.totalSales > 0
    ? Math.round((data.metrics.totalProfit / data.metrics.totalSales) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Shop Identity Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white shadow-md border border-slate-800">
        <div className="absolute inset-0 opacity-25">
          <img
            src="/src/assets/images/duka_storefront_1793208329470.jpg"
            alt="Duka Storefront"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />

        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-teal-400 shrink-0 shadow-md">
              <img
                src="/src/assets/images/shopkeeper_portrait_1793208330025.jpg"
                alt="Mama Boi"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  East Africa Small Business Assistant
                </span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-xs text-slate-300">Live Database</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
                {data.settings.shop_name || 'Mama Boi Duka & General Supplies'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Every sale tracked. Every debt remembered. Every stock alert on time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onOpenUssd && (
              <button
                onClick={onOpenUssd}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 text-teal-300 border border-slate-700 hover:bg-slate-700 transition-colors shadow-xs"
                title={`Dial ${data.settings?.ussd_service_code || '*384*88924#'} on the virtual feature phone`}
              >
                <PhoneCall className="w-4 h-4 text-teal-400" />
                <span>USSD {data.settings?.ussd_service_code || '*384*88924#'}</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('health')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 hover:bg-teal-500/30 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Business Health</span>
            </button>

            <button
              onClick={onSendDailySummary}
              disabled={isSendingSms}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingSms ? 'Transmitting...' : 'Send Daily Summary SMS'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Filter & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="font-semibold">Viewing Date:</span>
          <span className="font-mono font-medium text-slate-900">{selectedDate}</span>
          {selectedDate === new Date().toISOString().split('T')[0] && (
            <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              Today
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
            <button
              onClick={handleTodayClick}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={handleYesterdayClick}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedDate === new Date(Date.now() - 86400000).toISOString().split('T')[0]
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          />
        </div>
      </div>

      {/* Active Alerts Banner (if any) */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-rose-900">{alert.title}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">{alert.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  onClick={() => onSendStockAlert(alert.id)}
                  disabled={isSendingSms || alert.sms_sent}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{alert.sms_sent ? 'Alert SMS Sent' : 'Send Stock SMS Alert'}</span>
                </button>
                <button
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-rose-800 hover:bg-rose-100 transition-colors"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4 Core Business Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Total Sales */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              KES {data.metrics.totalSales.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-teal-700 font-mono">
                {data.metrics.salesCount} {data.metrics.salesCount === 1 ? 'sale' : 'sales'}
              </span>
              <span>·</span>
              <span>recorded {selectedDate === new Date().toISOString().split('T')[0] ? 'today' : 'on date'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Estimated Gross Profit */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Est. Gross Profit
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
              KES {data.metrics.totalProfit.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-emerald-800 font-mono">
                {marginPercent}% margin
              </span>
              <span>·</span>
              <span>Selling price - Cost price</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Debts & Overdue */}
        <div
          onClick={() => onNavigateTab('debts')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customer Debts
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <CreditCard className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              KES {data.metrics.totalOutstandingDebt.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              {data.metrics.overdueDebtsCount > 0 ? (
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {data.metrics.overdueDebtsCount} overdue
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">All debts on time</span>
              )}
              <span className="text-slate-400">·</span>
              <span className="text-teal-700 group-hover:underline">Manage debts &rarr;</span>
            </div>
          </div>
        </div>

        {/* Card 4: Inventory Health */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Low-Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
              <Package className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {data.metrics.lowStockCount} {data.metrics.lowStockCount === 1 ? 'item' : 'items'}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              {data.metrics.outOfStockCount > 0 ? (
                <span className="font-bold text-rose-600">
                  {data.metrics.outOfStockCount} out of stock
                </span>
              ) : (
                <span className="text-teal-700 font-medium">0 out of stock</span>
              )}
              <span>·</span>
              <span className="text-teal-700 group-hover:underline">Inspect stock &rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & SMS Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Sales */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Every sale backed by database inventory logs</p>
            </div>
            <button
              onClick={() => onNavigateTab('sales')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
            >
              <span>View All Sales</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {data.recentSales.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No transactions recorded for this date. Click "New Sale" to record your first sale!
              </div>
            ) : (
              data.recentSales.map((sale) => (
                <div key={sale.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {sale.payment_method === 'mpesa' ? (
                        <span className="text-emerald-700 font-extrabold text-[10px]">M-PESA</span>
                      ) : sale.payment_method === 'debt' ? (
                        <span className="text-amber-800 font-extrabold text-[10px]">DEBT</span>
                      ) : (
                        <span className="text-slate-800 font-extrabold text-[10px]">CASH</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {sale.customer_name || 'Walk-in Customer'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {sale.receipt_number}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sale.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                      KES {sale.total_amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium font-mono">
                      +KES {sale.profit_amount.toLocaleString()} profit
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: SMS Activity Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">SMS Activity</h2>
                <p className="text-xs text-slate-500">Africa's Talking Sandbox</p>
              </div>
              <button
                onClick={() => onNavigateTab('sms')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
              >
                <span>Full Log</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {data.recentSms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No SMS transmissions logged yet. Use "Send Test SMS" or "Send Daily Summary SMS".
                </div>
              ) : (
                data.recentSms.map((sms) => (
                  <div key={sms.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 truncate max-w-[140px]">
                        {sms.recipient_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
                          sms.is_demo_simulation
                            ? 'bg-amber-100 text-amber-800'
                            : sms.status_code === 101 || sms.provider_status === 'Success'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sms.provider_status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-mono truncate">
                      {sms.recipient_phone} · {sms.purpose}
                    </p>
                    <p className="text-slate-600 text-[11px] line-clamp-1 italic">
                      "{sms.message_text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigateTab('sms')}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-center block"
            >
              Open SMS Hub & Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
