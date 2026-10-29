/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SalesView } from './components/SalesView.tsx';
import { DebtsView } from './components/DebtsView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { HealthCheckView } from './components/HealthCheckView.tsx';
import { SmsActivityView } from './components/SmsActivityView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { SmsFeedbackModal } from './components/SmsFeedbackModal.tsx';
import { DemoGuideModal } from './components/DemoGuideModal.tsx';
import { UssdSimulatorModal } from './components/UssdSimulatorModal.tsx';
import { SecretsModal } from './components/SecretsModal.tsx';
import {
  api,
  DashboardData,
  SmsActivityResponse,
  HealthCheckData,
} from './services/api.ts';
import { Product, Customer, Sale, Debt, SmsLog, ShopSettings } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Core Data States
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [healthData, setHealthData] = useState<HealthCheckData | null>(null);
  const [smsActivity, setSmsActivity] = useState<SmsActivityResponse | null>(null);
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: 'Mama Boi Duka & General Supplies',
    shopkeeper_phone: '+254712345678',
    currency: 'KES',
    at_username: 'sandbox',
    at_api_key_configured: false,
    app_url: 'https://ais-dev-bscnsuporyfwsoeqnzdi2x-51694486837.europe-west2.run.app',
  });

  // Modal States
  const [smsFeedbackModalOpen, setSmsFeedbackModalOpen] = useState(false);
  const [activeSmsLog, setActiveSmsLog] = useState<SmsLog | null>(null);
  const [activeSmsRaw, setActiveSmsRaw] = useState<any>(null);
  const [activeSmsError, setActiveSmsError] = useState<string | undefined>(undefined);
  const [activeSmsTitle, setActiveSmsTitle] = useState('SMS Transmission Result');

  const [demoGuideModalOpen, setDemoGuideModalOpen] = useState(false);
  const [ussdModalOpen, setUssdModalOpen] = useState(false);
  const [secretsModalOpen, setSecretsModalOpen] = useState(false);

  // Load all initial state from server
  const loadAllData = useCallback(async (date?: string) => {
    try {
      const [dash, prods, custs, sls, dbts, hlth, sms, sett] = await Promise.all([
        api.getDashboard(date),
        api.getProducts(),
        api.getCustomers(),
        api.getSales(),
        api.getDebts(),
        api.getHealthCheck(),
        api.getSmsLogs('all'),
        api.getSettings(),
      ]);

      setDashboardData(dash);
      setProducts(prods);
      setCustomers(custs);
      setSales(sls);
      setDebts(dbts);
      setHealthData(hlth);
      setSmsActivity(sms);
      setSettings(sett);
    } catch (err) {
      console.error('Failed to load DukaShield data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleQuickSale = () => {
    setActiveTab('sales');
  };

  const handleOpenDemo = () => {
    setDemoGuideModalOpen(true);
  };

  const handleRecordSale = async (payload: any) => {
    const res = await api.recordSale(payload);
    await loadAllData();
    return res;
  };

  const handleAddCustomer = async (data: any) => {
    const newCust = await api.createCustomer(data);
    await loadAllData();
    return newCust;
  };

  const handleRepayDebt = async (debtId: string, amount: number, method: 'cash' | 'mpesa', ref?: string) => {
    const res = await api.repayDebt(debtId, amount, method, ref);
    await loadAllData();
    return res;
  };

  const handleSendDebtReminder = async (debtId: string) => {
    setIsSendingSms(true);
    try {
      const result = await api.sendDebtReminder(debtId);
      setActiveSmsLog(result.smsLog);
      setActiveSmsRaw(result.rawResponse);
      setActiveSmsError(result.error);
      setActiveSmsTitle('Customer Debt Reminder SMS');
      setSmsFeedbackModalOpen(true);
      await loadAllData();
      return result;
    } catch (err: any) {
      alert(err.message || 'Error transmitting debt reminder');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSendDailySummary = async () => {
    setIsSendingSms(true);
    try {
      const result = await api.sendDailySummarySms(dashboardData?.date);
      setActiveSmsLog(result.smsLog);
      setActiveSmsRaw(result.rawResponse);
      setActiveSmsError(result.error);
      setActiveSmsTitle('Daily Business Summary SMS');
      setSmsFeedbackModalOpen(true);
      await loadAllData();
      return result;
    } catch (err: any) {
      alert(err.message || 'Error sending daily summary SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSendStockAlert = async (alertId: string) => {
    setIsSendingSms(true);
    try {
      const result = await api.sendStockAlertSms(alertId);
      setActiveSmsLog(result.smsLog);
      setActiveSmsRaw(result.rawResponse);
      setActiveSmsError(result.error);
      setActiveSmsTitle('Low-Stock Notification SMS');
      setSmsFeedbackModalOpen(true);
      await loadAllData();
      return result;
    } catch (err: any) {
      alert(err.message || 'Error sending stock alert SMS');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleSendStockAlertDirect = async (product: any) => {
    setIsSendingSms(true);
    try {
      // Find or trigger stock alert
      const message = `DukaShield Alert: ${product.name} is running low. Current stock: ${product.current_stock} ${product.unit}s. Reorder soon to avoid running out.`;
      const result = await api.sendTestSms({
        to: settings.shopkeeper_phone,
        message,
        simulateFailureDemo: false,
      });
      setActiveSmsLog(result.smsLog);
      setActiveSmsRaw(result.rawResponse);
      setActiveSmsError(result.error);
      setActiveSmsTitle(`Stock Alert for ${product.name}`);
      setSmsFeedbackModalOpen(true);
      await loadAllData();
      return result;
    } catch (err: any) {
      alert(err.message || 'Error sending stock alert');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await api.acknowledgeAlert(alertId);
    await loadAllData();
  };

  const handleSendTestSms = async (payload: any) => {
    setIsSendingSms(true);
    try {
      const result = await api.sendTestSms(payload);
      setActiveSmsLog(result.smsLog);
      setActiveSmsRaw(result.rawResponse);
      setActiveSmsError(result.error);
      setActiveSmsTitle(payload.simulateFailureDemo ? 'Demo Simulated SMS Failure' : 'Test SMS Gateway Transmission');
      setSmsFeedbackModalOpen(true);
      await loadAllData();
      return result;
    } catch (err: any) {
      alert(err.message || 'Test SMS failed');
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleCreateProduct = async (productData: Partial<Product>) => {
    const res = await api.createProduct(productData);
    await loadAllData();
    return res;
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await api.updateProduct(id, updates);
    await loadAllData();
    return res;
  };

  const handleUpdateSettings = async (updates: Partial<ShopSettings>) => {
    const res = await api.updateSettings(updates);
    setSettings(res);
    await loadAllData();
    return res;
  };

  const handleTestConnection = async () => {
    return api.testSandboxConnection();
  };

  const handleResetSeed = async () => {
    await api.resetSeed();
    await loadAllData();
  };

  const handleInspectLog = (log: SmsLog) => {
    setActiveSmsLog(log);
    setActiveSmsRaw(log.raw_response);
    setActiveSmsError(log.failure_reason || undefined);
    setActiveSmsTitle('SMS Activity Log Inspection');
    setSmsFeedbackModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased pb-20 md:pb-8">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onQuickSale={handleQuickSale}
        onOpenDemo={handleOpenDemo}
        onOpenUssd={() => setUssdModalOpen(true)}
        onOpenSecrets={() => setSecretsModalOpen(true)}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Loading DukaShield Assistant...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && dashboardData && (
              <DashboardView
                data={dashboardData}
                isLoading={isLoading}
                onRefresh={(date) => loadAllData(date)}
                onNavigateTab={setActiveTab}
                onSendDailySummary={handleSendDailySummary}
                onSendStockAlert={handleSendStockAlert}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onQuickSale={handleQuickSale}
                onOpenUssd={() => setUssdModalOpen(true)}
                isSendingSms={isSendingSms}
              />
            )}

            {activeTab === 'sales' && (
              <SalesView
                products={products}
                customers={customers}
                sales={sales}
                onRecordSale={handleRecordSale}
                onAddCustomer={handleAddCustomer}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'debts' && (
              <DebtsView
                debts={debts}
                customers={customers}
                onRepayDebt={handleRepayDebt}
                onSendDebtReminder={handleSendDebtReminder}
                onAddCustomer={handleAddCustomer}
                onNavigateTab={setActiveTab}
                isSendingSms={isSendingSms}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                products={products}
                onCreateProduct={handleCreateProduct}
                onUpdateProduct={handleUpdateProduct}
                onSendStockAlertDirect={handleSendStockAlertDirect}
                isSendingSms={isSendingSms}
              />
            )}

            {activeTab === 'health' && (
              <HealthCheckView
                healthData={healthData}
                isLoading={isLoading}
                onRefresh={() => loadAllData()}
                onNavigateTab={setActiveTab}
                onSendDebtReminder={handleSendDebtReminder}
                onSendStockAlertDirect={handleSendStockAlertDirect}
              />
            )}

            {activeTab === 'sms' && (
              <SmsActivityView
                activityData={smsActivity}
                isLoading={isLoading}
                onRefresh={() => loadAllData()}
                onSendTestSms={handleSendTestSms}
                onInspectLog={handleInspectLog}
                isSendingSms={isSendingSms}
                shopkeeperPhone={settings.shopkeeper_phone}
                appUrl={settings.app_url}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onTestConnection={handleTestConnection}
                onResetSeed={handleResetSeed}
                onOpenUssd={() => setUssdModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Fixed Thumb Bar (< 15% viewport height) */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadAlertsCount={dashboardData?.alerts?.length || 0}
      />

      {/* Modals */}
      <SmsFeedbackModal
        isOpen={smsFeedbackModalOpen}
        onClose={() => setSmsFeedbackModalOpen(false)}
        smsLog={activeSmsLog}
        rawResponse={activeSmsRaw}
        error={activeSmsError}
        title={activeSmsTitle}
      />

      <DemoGuideModal
        isOpen={demoGuideModalOpen}
        onClose={() => setDemoGuideModalOpen(false)}
        onNavigateTab={setActiveTab}
        onResetSeed={handleResetSeed}
      />

      <UssdSimulatorModal
        isOpen={ussdModalOpen}
        onClose={() => setUssdModalOpen(false)}
        shopkeeperPhone={settings.shopkeeper_phone}
        ussdServiceCode={settings.ussd_service_code || '*384*88924#'}
        onRefreshData={() => loadAllData()}
      />

      <SecretsModal
        isOpen={secretsModalOpen}
        onClose={() => setSecretsModalOpen(false)}
        isConfigured={settings.at_api_key_configured}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}
