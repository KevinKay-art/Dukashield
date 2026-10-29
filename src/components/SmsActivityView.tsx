import React, { useState } from 'react';
import {
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
  Radio,
  Copy,
  Check,
  Filter,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { SmsLog } from '../types/index.ts';
import { SmsActivityResponse } from '../services/api.ts';

interface SmsActivityViewProps {
  activityData: SmsActivityResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  onSendTestSms: (payload: {
    to: string;
    message: string;
    simulateFailureDemo?: boolean;
  }) => Promise<any>;
  onInspectLog: (log: SmsLog) => void;
  isSendingSms: boolean;
  shopkeeperPhone?: string;
  appUrl?: string;
}

export const SmsActivityView: React.FC<SmsActivityViewProps> = ({
  activityData,
  isLoading,
  onRefresh,
  onSendTestSms,
  onInspectLog,
  isSendingSms,
  shopkeeperPhone = '+254712345678',
  appUrl = 'https://ais-dev-bscnsuporyfwsoeqnzdi2x-51694486837.europe-west2.run.app',
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'delivered' | 'pending' | 'demo'>('all');
  const [testPhone, setTestPhone] = useState(shopkeeperPhone);
  const [testMessage, setTestMessage] = useState(
    'DukaShield Sandbox Verification: Live test of Africa\'s Talking SMS delivery.'
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [simulatedWebhookMessageId, setSimulatedWebhookMessageId] = useState('');
  const [isSimulatingDlr, setIsSimulatingDlr] = useState(false);
  const [dlrFeedback, setDlrFeedback] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const logs = activityData?.logs || [];
  const counters = activityData?.counters || {
    realApiAttempts: 0,
    apiAccepted: 0,
    realProviderFailures: 0,
    confirmedDeliveries: 0,
    demoSimulatedFailures: 0,
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'success') {
      return !log.is_demo_simulation && (log.provider_status === 'Success' || log.status_code === 101);
    }
    if (filter === 'failed') {
      return !log.is_demo_simulation && (log.provider_status !== 'Success' && log.status_code !== 101);
    }
    if (filter === 'delivered') {
      return log.delivery_status === 'delivered';
    }
    if (filter === 'pending') {
      return log.delivery_status === 'pending';
    }
    if (filter === 'demo') {
      return log.is_demo_simulation;
    }
    return true;
  });

  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) return;

    await onSendTestSms({
      to: testPhone,
      message: testMessage,
      simulateFailureDemo: simulateFailure,
    });
  };

  // Test the webhook endpoint by sending a DLR callback payload
  const handleSimulateWebhookDlr = async () => {
    if (!simulatedWebhookMessageId) {
      alert('Please enter a Provider Message ID to simulate delivery report for.');
      return;
    }
    setIsSimulatingDlr(true);
    setDlrFeedback(null);
    try {
      const res = await fetch('/api/sms/delivery-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: simulatedWebhookMessageId.trim(),
          status: 'Success',
          phoneNumber: testPhone,
          networkCode: '63902', // Safaricom
        }),
      });

      if (res.ok) {
        setDlrFeedback(`Delivery Report processed successfully! Message ID ${simulatedWebhookMessageId} updated to 'Delivered'.`);
        onRefresh();
      } else {
        const txt = await res.text();
        setDlrFeedback(`Webhook response: ${txt}`);
      }
    } catch (err: any) {
      setDlrFeedback(`Webhook call failed: ${err.message}`);
    } finally {
      setIsSimulatingDlr(false);
    }
  };

  const copyCallbackUrl = () => {
    const callbackUrl = `${window.location.origin}/api/sms/delivery-report`;
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Helper to mask phone numbers safely: +254712345678 -> +254 712 *** 678
  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 9) return phone;
    const clean = phone.replace(/\s+/g, '');
    if (clean.length === 13 && clean.startsWith('+254')) {
      return `${clean.substring(0, 4)} ${clean.substring(4, 7)} *** ${clean.substring(10)}`;
    }
    return `${clean.substring(0, 4)}...${clean.substring(clean.length - 3)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              SMS Activity & Gateway Hub
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
              Africa's Talking Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent audit log of all SMS transactions, provider message IDs, real HTTP responses & delivery reports
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* 5 Distinct Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Real API Calls
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {counters.realApiAttempts}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">HTTP calls to Sandbox</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
            API Accepted (101)
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {counters.apiAccepted}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Accepted into gateway</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-teal-200 shadow-xs">
          <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
            Confirmed Deliveries
          </span>
          <div className="text-2xl font-bold font-mono text-teal-700 mt-1 tabular-nums">
            {counters.confirmedDeliveries}
          </div>
          <span className="text-[10px] text-teal-700 mt-0.5 block">Verified by DLR report</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-rose-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
            Provider Failures
          </span>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1 tabular-nums">
            {counters.realProviderFailures}
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Rejected / format errors</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-amber-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
            Demo Simulations
          </span>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-1 tabular-nums">
            {counters.demoSimulatedFailures}
          </div>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Demo-only (non-API)</span>
        </div>
      </div>

      {/* Legend Distinguishing API Acceptance vs Handset Delivery */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-teal-300">
              Legend & Lifecycle: API Gateway Acceptance vs. Final Handset Delivery
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong>1. Gateway Accepted (Code 101):</strong> Africa's Talking received and verified
              the SMS parameters, assigned a unique provider message ID (e.g.{' '}
              <code className="text-teal-300">ATXid_...</code>), and billed cost in KES.
              <br />
              <strong>2. Final Handset Delivery:</strong> Handset delivery reports arrive asynchronously
              via the Africa's Talking callback webhook URL. Status remains <em>Pending</em> until the
              carrier delivery report is received.
            </p>
          </div>
        </div>
      </div>

      {/* Send Test SMS & Webhook Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Box 1: Send Test SMS Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Send Test SMS</h2>
              <p className="text-xs text-slate-500">Live request to Africa's Talking Sandbox</p>
            </div>
            <a
              href="https://simulator.africastalking.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
            >
              <span>Sandbox Simulator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <form onSubmit={handleTestSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Recipient Kenyan Mobile Number:
              </label>
              <input
                type="tel"
                required
                placeholder="0712345678 or +254712345678"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Normalized to international format (+254...) before submission.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Message Content:</label>
                <span className="text-[11px] font-mono text-slate-400">
                  {testMessage.length}/160 chars
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Clearly Separated Demo-Only Simulation Option */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="font-bold text-xs text-amber-900">
                  Simulate failure (demo only)
                </span>
              </label>
              <p className="text-[11px] text-amber-800 leading-normal pl-6">
                Creates a local demonstration record with network failure for judge review without
                calling the live Africa's Talking endpoint. Never counts toward real API attempts.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingSms}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-xs transition-colors flex items-center justify-center gap-2 ${
                simulateFailure
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              <Send className="w-3.5 h-3.5 text-teal-400" />
              <span>
                {isSendingSms
                  ? 'Transmitting...'
                  : simulateFailure
                  ? 'Generate Simulated Failure (Demo)'
                  : "Dispatch Real SMS via Africa's Talking"}
              </span>
            </button>
          </form>
        </div>

        {/* Box 2: Delivery Report Callback & Simulator */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Delivery Report (DLR) Webhook</h2>
              <p className="text-xs text-slate-500">Live callback endpoint parser</p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Active Endpoint
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Your Public Webhook Callback URL:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/api/sms/delivery-report`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs select-all text-slate-700"
                />
                <button
                  onClick={copyCallbackUrl}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shrink-0 font-medium text-xs flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Configure this URL under <em>Africa's Talking Sandbox &rarr; SMS &rarr; SMS Callback URLs &rarr; Delivery Reports</em>.
              </p>
            </div>

            {/* Test DLR Callback Parser */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="font-semibold text-slate-800 block">
                Test Delivery Report Webhook Processor:
              </span>
              <p className="text-[11px] text-slate-500">
                Paste any Provider Message ID below to simulate Africa's Talking carrier callback and observe status update to 'Delivered'.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. ATXid_b49f28a8d9e7"
                  value={simulatedWebhookMessageId}
                  onChange={(e) => setSimulatedWebhookMessageId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleSimulateWebhookDlr}
                  disabled={isSimulatingDlr}
                  className="px-3 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 shrink-0 disabled:opacity-50"
                >
                  {isSimulatingDlr ? 'Simulating...' : 'Post Callback'}
                </button>
              </div>

              {dlrFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  {dlrFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setFilter('success')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'success'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Accepted ({counters.apiAccepted})
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'delivered'
                ? 'bg-teal-700 text-white font-semibold'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            Delivered ({counters.confirmedDeliveries})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'failed'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Failed ({counters.realProviderFailures})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            Pending Delivery
          </button>
          <button
            onClick={() => setFilter('demo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filter === 'demo'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Demo Simulation ({counters.demoSimulatedFailures})
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Recipient</th>
                <th className="py-3 px-3">Purpose</th>
                <th className="py-3 px-3">Message Preview</th>
                <th className="py-3 px-3">Provider Msg ID</th>
                <th className="py-3 px-3">Gateway Status</th>
                <th className="py-3 px-3">Delivery Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No SMS transmissions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status_code === 101 || log.provider_status === 'Success';
                  const isDemo = log.is_demo_simulation;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{log.recipient_name}</div>
                        <div className="font-mono text-slate-400 text-[11px]">
                          {maskPhone(log.recipient_phone)}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="capitalize text-slate-700 font-medium">
                          {log.purpose.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs truncate text-slate-600 font-mono text-[11px]">
                        "{log.message_text}"
                      </td>
                      <td className="py-3.5 px-3 font-mono text-teal-700 font-medium whitespace-nowrap">
                        {log.provider_message_id || <span className="text-slate-400">None</span>}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isDemo
                              ? 'bg-amber-100 text-amber-800'
                              : isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.provider_status}
                          {log.status_code ? ` (${log.status_code})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`capitalize text-[11px] font-semibold ${
                            log.delivery_status === 'delivered'
                              ? 'text-teal-700'
                              : log.delivery_status === 'pending'
                              ? 'text-blue-700'
                              : 'text-rose-600'
                          }`}
                        >
                          {log.delivery_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onInspectLog(log)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
