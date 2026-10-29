import React, { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Radio,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Save,
  Phone,
  Building,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  Eye,
  EyeOff,
  ClipboardPaste,
  Smartphone,
} from 'lucide-react';
import { ShopSettings } from '../types/index.ts';
import { api } from '../services/api.ts';

interface SettingsViewProps {
  settings: ShopSettings;
  onUpdateSettings: (updates: Partial<ShopSettings>) => Promise<ShopSettings>;
  onTestConnection: () => Promise<any>;
  onResetSeed: () => void;
  onOpenUssd?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onTestConnection,
  onResetSeed,
  onOpenUssd,
}) => {
  const [shopName, setShopName] = useState(settings.shop_name);
  const [shopPhone, setShopPhone] = useState(settings.shopkeeper_phone);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [connTestResult, setConnTestResult] = useState<any | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);

  // Direct API Key state
  const [usernameInput, setUsernameInput] = useState(settings.at_username || 'sandbox');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  // USSD Service Code state
  const [ussdCodeInput, setUssdCodeInput] = useState(settings.ussd_service_code || '*384*88924#');
  const [isSavingUssd, setIsSavingUssd] = useState(false);
  const [ussdSaveFeedback, setUssdSaveFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (settings.ussd_service_code) {
      setUssdCodeInput(settings.ussd_service_code);
    }
  }, [settings.ussd_service_code]);

  const handleSaveUssdCode = async () => {
    if (!ussdCodeInput.trim()) return;
    setIsSavingUssd(true);
    setUssdSaveFeedback(null);
    try {
      await onUpdateSettings({ ussd_service_code: ussdCodeInput.trim() });
      setUssdSaveFeedback('Saved! USSD service code updated across DukaShield.');
      setTimeout(() => setUssdSaveFeedback(null), 3000);
    } catch (err: any) {
      setUssdSaveFeedback(`Error: ${err.message}`);
    } finally {
      setIsSavingUssd(false);
    }
  };

  const callbackUrl = 'https://ais-dev-bscnsuporyfwsoeqnzdi2x-51694486837.europe-west2.run.app/api/ussd';

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2000);
  };

  const handlePasteKey = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        setKeyFeedback({
          type: 'info',
          text: 'Clipboard reading is restricted in this preview frame. Please click the box and press Ctrl+V (or Cmd+V on Mac) to paste.',
        });
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        setApiKeyInput(text.trim());
        setKeyFeedback({ type: 'success', text: 'API Key pasted from clipboard! Click "Save & Verify Key" below.' });
      } else {
        setKeyFeedback({
          type: 'info',
          text: 'Clipboard empty or restricted. Please click inside the box and press Ctrl+V (or Cmd+V) to paste.',
        });
      }
    } catch {
      setKeyFeedback({
        type: 'info',
        text: 'Browser security prevented automatic reading. Click inside the box and press Ctrl+V (or Cmd+V on Mac) or right-click to paste.',
      });
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) {
      setKeyFeedback({ type: 'error', text: 'Please enter or paste your API Key.' });
      return;
    }

    setIsSavingKey(true);
    setKeyFeedback(null);

    try {
      const res = await api.saveApiKey(apiKeyInput.trim(), usernameInput.trim());
      setConnTestResult(res.testResult);
      if (res.testResult?.canConnect) {
        setKeyFeedback({ type: 'success', text: 'API Key saved securely on the server and verified with Africa\'s Talking!' });
      } else {
        setKeyFeedback({
          type: 'error',
          text: `Gateway responded: ${res.testResult?.error || 'Authentication failed'}. Ensure you clicked the orange "Go To Sandbox App" button before generating this key.`,
        });
      }
    } catch (err: any) {
      setKeyFeedback({ type: 'error', text: err.message || 'Failed to save API key' });
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings({
        shop_name: shopName,
        shopkeeper_phone: shopPhone,
        ussd_service_code: ussdCodeInput.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnectionClick = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await onTestConnection();
      setConnTestResult(res);
    } catch (err: any) {
      setConnTestResult({ canConnect: false, error: err.message });
    } finally {
      setIsTestingConn(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Africa's Talking Gateway
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure shop identity, owner alerts phone number, and verify Africa's Talking Sandbox credentials
        </p>
      </div>

      {/* Africa's Talking Status & Diagnostic Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Africa's Talking Sandbox Status</h2>
              <p className="text-xs text-slate-500">Official East African SMS Infrastructure</p>
            </div>
          </div>

          <button
            onClick={handleTestConnectionClick}
            disabled={isTestingConn}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
          >
            <span>{isTestingConn ? 'Testing Gateway...' : 'Test Sandbox Connection'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500">API Endpoint:</span>
            <div className="font-mono font-semibold text-slate-900 truncate">
              api.sandbox.africastalking.com
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500">Sandbox Username:</span>
            <div className="font-mono font-semibold text-teal-700">sandbox</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="text-slate-500">Server API Key State:</span>
            <div className="font-semibold flex items-center gap-1.5">
              {settings.at_api_key_configured ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Configured on Server
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Not Configured in .env
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Diagnostic Test Results */}
        {connTestResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
              connTestResult.canConnect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
            }`}
          >
            <div className="font-bold flex items-center gap-2">
              {connTestResult.canConnect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sandbox Connection Succeeded</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Gateway Connection Diagnostic</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">
              {connTestResult.canConnect
                ? `Successfully reached Africa's Talking Sandbox server for user "${connTestResult.username}" with key ${connTestResult.apiKeyPreview}. Active Sandbox Balance: ${connTestResult.balance || 'Available'}.`
                : connTestResult.error || 'Connection failed'}
            </p>
          </div>
        )}
      </div>

      {/* Direct API Key Paste & Save Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-teal-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Direct Sandbox API Key Input
              </h2>
              <p className="text-xs text-slate-500">
                Paste your Africa's Talking Sandbox API Key directly to enable real live SMS dispatch
              </p>
            </div>
          </div>
          {settings.at_api_key_configured && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Active Key Saved
            </span>
          )}
        </div>

        {/* Quick Guide to Avoid 401 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-1 text-xs">
          <span className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Troubleshooting "HTTP 401: The supplied authentication is invalid":
          </span>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            In Africa's Talking (<a href="https://account.africastalking.com" target="_blank" rel="noreferrer" className="underline font-bold">account.africastalking.com</a>), you must click the orange button: <strong>"Go to Sandbox App"</strong> FIRST. Generating a key from your main dashboard or a live app will cause a 401 when paired with username <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">sandbox</code>.
          </p>
        </div>

        <form onSubmit={handleSaveApiKey} className="space-y-3">
          <div>
            <label htmlFor="settingsUsernameField" className="font-semibold text-slate-800 text-xs block mb-1">
              Africa's Talking Username:
            </label>
            <input
              id="settingsUsernameField"
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="sandbox"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white outline-hidden"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Default is <strong>sandbox</strong>. If you created a named app on Africa's Talking, type your app name here.
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label htmlFor="settingsKeyField" className="font-semibold text-slate-800 text-xs">
              Enter or Paste API Key:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteKey}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 hover:bg-teal-100 transition-colors"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Try Auto-Paste</span>
              </button>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={() => setApiKeyInput('')}
                  className="text-[11px] text-slate-400 hover:text-rose-600 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <textarea
              id="settingsKeyField"
              rows={2}
              required
              placeholder="Paste your Africa's Talking Sandbox API key here (Click inside and press Ctrl+V or Cmd+V)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:bg-white outline-hidden transition-all shadow-2xs"
              style={{ WebkitTextSecurity: showKey ? 'none' : 'disc' } as any}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 p-1"
              title={showKey ? 'Mask key' : 'Show key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Press <kbd className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">Ctrl+V</kbd> (or <kbd className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">⌘V</kbd>) inside the box, or right-click to paste.
            </span>
            <button
              type="submit"
              disabled={isSavingKey || !apiKeyInput.trim()}
              className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSavingKey ? 'Verifying...' : 'Save & Verify Key'}</span>
            </button>
          </div>
        </form>

        {keyFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              keyFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : keyFeedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            {keyFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : keyFeedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <span>{keyFeedback.text}</span>
          </div>
        )}
      </div>

      {/* USSD Service Code & Callback Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">USSD Service Code & Callback Status</h2>
              <p className="text-xs text-slate-500">Feature phone access for shopkeepers without internet smartphones</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Gateway Live
          </span>
        </div>

        <div className="space-y-3 text-xs">
          {/* Configured Service Code Input */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ussd-service-code-input" className="font-semibold text-slate-700">
                Your Africa's Talking USSD Service Code:
              </label>
              <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold">
                Active: {settings.ussd_service_code || '*384*88924#'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="ussd-service-code-input"
                type="text"
                value={ussdCodeInput}
                onChange={(e) => setUssdCodeInput(e.target.value)}
                placeholder="*384*88924#"
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-xs text-slate-900 font-bold focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleSaveUssdCode}
                disabled={isSavingUssd || !ussdCodeInput.trim()}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-2xs disabled:opacity-50"
              >
                {isSavingUssd ? 'Saving...' : 'Save Code'}
              </button>
            </div>
            {ussdSaveFeedback && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{ussdSaveFeedback}</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Match this to the service code configured in your Africa's Talking Sandbox (e.g.{' '}
              <code className="bg-slate-200 px-1 rounded font-mono font-bold">*384*88924#</code>).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Your USSD Callback URL:</span>
              <button
                type="button"
                onClick={copyCallbackUrl}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white px-2.5 py-1 rounded border border-slate-200 hover:border-teal-300 transition-colors shadow-2xs"
              >
                {copiedCallback ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCallback ? 'Copied to Clipboard!' : 'Copy Callback URL'}</span>
              </button>
            </div>
            <code className="block p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-teal-800 break-all select-all font-semibold">
              {callbackUrl}
            </code>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In Africa's Talking Sandbox &rarr; <em>USSD &rarr; Service Codes &rarr; Create Channel</em>:
              set your Service Code (<code className="bg-slate-200 px-1 rounded font-mono font-bold">{settings.ussd_service_code || '*384*88924#'}</code>) and paste the URL above as your Callback URL.
            </p>
          </div>

          {/* SIM and External Webhook Clarification */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
              <Radio className="w-3.5 h-3.5 text-amber-700" />
              <span>Testing USSD: Real SIM vs In-App Simulator</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>1. On Real SIM Cards:</strong> Telcos (Safaricom, Airtel) only broadcast paid, commercial USSD channels over physical cell towers. Free Sandbox codes (like <code className="bg-amber-100 px-1 rounded font-mono font-bold">{settings.ussd_service_code || '*384*88924#'}</code>) do not route over physical SIM cards.
            </p>
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>2. External Webhook 302:</strong> External cloud simulators hitting this private AI Studio URL get redirected by the workspace session cookie layer, which Africa's Talking reports as <em>"network technical problems"</em>.
            </p>
            {onOpenUssd && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onOpenUssd}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs inline-flex items-center justify-center gap-2 text-xs"
                >
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  <span>Launch In-App USSD Feature Phone Simulator ({settings.ussd_service_code || '*384*88924#'})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Africa's Talking Setup Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <BookOpen className="w-4 h-4 text-teal-600" />
          <h2 className="text-base font-bold text-slate-900">
            Africa's Talking Sandbox Setup Guide
          </h2>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-bold text-slate-900">Create or Login to Africa's Talking</p>
              <p className="text-slate-600">
                Sign in to{' '}
                <a
                  href="https://account.africastalking.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-semibold underline inline-flex items-center gap-0.5"
                >
                  account.africastalking.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and toggle to the <strong>Sandbox</strong> environment in the top navigation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-bold text-slate-900">Generate Sandbox API Key</p>
              <p className="text-slate-600">
                Go to <em>Settings &rarr; API Key</em>, enter your password, and copy your newly
                generated Sandbox API Key.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-bold text-slate-900">Configure Server-Side Environment Variable</p>
              <p className="text-slate-600">
                Set <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">AFRICASTALKING_API_KEY="YOUR_KEY"</code> in your server's <code className="bg-slate-100 text-slate-800 px-1 rounded font-mono">.env</code> file or host secrets. The key stays 100% on the server and is never exposed to browser clients.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <div>
              <p className="font-bold text-slate-900">Test with the Web Simulator</p>
              <p className="text-slate-600">
                Launch{' '}
                <a
                  href="https://simulator.africastalking.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-semibold underline inline-flex items-center gap-0.5"
                >
                  simulator.africastalking.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and enter your test phone number (e.g. +254712345678). When DukaShield transmits an SMS, you will see it arrive live on the virtual handset!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop Information Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="pb-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Duka & Business Profile</h2>
          <p className="text-xs text-slate-500">Controls shop name in SMS templates and alert recipient</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Duka / Business Name:</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Appears in automated debt reminders: <em>"Hello [Name], your balance at [Shop Name] is..."</em>
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Shopkeeper Alerts Mobile Number:
            </label>
            <input
              type="tel"
              required
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Receives daily EOD summaries and low-stock SMS reorder alerts (+254...).
            </p>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onResetSeed}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Seed Data</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-teal-400" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
