import React, { useState, useEffect } from 'react';
import { Users, Pill, Plus, Edit3, Trash2, Key, Eye, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const ClinicStaffManagement = () => {
  const [activeTab, setActiveTab] = useState('receptionist');
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const endpoint = activeTab === 'receptionist' ? 'receptionists' : 'pharmaceuticals';
  const defaultPwd = activeTab === 'receptionist' ? 'Clinic@123' : 'Pharma@123';
  const label = activeTab === 'receptionist' ? 'Receptionist' : 'Pharmaceutical';

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [activeTab]);

  const fetchBranches = async () => {
    try {
      const res = await API.get('/branches');
      setBranches(res.data || []);
    } catch { /* silent */ }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/staff/${endpoint}`);
      setStaff(res.data || []);
    } catch {
      setToast({ message: 'Failed to load staff', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onAdd = async (data) => {
    setSubmitting(true);
    try {
      const res = await API.post(`/staff/${endpoint}`, data);
      setToast({ message: `${label} added! Code: ${res.data.employeeCode}`, type: 'success' });
      setIsAddModalOpen(false);
      reset();
      fetchStaff();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const onEdit = async (data) => {
    setSubmitting(true);
    try {
      await API.put(`/staff/${endpoint}/${selectedStaff._id}`, data);
      setToast({ message: 'Updated successfully!', type: 'success' });
      setIsEditModalOpen(false);
      fetchStaff();
    } catch {
      setToast({ message: 'Update failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleEditClick = (member) => {
    setSelectedStaff(member);
    ['name', 'phone', 'email', 'gender', 'address'].forEach(k => setValue(k, member[k] || ''));
    setValue('branch', member.branch?._id || '');
    if (member.dateOfBirth) setValue('dateOfBirth', new Date(member.dateOfBirth).toISOString().split('T')[0]);
    if (member.joiningDate) setValue('joiningDate', new Date(member.joiningDate).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate ${member.name}?`)) return;
    try {
      await API.delete(`/staff/${endpoint}/${member._id}`);
      setToast({ message: `${label} deactivated`, type: 'success' });
      fetchStaff();
    } catch {
      setToast({ message: 'Action failed', type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) return;
    setSubmitting(true);
    try {
      await API.put(`/staff/${endpoint}/${selectedStaff._id}/reset-password`, { newPassword });
      setToast({ message: 'Password reset!', type: 'success' });
      setIsResetModalOpen(false);
      setNewPassword('');
    } catch {
      setToast({ message: 'Reset failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const StaffForm = ({ onSubmit }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Full Name *" placeholder="e.g. Priya Sharma" {...register('name', { required: true })} error={errors.name && 'Required'} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Phone *" placeholder="10-digit mobile" {...register('phone', { required: true })} error={errors.phone && 'Required'} />
        <Input label="Email" type="email" placeholder="optional" {...register('email')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Gender *</label>
          <select className="w-full h-12 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary" {...register('gender', { required: true })}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Branch *</label>
          <select className="w-full h-12 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary" {...register('branch', { required: true })}>
            <option value="">Select Branch...</option>
            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Date of Birth" type="date" {...register('dateOfBirth')} />
        <Input label="Joining Date" type="date" {...register('joiningDate')} />
      </div>
      <Input label="Address" placeholder="Residential address" {...register('address')} />
      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-[9px] font-bold text-primary uppercase">
          Employee code will be auto-generated. Default password: <span className="underline">{defaultPwd}</span>
        </p>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" fullWidth onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }}>Cancel</Button>
        <Button type="submit" fullWidth isLoading={submitting} icon={Plus}>Save {label}</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Clinic Staff</h1>
          <p className="text-sm text-secondary">Manage Receptionists & Pharmaceutical staff</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => { reset(); setIsAddModalOpen(true); }}>
          Add {label}
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-sm">
        <button onClick={() => setActiveTab('receptionist')}
          className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'receptionist' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}>
          <Users size={14} /> Receptionist
        </button>
        <button onClick={() => setActiveTab('pharmaceutical')}
          className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'pharmaceutical' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}>
          <Pill size={14} /> Pharmaceutical
        </button>
      </div>

      {loading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : staff.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Users size={64} className="mx-auto mb-4" />
          <p className="font-bold">No {label.toLowerCase()} staff found</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase">Staff Member</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase">Branch</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase">Employee Code</th>
                  <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {staff.map(member => (
                  <tr key={member._id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${activeTab === 'receptionist' ? 'bg-indigo-50 text-primary' : 'bg-green-50 text-success'}`}>
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{member.name}</p>
                          <p className="text-[10px] text-secondary">{member.phone} · {member.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building2 size={13} className="text-gray-400" />
                        {member.branch?.name || '—'}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-bold text-gray-700">{member.employeeCode}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEditClick(member)} className="p-2 text-warning hover:bg-amber-50 rounded-xl"><Edit3 size={15} /></button>
                        <button onClick={() => { setSelectedStaff(member); setIsResetModalOpen(true); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-xl"><Key size={15} /></button>
                        <button onClick={() => handleDeactivate(member)} className="p-2 text-danger hover:bg-red-50 rounded-xl"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {staff.map(member => (
              <Card key={member._id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${activeTab === 'receptionist' ? 'bg-indigo-50 text-primary' : 'bg-green-50 text-success'}`}>{member.name[0]}</div>
                    <div>
                      <p className="font-bold text-gray-900">{member.name}</p>
                      <p className="text-[10px] text-secondary">{member.employeeCode} · {member.branch?.name}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditClick(member)} className="flex-1 py-2 text-xs font-black text-warning bg-amber-50 rounded-xl">Edit</button>
                  <button onClick={() => { setSelectedStaff(member); setIsResetModalOpen(true); }} className="flex-1 py-2 text-xs font-black text-purple-600 bg-purple-50 rounded-xl">Reset Pwd</button>
                  <button onClick={() => handleDeactivate(member)} className="flex-1 py-2 text-xs font-black text-danger bg-red-50 rounded-xl">Deactivate</button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); reset(); }} title={`Add ${label}`} size="lg">
        <StaffForm onSubmit={onAdd} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit ${label}`} size="lg">
        <StaffForm onSubmit={onEdit} />
      </Modal>
      <Modal isOpen={isResetModalOpen} onClose={() => { setIsResetModalOpen(false); setNewPassword(''); }} title={`Reset Password — ${selectedStaff?.name}`}>
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
            <p className="text-xs font-black text-purple-700">Employee Code: {selectedStaff?.employeeCode}</p>
            <p className="text-[10px] text-purple-400 mt-1">Branch: {selectedStaff?.branch?.name}</p>
          </div>
          <Input label="New Password" placeholder={defaultPwd} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
            <Button fullWidth isLoading={submitting} onClick={handleResetPassword}>Reset Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ClinicStaffManagement;
