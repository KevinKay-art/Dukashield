import React from 'react';
import { LayoutDashboard, ShoppingBag, BookOpen, Package, MessageSquareText } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadAlertsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  unreadAlertsCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales', label: 'POS', icon: ShoppingBag },
    { id: 'debts', label: 'Debts', icon: BookOpen },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'sms', label: 'SMS Hub', icon: MessageSquareText },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 pb-safe shadow-lg">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors relative ${
                isActive ? 'text-teal-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 stroke-[2.2]' : 'text-slate-500 stroke-[1.8]'}`} />
                {tab.id === 'dashboard' && unreadAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </div>
              <span className="text-[11px] tracking-tight mt-1 leading-none">{tab.label}</span>
              {isActive && (
                <div className="w-4 h-0.5 bg-teal-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
