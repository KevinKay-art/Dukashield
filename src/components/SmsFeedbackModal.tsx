import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, X, ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { SmsLog } from '../types/index.ts';

interface SmsFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  smsLog?: SmsLog | null;
  rawResponse?: any;
  error?: string;
  title?: string;
}

export const SmsFeedbackModal: React.FC<SmsFeedbackModalProps> = ({
  isOpen,
  onClose,
  smsLog,
  rawResponse,
  error,
  title = 'SMS Transmission Details',
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !smsLog) return null;

  const isSuccess = smsLog.status_code === 101 || smsLog.provider_status === 'Success';
  const isDemo = smsLog.is_demo_simulation;

  const copyPayload = () => {
    const textToCopy = JSON.stringify(rawResponse || smsLog.raw_response || smsLog, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDemo
                  ? 'bg-amber-100 text-amber-700'
                  : isSuccess
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {isDemo
                  ? 'Demo Simulation (Not sent to live API)'
                  : isSuccess
                  ? "Africa's Talking Sandbox Gateway Accepted"
                  : 'SMS Gateway Rejection / Network Failure'}
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

        {/* Content Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1 text-sm text-slate-700">
          {/* Key Outcome Banner */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDemo
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : isSuccess
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase">
                {isDemo ? 'Demo Mode Outcome' : 'API Response Status'}
              </span>
              <span className="font-mono text-xs font-bold">
                Status Code: {smsLog.status_code ?? 'None'}
              </span>
            </div>
            <p className="text-sm font-medium mt-1">
              {smsLog.provider_status}
              {smsLog.cost && ` · Cost: ${smsLog.cost}`}
            </p>
            {smsLog.failure_reason && (
              <p className="text-xs mt-1.5 font-normal text-rose-800 bg-white/70 p-2 rounded-md border border-rose-100">
                {smsLog.failure_reason}
              </p>
            )}
          </div>

          {/* Details Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Recipient Phone:</span>
              <span className="font-mono font-medium text-slate-900">{smsLog.recipient_phone}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Recipient Name:</span>
              <span className="font-medium text-slate-900">{smsLog.recipient_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Provider Message ID:</span>
              <span className="font-mono text-xs font-semibold text-teal-700 select-all">
                {smsLog.provider_message_id || 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Handset Delivery State:</span>
              <span className="capitalize font-medium text-slate-800">
                {smsLog.delivery_status}
                {smsLog.delivery_status === 'pending' && ' (Awaiting callback)'}
              </span>
            </div>
          </div>

          {/* Message Text Preview */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Message Content Sent:
            </label>
            <div className="p-3 bg-slate-100 rounded-xl text-xs font-mono text-slate-800 leading-relaxed border border-slate-200">
              "{smsLog.message_text}"
            </div>
          </div>

          {/* Sandbox Explanation Note */}
          <div className="text-xs text-slate-500 bg-blue-50/70 p-3 rounded-xl border border-blue-100 space-y-1">
            <p className="font-semibold text-blue-900">
              Important: API Acceptance vs Handset Delivery
            </p>
            <p className="text-blue-800 leading-normal">
              An HTTP 200 with code 101 indicates Africa's Talking has validated and accepted the
              SMS into its gateway queue. Handset delivery confirmation requires the webhook delivery
              report callback configured in your Sandbox dashboard.
            </p>
          </div>

          {/* Collapsible Raw API Response */}
          <div>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center justify-between w-full text-xs font-medium text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>Inspect Raw Gateway Response</span>
              {showRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRaw && (
              <div className="mt-2 relative">
                <button
                  onClick={copyPayload}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 text-slate-200 hover:text-white rounded-md text-xs flex items-center gap-1 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(rawResponse || smsLog.raw_response || smsLog, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <a
            href="https://sandbox.africastalking.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-semibold hover:underline"
          >
            <span>Africa's Talking Sandbox</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
