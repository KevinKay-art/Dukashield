import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Send,
  Edit2,
  TrendingUp,
  Tag,
  CheckCircle2,
  ArrowUpDown,
} from 'lucide-react';
import { Product } from '../types/index.ts';

interface InventoryViewProps {
  products: Product[];
  onCreateProduct: (data: Partial<Product>) => Promise<Product>;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<Product>;
  onSendStockAlertDirect: (product: Product) => Promise<any>;
  isSendingSms: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onCreateProduct,
  onUpdateProduct,
  onSendStockAlertDirect,
  isSendingSms,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  // New Product Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('Flour & Grains');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>('');
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formThreshold, setFormThreshold] = useState<number | ''>(5);
  const [formUnit, setFormUnit] = useState('packet');
  const [isSaving, setIsSaving] = useState(false);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter((p) => p.current_stock <= p.low_stock_threshold).length;
  const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
  const totalStockValue = products.reduce((sum, p) => sum + p.cost_price * p.current_stock, 0);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('');
    setFormCategory('Flour & Grains');
    setFormCostPrice('');
    setFormSellingPrice('');
    setFormStock('');
    setFormThreshold(5);
    setFormUnit('packet');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormCostPrice(p.cost_price);
    setFormSellingPrice(p.selling_price);
    setFormStock(p.current_stock);
    setFormThreshold(p.low_stock_threshold);
    setFormUnit(p.unit);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formCostPrice === '' || formSellingPrice === '' || formStock === '') return;

    setIsSaving(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, {
          name: formName,
          sku: formSku,
          category: formCategory,
          cost_price: Number(formCostPrice),
          selling_price: Number(formSellingPrice),
          current_stock: Number(formStock),
          low_stock_threshold: Number(formThreshold),
          unit: formUnit,
        });
      } else {
        await onCreateProduct({
          name: formName,
          sku: formSku,
          category: formCategory,
          cost_price: Number(formCostPrice),
          selling_price: Number(formSellingPrice),
          current_stock: Number(formStock),
          low_stock_threshold: Number(formThreshold),
          unit: formUnit,
        });
      }
      setIsAddModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error saving product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickStockAdjust = async (product: Product, delta: number) => {
    const newStock = product.current_stock + delta;
    if (newStock < 0) return;
    try {
      await onUpdateProduct(product.id, { current_stock: newStock });
    } catch (err: any) {
      alert(err.message || 'Could not update stock');
    }
  };

  const handleSendStockAlert = async (product: Product) => {
    setSendingAlertId(product.id);
    try {
      await onSendStockAlertDirect(product);
    } finally {
      setSendingAlertId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-500">
            Real-time stock counts, low-stock thresholds, and Africa's Talking SMS alerts
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Catalog Size
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2 tabular-nums">
            {products.length} products
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Total inventory valuation: KES {totalStockValue.toLocaleString()}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Stock Health Status
          </span>
          <div className="text-2xl font-bold font-mono text-teal-700 mt-2 tabular-nums">
            {products.length - lowStockCount} healthy
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Above configured low-stock thresholds
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Stock Warnings
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-2 tabular-nums">
            {lowStockCount} items low
          </div>
          <span className="text-xs text-amber-700 mt-1 block">
            {outOfStockCount > 0 ? `${outOfStockCount} completely out of stock` : 'Ready to reorder'}
          </span>
        </div>
      </div>

      {/* Product Visual Showcase Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center gap-5">
        <div className="w-full md:w-48 h-28 rounded-lg overflow-hidden shrink-0 border border-slate-200">
          <img
            src="/src/assets/images/kenyan_duka_products_1793208329812.jpg"
            alt="East African Grocery Staples"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              Kenyan Retail Staples
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Fast Moving Consumer Goods</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            DukaShield Reorder Protection
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Whenever a sale reduces any product below its configured threshold, DukaShield flags it
            on the dashboard and empowers you to dispatch an SMS restock alert directly to your supplier
            or phone via Africa's Talking Sandbox.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
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

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Gross Margin</th>
                <th className="py-3 px-3 text-center">Current Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.current_stock <= 0;
                const isLowStock = p.current_stock > 0 && p.current_stock <= p.low_stock_threshold;
                const profitPerUnit = p.selling_price - p.cost_price;
                const margin = Math.round((profitPerUnit / p.selling_price) * 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {p.category} · Sold in {p.unit}s
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{p.sku}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      KES {p.cost_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      KES {p.selling_price.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                      +{margin}% (KES {profitPerUnit})
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickStockAdjust(p, -1)}
                          disabled={p.current_stock <= 0}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 font-bold"
                          title="Reduce 1"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-sm w-8 text-center text-slate-900">
                          {p.current_stock}
                        </span>
                        <button
                          onClick={() => handleQuickStockAdjust(p, 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                          title="Add 1"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        threshold: {p.low_stock_threshold}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isLowStock && (
                          <button
                            onClick={() => handleSendStockAlert(p)}
                            disabled={isSendingSms || sendingAlertId === p.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50"
                            title="Send SMS stock alert to shopkeeper"
                          >
                            <Send className="w-3 h-3 text-amber-700" />
                            <span>{sendingAlertId === p.id ? 'Sending...' : 'Stock SMS'}</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-400 hover:text-slate-800 rounded-md hover:bg-slate-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Product Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unga wa Dola Maize Meal 2kg"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">SKU / Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. UNG-DOL-2KG"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Flour & Grains">Flour & Grains</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Oils & Fats">Oils & Fats</option>
                    <option value="Detergents & Soap">Detergents & Soap</option>
                    <option value="Pantry">Pantry</option>
                    <option value="Beverages">Beverages</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cost Price (KES):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 155"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Selling Price (KES):
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 195"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Initial Stock:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 24"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Low Threshold:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Unit:</label>
                  <input
                    type="text"
                    placeholder="packet, bottle, bar"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
