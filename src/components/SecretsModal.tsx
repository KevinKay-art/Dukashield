import React, { useState } from 'react';
import {
  Key,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  ClipboardPaste,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface SecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  onTestConnection: () => Promise<any>;
  onKeySaved?: () => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
  onTestConnection,
  onKeySaved,
}) => {
  const [usernameInput, setUsernameInput] = useState('sandbox');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  if (!isOpen) return null;

  const callbackUrl = 'https://ais-dev-bscnsuporyfwsoeqnzdi2x-51694486837.europe-west2.run.app/api/ussd';

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        setFeedbackMsg({
          type: 'info',
          text: 'Clipboard reading is restricted in this browser frame. Please click inside the box below and press Ctrl+V (or Cmd+V on Mac) to paste.',
        });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        setApiKeyInput(text.trim());
        setFeedbackMsg({ type: 'success', text: 'API Key successfully pasted from clipboard! Click "Save & Verify Key" below.' });
      } else {
        setFeedbackMsg({
          type: 'info',
          text: 'Clipboard was empty or inaccessible. Click inside the box below and press Ctrl+V (or Cmd+V) to paste.',
        });
      }
    } catch {
      setFeedbackMsg({
        type: 'info',
        text: 'Browser security prevented automatic clipboard reading. Click directly inside the box below and press Ctrl+V (or Cmd+V on Mac) or right-click to paste.',
      });
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter or paste your API Key.' });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    setTestResult(null);

    try {
      const res = await api.saveApiKey(apiKeyInput.trim(), usernameInput.trim());
      setTestResult(res.testResult);
      if (res.testResult?.canConnect) {
        setFeedbackMsg({ type: 'success', text: 'Africa\'s Talking verified successfully! Gateway is connected and ready.' });
      } else {
        setFeedbackMsg({
          type: 'error',
          text: `Gateway replied: ${res.testResult?.error || 'Authentication failed'}. Check the orange "Go to Sandbox App" instructions above.`,
        });
      }
      if (onKeySaved) onKeySaved();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save API key to server' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunDiagnostic = async () => {
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await onTestConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ canConnect: false, error: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <Key className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Africa's Talking Sandbox Key</h2>
                {isConfigured ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Key Active
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                    Paste Key Below
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Paste your Sandbox API Key directly to link SMS & USSD
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
        <div className="py-4 space-y-4 overflow-y-auto pr-1 text-xs text-slate-700 leading-relaxed">
          {/* USSD Callback Status Notice */}
          <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-1.5 text-teal-950">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-xs text-teal-900">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                USSD Service Code & Callback Ready!
              </span>
              <button
                type="button"
                onClick={copyCallbackUrl}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:text-teal-950 bg-teal-100/70 hover:bg-teal-200 px-2 py-0.5 rounded transition-colors"
              >
                {copiedCallback ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCallback ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              Your callback URL is active at: <br />
              <code className="font-mono text-[10px] bg-teal-100/60 px-1 py-0.5 rounded select-all break-all font-semibold">
                {callbackUrl}
              </code>
            </p>
          </div>

          {/* Quick Guide to Avoid 401 */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1 text-[11px]">
            <span className="font-bold flex items-center gap-1 text-amber-900">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              How to Avoid "HTTP 401: The supplied authentication is invalid":
            </span>
            <ol className="list-decimal list-inside space-y-0.5 text-amber-900 pl-1">
              <li>On <a href="https://account.africastalking.com" target="_blank" rel="noreferrer" className="underline font-bold">account.africastalking.com</a>, click the orange button: <strong>"Go to Sandbox App"</strong>.</li>
              <li>Inside that orange Sandbox app, click <strong>Settings &rarr; API Key</strong> and generate your key.</li>
              <li>Wait ~2 minutes for Africa's Talking servers to propagate the key, then paste below.</li>
            </ol>
            <p className="text-[10px] text-amber-800 pt-1">
              <em>Note: If you generated your key under a named App instead of the Sandbox app, enter your App Name in the Username box below.</em>
            </p>
          </div>

          {/* Paste Input Form */}
          <form onSubmit={handleSaveApiKey} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label htmlFor="usernameField" className="font-bold text-slate-900 text-xs block mb-1">
                Africa's Talking Username:
              </label>
              <input
                id="usernameField"
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="sandbox"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Keep as <strong>sandbox</strong> unless using a named live app.
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="apiKeyField" className="font-bold text-slate-900 text-xs block">
                Paste Sandbox API Key:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold hover:underline bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-teal-300 transition-colors shadow-2xs"
                  title="Try reading from clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-teal-600" />
                  <span>Try Auto-Paste</span>
                </button>
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={() => setApiKeyInput('')}
                    className="text-[10px] text-slate-500 hover:text-rose-600 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Direct Paste Box (Textarea for easiest paste on all browsers and devices) */}
            <div className="relative">
              <textarea
                id="apiKeyField"
                rows={2}
                required
                autoFocus
                placeholder="Paste key here (Press Ctrl+V / Cmd+V or right-click > Paste)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-hidden transition-all shadow-2xs"
                style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' } as any}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-1"
                title={showKey ? 'Mask key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>
                Tip: Click the box and press <kbd className="bg-slate-200 text-slate-700 px-1 rounded font-mono font-bold text-[10px]">Ctrl+V</kbd> (or <kbd className="bg-slate-200 text-slate-700 px-1 rounded font-mono font-bold text-[10px]">⌘V</kbd>)
              </span>
              <a
                href="https://account.africastalking.com"
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 underline font-semibold inline-flex items-center gap-0.5"
              >
                <span>account.africastalking.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !apiKeyInput.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span>{isSaving ? 'Verifying with Africa\'s Talking...' : 'Save & Verify Key'}</span>
              </button>
            </div>
          </form>

          {/* Feedback Message */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : feedbackMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : feedbackMsg.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedbackMsg.text}</span>
            </div>
          )}

          {/* Diagnostic Test Results */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                testResult.canConnect
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {testResult.canConnect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Africa's Talking Sandbox Connected Successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Sandbox Gateway Response:</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed">
                {testResult.canConnect
                  ? `Authenticated as "${testResult.username}" with key ${testResult.apiKeyPreview}. Active Sandbox Balance: ${testResult.balance || 'Available'}. All SMS reminders and USSD sessions are live and operational.`
                  : testResult.error || 'Connection failed'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRunDiagnostic}
            disabled={isSaving}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-test Gateway</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
