import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-4`}>
    <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
      <Icon size={26} className={color} />
    </div>
    <div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-gray-900 mt-0.5">{value ?? '—'}</p>
    </div>
  </div>
);

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [summaryRes, apptRes] = await Promise.all([
        API.get('/appointments/dashboard-summary'),
        API.get(`/appointments?date=${today}&limit=10`)
      ]);
      setSummary(summaryRes.data);
      setTodayAppts(apptRes.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  const statusColor = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-green-50 text-success border-green-200',
    Cancelled: 'bg-red-50 text-danger border-red-200'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-secondary font-medium mt-1">
            {user?.branch?.name} &nbsp;·&nbsp; {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => navigate('/receptionist/appointments')}>
          Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Tokens" value={summary?.total} icon={Calendar} color="text-primary" bg="bg-indigo-50" />
        <StatCard title="Pending" value={summary?.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Completed" value={summary?.completed} icon={CheckCircle} color="text-success" bg="bg-green-50" />
        <StatCard title="Total Patients" value={summary?.totalPatients} icon={Users} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Today's Appointments */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-gray-900">Today's Queue</h2>
          <button
            onClick={() => navigate('/receptionist/appointments')}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {todayAppts.length === 0 ? (
          <div className="py-10 text-center opacity-40">
            <Calendar size={48} className="mx-auto mb-3" />
            <p className="font-bold text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayAppts.map(appt => (
              <div
                key={appt._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-indigo-50/40 transition-colors cursor-pointer"
                onClick={() => navigate('/receptionist/appointments')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">
                    {appt.tokenNumber}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{appt.patient?.name}</p>
                    <p className="text-[10px] text-secondary font-medium">
                      {appt.patient?.age} yrs &nbsp;·&nbsp; {appt.patient?.gender}
                      {appt.chiefComplaint ? ` · ${appt.chiefComplaint}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${statusColor[appt.status]}`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Book Appointment', desc: 'Register new patient & book token', path: '/receptionist/appointments', color: 'bg-primary', icon: Calendar },
          { label: 'Patient List', desc: 'Search & view all patients', path: '/receptionist/patients', color: 'bg-success', icon: Users },
          { label: 'Reports', desc: 'Daily, weekly, monthly analytics', path: '/receptionist/reports', color: 'bg-purple-600', icon: CheckCircle },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="group bg-white border border-gray-100 rounded-3xl p-6 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${action.color} rounded-2xl flex items-center justify-center text-white mb-4`}>
              <action.icon size={22} />
            </div>
            <h3 className="font-black text-gray-900 text-sm">{action.label}</h3>
            <p className="text-xs text-secondary mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
