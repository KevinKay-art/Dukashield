import React from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Send,
  ArrowRight,
  Info,
  Shield,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { HealthCheckData } from '../services/api.ts';
import { HealthCheckRecommendation } from '../types/index.ts';

interface HealthCheckViewProps {
  healthData: HealthCheckData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
  onSendDebtReminder: (debtId: string) => Promise<any>;
  onSendStockAlertDirect: (productInfo: any) => Promise<any>;
}

export const HealthCheckView: React.FC<HealthCheckViewProps> = ({
  healthData,
  isLoading,
  onRefresh,
  onNavigateTab,
  onSendDebtReminder,
  onSendStockAlertDirect,
}) => {
  if (isLoading || !healthData) {
    return (
      <div className="py-16 text-center text-slate-500 text-sm">
        Calculating business health indicators from database transactions...
      </div>
    );
  }

  const { overallStatus, score, metrics, recommendations, calculatedAt } = healthData;

  const handleActionClick = async (rec: HealthCheckRecommendation) => {
    if (rec.action_type === 'send_debt_reminder_sms' && rec.action_payload?.debtId) {
      await onSendDebtReminder(rec.action_payload.debtId);
    } else if (rec.action_type === 'send_stock_alert_sms' && rec.action_payload) {
      await onSendStockAlertDirect({
        id: rec.action_payload.productId,
        name: rec.action_payload.productName,
        current_stock: rec.action_payload.currentStock,
        unit: 'unit',
      });
    } else if (rec.action_type === 'navigate_inventory') {
      onNavigateTab('inventory');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Business Health Check
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-200">
              Signature Feature
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic business intelligence: real comparative ratios, credit risk, and stock velocity
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors self-start sm:self-auto"
        >
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span>Recalculate Health</span>
        </button>
      </div>

      {/* Main Score & Overall Status Card */}
      <div
        className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 ${
          overallStatus === 'healthy'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : overallStatus === 'attention_needed'
            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-xs ${
              overallStatus === 'healthy'
                ? 'bg-emerald-600 text-white'
                : overallStatus === 'attention_needed'
                ? 'bg-amber-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {score}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Shop Vitality Index
              </span>
              <span>·</span>
              <span className="text-xs font-mono font-medium">Score: {score}/100</span>
            </div>
            <h2 className="text-xl font-bold mt-0.5">
              {overallStatus === 'healthy' && 'Duka Operating in Healthy Territory'}
              {overallStatus === 'attention_needed' && 'Moderate Attention Recommended'}
              {overallStatus === 'action_required' && 'Critical Business Actions Required Today'}
            </h2>
            <p className="text-xs mt-1 max-w-xl opacity-90 leading-relaxed">
              Derived mathematically from inventory thresholds, customer repayment aging, daily sales
              momentum against yesterday, and profit margins.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-current text-xs font-semibold font-mono">
            {metrics.overdueDebtsCount} overdue debts
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-current text-xs font-semibold font-mono">
            {metrics.lowStockCount} low items
          </div>
        </div>
      </div>

      {/* Comparative Ratios Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Trend vs Yesterday */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Sales vs Yesterday
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              KES {metrics.todaySales.toLocaleString()}
            </span>
            {metrics.salesGrowthPercent !== null && (
              <span
                className={`text-xs font-bold font-mono ${
                  metrics.salesGrowthPercent >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {metrics.salesGrowthPercent >= 0 ? `+${metrics.salesGrowthPercent}%` : `${metrics.salesGrowthPercent}%`}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Yesterday: KES {metrics.yesterdaySales.toLocaleString()}
          </span>
        </div>

        {/* Profit Margin */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Gross Margin Ratio
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {metrics.grossMarginPercent}%
            </span>
            <span className="text-xs font-mono text-slate-500">
              (KES {metrics.todayProfit.toLocaleString()})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Revenue minus wholesale purchase costs
          </span>
        </div>

        {/* Overdue Debt Exposure */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Overdue Capital Locked
          </span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-2 tabular-nums">
            KES {metrics.overdueDebtsAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.overdueDebtsCount} past agreed date
          </span>
        </div>

        {/* Stock Safety Ratio */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Stock Replenishment
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {metrics.healthyStockCount} / {metrics.healthyStockCount + metrics.lowStockCount} stocked
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {metrics.lowStockCount} items below threshold
          </span>
        </div>
      </div>

      {/* Actionable Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Actionable Business Recommendations ({recommendations.length})
          </h2>
          <span className="text-xs text-slate-500">
            Calculated: {new Date(calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => {
            const isAlert = rec.severity === 'alert';
            const isWarning = rec.severity === 'warning';
            const isGood = rec.severity === 'good';

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-xl border bg-white shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isAlert
                    ? 'border-rose-200 hover:border-rose-300'
                    : isWarning
                    ? 'border-amber-200 hover:border-amber-300'
                    : isGood
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isAlert
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : isGood
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {rec.category}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {rec.metric}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.message}</p>

                  {/* Mathematical Explanation */}
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700">Why this appeared: </strong>
                      {rec.reason}
                    </span>
                  </div>
                </div>

                {rec.action_label && (
                  <div className="self-end md:self-center shrink-0">
                    <button
                      onClick={() => handleActionClick(rec)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                        isAlert
                          ? 'bg-rose-700 text-white hover:bg-rose-800'
                          : isWarning
                          ? 'bg-amber-600 text-white hover:bg-amber-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{rec.action_label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
