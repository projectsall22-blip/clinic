import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Trash2, Printer, ShoppingCart, X,
  User, Hash, CheckCircle, Phone, MapPin,
  Calendar, Clock, ChevronDown, ChevronUp
} from 'lucide-react';
import API from '../../api/axios';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { generateReceipt } from '../../utils/receiptGenerator';

// ── Patient Full Detail Card ─────────────────────────────────────────────────
const PatientCard = ({ patient, tokenDisplay, appointments = [], onClear }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="rounded-2xl border border-indigo-200 overflow-hidden">
      {/* Header Row */}
      <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0">
            {patient.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm leading-tight">{patient.name}</p>
            <p className="text-[10px] text-secondary font-medium">
              {patient.age} yrs · {patient.gender}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tokenDisplay && tokenDisplay !== '—' && (
            <div className="text-right mr-1">
              <p className="text-[9px] font-black text-primary uppercase leading-none">Token</p>
              <p className="text-2xl font-black text-primary leading-tight">{tokenDisplay}</p>
            </div>
          )}
          <button onClick={onClear} className="p-1.5 hover:bg-red-50 rounded-lg">
            <X size={14} className="text-gray-400 hover:text-danger" />
          </button>
        </div>
      </div>

      {/* Detail Rows */}
      <div className="bg-white px-4 py-3 space-y-2">
        {patient.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone size={12} className="text-gray-400 shrink-0" />
            <span className="font-bold">{patient.phone}</span>
          </div>
        )}
        {patient.address && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <MapPin size={12} className="text-gray-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{patient.address}</span>
          </div>
        )}

        {/* Registration date */}
        {patient.createdAt && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={11} className="shrink-0" />
            <span>First visit: {new Date(patient.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      {/* Visit History toggle */}
      {appointments.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-black text-primary bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
          >
            <span>Visit History ({appointments.length})</span>
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showHistory && (
            <div className="max-h-44 overflow-y-auto divide-y divide-gray-50">
              {appointments.map(a => (
                <div key={a._id} className="px-4 py-2.5 flex items-center justify-between bg-white hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-primary">#{String(a.tokenNumber).padStart(3,'0')}</span>
                      <span className="text-[10px] text-gray-400">·</span>
                      <span className="text-[10px] text-secondary font-medium">
                        {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {a.chiefComplaint && (
                      <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{a.chiefComplaint}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                    a.status === 'Completed' ? 'bg-green-100 text-success' :
                    a.status === 'Cancelled' ? 'bg-red-100 text-danger' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Sell Page ────────────────────────────────────────────────────────────
const SellPage = () => {
  // Medicine search
  const [query, setQuery]                   = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [cartItems, setCartItems]           = useState([]);
  const medTimeout                          = useRef(null);

  // Token lookup
  const [tokenInput, setTokenInput]         = useState('');
  const [tokenLoading, setTokenLoading]     = useState(false);
  const [tokenError, setTokenError]         = useState('');

  // Patient
  const [searchQuery, setSearchQuery]               = useState('');  // name OR mobile
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [selectedPatient, setSelectedPatient]       = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientPhone, setPatientPhone]             = useState('');
  const [tokenDisplay, setTokenDisplay]             = useState('');
  const [searchLoading, setSearchLoading]           = useState(false);
  const searchTimeout                               = useRef(null);
  const dropdownRef                                 = useRef(null);

  // Bill
  const [discount, setDiscount]         = useState(0);
  const [paymentMode, setPaymentMode]   = useState('Cash');
  const [submitting, setSubmitting]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [lastSale, setLastSale]         = useState(null);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setPatientSuggestions([]);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Token lookup ────────────────────────────────────────────────────────
  const fetchByToken = async (val) => {
    const num = val.trim();
    if (!num || isNaN(num)) return;
    setTokenLoading(true);
    setTokenError('');
    try {
      const res  = await API.get(`/appointments/by-token/${num}`);
      const appt = res.data;
      const p    = appt.patient;

      setSelectedPatient(p);
      setPatientPhone(p?.phone || '');
      setTokenDisplay(String(appt.tokenNumber).padStart(3, '0'));
      setSearchQuery(p?.name || '');
      setPatientSuggestions([]);

      // Also fetch full history
      if (p?._id) {
        try {
          const detail = await API.get(`/patients/${p._id}`);
          setPatientAppointments(detail.data.appointments || []);
          // Merge extra fields (createdAt, address) into selectedPatient
          setSelectedPatient(prev => ({ ...prev, ...detail.data.patient }));
        } catch { setPatientAppointments([]); }
      }
      setToast({ message: `Token ${num} — ${p?.name} loaded!`, type: 'success' });
    } catch (err) {
      setTokenError(err.response?.data?.message || `Token ${num} not found for today`);
      clearPatient();
    } finally {
      setTokenLoading(false);
    }
  };

  // ── Patient search (name OR mobile) ─────────────────────────────────────
  const handleSearchChange = (q) => {
    setSearchQuery(q);
    clearPatient(false); // keep searchQuery, just clear selection
    clearTimeout(searchTimeout.current);
    if (!q || q.length < 2) { setPatientSuggestions([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await API.get(`/patients?search=${encodeURIComponent(q)}&limit=10`);
        setPatientSuggestions(res.data.patients || []);
      } catch { /* silent */ }
      finally { setSearchLoading(false); }
    }, 300);
  };

  const selectPatient = async (patient) => {
    setPatientSuggestions([]);
    setSearchQuery(patient.name);
    setPatientPhone(patient.phone || '');
    setTokenDisplay('');

    // Fetch full detail + appointments
    try {
      const res = await API.get(`/patients/${patient._id}`);
      const full = res.data.patient;
      const appts = res.data.appointments || [];
      setSelectedPatient({ ...patient, ...full });
      setPatientAppointments(appts);
      // Show latest token if exists
      if (appts.length > 0) {
        setTokenDisplay(String(appts[0].tokenNumber).padStart(3, '0'));
      }
    } catch {
      setSelectedPatient(patient);
      setPatientAppointments([]);
    }
  };

  const clearPatient = (clearSearch = true) => {
    setSelectedPatient(null);
    setPatientAppointments([]);
    setPatientPhone('');
    setTokenDisplay('');
    setTokenInput('');
    setTokenError('');
    if (clearSearch) { setSearchQuery(''); setPatientSuggestions([]); }
  };

  // ── Medicine search ──────────────────────────────────────────────────────
  const searchMedicines = (q) => {
    setQuery(q);
    clearTimeout(medTimeout.current);
    if (!q || q.length < 2) { setSearchResults([]); return; }
    medTimeout.current = setTimeout(async () => {
      try {
        const res = await API.get(`/medicines/search?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data || []);
      } catch { /* silent */ }
    }, 300);
  };

  const addToCart = (med) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.medicineId === med._id);
      if (ex) return prev.map(i => i.medicineId === med._id
        ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i);
      return [...prev, {
        medicineId: med._id, medicineName: med.name,
        quantity: 1, unitPrice: med.sellingPrice,
        total: med.sellingPrice, maxStock: med.stock, unit: med.unit
      }];
    });
    setQuery(''); setSearchResults([]);
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i =>
      i.medicineId === id ? { ...i, quantity: qty, total: qty * i.unitPrice } : i
    ));
  };
  const removeItem = (id) => setCartItems(prev => prev.filter(i => i.medicineId !== id));

  const subtotal   = cartItems.reduce((s, i) => s + i.total, 0);
  const grandTotal = Math.max(0, subtotal - Number(discount || 0));

  const handleSell = async () => {
    if (cartItems.length === 0) { setToast({ message: 'Add at least one medicine', type: 'error' }); return; }
    setSubmitting(true);
    try {
      const res = await API.post('/sales', {
        items:       cartItems.map(i => ({ medicineId: i.medicineId, quantity: i.quantity })),
        patientName: searchQuery || 'Walk-in Patient',
        patientPhone,
        patientId:   selectedPatient?._id || null,
        discount:    Number(discount || 0),
        paymentMode
      });
      setLastSale(res.data);
      setToast({ message: `Sale created! Receipt: ${res.data.receiptNumber}`, type: 'success' });
      await generateReceipt(res.data);
      // Full reset
      setCartItems([]); clearPatient(true); setDiscount(0); setPaymentMode('Cash');
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Sale failed', type: 'error' });
    } finally { setSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">New Sale</h1>
        <p className="text-sm text-secondary">Search medicines, add to bill, generate receipt</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Medicine Search + Cart ─────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Medicine Search */}
          <div className="relative">
            <div className="bg-white rounded-2xl border-2 border-gray-100 flex items-center gap-3 px-4 h-14 focus-within:border-primary transition-colors">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={e => searchMedicines(e.target.value)}
                placeholder="Search medicine by name..."
                className="flex-1 font-medium text-gray-800 outline-none placeholder-gray-400"
              />
              {query && <button onClick={() => { setQuery(''); setSearchResults([]); }}><X size={16} className="text-gray-400" /></button>}
            </div>
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 overflow-hidden">
                {searchResults.map(med => (
                  <button key={med._id} type="button" onClick={() => addToCart(med)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0">
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-900">{med.name}</p>
                      <p className="text-[10px] text-secondary">{med.category} · {med.unit} · Stock: {med.stock}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-black text-primary">₹{med.sellingPrice}</p>
                      <p className="text-[9px] text-gray-400">per {med.unit}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
              <ShoppingCart size={18} className="text-primary" />
              <h2 className="font-black text-gray-900">Bill Items</h2>
              {cartItems.length > 0 && (
                <span className="ml-auto text-xs font-black bg-primary text-white rounded-full px-2 py-0.5">{cartItems.length}</span>
              )}
            </div>
            {cartItems.length === 0 ? (
              <div className="py-14 text-center opacity-30">
                <ShoppingCart size={44} className="mx-auto mb-3" />
                <p className="font-bold text-sm">Search and add medicines above</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {cartItems.map(item => (
                  <div key={item.medicineId} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{item.medicineName}</p>
                      <p className="text-[10px] text-secondary">₹{item.unitPrice} per {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.medicineId, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 font-bold flex items-center justify-center hover:bg-gray-200 text-lg">−</button>
                      <span className="w-7 text-center font-black text-sm">{item.quantity}</span>
                      <button onClick={() => {
                        if (item.quantity < item.maxStock) updateQty(item.medicineId, item.quantity + 1);
                        else setToast({ message: `Only ${item.maxStock} in stock`, type: 'error' });
                      }} className="w-7 h-7 rounded-lg bg-gray-100 font-bold flex items-center justify-center hover:bg-gray-200 text-lg">+</button>
                    </div>
                    <p className="w-18 text-right font-black text-sm text-gray-900 shrink-0">₹{item.total.toFixed(2)}</p>
                    <button onClick={() => removeItem(item.medicineId)} className="p-1 text-gray-300 hover:text-danger shrink-0"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Patient + Bill ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Patient Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Patient Details</p>

            {/* ── METHOD 1: Token Number ── */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase ml-1">
                Today's Token Number
              </p>
              <div className={`flex items-center gap-2 border-2 rounded-xl px-3 h-12 transition-colors ${
                tokenError            ? 'border-red-300 bg-red-50/60'   :
                selectedPatient && tokenInput ? 'border-success bg-green-50/50' :
                'border-gray-100 focus-within:border-primary'
              }`}>
                <Hash size={16} className={
                  tokenError ? 'text-danger' :
                  selectedPatient && tokenInput ? 'text-success' : 'text-gray-400'
                } />
                <input
                  type="number" min="1"
                  value={tokenInput}
                  onChange={e => { setTokenInput(e.target.value); setTokenError(''); }}
                  onKeyDown={e => e.key === 'Enter' && fetchByToken(tokenInput)}
                  onBlur={() => tokenInput && fetchByToken(tokenInput)}
                  placeholder="Enter token & press Enter"
                  className="flex-1 font-black text-xl text-gray-800 outline-none bg-transparent placeholder-gray-300 placeholder:text-sm placeholder:font-normal"
                />
                {tokenLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                {selectedPatient && tokenInput && !tokenLoading && <CheckCircle size={16} className="text-success shrink-0" />}
                {(tokenInput) && !tokenLoading && <button onClick={() => clearPatient()}><X size={13} className="text-gray-400 hover:text-danger" /></button>}
              </div>
              {tokenError && <p className="text-[11px] text-danger font-bold ml-1">⚠ {tokenError}</p>}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[10px] font-black text-gray-400 uppercase px-1">or search patient</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* ── METHOD 2: Name or Mobile Search ── */}
            <div className="relative" ref={dropdownRef}>
              <div className={`flex items-center gap-2 border-2 rounded-xl px-3 h-11 transition-colors ${
                selectedPatient && !tokenInput ? 'border-primary bg-indigo-50/30' :
                'border-gray-100 focus-within:border-primary'
              }`}>
                {searchLoading
                  ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  : <Search size={15} className="text-gray-400 shrink-0" />
                }
                <input
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Name or mobile number..."
                  className="flex-1 font-medium text-sm text-gray-800 outline-none bg-transparent placeholder-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => clearPatient(true)}>
                    <X size={13} className="text-gray-400 hover:text-danger" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {patientSuggestions.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl mt-1 overflow-hidden max-h-64 overflow-y-auto">
                  {patientSuggestions.map(p => (
                    <button key={p._id} type="button" onClick={() => selectPatient(p)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0 text-left">
                      <div className="w-9 h-9 bg-indigo-50 rounded-full flex items-center justify-center font-black text-primary shrink-0">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-secondary">
                          {p.age} yrs · {p.gender}
                          {p.phone ? ` · 📞 ${p.phone}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-gray-400 uppercase">Registered</p>
                        <p className="text-[10px] font-bold text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── PATIENT FULL DETAIL CARD ── */}
            {selectedPatient && (
              <PatientCard
                patient={selectedPatient}
                tokenDisplay={tokenDisplay}
                appointments={patientAppointments}
                onClear={() => clearPatient(true)}
              />
            )}

            {/* Phone (editable) */}
            {!selectedPatient && (
              <div className="flex items-center gap-2 border-2 border-gray-100 rounded-xl px-3 h-11 focus-within:border-primary transition-colors">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <input
                  value={patientPhone}
                  onChange={e => setPatientPhone(e.target.value)}
                  placeholder="Phone number (optional)"
                  className="flex-1 font-medium text-sm text-gray-800 outline-none placeholder-gray-400"
                />
              </div>
            )}

            {!searchQuery && !tokenInput && (
              <p className="text-[10px] text-gray-400 italic text-center">
                Leave empty to save as "Walk-in Patient"
              </p>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Bill Summary</p>

            <div className="flex justify-between text-sm">
              <span className="text-secondary font-medium">Subtotal</span>
              <span className="font-bold">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-secondary font-medium">Discount (₹)</span>
              <input type="number" min="0" max={subtotal} value={discount}
                onChange={e => setDiscount(e.target.value)}
                className="w-24 h-9 border-2 border-gray-100 rounded-xl px-3 text-sm font-bold text-right outline-none focus:border-primary" />
            </div>

            <div className="h-px bg-gray-100" />

            <div className="flex justify-between">
              <span className="font-black text-gray-900">Grand Total</span>
              <span className="font-black text-xl text-primary">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase">Payment Mode</p>
              <div className="flex gap-2">
                {['Cash', 'UPI', 'Card'].map(mode => (
                  <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                    className={`flex-1 py-2 text-xs font-black uppercase rounded-xl border transition-all ${
                      paymentMode === mode ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary'
                    }`}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <Button fullWidth variant="primary" icon={Printer} isLoading={submitting} onClick={handleSell} className="mt-2">
              Sell & Print Receipt
            </Button>

            {lastSale && (
              <button onClick={() => generateReceipt(lastSale).catch(()=>{})}
                className="w-full py-2 text-xs font-black text-primary border border-primary/30 rounded-xl hover:bg-indigo-50">
                🖨 Reprint Last Receipt ({lastSale.receiptNumber})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
