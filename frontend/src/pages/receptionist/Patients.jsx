import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Eye, Edit3, Phone, MapPin, Calendar, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const PatientsPage = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetail, setPatientDetail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/patients?search=${search}&page=${page}&limit=20`);
      setPatients(res.data.patients || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setToast({ message: 'Failed to load patients', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleView = async (patient) => {
    setSelectedPatient(patient);
    try {
      const res = await API.get(`/patients/${patient._id}`);
      setPatientDetail(res.data);
    } catch {
      setPatientDetail({ patient, appointments: [] });
    }
    setIsViewModalOpen(true);
  };

  const handleEditClick = (patient) => {
    setSelectedPatient(patient);
    setValue('name', patient.name);
    setValue('age', patient.age);
    setValue('gender', patient.gender);
    setValue('phone', patient.phone || '');
    setValue('address', patient.address || '');
    setIsEditModalOpen(true);
  };

  const onUpdate = async (data) => {
    setSubmitting(true);
    try {
      await API.put(`/patients/${selectedPatient._id}`, data);
      setToast({ message: 'Patient updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      fetchPatients();
    } catch {
      setToast({ message: 'Update failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      <Icon size={14} className="text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-[9px] font-black text-gray-400 uppercase">{label}</p>
        <p className="text-sm font-bold text-gray-800">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Patient List</h1>
          <p className="text-sm text-secondary font-medium">Search and manage registered patients</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 max-w-md">
        <Search size={18} className="text-gray-400 shrink-0 ml-1" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone..."
          className="flex-1 text-sm font-medium outline-none text-gray-800 placeholder-gray-400"
        />
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : patients.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Users size={64} className="mx-auto mb-4" />
          <p className="font-bold">No patients found</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Age / Gender</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Phone</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Registered</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {patients.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center font-black text-primary">{p.name[0]}</div>
                        <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.age} yrs · {p.gender}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.phone || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleView(p)} className="p-2 text-primary hover:bg-indigo-50 rounded-lg"><Eye size={16} /></button>
                        <button onClick={() => handleEditClick(p)} className="p-2 text-warning hover:bg-amber-50 rounded-lg"><Edit3 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {patients.map(p => (
              <Card key={p._id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-black text-primary">{p.name[0]}</div>
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-secondary">{p.age} yrs · {p.gender} · {p.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleView(p)} className="p-2 bg-indigo-50 text-primary rounded-lg"><Eye size={16} /></button>
                    <button onClick={() => handleEditClick(p)} className="p-2 bg-amber-50 text-warning rounded-lg"><Edit3 size={16} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm font-bold border rounded-xl disabled:opacity-30">← Prev</button>
              <span className="px-4 py-2 text-sm font-bold">Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-bold border rounded-xl disabled:opacity-30">Next →</button>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Patient Profile">
        {patientDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-3xl border border-indigo-100">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-2xl font-black">
                {patientDetail.patient?.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{patientDetail.patient?.name}</h2>
                <p className="text-sm text-secondary">{patientDetail.patient?.age} yrs · {patientDetail.patient?.gender}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow icon={Phone} label="Phone" value={patientDetail.patient?.phone} />
              <InfoRow icon={Calendar} label="Registered" value={new Date(patientDetail.patient?.createdAt).toLocaleDateString('en-IN')} />
              <div className="col-span-2"><InfoRow icon={MapPin} label="Address" value={patientDetail.patient?.address} /></div>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Recent Appointments ({patientDetail.appointments?.length || 0})</p>
              {patientDetail.appointments?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patientDetail.appointments.map(a => (
                    <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-800">Token #{a.tokenNumber}</p>
                        <p className="text-[10px] text-secondary">{new Date(a.appointmentDate).toLocaleDateString('en-IN')}{a.chiefComplaint ? ` · ${a.chiefComplaint}` : ''}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${a.status === 'Completed' ? 'bg-green-100 text-success' : a.status === 'Cancelled' ? 'bg-red-100 text-danger' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-secondary">No appointments yet</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Patient">
        <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
          <Input label="Full Name" {...register('name', { required: true })} error={errors.name && 'Required'} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" {...register('age', { required: true })} error={errors.age && 'Required'} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Gender</label>
              <select className="w-full h-12 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary" {...register('gender')}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <Input label="Phone" {...register('phone')} />
          <Input label="Address" {...register('address')} />
          <div className="flex gap-3">
            <Button type="button" variant="ghost" fullWidth onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" fullWidth isLoading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PatientsPage;
