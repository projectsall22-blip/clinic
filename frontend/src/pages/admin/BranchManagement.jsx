import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit3, Trash2, MapPin, Phone, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await API.get('/branches');
      setBranches(res.data || []);
    } catch {
      setToast({ message: 'Failed to load branches', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onAdd = async (data) => {
    setSubmitting(true);
    try {
      await API.post('/branches', data);
      setToast({ message: 'Branch created!', type: 'success' });
      setIsAddModalOpen(false);
      reset();
      fetchBranches();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const onEdit = async (data) => {
    setSubmitting(true);
    try {
      await API.put(`/branches/${selectedBranch._id}`, data);
      setToast({ message: 'Branch updated!', type: 'success' });
      setIsEditModalOpen(false);
      fetchBranches();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleEditClick = (branch) => {
    setSelectedBranch(branch);
    ['name', 'address', 'phone', 'doctorName', 'doctorDegree'].forEach(k => setValue(k, branch[k] || ''));
    setIsEditModalOpen(true);
  };

  const handleDeactivate = async (branch) => {
    if (!window.confirm(`Deactivate branch "${branch.name}"? Staff will lose access.`)) return;
    try {
      await API.delete(`/branches/${branch._id}`);
      setToast({ message: 'Branch deactivated', type: 'success' });
      fetchBranches();
    } catch {
      setToast({ message: 'Action failed', type: 'error' });
    }
  };

  const BranchForm = ({ onSubmit }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Branch Name *" placeholder="e.g. New Life Clinic - Sector 5" {...register('name', { required: true })} error={errors.name && 'Required'} />
      <Input label="Address *" placeholder="Full address of the branch" {...register('address', { required: true })} error={errors.address && 'Required'} />
      <Input label="Phone *" placeholder="10-digit phone number" {...register('phone', { required: true })} error={errors.phone && 'Required'} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Doctor Name *" placeholder="e.g. Dr. Rajesh Kumar" {...register('doctorName', { required: true })} error={errors.doctorName && 'Required'} />
        <Input label="Doctor Degree" placeholder="e.g. MBBS, MD" {...register('doctorDegree')} />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="ghost" fullWidth onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); reset(); }}>Cancel</Button>
        <Button type="submit" fullWidth isLoading={submitting} icon={Plus}>Save Branch</Button>
      </div>
    </form>
  );

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Branch Management</h1>
          <p className="text-sm text-secondary">Manage all clinic branches</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => { reset(); setIsAddModalOpen(true); }}>Add Branch</Button>
      </div>

      {branches.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Building2 size={64} className="mx-auto mb-4" />
          <p className="font-bold">No branches yet. Add your first branch!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(branch => (
            <Card key={branch._id} className={`group hover:border-primary transition-all ${!branch.isActive ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center font-black text-xl">
                  <Building2 size={22} />
                </div>
                <div className="flex gap-1">
                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${branch.isActive ? 'bg-green-50 text-success border border-green-200' : 'bg-gray-100 text-gray-500'}`}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <h3 className="font-black text-gray-900 text-base mb-3">{branch.name}</h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-secondary text-xs">
                  <User size={13} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{branch.doctorName}{branch.doctorDegree ? ` (${branch.doctorDegree})` : ''}</span>
                </div>
                <div className="flex items-start gap-2 text-secondary text-xs">
                  <MapPin size={13} className="shrink-0 mt-0.5" />
                  <span className="font-medium">{branch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary text-xs">
                  <Phone size={13} className="shrink-0" />
                  <span className="font-medium">{branch.phone}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleEditClick(branch)} className="flex-1 py-2 text-xs font-black text-warning bg-amber-50 rounded-xl hover:bg-amber-100 flex items-center justify-center gap-1">
                  <Edit3 size={13} /> Edit
                </button>
                {branch.isActive && (
                  <button onClick={() => handleDeactivate(branch)} className="flex-1 py-2 text-xs font-black text-danger bg-red-50 rounded-xl hover:bg-red-100 flex items-center justify-center gap-1">
                    <Trash2 size={13} /> Deactivate
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); reset(); }} title="Add New Branch">
        <BranchForm onSubmit={onAdd} />
      </Modal>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Branch">
        <BranchForm onSubmit={onEdit} />
      </Modal>
    </div>
  );
};

export default BranchManagement;
