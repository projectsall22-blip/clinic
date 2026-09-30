import React, { useState, useEffect, useCallback } from 'react';
import {
  Pill, Search, AlertTriangle, Package, TrendingDown,
  Building2, Filter, Download, RefreshCw, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import Button from '../../components/common/Button';

const CATEGORY_COLORS = {
  Tablet:    'bg-blue-50 text-blue-700',
  Capsule:   'bg-purple-50 text-purple-700',
  Syrup:     'bg-green-50 text-green-700',
  Injection: 'bg-red-50 text-red-700',
  Ointment:  'bg-amber-50 text-amber-700',
  Drops:     'bg-cyan-50 text-cyan-700',
  Powder:    'bg-orange-50 text-orange-700',
  Other:     'bg-gray-100 text-gray-600',
};

const getStockStatus = (med) => {
  if (med.stock === 0)
    return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700 border-red-200' };
  if (med.expiryDate && new Date(med.expiryDate) < new Date())
    return { label: 'Expired',      cls: 'bg-gray-200 text-gray-600 border-gray-300' };
  if (med.stock <= med.minStockAlert)
    return { label: 'Low Stock',    cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return   { label: 'In Stock',     cls: 'bg-green-100 text-green-700 border-green-200' };
};

const AdminMedicineStock = () => {
  const [branches, setBranches]     = useState([]);
  const [medicines, setMedicines]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | low | out | expired
  const [summary, setSummary]       = useState(null);

  // Fetch branches on mount
  useEffect(() => {
    API.get('/branches')
      .then(r => setBranches(r.data || []))
      .catch(() => {});
  }, []);

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch) params.append('branch', selectedBranch);
      if (search)         params.append('search', search);

      const res = await API.get(`/medicines?${params}`);
      const list = res.data || [];
      setMedicines(list);

      // Build summary from list
      const today     = new Date();
      const in30Days  = new Date(); in30Days.setDate(in30Days.getDate() + 30);
      setSummary({
        total:        list.length,
        inStock:      list.filter(m => m.stock > m.minStockAlert).length,
        lowStock:     list.filter(m => m.stock > 0 && m.stock <= m.minStockAlert).length,
        outOfStock:   list.filter(m => m.stock === 0).length,
        expired:      list.filter(m => m.expiryDate && new Date(m.expiryDate) < today).length,
        expiringSoon: list.filter(m => m.expiryDate && new Date(m.expiryDate) >= today && new Date(m.expiryDate) <= in30Days).length,
        totalValue:   list.reduce((s, m) => s + m.stock * m.sellingPrice, 0),
      });
    } catch {
      setToast({ message: 'Failed to load medicines', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, search]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  // Client-side filter by status
  const filtered = medicines.filter(med => {
    if (filterStatus === 'low')     return med.stock > 0 && med.stock <= med.minStockAlert;
    if (filterStatus === 'out')     return med.stock === 0;
    if (filterStatus === 'expired') return med.expiryDate && new Date(med.expiryDate) < new Date();
    return true;
  });

  // Excel export
  const exportExcel = () => {
    if (!filtered.length) return;
    const rows = [
      ['Medicine Name', 'Generic Name', 'Category', 'Unit', 'Stock', 'Min Alert',
       'Sell Price (₹)', 'Stock Value (₹)', 'Expiry', 'Status', 'Branch'],
      ...filtered.map(m => {
        const branch = branches.find(b => b._id === (m.branch?._id || m.branch));
        return [
          m.name, m.genericName || '', m.category, m.unit,
          m.stock, m.minStockAlert,
          m.sellingPrice, (m.stock * m.sellingPrice).toFixed(2),
          m.expiryDate ? new Date(m.expiryDate).toLocaleDateString('en-IN') : '—',
          getStockStatus(m).label,
          branch?.name || '—'
        ];
      })
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Medicine Stock');
    XLSX.writeFile(wb, `Medicine_Stock_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
    setToast({ message: 'Exported to Excel!', type: 'success' });
  };

  const branchName = (med) => {
    const b = branches.find(b => b._id === (med.branch?._id || med.branch));
    return b?.name || '—';
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Medicine Stock</h1>
          <p className="text-sm text-secondary font-medium">Branch-wise inventory overview</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchMedicines}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
          >
            <RefreshCw size={16} />
          </button>
          <Button variant="primary" icon={Download} onClick={exportExcel}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: 'Total Items',    value: summary.total,        color: 'text-primary',   bg: 'bg-indigo-50',  icon: Pill },
            { label: 'In Stock',       value: summary.inStock,      color: 'text-success',   bg: 'bg-green-50',   icon: Package },
            { label: 'Low Stock',      value: summary.lowStock,     color: 'text-amber-600', bg: 'bg-amber-50',   icon: AlertTriangle },
            { label: 'Out of Stock',   value: summary.outOfStock,   color: 'text-danger',    bg: 'bg-red-50',     icon: TrendingDown },
            { label: 'Expired',        value: summary.expired,      color: 'text-gray-500',  bg: 'bg-gray-100',   icon: Calendar },
            { label: 'Expiring (30d)', value: summary.expiringSoon, color: 'text-orange-600',bg: 'bg-orange-50',  icon: Calendar },
            { label: 'Stock Value',    value: `₹${summary.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: Package },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex items-center gap-2.5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={16} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase leading-tight truncate">{s.label}</p>
                <p className={`text-base font-black ${s.color} leading-tight`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">

        {/* Branch selector */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-10">
          <Building2 size={15} className="text-gray-400 shrink-0" />
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="text-sm font-bold text-gray-700 outline-none bg-transparent pr-1"
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 h-10 flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicine..."
            className="text-sm font-medium outline-none bg-transparent flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'all',     label: 'All' },
            { key: 'low',     label: '⚠ Low Stock' },
            { key: 'out',     label: '✕ Out of Stock' },
            { key: 'expired', label: '⏰ Expired' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`text-[11px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all ${
                filterStatus === f.key
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-500 hover:border-primary bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="ml-auto text-xs text-secondary font-bold">{filtered.length} medicines</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Pill size={56} className="mx-auto mb-4" />
          <p className="font-bold">No medicines found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase">Medicine</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase">Branch</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Category</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Stock</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Price</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Value</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Expiry</th>
                  <th className="px-4 py-3.5 text-[10px] font-black text-gray-400 uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(med => {
                  const status = getStockStatus(med);
                  const catCls = CATEGORY_COLORS[med.category] || CATEGORY_COLORS.Other;
                  const isLow  = med.stock > 0 && med.stock <= med.minStockAlert;
                  const isOut  = med.stock === 0;
                  return (
                    <tr
                      key={med._id}
                      className={`hover:bg-gray-50/60 transition-colors ${isOut ? 'bg-red-50/30' : isLow ? 'bg-amber-50/20' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-sm text-gray-900">{med.name}</p>
                        {med.genericName && (
                          <p className="text-[10px] text-secondary">{med.genericName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Building2 size={12} className="text-gray-400 shrink-0" />
                          <span className="font-medium truncate max-w-[120px]">{branchName(med)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${catCls}`}>
                          {med.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <p className={`font-black text-sm ${isOut ? 'text-danger' : isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                          {med.stock}
                        </p>
                        <p className="text-[9px] text-gray-400">{med.unit}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-sm text-gray-700">
                        ₹{med.sellingPrice}
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-sm text-primary">
                        ₹{(med.stock * med.sellingPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3.5 text-center text-xs text-gray-500">
                        {med.expiryDate
                          ? new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(med => {
              const status = getStockStatus(med);
              const catCls = CATEGORY_COLORS[med.category] || CATEGORY_COLORS.Other;
              return (
                <Card key={med._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{med.name}</p>
                      {med.genericName && (
                        <p className="text-[10px] text-secondary">{med.genericName}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 size={11} className="text-gray-400" />
                        <p className="text-[10px] text-secondary">{branchName(med)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${status.cls}`}>
                        {status.label}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${catCls}`}>
                        {med.category}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Stock</p>
                      <p className={`font-black text-sm ${med.stock === 0 ? 'text-danger' : med.stock <= med.minStockAlert ? 'text-amber-600' : 'text-gray-800'}`}>
                        {med.stock} <span className="text-[9px] font-normal">{med.unit}</span>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Price</p>
                      <p className="font-black text-sm text-gray-800">₹{med.sellingPrice}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Value</p>
                      <p className="font-black text-sm text-primary">
                        ₹{(med.stock * med.sellingPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                  {med.expiryDate && (
                    <p className="text-[10px] text-gray-400 mt-2">
                      Expiry: {new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMedicineStock;
