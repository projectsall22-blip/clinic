import React, { useState, useEffect } from 'react';
import { Pill, TrendingUp, AlertTriangle, ShoppingCart, DollarSign, Package, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, bg, suffix = '' }) => (
  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
      <Icon size={26} className={color} />
    </div>
    <div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 mt-0.5">{value ?? '—'}{suffix}</p>
    </div>
  </div>
);

const PharmaDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [lowStockMeds, setLowStockMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, lowStockRes] = await Promise.all([
        API.get('/sales/dashboard-summary'),
        API.get('/medicines?lowStock=true&limit=5')
      ]);
      setSummary(summaryRes.data);
      setLowStockMeds(lowStockRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Pharmacy Dashboard 💊
          </h1>
          <p className="text-sm text-secondary font-medium mt-1">{user?.branch?.name}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/pharmaceutical/sell')}>
          New Sale
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Revenue" value={`₹${(summary?.todayRevenue || 0).toLocaleString('en-IN')}`} icon={DollarSign} color="text-success" bg="bg-green-50" />
        <StatCard title="Today's Sales" value={summary?.todaySalesCount} icon={ShoppingCart} color="text-primary" bg="bg-indigo-50" />
        <StatCard title="Total Medicines" value={summary?.totalMedicines} icon={Pill} color="text-purple-600" bg="bg-purple-50" />
        <StatCard title="Low Stock Alerts" value={summary?.lowStockCount} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Low Stock Alerts */}
      {lowStockMeds.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
            </h2>
            <button onClick={() => navigate('/pharmaceutical/medicines')} className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              Manage Stock <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {lowStockMeds.map(med => (
              <div key={med._id} className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Pill size={16} className="text-amber-700" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{med.name}</p>
                    <p className="text-[10px] text-gray-500">{med.category} · {med.unit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-700">{med.stock} left</p>
                  <p className="text-[9px] text-gray-400">Min: {med.minStockAlert}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'New Sale', desc: 'Create a medicine bill & receipt', path: '/pharmaceutical/sell', color: 'bg-primary', icon: ShoppingCart },
          { label: 'Medicine Stock', desc: 'Add, edit & manage medicines', path: '/pharmaceutical/medicines', color: 'bg-success', icon: Package },
          { label: 'Sales Reports', desc: 'Daily, weekly, monthly analytics', path: '/pharmaceutical/reports', color: 'bg-purple-600', icon: TrendingUp },
        ].map(action => (
          <button key={action.label} onClick={() => navigate(action.path)}
            className="group bg-white border border-gray-100 rounded-3xl p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center text-white mb-4`}>
              <action.icon size={22} />
            </div>
            <h3 className="font-black text-gray-900 text-sm">{action.label}</h3>
            <p className="text-xs text-secondary mt-1">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Stock value */}
      {summary?.totalStockValue > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white">
          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Total Stock Value</p>
          <p className="text-4xl font-black">₹{(summary.totalStockValue).toLocaleString('en-IN')}</p>
          <p className="text-sm opacity-70 mt-1">Based on current selling prices</p>
        </div>
      )}
    </div>
  );
};

export default PharmaDashboard;
