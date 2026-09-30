import React, { useState, useEffect } from 'react';
import { Building2, Calendar, Users, DollarSign, Package, RefreshCw, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ClinicDashboard = () => {
  const navigate = useNavigate();
  const [branchStats, setBranchStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/branches/stats');
      setBranchStats(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate totals
  const totals = branchStats.reduce((acc, b) => ({
    appointments: acc.appointments + (b.todayAppointments || 0),
    patients: acc.patients + (b.totalPatients || 0),
    revenue: acc.revenue + (b.todayRevenue || 0),
    sales: acc.sales + (b.todaySalesCount || 0),
  }), { appointments: 0, patients: 0, revenue: 0, sales: 0 });

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Clinic Overview</h1>
          <p className="text-sm text-secondary">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><RefreshCw size={18} /></button>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Appointments", value: totals.appointments, icon: Calendar, color: 'text-primary', bg: 'bg-indigo-50' },
          { label: 'Total Patients', value: totals.patients, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: "Today's Revenue", value: `₹${totals.revenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-success', bg: 'bg-green-50' },
          { label: "Today's Sales", value: totals.sales, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-3">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon size={22} className={s.color} />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase">{s.label}</p>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Branch Cards */}
      <div>
        <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
          <Building2 size={18} className="text-primary" /> Branch-wise Summary
        </h2>
        {branchStats.length === 0 ? (
          <div className="py-16 text-center opacity-40">
            <Building2 size={48} className="mx-auto mb-3" />
            <p className="font-bold">No branches found. Add branches first.</p>
            <button onClick={() => navigate('/admin/branches')} className="mt-3 text-sm font-black text-primary hover:underline">→ Add Branch</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {branchStats.map(({ branch, todayAppointments, totalPatients, stockItems, todayRevenue, todaySalesCount }) => (
              <Card key={branch._id} className="hover:border-primary transition-all group">
                {/* Branch Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-primary rounded-xl flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-sm leading-tight">{branch.name}</h3>
                      <p className="text-[10px] text-secondary">{branch.doctorName}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-green-50 text-success px-2 py-1 rounded-lg border border-green-200">Active</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { label: 'Appts Today', value: todayAppointments, color: 'text-primary' },
                    { label: 'Total Patients', value: totalPatients, color: 'text-purple-600' },
                    { label: "Today's Revenue", value: `₹${(todayRevenue || 0).toLocaleString('en-IN')}`, color: 'text-success' },
                    { label: 'Stock Items', value: stockItems, color: 'text-amber-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[9px] font-black text-gray-400 uppercase">{s.label}</p>
                      <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/admin/clinic-reports')}
                  className="w-full py-2 text-xs font-black text-primary bg-indigo-50 rounded-xl hover:bg-indigo-100 flex items-center justify-center gap-1"
                >
                  View Reports <ArrowRight size={12} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Admin Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Branches', path: '/admin/branches', color: 'bg-indigo-50 text-primary' },
          { label: 'Clinic Staff', path: '/admin/clinic-staff', color: 'bg-green-50 text-success' },
          { label: 'Reports', path: '/admin/clinic-reports', color: 'bg-purple-50 text-purple-600' },
          { label: 'Stock View', path: '/admin/clinic-stock', color: 'bg-amber-50 text-amber-600' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className={`${a.color} rounded-2xl p-4 font-black text-sm hover:opacity-80 transition-all`}>
            {a.label} →
          </button>
        ))}
      </div>
    </div>
  );
};

export default ClinicDashboard;
