import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Sparkles,
  RotateCcw,
  X,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onResetSeed: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onResetSeed,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "Inspect Today's Shop Dashboard",
      tab: 'dashboard',
      description: "Review today's total sales in KES, profit margin, outstanding customer debts, and active inventory alerts from live database records.",
      actionLabel: 'Go to Dashboard',
    },
    {
      step: 2,
      title: 'Record a Sale & Verify Inventory Deduction',
      tab: 'sales',
      description: 'Add products to cart (e.g. Unga or Bread). Notice that sales deduct inventory safely and cannot exceed available stock.',
      actionLabel: 'Open POS & Sell',
    },
    {
      step: 3,
      title: 'Inspect Overdue Customer Debt',
      tab: 'debts',
      description: "Inspect John Kamau's overdue debt of KES 1,450. Observe automatic overdue calculation and remaining balance ledger.",
      actionLabel: 'View Debts Ledger',
    },
    {
      step: 4,
      title: "Send Debt Reminder via Africa's Talking Sandbox",
      tab: 'debts',
      description: "Click 'Send SMS Reminder' on John Kamau. The server makes a real call to the Africa's Talking Sandbox SMS endpoint and stores provider response.",
      actionLabel: 'Try Debt Reminder',
    },
    {
      step: 5,
      title: 'Trigger & View Low-Stock Alert',
      tab: 'inventory',
      description: 'Fresha Milk is at 3 units (below threshold of 10). View the visible alert and send an SMS stock notification to the shopkeeper phone.',
      actionLabel: 'Inspect Stock Alerts',
    },
    {
      step: 6,
      title: 'Run Deterministic Business Health Check',
      tab: 'health',
      description: 'Evaluate sales growth against yesterday, profit margins, cash-at-risk ratio, and fast-moving item warnings with mathematical explanations.',
      actionLabel: 'View Health Check',
    },
    {
      step: 7,
      title: 'Send Daily Business Summary SMS',
      tab: 'dashboard',
      description: "Click 'Send Daily Summary SMS' on the dashboard. Generates a concise EOD summary and transmits it to the shopkeeper phone.",
      actionLabel: 'Send Daily Summary',
    },
    {
      step: 8,
      title: 'Audit SMS Activity Log & Real Callback DLR',
      tab: 'sms',
      description: "Inspect message IDs (e.g. ATXid_...), status codes (101), cost in KES, delivery statuses, and test the callback webhook endpoint.",
      actionLabel: 'Open SMS Audit Hub',
    },
    {
      step: 9,
      title: "Verify in Africa's Talking Sandbox Simulator",
      tab: 'settings',
      description: "Open the official Africa's Talking web simulator (simulator.africastalking.com) with your test phone number to watch messages arrive on the virtual handset!",
      actionLabel: 'View Sandbox Guide',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Hackathon Judge Demonstration Guide
              </h2>
              <p className="text-xs text-slate-500">
                9-step verification of real inventory, debts, business health & Africa's Talking SMS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="py-4 space-y-3 overflow-y-auto pr-1">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-xs text-teal-900 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Ready for Live Evaluation</p>
              <p className="text-teal-800 mt-0.5 leading-relaxed">
                Every metric comes from actual database records. All SMS triggers send real requests to
                Africa's Talking Sandbox with real provider message IDs. Use the shortcuts below to evaluate each requirement.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {steps.map((s) => (
              <div
                key={s.step}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-normal">{s.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNavigateTab(s.tab);
                    onClose();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 transition-colors shrink-0 self-end sm:self-center"
                >
                  <span>{s.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            onClick={() => {
              if (window.confirm('Reset database to default Kenyan demo dataset? This restores initial sample sales, products and debts.')) {
                onResetSeed();
              }
            }}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data to Initial State</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
