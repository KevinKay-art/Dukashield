import React, { useState } from 'react';
import {
  BookOpen,
  Send,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Plus,
  ArrowRight,
  User,
  History,
  Phone,
} from 'lucide-react';
import { Customer, Debt, DebtPayment } from '../types/index.ts';

interface DebtsViewProps {
  debts: Debt[];
  customers: Customer[];
  onRepayDebt: (
    debtId: string,
    amount: number,
    paymentMethod: 'cash' | 'mpesa',
    receiptReference?: string
  ) => Promise<{ debt: Debt; payment: DebtPayment }>;
  onSendDebtReminder: (debtId: string) => Promise<any>;
  onAddCustomer: (data: { name: string; phone: string; notes?: string }) => Promise<Customer>;
  onNavigateTab: (tab: string) => void;
  isSendingSms: boolean;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  customers,
  onRepayDebt,
  onSendDebtReminder,
  onAddCustomer,
  isSendingSms,
}) => {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'active' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [repayingDebt, setRepayingDebt] = useState<Debt | null>(null);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [repayMethod, setRepayMethod] = useState<'cash' | 'mpesa'>('mpesa');
  const [repayRef, setRepayRef] = useState('');
  const [selectedDebtHistory, setSelectedDebtHistory] = useState<Debt | null>(null);
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [reminderTargetId, setReminderTargetId] = useState<string | null>(null);

  const now = new Date();

  // Summary Metrics
  const activeDebts = debts.filter((d) => d.status !== 'paid');
  const totalOutstanding = activeDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
  const overdueDebts = debts.filter((d) => d.status === 'overdue' || (d.remaining_amount > 0 && new Date(d.due_date) < now));
  const totalOverdueAmount = overdueDebts.reduce((sum, d) => sum + d.remaining_amount, 0);
  const fullyPaidCount = debts.filter((d) => d.status === 'paid').length;

  const filteredDebts = debts.filter((debt) => {
    const isOverdue = debt.status === 'overdue' || (debt.remaining_amount > 0 && new Date(debt.due_date) < now);
    const matchesSearch =
      debt.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debt.customer_phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filter === 'overdue') return isOverdue;
    if (filter === 'active') return debt.remaining_amount > 0;
    if (filter === 'paid') return debt.status === 'paid';
    return true;
  });

  const handleOpenRepay = (debt: Debt) => {
    setRepayingDebt(debt);
    setRepayAmount(debt.remaining_amount);
    setRepayRef(repayMethod === 'mpesa' ? `MPESA-${Date.now().toString().slice(-6)}` : 'CASH');
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayingDebt || !repayAmount || Number(repayAmount) <= 0) return;

    setIsSubmittingRepay(true);
    try {
      await onRepayDebt(
        repayingDebt.id,
        Number(repayAmount),
        repayMethod,
        repayRef || undefined
      );
      setRepayingDebt(null);
      setRepayAmount('');
      setRepayRef('');
    } catch (err: any) {
      alert(err.message || 'Repayment failed');
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const handleTriggerReminder = async (debt: Debt) => {
    setReminderTargetId(debt.id);
    try {
      await onSendDebtReminder(debt.id);
    } finally {
      setReminderTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Credit & Debt Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Track customer balances, overdue collections, partial repayments, and automated Africa's Talking reminders
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Outstanding Balance
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            KES {totalOutstanding.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {activeDebts.length} active customer balances
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
              Overdue Balance
            </span>
            <span className="p-1 rounded-md bg-rose-50 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2 tabular-nums">
            KES {totalOverdueAmount.toLocaleString()}
          </div>
          <span className="text-xs text-rose-600 font-medium mt-1 block">
            {overdueDebts.length} customer debts past agreed due date
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Settled Accounts
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2 tabular-nums">
            {fullyPaidCount} settled
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Fully repaid customer transactions
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Debts ({debts.length})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Overdue ({overdueDebts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'active'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Open / Partial ({activeDebts.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'paid'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Fully Paid ({fullyPaidCount})
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter customer by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
        />
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3 text-right">Original Debt</th>
                <th className="py-3 px-3 text-right">Repaid</th>
                <th className="py-3 px-3 text-right">Balance Owed</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No debts match the current filter.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const isOverdue =
                    debt.remaining_amount > 0 &&
                    (debt.status === 'overdue' || new Date(debt.due_date) < now);

                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{debt.customer_name}</div>
                        {debt.notes && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{debt.notes}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {debt.customer_phone}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-mono text-slate-800">{debt.due_date}</div>
                        <div className="text-[10px] text-slate-400">Incurred {debt.incurred_date}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        KES {debt.initial_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-medium">
                        KES {debt.paid_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                        KES {debt.remaining_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        {debt.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            Paid in Full
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue
                          </span>
                        ) : debt.status === 'partial' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800">
                            Partial Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            Open
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {debt.remaining_amount > 0 && (
                            <>
                              <button
                                onClick={() => handleTriggerReminder(debt)}
                                disabled={isSendingSms || reminderTargetId === debt.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
                                title="Send SMS reminder to customer via Africa's Talking Sandbox"
                              >
                                <Send className="w-3 h-3 text-teal-600" />
                                <span>
                                  {reminderTargetId === debt.id ? 'Sending...' : 'SMS Reminder'}
                                </span>
                              </button>

                              <button
                                onClick={() => handleOpenRepay(debt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
                              >
                                <span>Record Repay</span>
                              </button>
                            </>
                          )}

                          {debt.payments.length > 0 && (
                            <button
                              onClick={() => setSelectedDebtHistory(debt)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                              title="View repayment history"
                            >
                              <History className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayment Modal */}
      {repayingDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Record Customer Repayment</h3>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{repayingDebt.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Outstanding Balance:</span>
                <span className="font-mono font-bold text-rose-700">
                  KES {repayingDebt.remaining_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <form onSubmit={handleRepaySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Repayment Amount (KES):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={repayingDebt.remaining_amount}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-base font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRepayAmount(repayingDebt.remaining_amount)}
                    className="text-[11px] text-teal-700 font-semibold hover:underline"
                  >
                    Full Balance (KES {repayingDebt.remaining_amount.toLocaleString()})
                  </button>
                  {repayingDebt.remaining_amount > 500 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setRepayAmount(Math.round(repayingDebt.remaining_amount / 2))}
                        className="text-[11px] text-teal-700 font-semibold hover:underline"
                      >
                        Half (KES {Math.round(repayingDebt.remaining_amount / 2).toLocaleString()})
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Payment Method:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRepayMethod('mpesa')}
                    className={`py-2 px-3 rounded-lg font-semibold border text-center ${
                      repayMethod === 'mpesa'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod('cash')}
                    className={`py-2 px-3 rounded-lg font-semibold border text-center ${
                      repayMethod === 'cash'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Receipt / Transaction Reference:
                </label>
                <input
                  type="text"
                  placeholder="e.g. QGK819203 or Cash Receipt"
                  value={repayRef}
                  onChange={(e) => setRepayRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRepayingDebt(null)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepay}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 shadow-xs disabled:opacity-50"
                >
                  {isSubmittingRepay ? 'Saving...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment History Modal */}
      {selectedDebtHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Repayment Ledger</h3>
                <p className="text-xs text-slate-500">{selectedDebtHistory.customer_name}</p>
              </div>
              <button
                onClick={() => setSelectedDebtHistory(null)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDebtHistory.payments.map((p) => (
                <div key={p.id} className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900">KES {p.amount.toLocaleString()}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.payment_date} · {p.payment_method.toUpperCase()}
                      {p.receipt_reference && ` (${p.receipt_reference})`}
                    </div>
                  </div>
                  <span className="text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md">
                    Credited
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
