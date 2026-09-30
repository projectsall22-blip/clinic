import React, { useState, useEffect } from 'react';
import { TrendingUp, Download, DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const RANGES = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
  { key: 'yearly', label: 'This Year' },
];

const PharmaReports = () => {
  const [range, setRange] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchReport(); }, [range]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/clinic-reports/pharma?range=${range}`);
      setData(res.data);
    } catch {
      setToast({ message: 'Failed to load report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!data) return;

    const summary = [
      ['New Life Clinic — Pharmacy Sales Report'],
      ['Range', range.toUpperCase()],
      ['From', new Date(data.from).toLocaleDateString('en-IN')],
      ['To', new Date(data.to).toLocaleDateString('en-IN')],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', `₹${data.totalRevenue}`],
      ['Total Discount Given', `₹${data.totalDiscount}`],
      ['Total Bills', data.salesCount],
    ];

    const topMeds = [
      ['Medicine Name', 'Qty Sold', 'Revenue'],
      ...(data.topMedicines || []).map(m => [m._id, m.totalQty, `₹${m.totalRevenue}`])
    ];

    const trend = [
      ['Date', 'Revenue', 'Bills Count'],
      ...(data.dailySalesTrend || []).map(d => [d._id, `₹${d.revenue}`, d.count])
    ];

    const stockAlerts = [
      ['Medicine', 'Current Stock', 'Min Required', 'Unit'],
      ...(data.stockAlerts || []).map(m => [m.name, m.stock, m.minStockAlert, m.unit])
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topMeds), 'Top Medicines');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trend), 'Daily Trend');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stockAlerts), 'Stock Alerts');
    XLSX.writeFile(wb, `Pharma_Report_${range}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
    setToast({ message: 'Exported to Excel!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Sales Reports</h1>
          <p className="text-sm text-secondary">Pharmacy analytics & export</p>
        </div>
        <Button variant="primary" icon={Download} onClick={exportToExcel}>Export Excel</Button>
      </div>

      {/* Range */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-md">
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setRange(r.key)}
            className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${range === r.key ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}>
            {r.label}
          </button>
        ))}
      </div>

      {loading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Revenue', value: `₹${(data.totalRevenue || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-success', bg: 'bg-green-50' },
              { label: 'Total Bills', value: data.salesCount, icon: ShoppingCart, color: 'text-primary', bg: 'bg-indigo-50' },
              { label: 'Discount Given', value: `₹${(data.totalDiscount || 0).toLocaleString('en-IN')}`, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <s.icon size={22} className={s.color} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase">{s.label}</p>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Top Medicines */}
          {data.topMedicines?.length > 0 && (
            <Card>
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Top Selling Medicines
              </h3>
              <div className="space-y-2">
                {data.topMedicines.map((med, i) => (
                  <div key={med._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-7 h-7 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0">{i + 1}</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">{med._id}</p>
                      <p className="text-[10px] text-secondary">{med.totalQty} units sold</p>
                    </div>
                    <p className="font-black text-primary">₹{med.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Daily Trend */}
          {data.dailySalesTrend?.length > 0 && (
            <Card>
              <h3 className="font-black text-gray-900 mb-4">Daily Sales Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-left">Date</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-center">Bills</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.dailySalesTrend.map(row => (
                      <tr key={row._id}>
                        <td className="py-3 text-sm font-bold text-gray-800">{new Date(row._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td className="py-3 text-center font-bold text-gray-600">{row.count}</td>
                        <td className="py-3 text-right font-black text-success">₹{row.revenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Stock Alerts */}
          {data.stockAlerts?.length > 0 && (
            <Card>
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts ({data.stockAlerts.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.stockAlerts.map(med => (
                  <div key={med._id} className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="font-bold text-sm text-gray-900 truncate">{med.name}</p>
                    <p className="text-xs text-amber-700 font-bold">{med.stock} left · Min: {med.minStockAlert}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
};

export default PharmaReports;
