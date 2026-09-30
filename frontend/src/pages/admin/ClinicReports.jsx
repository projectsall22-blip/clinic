import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, Download, Building2, Calendar, Users,
  DollarSign, Pill, AlertTriangle, RefreshCw, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

// ── Date helpers ─────────────────────────────────────────────────────────────
const fmt = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD for input[type=date]

const QUICK_RANGES = [
  {
    label: 'Today',
    get: () => { const d = new Date(); return { from: fmt(d), to: fmt(d) }; }
  },
  {
    label: 'Yesterday',
    get: () => {
      const d = new Date(); d.setDate(d.getDate() - 1);
      return { from: fmt(d), to: fmt(d) };
    }
  },
  {
    label: 'Last 7 Days',
    get: () => {
      const to = new Date();
      const from = new Date(); from.setDate(from.getDate() - 6);
      return { from: fmt(from), to: fmt(to) };
    }
  },
  {
    label: 'This Month',
    get: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: fmt(from), to: fmt(now) };
    }
  },
  {
    label: 'Last Month',
    get: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(from), to: fmt(to) };
    }
  },
  {
    label: 'This Year',
    get: () => {
      const now  = new Date();
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: fmt(from), to: fmt(now) };
    }
  },
  { label: 'Custom', get: null },
];

// ── Small stat box ────────────────────────────────────────────────────────────
const StatBox = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
      <Icon size={20} className={color} />
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider leading-none">{label}</p>
      <p className={`text-lg font-black ${color} mt-0.5`}>{value ?? '—'}</p>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const ClinicReports = () => {
  // Date range state
  const today   = fmt(new Date());
  const [from, setFrom]           = useState(today);
  const [to,   setTo]             = useState(today);
  const [activeQuick, setActiveQuick] = useState('Today');

  // Filter state
  const [branchId, setBranchId]   = useState('');
  const [branches, setBranches]   = useState([]);

  // Data state
  const [data,        setData]        = useState(null);
  const [stockData,   setStockData]   = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [stockLoading,setStockLoading]= useState(false);
  const [toast,       setToast]       = useState(null);
  const [activeTab,   setActiveTab]   = useState('reports');

  // Fetch branches once
  useEffect(() => {
    API.get('/branches').then(r => setBranches(r.data || [])).catch(() => {});
  }, []);

  // Fetch report whenever from/to/branch changes
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ range: 'custom', customFrom: from, customTo: to });
      if (branchId) params.append('branch', branchId);
      const res = await API.get(`/clinic-reports/admin?${params}`);
      setData(res.data);
    } catch {
      setToast({ message: 'Failed to load report', type: 'error' });
    } finally { setLoading(false); }
  }, [from, to, branchId]);

  const fetchStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const params = branchId ? `?branch=${branchId}` : '';
      const res = await API.get(`/clinic-reports/stock${params}`);
      setStockData(res.data);
    } catch {
      setToast({ message: 'Failed to load stock data', type: 'error' });
    } finally { setStockLoading(false); }
  }, [branchId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);
  useEffect(() => { if (activeTab === 'stock') fetchStock(); }, [activeTab, fetchStock]);

  // Apply quick range
  const applyQuick = (q) => {
    setActiveQuick(q.label);
    if (q.get) {
      const { from: f, to: t } = q.get();
      setFrom(f);
      setTo(t);
    }
  };

  // Branch map helper
  const branchMap = {};
  branches.forEach(b => { branchMap[b._id] = b.name; });

  // Display date range label
  const fromDisplay = new Date(from).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const toDisplay   = new Date(to).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Excel Export ───────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!data) return;

    const summarySheet = [
      ['New Life Clinic — Admin Report'],
      ['From', fromDisplay],
      ['To',   toDisplay],
      ['Branch', branchId ? branchMap[branchId] : 'All Branches'],
      [],
      ['Metric', 'Value'],
      ['New Patients', data.newPatients],
    ];

    const apptSheet = [
      ['Branch', 'Total Appointments', 'Completed', 'Cancelled', 'Pending'],
      ...(data.apptSummary || []).map(r => [
        branchMap[r._id] || r._id,
        r.total, r.completed, r.cancelled,
        r.total - r.completed - r.cancelled
      ])
    ];

    const salesSheet = [
      ['Branch', 'Total Revenue (₹)', 'Total Bills'],
      ...(data.salesSummary || []).map(r => [
        branchMap[r._id] || r._id,
        r.revenue, r.count
      ])
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(apptSheet),   'Appointments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesSheet),  'Sales Revenue');
    XLSX.writeFile(wb, `Report_${from}_to_${to}.xlsx`);
    setToast({ message: 'Report exported to Excel!', type: 'success' });
  };

  // ── Totals across all branches ─────────────────────────────────────────────
  const totalAppts    = data?.apptSummary?.reduce((s, r) => s + r.total,     0) ?? 0;
  const totalComplete = data?.apptSummary?.reduce((s, r) => s + r.completed, 0) ?? 0;
  const totalCancel   = data?.apptSummary?.reduce((s, r) => s + r.cancelled, 0) ?? 0;
  const totalRevenue  = data?.salesSummary?.reduce((s, r) => s + r.revenue,  0) ?? 0;
  const totalBills    = data?.salesSummary?.reduce((s, r) => s + r.count,    0) ?? 0;

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Clinic Reports</h1>
          <p className="text-sm text-secondary font-medium">
            {fromDisplay === toDisplay ? fromDisplay : `${fromDisplay} — ${toDisplay}`}
            {branchId ? ` · ${branchMap[branchId]}` : ' · All Branches'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { fetchReport(); if (activeTab === 'stock') fetchStock(); }}
            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
          >
            <RefreshCw size={16} />
          </button>
          <Button variant="primary" icon={Download} onClick={exportToExcel}>
            Export Excel
          </Button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-xs">
        {[{ key: 'reports', label: '📊 Reports' }, { key: 'stock', label: '💊 Stock' }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${
              activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Quick range pills */}
        {activeTab === 'reports' && (
          <div className="flex flex-wrap gap-2">
            {QUICK_RANGES.map(q => (
              <button
                key={q.label}
                onClick={() => applyQuick(q)}
                className={`text-xs font-black uppercase px-3 py-2 rounded-xl border transition-all ${
                  activeQuick === q.label
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 text-gray-500 hover:border-primary bg-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Custom date inputs — always visible so admin can always pick exact dates */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-gray-400 shrink-0" />
            <span className="text-xs font-black text-gray-400 uppercase">From</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => { setFrom(e.target.value); setActiveQuick('Custom'); }}
              className="h-9 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase">To</span>
            <input
              type="date"
              value={to}
              min={from}
              max={fmt(new Date())}
              onChange={e => { setTo(e.target.value); setActiveQuick('Custom'); }}
              className="h-9 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Branch selector */}
          <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl px-3 h-9">
            <Building2 size={14} className="text-gray-400 shrink-0" />
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="text-sm font-bold text-gray-700 outline-none bg-transparent"
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── REPORTS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        loading ? (
          <div className="py-20"><LoadingSpinner size="lg" /></div>
        ) : data ? (
          <div className="space-y-6">

            {/* Summary stat boxes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatBox label="Total Appts"    value={totalAppts}    icon={Calendar}  color="text-primary"    bg="bg-indigo-50" />
              <StatBox label="Completed"      value={totalComplete} icon={Calendar}  color="text-success"    bg="bg-green-50" />
              <StatBox label="Cancelled"      value={totalCancel}   icon={Calendar}  color="text-danger"     bg="bg-red-50" />
              <StatBox label="New Patients"   value={data.newPatients} icon={Users}  color="text-purple-600" bg="bg-purple-50" />
              <StatBox label="Total Revenue"  value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={DollarSign} color="text-success" bg="bg-green-50" />
              <StatBox label="Total Bills"    value={totalBills}    icon={BarChart2} color="text-amber-600"  bg="bg-amber-50" />
            </div>

            {/* Appointments by Branch */}
            {data.apptSummary?.length > 0 ? (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" /> Appointments by Branch
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Branch', 'Total', 'Completed', 'Cancelled', 'Pending', 'Completion %'].map(h => (
                          <th key={h} className="pb-3 text-[10px] font-black text-gray-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.apptSummary.map(row => {
                        const pending  = row.total - row.completed - row.cancelled;
                        const pct      = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
                        return (
                          <tr key={row._id} className="hover:bg-gray-50/50">
                            <td className="py-3 font-bold text-sm text-gray-800">{branchMap[row._id] || 'Unknown'}</td>
                            <td className="py-3 font-bold text-gray-700">{row.total}</td>
                            <td className="py-3 font-bold text-success">{row.completed}</td>
                            <td className="py-3 font-bold text-danger">{row.cancelled}</td>
                            <td className="py-3 font-bold text-amber-600">{pending}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                                  <div
                                    className={`h-full rounded-full ${pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-amber-400' : 'bg-danger'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs font-black text-gray-600">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Total row */}
                    <tfoot className="border-t-2 border-gray-200">
                      <tr className="bg-indigo-50/50">
                        <td className="py-3 px-0 font-black text-sm text-primary">TOTAL</td>
                        <td className="py-3 font-black text-primary">{totalAppts}</td>
                        <td className="py-3 font-black text-success">{totalComplete}</td>
                        <td className="py-3 font-black text-danger">{totalCancel}</td>
                        <td className="py-3 font-black text-amber-600">{totalAppts - totalComplete - totalCancel}</td>
                        <td className="py-3 font-black text-primary">
                          {totalAppts > 0 ? `${Math.round((totalComplete / totalAppts) * 100)}%` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            ) : (
              <div className="py-10 text-center opacity-40">
                <Calendar size={40} className="mx-auto mb-3" />
                <p className="font-bold text-sm">No appointments in this date range</p>
              </div>
            )}

            {/* Sales Revenue by Branch */}
            {data.salesSummary?.length > 0 && (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-success" /> Sales Revenue by Branch
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {['Branch', 'Revenue', 'Bills', 'Avg per Bill'].map(h => (
                          <th key={h} className="pb-3 text-[10px] font-black text-gray-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.salesSummary.map(row => (
                        <tr key={row._id} className="hover:bg-gray-50/50">
                          <td className="py-3 font-bold text-sm text-gray-800">{branchMap[row._id] || 'Unknown'}</td>
                          <td className="py-3 font-black text-success">₹{(row.revenue || 0).toLocaleString('en-IN')}</td>
                          <td className="py-3 font-bold text-gray-700">{row.count}</td>
                          <td className="py-3 font-bold text-secondary">
                            {row.count > 0 ? `₹${Math.round(row.revenue / row.count).toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-gray-200">
                      <tr className="bg-green-50/50">
                        <td className="py-3 font-black text-sm text-success">TOTAL</td>
                        <td className="py-3 font-black text-success">₹{totalRevenue.toLocaleString('en-IN')}</td>
                        <td className="py-3 font-black text-gray-700">{totalBills}</td>
                        <td className="py-3 font-black text-secondary">
                          {totalBills > 0 ? `₹${Math.round(totalRevenue / totalBills).toLocaleString('en-IN')}` : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            )}
          </div>
        ) : null
      )}

      {/* ── STOCK TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        stockLoading ? (
          <div className="py-20"><LoadingSpinner size="lg" /></div>
        ) : stockData ? (
          <div className="space-y-6">

            {/* By Branch */}
            {stockData.byBranch?.length > 0 && (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Pill size={16} className="text-primary" /> Stock Summary by Branch
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stockData.byBranch.map(b => (
                    <div key={b._id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="font-black text-sm text-gray-900 mb-2">{branchMap[b._id] || 'Branch'}</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Total Medicines</span>
                          <span className="font-bold text-gray-800">{b.totalItems}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Stock Value</span>
                          <span className="font-bold text-success">₹{(b.totalStockValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Low Stock Items</span>
                          <span className={`font-bold ${b.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{b.lowStockCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Low Stock */}
            {stockData.lowStock?.length > 0 && (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" /> Low Stock ({stockData.lowStock.length})
                </h3>
                <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {stockData.lowStock.map(med => (
                    <div key={med._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{med.name}</p>
                        <p className="text-[10px] text-gray-500">{med.branch?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-700">{med.stock} {med.unit}</p>
                        <p className="text-[9px] text-gray-400">Min: {med.minStockAlert}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Expiring Soon */}
            {stockData.expiringSoon?.length > 0 && (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500" /> Expiring in 30 Days ({stockData.expiringSoon.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {stockData.expiringSoon.map(med => (
                    <div key={med._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100">
                      <div>
                        <p className="font-bold text-sm text-gray-900">{med.name}</p>
                        <p className="text-[10px] text-gray-500">{med.branch?.name}</p>
                      </div>
                      <p className="text-xs font-black text-orange-700">
                        {new Date(med.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Out of Stock */}
            {stockData.outOfStock?.length > 0 && (
              <Card>
                <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-danger" /> Out of Stock ({stockData.outOfStock.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {stockData.outOfStock.map(med => (
                    <div key={med._id} className="p-3 bg-red-50 rounded-2xl border border-red-100">
                      <p className="font-bold text-sm text-gray-900 truncate">{med.name}</p>
                      <p className="text-[10px] text-danger font-bold">OUT OF STOCK</p>
                      <p className="text-[10px] text-gray-400">{med.branch?.name}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : null
      )}
    </div>
  );
};

export default ClinicReports;
