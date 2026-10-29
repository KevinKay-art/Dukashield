import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
  Calendar,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, Customer, Sale, BusinessAlert, Debt } from '../types/index.ts';

interface SalesViewProps {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  onRecordSale: (payload: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: 'cash' | 'mpesa' | 'debt';
    customerId?: string;
    debtDueDate?: string;
    debtNotes?: string;
  }) => Promise<{ sale: Sale; debt?: Debt; alertsTriggered: BusinessAlert[] }>;
  onAddCustomer: (data: { name: string; phone: string; notes?: string }) => Promise<Customer>;
  onNavigateTab: (tab: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const SalesView: React.FC<SalesViewProps> = ({
  products,
  customers,
  sales,
  onRecordSale,
  onAddCustomer,
  onNavigateTab,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'debt'>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [debtDueDate, setDebtDueDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [debtNotes, setDebtNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<Sale | null>(null);

  // New Customer Modal
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) return;

    setErrorMsg(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          setErrorMsg(`Cannot add more than ${product.current_stock} units in stock for ${product.name}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setErrorMsg(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.current_stock) {
              setErrorMsg(`Maximum stock available for ${item.product.name} is ${item.product.current_stock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMsg(null);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.product.selling_price * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + item.product.cost_price * item.quantity, 0);
  const estimatedProfit = totalAmount - totalCost;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'debt' && !selectedCustomerId) {
      setErrorMsg('Please select a registered customer to record a sale on debt/credit.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        customerId: selectedCustomerId || undefined,
        debtDueDate: paymentMethod === 'debt' ? debtDueDate : undefined,
        debtNotes: paymentMethod === 'debt' ? debtNotes : undefined,
      };

      const result = await onRecordSale(payload);

      // Trigger Confetti Celebration!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSuccessReceipt(result.sale);
      setCart([]);
      setSelectedCustomerId('');
      setDebtNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await onAddCustomer({
        name: newCustName,
        phone: newCustPhone,
        notes: newCustNotes,
      });
      setSelectedCustomerId(created.id);
      setIsNewCustomerModalOpen(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustNotes('');
    } catch (err: any) {
      alert(err.message || 'Could not save customer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales POS Terminal</h1>
          <p className="text-xs text-slate-500">
            Real-time stock deduction, gross profit tracking, and customer credit ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewCustomerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>+ New Customer</span>
          </button>
        </div>
      </div>

      {/* POS Two-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Catalog & Search */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Categories */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.current_stock <= 0;
              const isLowStock = prod.current_stock > 0 && prod.current_stock <= prod.low_stock_threshold;
              const inCart = cart.find((i) => i.product.id === prod.id);

              return (
                <div
                  key={prod.id}
                  onClick={() => !isOutOfStock && addToCart(prod)}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-teal-400 hover:shadow-xs cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-bold text-slate-900 leading-snug">{prod.name}</h2>
                      {inCart && (
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {inCart.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-mono">{prod.sku}</span>
                      <span>·</span>
                      <span>{prod.category}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-slate-900">
                        KES {prod.selling_price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Profit: KES {(prod.selling_price - prod.cost_price).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${prod.current_stock} ${prod.unit}s`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (5 cols): Live POS Cart & Checkout */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-teal-600" />
              <h2 className="text-base font-bold text-slate-900">Sale Cart</h2>
              <span className="text-xs font-mono font-medium text-slate-500">
                ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium"
              >
                Clear Cart
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Cart is empty. Tap any product on the left to add it to the sale.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      KES {item.product.selling_price} × {item.quantity} = KES {(item.product.selling_price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 flex items-center justify-center ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Selection */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Customer:</span>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-teal-700 text-[11px] hover:underline"
              >
                + Register New
              </button>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Walk-in Customer (Cash / M-Pesa)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Payment Method:</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'bg-slate-900 text-white border-slate-900 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition-colors ${
                  paymentMethod === 'mpesa'
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                M-Pesa
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('debt')}
                className={`py-2 px-2 rounded-lg font-medium border text-center transition-colors ${
                  paymentMethod === 'debt'
                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Debt / Credit
              </button>
            </div>
          </div>

          {/* Debt specifics if Debt is selected */}
          {paymentMethod === 'debt' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Customer Credit Agreement</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Agreed Due Date:</label>
                <input
                  type="date"
                  value={debtDueDate}
                  onChange={(e) => setDebtDueDate(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5 font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-600 block mb-0.5">Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Promises to clear by Friday evening"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-md p-1.5"
                />
              </div>
            </div>
          )}

          {/* Totals & Profit Summary */}
          <div className="pt-3 border-t border-slate-200 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Estimated Cost:</span>
              <span className="font-mono">KES {totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-700">
              <span>Est. Gross Profit:</span>
              <span className="font-mono">+KES {estimatedProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Amount:</span>
              <span className="font-mono text-xl text-teal-700">
                KES {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-3 px-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Processing Sale...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Complete Sale (KES {totalAmount.toLocaleString()})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Sales History Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recorded Sales Log</h2>
            <p className="text-xs text-slate-500">All historical sales and receipts</p>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-500">
            {sales.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Receipt</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items Purchased</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-3 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                    {sale.receipt_number}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono">{sale.sale_date}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">
                    {sale.customer_name || 'Walk-in'}
                  </td>
                  <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                    {sale.items.map((i) => `${i.product_name} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        sale.payment_method === 'mpesa'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.payment_method === 'debt'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    KES {sale.total_amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-700 font-medium">
                    +KES {sale.profit_amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Receipt Modal */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Sale Successfully Recorded!</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Receipt #{successReceipt.receipt_number}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-left border border-slate-100 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{successReceipt.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="font-semibold uppercase text-slate-800">{successReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Total Paid:</span>
                <span className="font-mono text-teal-700">
                  KES {successReceipt.total_amount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSuccessReceipt(null)}
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              Done & Start Next Sale
            </button>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Register New Customer</h3>
            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Kamau"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kenyan Mobile Number:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712345678 or +254712345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Normalized automatically to Africa's Talking format (+254...)
                </p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 4B, regular buyer"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
