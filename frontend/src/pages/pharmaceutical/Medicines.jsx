import React, { useState, useEffect, useCallback } from 'react';
import { Pill, Plus, Search, Edit3, Trash2, Package, AlertTriangle, PlusCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

const CATEGORIES = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Powder', 'Other'];

const MedicinesPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [stockQty, setStockQty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/medicines?search=${search}`);
      setMedicines(res.data || []);
    } catch {
      setToast({ message: 'Failed to load medicines', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);

  const onAdd = async (data) => {
    setSubmitting(true);
    try {
      await API.post('/medicines', data);
      setToast({ message: 'Medicine added!', type: 'success' });
      setIsAddModalOpen(false);
      reset();
      fetchMedicines();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const onEdit = async (data) => {
    setSubmitting(true);
    try {
      await API.put(`/medicines/${selectedMed._id}`, data);
      setToast({ message: 'Medicine updated!', type: 'success' });
      setIsEditModalOpen(false);
      fetchMedicines();
    } catch {
      setToast({ message: 'Update failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleEditClick = (med) => {
    setSelectedMed(med);
    ['name', 'genericName', 'category', 'unit', 'purchasePrice', 'sellingPrice', 'stock', 'minStockAlert', 'manufacturer'].forEach(k => setValue(k, med[k]));
    if (med.expiryDate) setValue('expiryDate', new Date(med.expiryDate).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleAddStock = async () => {
    if (!stockQty || isNaN(stockQty) || Number(stockQty) <= 0) return;
    setSubmitting(true);
    try {
      await API.put(`/medicines/${selectedMed._id}/add-stock`, { quantity: Number(stockQty) });
      setToast({ message: `Added ${stockQty} units to stock!`, type: 'success' });
      setIsStockModalOpen(false);
      setStockQty('');
      fetchMedicines();
    } catch {
      setToast({ message: 'Stock update failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Delete ${med.name}?`)) return;
    try {
      await API.delete(`/medicines/${med._id}`);
      setToast({ message: 'Medicine deleted', type: 'success' });
      fetchMedicines();
    } catch {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const getStockStatus = (med) => {
    if (med.stock === 0) return { label: 'Out of Stock', class: 'bg-red-50 text-danger border-red-200' };
    if (med.stock <= med.minStockAlert) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (med.expiryDate && new Date(med.expiryDate) < new Date()) return { label: 'Expired', class: 'bg-gray-100 text-gray-500 border-gray-200' };
    return { label: 'In Stock', class: 'bg-green-50 text-success border-green-200' };
  };

  const MedForm = ({ onSubmit, defaultValues }) => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Medicine Name *" placeholder="e.g. Paracetamol" {...register('name', { required: true })} error={errors.name && 'Required'} />
        <Input label="Generic Name" placeholder="e.g. Acetaminophen" {...register('genericName')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase ml-1">Category *</label>
          <select className="w-full h-12 border-2 border-gray-100 rounded-xl px-3 font-bold text-sm outline-none focus:border-primary" {...register('category')}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Input label="Unit" placeholder="Strip / Bottle / Vial" {...register('unit')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Purchase Price (₹) *" type="number" step="0.01" {...register('purchasePrice', { required: true })} error={errors.purchasePrice && 'Required'} />
        <Input label="Selling Price (₹) *" type="number" step="0.01" {...register('sellingPrice', { required: true })} error={errors.sellingPrice && 'Required'} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Opening Stock" type="number" {...register('stock')} />
        <Input label="Min Stock Alert" type="number" placeholder="10" {...register('minStockAlert')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Expiry Date" type="date" {...register('expiryDate')} />
        <Input label="Manufacturer" placeholder="e.g. Sun Pharma" {...register('manufacturer')} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" fullWidth onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
        <Button type="submit" fullWidth isLoading={submitting} icon={Plus}>Save Medicine</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Medicine Stock</h1>
          <p className="text-sm text-secondary">Manage medicines, prices and inventory</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => { reset(); setIsAddModalOpen(true); }}>Add Medicine</Button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 max-w-md">
        <Search size={18} className="text-gray-400 ml-1" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine name..." className="flex-1 text-sm font-medium outline-none text-gray-800 placeholder-gray-400" />
      </div>

      {loading ? <div className="py-20"><LoadingSpinner size="lg" /></div> : medicines.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <Pill size={64} className="mx-auto mb-4" />
          <p className="font-bold">No medicines found</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Medicine</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Category</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Price</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Stock</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Expiry</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {medicines.map(med => {
                  const status = getStockStatus(med);
                  return (
                    <tr key={med._id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4">
                        <p className="font-bold text-sm text-gray-900">{med.name}</p>
                        <p className="text-[10px] text-secondary">{med.genericName || med.unit}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{med.category}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-gray-900">₹{med.sellingPrice}</p>
                        <p className="text-[10px] text-secondary">Cost: ₹{med.purchasePrice}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-gray-800">{med.stock} {med.unit}</td>
                      <td className="px-4 py-4 text-xs text-gray-500">{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${status.class}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button title="Add Stock" onClick={() => { setSelectedMed(med); setIsStockModalOpen(true); }} className="p-2 text-success hover:bg-green-50 rounded-xl"><PlusCircle size={16} /></button>
                          <button onClick={() => handleEditClick(med)} className="p-2 text-warning hover:bg-amber-50 rounded-xl"><Edit3 size={16} /></button>
                          <button onClick={() => handleDelete(med)} className="p-2 text-danger hover:bg-red-50 rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {medicines.map(med => {
              const status = getStockStatus(med);
              return (
                <Card key={med._id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{med.name}</p>
                      <p className="text-[10px] text-secondary">{med.category} · {med.unit}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${status.class}`}>{status.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Sell Price</p>
                      <p className="font-black text-sm text-gray-900">₹{med.sellingPrice}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Stock</p>
                      <p className="font-black text-sm text-gray-900">{med.stock}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-2 text-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">Expiry</p>
                      <p className="font-black text-xs text-gray-900">{med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedMed(med); setIsStockModalOpen(true); }} className="flex-1 py-2 text-xs font-black text-success bg-green-50 rounded-xl">+ Stock</button>
                    <button onClick={() => handleEditClick(med)} className="flex-1 py-2 text-xs font-black text-warning bg-amber-50 rounded-xl">Edit</button>
                    <button onClick={() => handleDelete(med)} className="flex-1 py-2 text-xs font-black text-danger bg-red-50 rounded-xl">Delete</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); reset(); }} title="Add New Medicine" size="lg">
        <MedForm onSubmit={onAdd} />
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Medicine" size="lg">
        <MedForm onSubmit={onEdit} />
      </Modal>

      <Modal isOpen={isStockModalOpen} onClose={() => { setIsStockModalOpen(false); setStockQty(''); }} title="Add Stock">
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
            <p className="font-black text-success">{selectedMed?.name}</p>
            <p className="text-xs text-gray-500 mt-1">Current stock: {selectedMed?.stock} {selectedMed?.unit}</p>
          </div>
          <Input label="Quantity to Add" type="number" placeholder="e.g. 50" value={stockQty} onChange={e => setStockQty(e.target.value)} />
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={() => setIsStockModalOpen(false)}>Cancel</Button>
            <Button fullWidth isLoading={submitting} onClick={handleAddStock} icon={PlusCircle}>Add to Stock</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MedicinesPage;
