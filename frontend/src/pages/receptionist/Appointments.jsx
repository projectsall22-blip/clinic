import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Printer, CheckCircle, XCircle, Clock, Search, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import { generateAppointmentSlip } from '../../utils/appointmentSlip';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-green-50 text-success border-green-200',
  Cancelled: 'bg-red-50 text-danger border-red-200'
};

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(true);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate, limit: 100 });
      if (statusFilter) params.append('status', statusFilter);
      const res = await API.get(`/appointments?${params}`);
      setAppointments(res.data.appointments || []);
    } catch {
      setToast({ message: 'Failed to load appointments', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const searchPatients = async (q) => {
    if (!q || q.length < 2) { setPatientResults([]); return; }
    try {
      const res = await API.get(`/patients?search=${q}&limit=10`);
      setPatientResults(res.data.patients || []);
    } catch { /* silent */ }
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setPatientSearch(p.name);
    setPatientResults([]);
    setIsNewPatient(false);
  };

  const onBook = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        appointmentDate: selectedDate,
        chiefComplaint: data.chiefComplaint,
        doctorName: data.doctorName || user?.branch?.doctorName,
        doctorDegree: data.doctorDegree || user?.branch?.doctorDegree,
      };

      if (!isNewPatient && selectedPatient) {
        payload.patientId = selectedPatient._id;
      } else {
        payload.patientData = {
          name: data.name,
          age: Number(data.age),
          gender: data.gender,
          phone: data.phone,
          address: data.address
        };
      }

      await API.post('/appointments', payload);
      setToast({ message: 'Appointment booked successfully!', type: 'success' });
      setIsBookModalOpen(false);
      reset();
      setSelectedPatient(null);
      setPatientSearch('');
      setIsNewPatient(true);
      fetchAppointments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Booking failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status } : a));
      setToast({ message: `Marked as ${status}`, type: 'success' });
    } catch {
      setToast({ message: 'Update failed', type: 'error' });
    }
  };

  const handlePrint = async (apptId) => {
    try {
      const [slipRes, branchRes] = await Promise.all([
        API.get(`/appointments/${apptId}/slip`),
        API.get('/branches')
      ]);
      await generateAppointmentSlip(slipRes.data, branchRes.data || []);
    } catch {
      setToast({ message: 'Could not generate slip', type: 'error' });
    }
  };

  const changeDate = (offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const counts = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    cancelled: appointments.filter(a => a.status === 'Cancelled').length,
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Appointments</h1>
          <p className="text-sm text-secondary font-medium">{user?.branch?.name}</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsBookModalOpen(true)}>
          Book Appointment
        </Button>
      </div>

      {/* Date navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
        <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-50 rounded-xl"><ChevronLeft size={18} /></button>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="font-bold text-gray-800 border-2 border-gray-100 rounded-xl px-3 h-10 outline-none focus:border-primary"
        />
        <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-50 rounded-xl"><ChevronRight size={18} /></button>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="text-xs font-black text-primary border border-primary/30 rounded-xl px-3 py-1.5 hover:bg-indigo-50"
        >
          Today
        </button>
        <div className="ml-auto flex gap-2 flex-wrap">
          {['', 'Pending', 'Completed', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary'}`}
            >
              {s || 'All'} {s === '' ? `(${counts.total})` : s === 'Pending' ? `(${counts.pending})` : s === 'Completed' ? `(${counts.completed})` : `(${counts.cancelled})`}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Calendar size={64} className="mx-auto mb-4" />
          <p className="font-bold">No appointments for this date</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Token</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Patient</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Complaint</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(appt => (
                  <tr key={appt._id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">
                        {appt.tokenNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-sm text-gray-900">{appt.patient?.name}</p>
                      <p className="text-[10px] text-secondary">{appt.patient?.age} yrs · {appt.patient?.gender} · {appt.patient?.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-[200px] truncate">{appt.chiefComplaint || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${STATUS_STYLES[appt.status]}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button title="Print Slip" onClick={() => handlePrint(appt._id)} className="p-2 hover:bg-indigo-50 text-primary rounded-xl"><Printer size={16} /></button>
                        {appt.status === 'Pending' && (
                          <>
                            <button title="Complete" onClick={() => updateStatus(appt._id, 'Completed')} className="p-2 hover:bg-green-50 text-success rounded-xl"><CheckCircle size={16} /></button>
                            <button title="Cancel" onClick={() => updateStatus(appt._id, 'Cancelled')} className="p-2 hover:bg-red-50 text-danger rounded-xl"><XCircle size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {appointments.map(appt => (
              <Card key={appt._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">
                      {appt.tokenNumber}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{appt.patient?.name}</p>
                      <p className="text-[10px] text-secondary">{appt.patient?.age} yrs · {appt.patient?.gender}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{appt.chiefComplaint || 'General'}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border shrink-0 ${STATUS_STYLES[appt.status]}`}>
                    {appt.status}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handlePrint(appt._id)} className="flex-1 py-2 text-xs font-black text-primary bg-indigo-50 rounded-xl">🖨 Print Slip</button>
                  {appt.status === 'Pending' && (
                    <>
                      <button onClick={() => updateStatus(appt._id, 'Completed')} className="flex-1 py-2 text-xs font-black text-success bg-green-50 rounded-xl">✓ Complete</button>
                      <button onClick={() => updateStatus(appt._id, 'Cancelled')} className="flex-1 py-2 text-xs font-black text-danger bg-red-50 rounded-xl">✗ Cancel</button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Book Modal */}
      <Modal isOpen={isBookModalOpen} onClose={() => { setIsBookModalOpen(false); reset(); setSelectedPatient(null); setPatientSearch(''); setIsNewPatient(true); }} title="Book New Appointment" size="lg">
        <form onSubmit={handleSubmit(onBook)} className="space-y-5">

          {/* Patient selection */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
            <div className="flex gap-3">
              <button type="button" onClick={() => { setIsNewPatient(true); setSelectedPatient(null); setPatientSearch(''); }}
                className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl border transition-all ${isNewPatient ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500'}`}>
                New Patient
              </button>
              <button type="button" onClick={() => setIsNewPatient(false)}
                className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl border transition-all ${!isNewPatient ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500'}`}>
                Existing Patient
              </button>
            </div>

            {!isNewPatient ? (
              <div className="relative">
                <input
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); searchPatients(e.target.value); setSelectedPatient(null); }}
                  placeholder="Search patient by name or phone..."
                  className="w-full h-12 border-2 border-gray-100 rounded-xl px-4 font-medium text-sm outline-none focus:border-primary"
                />
                {patientResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-1 overflow-hidden">
                    {patientResults.map(p => (
                      <button type="button" key={p._id} onClick={() => handleSelectPatient(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-left">
                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center font-black text-primary text-sm">{p.name[0]}</div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-secondary">{p.age} yrs · {p.gender} · {p.phone || '—'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <p className="text-sm font-bold text-primary">✓ Selected: {selectedPatient.name}</p>
                    <p className="text-[10px] text-secondary">{selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-gray-400 uppercase">New Patient Details</p>
                <Input label="Full Name *" placeholder="e.g. Ramesh Verma" {...register('name', { required: isNewPatient })} error={errors.name && 'Required'} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Age *" type="number" placeholder="e.g. 35" {...register('age', { required: isNewPatient })} error={errors.age && 'Required'} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Gender *</label>
                    <select className="w-full h-12 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary" {...register('gender', { required: isNewPatient })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <Input label="Phone" placeholder="10-digit mobile" {...register('phone')} />
                <Input label="Address" placeholder="e.g. 12 MG Road, Delhi" {...register('address')} />
              </div>
            )}
          </div>

          {/* Appointment details */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
            <p className="text-[10px] font-black text-primary uppercase">Appointment Details</p>
            <Input label="Chief Complaint" placeholder="e.g. Fever, Cough, Headache" {...register('chiefComplaint')} />
            <Input label="Doctor Name" placeholder={user?.branch?.doctorName || 'Doctor'} {...register('doctorName')} />
            <Input label="Doctor Degree" placeholder={user?.branch?.doctorDegree || 'e.g. MBBS, MD'} {...register('doctorDegree')} />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="ghost" fullWidth onClick={() => { setIsBookModalOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" variant="primary" fullWidth isLoading={submitting} icon={Plus}>Confirm Booking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppointmentsPage;
