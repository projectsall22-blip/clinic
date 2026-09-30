import React, { useState, useEffect } from 'react';
import { BarChart2, Download, Calendar, TrendingUp, CheckCircle, XCircle, Users } from 'lucide-react';
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

const StatBox = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
);

const ReceptionistReports = () => {
  const [range, setRange] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchReport(); }, [range]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/clinic-reports/receptionist?range=${range}`);
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
      ['New Life Clinic — Appointment Report'],
      ['Range', range.toUpperCase()],
      ['From', new Date(data.from).toLocaleDateString('en-IN')],
      ['To', new Date(data.to).toLocaleDateString('en-IN')],
      [],
      ['Metric', 'Value'],
      ['Total Appointments', data.total],
      ['Completed', data.completed],
      ['Cancelled', data.cancelled],
      ['Pending', data.pending],
      ['New Patients', data.newPatients],
    ];

    const trend = [
      ['Date', 'Total Appointments', 'Completed'],
      ...(data.dailyTrend || []).map(d => [d._id, d.count, d.completed])
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trend), 'Daily Trend');
    XLSX.writeFile(wb, `Appointment_Report_${range}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.xlsx`);
    setToast({ message: 'Report exported to Excel!', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Appointment Reports</h1>
          <p className="text-sm text-secondary">Analytics & export for your branch</p>
        </div>
        <Button variant="primary" icon={Download} onClick={exportToExcel}>Export Excel</Button>
      </div>

      {/* Range selector */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-md">
        {RANGES.map(r => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${range === r.key ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Appointments" value={data.total} icon={Calendar} color="text-primary" bg="bg-indigo-50" />
            <StatBox label="Completed" value={data.completed} icon={CheckCircle} color="text-success" bg="bg-green-50" />
            <StatBox label="Cancelled" value={data.cancelled} icon={XCircle} color="text-danger" bg="bg-red-50" />
            <StatBox label="New Patients" value={data.newPatients} icon={Users} color="text-purple-600" bg="bg-purple-50" />
          </div>

          {/* Date Info */}
          <Card>
            <p className="text-xs font-black text-gray-400 uppercase mb-1">Reporting Period</p>
            <p className="font-bold text-gray-800">
              {new Date(data.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' '} — {' '}
              {new Date(data.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </Card>

          {/* Daily Trend Table */}
          {data.dailyTrend?.length > 0 && (
            <Card>
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" /> Daily Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase">Date</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-center">Total</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-center">Completed</th>
                      <th className="pb-3 text-[10px] font-black text-gray-400 uppercase text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.dailyTrend.map(row => (
                      <tr key={row._id}>
                        <td className="py-3 text-sm font-bold text-gray-800">{new Date(row._id).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                        <td className="py-3 text-center font-bold text-gray-700">{row.count}</td>
                        <td className="py-3 text-center font-bold text-success">{row.completed}</td>
                        <td className="py-3 text-center">
                          <span className={`text-xs font-black px-2 py-1 rounded-lg ${row.count > 0 && row.completed / row.count > 0.7 ? 'bg-green-50 text-success' : 'bg-amber-50 text-amber-700'}`}>
                            {row.count > 0 ? `${Math.round((row.completed / row.count) * 100)}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ReceptionistReports;
