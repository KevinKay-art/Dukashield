import { ShieldCheck, Plus, Sparkles, Radio, PhoneCall, Key } from 'lucide-react';
import { ShopSettings } from '../types/index.ts';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onQuickSale: () => void;
  onOpenDemo: () => void;
  onOpenUssd: () => void;
  onOpenSecrets: () => void;
  settings?: ShopSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onQuickSale,
  onOpenDemo,
  onOpenUssd,
  onOpenSecrets,
  settings,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'sales', label: 'Sales POS' },
    { id: 'debts', label: 'Debts' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'health', label: 'Health Check' },
    { id: 'sms', label: 'SMS Activity' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Bar 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-teal-400 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Duka<span className="text-teal-600">Shield</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">
                {settings?.shop_name || 'East African Duka Assistant'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-teal-700 bg-teal-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSecrets}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors shadow-xs ${
              settings?.at_api_key_configured
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Configure Africa's Talking API Key Secret"
          >
            <Key className="w-3.5 h-3.5 text-current" />
            <span className="hidden sm:inline">Secrets</span>
          </button>

          <button
            onClick={onOpenUssd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-teal-300 bg-teal-50 text-teal-900 hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            title={`Open Africa's Talking USSD Feature Phone Simulator (${settings?.ussd_service_code || '*384*88924#'})`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-700" />
            <span>USSD {settings?.ussd_service_code || '*384*88924#'}</span>
          </button>

          <button
            onClick={onOpenDemo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            title="Open guided hackathon evaluation workflow"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Judge Demo</span>
          </button>

          <button
            onClick={onQuickSale}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>New Sale</span>
          </button>
        </div>
      </div>
    </header>
  );
};
