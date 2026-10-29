import React, { useState } from 'react';
import {
  PhoneCall,
  X,
  RotateCcw,
  Delete,
  Copy,
  Check,
  ExternalLink,
  Radio,
  Sparkles,
} from 'lucide-react';

interface UssdSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopkeeperPhone?: string;
  ussdServiceCode?: string;
  onRefreshData?: () => void;
}

export const UssdSimulatorModal: React.FC<UssdSimulatorModalProps> = ({
  isOpen,
  onClose,
  shopkeeperPhone = '+254712345678',
  ussdServiceCode = '*384*88924#',
  onRefreshData,
}) => {
  const activeServiceCode = ussdServiceCode || '*384*88924#';
  const [sessionActive, setSessionActive] = useState(false);
  const [dialInput, setDialInput] = useState(activeServiceCode);
  const [userInput, setUserInput] = useState('');
  const [ussdHistory, setUssdHistory] = useState<string[]>([]);
  const [currentScreenText, setCurrentScreenText] = useState<string>('');
  const [isFinalScreen, setIsFinalScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  React.useEffect(() => {
    if (ussdServiceCode) {
      setDialInput(ussdServiceCode);
    }
  }, [ussdServiceCode]);

  if (!isOpen) return null;

  const callbackUrl = `${window.location.origin}/api/ussd`;

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `sess-${Date.now()}`,
          serviceCode: dialInput.trim(),
          phoneNumber: shopkeeperPhone,
          text: '',
        }),
      });

      const responseText = await res.text();
      setSessionActive(true);
      setUssdHistory([]);
      setUserInput('');

      if (responseText.startsWith('CON ')) {
        setCurrentScreenText(responseText.substring(4));
        setIsFinalScreen(false);
      } else if (responseText.startsWith('END ')) {
        setCurrentScreenText(responseText.substring(4));
        setIsFinalScreen(true);
      } else {
        setCurrentScreenText(responseText);
        setIsFinalScreen(true);
      }

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setCurrentScreenText(`Connection Error: ${err.message}`);
      setIsFinalScreen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInput = async () => {
    if (!userInput.trim()) return;

    setIsLoading(true);
    const newHistory = [...ussdHistory, userInput.trim()];
    const chainedText = newHistory.join('*');

    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `sess-${Date.now()}`,
          serviceCode: dialInput.trim(),
          phoneNumber: shopkeeperPhone,
          text: chainedText,
        }),
      });

      const responseText = await res.text();
      setUssdHistory(newHistory);
      setUserInput('');

      if (responseText.startsWith('CON ')) {
        setCurrentScreenText(responseText.substring(4));
        setIsFinalScreen(false);
      } else if (responseText.startsWith('END ')) {
        setCurrentScreenText(responseText.substring(4));
        setIsFinalScreen(true);
      } else {
        setCurrentScreenText(responseText);
        setIsFinalScreen(true);
      }

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setCurrentScreenText(`USSD Error: ${err.message}`);
      setIsFinalScreen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSessionActive(false);
    setDialInput(activeServiceCode);
    setCurrentScreenText('');
    setUserInput('');
    setUssdHistory([]);
    setIsFinalScreen(false);
  };

  const handleKeypadPress = (val: string) => {
    if (!sessionActive) {
      setDialInput((prev) => prev + val);
    } else if (!isFinalScreen) {
      setUserInput((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    if (!sessionActive) {
      setDialInput((prev) => prev.slice(0, -1));
    } else {
      setUserInput((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 overflow-hidden relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <PhoneCall className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  DukaShield USSD Channel ({activeServiceCode})
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                  Africa's Talking USSD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Offline feature-phone access for shopkeepers without smartphones or internet bundles
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

        {/* Content Body: Feature Phone + Callback Instructions Split */}
        <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto pr-1 items-start">
          {/* Left Column (7 cols): Realistic Feature Phone Mockup */}
          <div className="md:col-span-7 bg-slate-900 rounded-3xl p-5 text-white shadow-xl border-4 border-slate-800 flex flex-col items-center max-w-xs mx-auto w-full">
            {/* Phone Speaker Grill */}
            <div className="w-12 h-1 bg-slate-700 rounded-full mb-3" />

            {/* Monochrome / Backlit LCD Screen */}
            <div className="w-full bg-[#9bb59c] text-[#1c2c1e] font-mono p-3 rounded-lg shadow-inner border-2 border-[#8ba38c] min-h-[170px] flex flex-col justify-between text-xs leading-tight select-none">
              {!sessionActive ? (
                <div className="flex flex-col justify-between h-full space-y-2">
                  <div className="flex justify-between items-center text-[10px] border-b border-[#8ba38c] pb-1 opacity-80">
                    <span>SAFARICOM 4G</span>
                    <span>10:45</span>
                  </div>
                  <div className="text-center py-4">
                    <span className="text-sm font-bold tracking-wider block">
                      {dialInput || `Dial ${activeServiceCode}`}
                    </span>
                    <span className="text-[10px] opacity-75 mt-1 block">Press CALL to dial USSD</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] pt-1 border-t border-[#8ba38c]">
                    <span>Menu</span>
                    <span>Contacts</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-between h-full space-y-1.5">
                  <div className="whitespace-pre-line text-[11px] leading-tight font-medium overflow-y-auto max-h-[130px]">
                    {isLoading ? 'Loading USSD...' : currentScreenText}
                  </div>

                  {!isFinalScreen && (
                    <div className="pt-1 border-t border-[#8ba38c] flex items-center justify-between">
                      <span className="text-[11px] font-bold">Input: {userInput}</span>
                      <span className="text-[10px] opacity-75">Send</span>
                    </div>
                  )}

                  {isFinalScreen && (
                    <div className="pt-1 border-t border-[#8ba38c] text-center text-[10px] font-bold">
                      [Session Finished · Redial to start]
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Keypad Navigation Controls */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="col-span-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call / Send</span>
                </button>
              ) : !isFinalScreen ? (
                <button
                  onClick={handleSendInput}
                  disabled={isLoading || !userInput}
                  className="col-span-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  <span>Send</span>
                </button>
              ) : (
                <button
                  onClick={handleReset}
                  className="col-span-2 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Redial {activeServiceCode}</span>
                </button>
              )}

              <button
                onClick={handleBackspace}
                className="py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center shadow-md active:scale-95 transition-all"
                title="Backspace / End Call"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Numeric Keypad (1 - 9, *, 0, #) */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3">
              {[
                { k: '1', sub: '.,' },
                { k: '2', sub: 'ABC' },
                { k: '3', sub: 'DEF' },
                { k: '4', sub: 'GHI' },
                { k: '5', sub: 'JKL' },
                { k: '6', sub: 'MNO' },
                { k: '7', sub: 'PQRS' },
                { k: '8', sub: 'TUV' },
                { k: '9', sub: 'WXYZ' },
                { k: '*', sub: '' },
                { k: '0', sub: '+' },
                { k: '#', sub: '' },
              ].map((item) => (
                <button
                  key={item.k}
                  onClick={() => handleKeypadPress(item.k)}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono flex flex-col items-center justify-center active:bg-slate-600 shadow-xs"
                >
                  <span className="font-bold text-sm leading-none">{item.k}</span>
                  {item.sub && <span className="text-[8px] text-slate-400 leading-none">{item.sub}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (5 cols): Africa's Talking USSD Callback & Guide */}
          <div className="md:col-span-5 space-y-4 text-xs">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-teal-900 space-y-1">
              <span className="font-bold block text-sm">Real Africa's Talking USSD API</span>
              <p className="text-teal-800 leading-relaxed">
                DukaShield's USSD engine implements Africa's Talking's exact <code className="font-bold">CON</code> (continue) and <code className="font-bold">END</code> (terminate) protocol on <code className="font-bold">POST /api/ussd</code>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">
                Your Africa's Talking USSD Callback URL:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={callbackUrl}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-[11px] select-all"
                />
                <button
                  onClick={copyCallbackUrl}
                  className="px-2.5 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shrink-0 text-xs flex items-center gap-1"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2">
              <span className="font-bold text-slate-900 block">Supported USSD Actions:</span>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>
                  <strong>1. Today's Sales:</strong> Instant gross sales & profit
                </li>
                <li>
                  <strong>2. Low Stock:</strong> Current inventory alerts
                </li>
                <li>
                  <strong>3. Overdue Debts:</strong> Aging balances & debtor names
                </li>
                <li>
                  <strong>4. Record Cash Sale:</strong> Multi-step transaction that updates database inventory
                </li>
                <li>
                  <strong>5. Debt Reminder SMS:</strong> Dispatches real Africa's Talking reminder SMS
                </li>
                <li>
                  <strong>6. Daily Summary SMS:</strong> Sends EOD summary to shopkeeper
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-xs text-amber-900">
                <Radio className="w-3.5 h-3.5 text-amber-700" />
                <span>Why Real SIMs & External Simulators Show Network Errors:</span>
              </span>
              <ul className="text-[11px] text-amber-800 space-y-1 leading-normal list-disc list-inside">
                <li>
                  <strong>Physical SIM Cards:</strong> Safaricom and Airtel cell towers <em>only</em> route Live commercial USSD codes (approved with CAK). Free Sandbox codes (like <code className="bg-amber-100 px-1 rounded">*384*...#</code>) do not broadcast over cellular towers.
                </li>
                <li>
                  <strong>External Gateway 302:</strong> External cloud webhooks hitting the private AI Studio dev preview get redirected by Google's session cookie gate, causing Africa's Talking to report <em>"network experiencing technical problems"</em>.
                </li>
                <li>
                  <strong>Solution:</strong> Use this <strong>built-in Kabambe simulator on the left</strong>! It executes the exact Africa's Talking <code className="font-bold">CON</code>/<code className="font-bold">END</code> protocol against the local server with 100% fidelity.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Simulator updates real database inventory & debts in real time.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
