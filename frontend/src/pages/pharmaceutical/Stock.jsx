import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Calendar, TrendingDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import { generateReceipt } from '../../utils/receiptGenerator';

const StockPage = () => {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchSales(); }, [selectedDate]);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await API.get('/sales/dashboard-summary');
      setSummary(res.data);
    } catch { setToast({ message: 'Failed to load summary', type: 'error' }); }
    finally { setSummaryLoading(false); }
  };

  const fetchSales = async () => {
    setSalesLoading(true);
    try {
      const res = await API.get(`/sales?from=${selectedDate}&to=${selectedDate}`);
      setSales(res.data.sales || []);
    } catch { setToast({ message: 'Failed to load sales', type: 'error' }); }
    finally { setSalesLoading(false); }
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleReprint = async (saleId) => {
    try {
      const res = await API.get(`/sales/${saleId}`);
      await generateReceipt(res.data);
    } catch { setToast({ message: 'Could not fetch receipt', type: 'error' }); }
  };

  const dayRevenue = sales.reduce((s, sale) => s + sale.grandTotal, 0);

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Stock & Sales</h1>
          <p className="text-sm text-secondary">Daily sales record and stock overview</p>
        </div>
        <button onClick={() => { fetchSummary(); fetchSales(); }} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><RefreshCw size={18} /></button>
      </div>

      {/* Today Summary */}
      {!summaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Revenue", value: `₹${(summary.todayRevenue || 0).toLocaleString('en-IN')}`, color: 'text-success', bg: 'bg-green-50', icon: TrendingDown },
            { label: "Today's Bills", value: summary.todaySalesCount, color: 'text-primary', bg: 'bg-indigo-50', icon: Package },
            { label: 'Low Stock', value: summary.lowStockCount, color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle },
            { label: 'Total Medicines', value: summary.totalMedicines, color: 'text-purple-600', bg: 'bg-purple-50', icon: Package },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <s.icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase">{s.label}</p>
                <p className="text-lg font-black text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-xs">
        {[{ key: 'sales', label: 'Daily Sales' }, { key: 'stock', label: 'Stock View' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all ${activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' ? (
        <>
          {/* Date navigator */}
          <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3 max-w-sm">
            <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-gray-50 rounded-xl"><ChevronLeft size={16} /></button>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="font-bold text-gray-800 border-2 border-gray-100 rounded-xl px-3 h-9 outline-none focus:border-primary text-sm flex-1" />
            <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-gray-50 rounded-xl"><ChevronRight size={16} /></button>
            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="text-[10px] font-black text-primary border border-primary/30 rounded-xl px-2 py-1 hover:bg-indigo-50">Today</button>
          </div>

          {/* Revenue for day */}
          {!salesLoading && sales.length > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase opacity-70">Day Total</p>
                <p className="text-2xl font-black">₹{dayRevenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase opacity-70">Bills</p>
                <p className="text-2xl font-black">{sales.length}</p>
              </div>
            </div>
          )}

          {salesLoading ? <div className="py-16"><LoadingSpinner size="lg" /></div> : sales.length === 0 ? (
            <div className="py-16 text-center opacity-40">
              <Package size={48} className="mx-auto mb-3" />
              <p className="font-bold">No sales on this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map(sale => (
                <Card key={sale._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{sale.receiptNumber}</p>
                      <p className="text-xs text-secondary">{sale.patientName} · {sale.paymentMode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-primary">₹{sale.grandTotal.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-400">{new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{sale.items?.length || 0} item(s)</p>
                    <button onClick={() => handleReprint(sale._id)} className="text-xs font-black text-primary bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100">
                      🖨 Reprint
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Stock View Tab */
        <StockView setToast={setToast} />
      )}
    </div>
  );
};

const StockView = ({ setToast }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/medicines').then(res => setMedicines(res.data || [])).catch(() => setToast({ message: 'Failed to load stock', type: 'error' })).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase">Medicine</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Stock</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Price</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Expiry</th>
            <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {medicines.map(med => {
            const isLow = med.stock <= med.minStockAlert;
            const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
            const isOut = med.stock === 0;
            return (
              <tr key={med._id} className={isLow || isExpired || isOut ? 'bg-amber-50/30' : ''}>
                <td className="px-4 py-3">
                  <p className="font-bold text-sm text-gray-900">{med.name}</p>
                  <p className="text-[9px] text-secondary">{med.category}</p>
                </td>
                <td className="px-4 py-3 text-center font-black text-sm">{med.stock} <span className="text-[9px] text-gray-400 font-normal">{med.unit}</span></td>
                <td className="px-4 py-3 text-center font-bold text-sm">₹{med.sellingPrice}</td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${isOut ? 'bg-red-100 text-danger' : isExpired ? 'bg-gray-200 text-gray-600' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-success'}`}>
                    {isOut ? 'Out' : isExpired ? 'Expired' : isLow ? 'Low' : 'OK'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockPage;
