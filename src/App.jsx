import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Printer, Edit, 
  User, Briefcase, DollarSign, Coins, PiggyBank, ReceiptText, 
  ArrowDownToLine, ArrowUpFromLine, X, Loader2, Handshake, 
  Building2, UserCircle, PlusCircle, CheckCircle2,
  History, Download, Upload, Database, Check
} from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState('connected');
  const [toastMessage, setToastMessage] = useState(null);

  // بەڕێوەبردنی پەڕەکان و جۆری کارگە/شەخسی لەگەڵ هەڵگرتن لە بیرگە
  const [activeTab, setActiveTab] = useState('accounting'); // 'accounting', 'debts', 'savings'
  const [workspace, setWorkspace] = useState(() => localStorage.getItem('vh_workspace') || 'all'); // 'all', 'factory', 'personal'
  const [receiptToPrint, setReceiptToPrint] = useState(null);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // زانیارییەکان
  const [allTransactions, setAllTransactions] = useState([]);
  const [allSavings, setAllSavings] = useState([]);
  const [allDebts, setAllDebts] = useState([]);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // فۆڕمی ژمێریاری
  const [type, setType] = useState('income');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [personName, setPersonName] = useState('');
  const [jobType, setJobType] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(getTodayDate());
  const [formWorkspace, setFormWorkspace] = useState('factory');
  const [editingId, setEditingId] = useState(null);

  // فۆڕمی پاشەکەوت
  const [savingsType, setSavingsType] = useState('add');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsCurrency, setSavingsCurrency] = useState('USD');
  const [savingsNote, setSavingsNote] = useState('');
  const [savingsDate, setSavingsDate] = useState(getTodayDate());
  const [savingsWorkspace, setSavingsWorkspace] = useState('factory');

  // فۆڕمی قەرز
  const [debtType, setDebtType] = useState('owes_me');
  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtCurrency, setDebtCurrency] = useState('USD');
  const [debtNote, setDebtNote] = useState('');
  const [debtDate, setDebtDate] = useState(getTodayDate());
  const [debtWorkspace, setDebtWorkspace] = useState('factory');
  const [editingDebtId, setEditingDebtId] = useState(null);

  // قیست
  const [installmentModalItem, setInstallmentModalItem] = useState(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentDate, setInstallmentDate] = useState(getTodayDate());
  const [installmentNote, setInstallmentNote] = useState('');

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleWorkspaceChange = (ws) => {
    setWorkspace(ws);
    localStorage.setItem('vh_workspace', ws);
  };

  // ---------------------------------------------------------
  // هێنان و هاوکاتکردنی داتاکان لە داتابەیسی هەمیشەیی
  // ---------------------------------------------------------
  const fetchAllData = async (isBackground = false) => {
    if (!isBackground) setIsSyncing(true);
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.transactions) setAllTransactions(data.transactions);
        if (data.savings) setAllSavings(data.savings);
        if (data.debts) setAllDebts(data.debts);
        setDbStatus('connected');

        localStorage.setItem('vh_transactions', JSON.stringify(data.transactions || []));
        localStorage.setItem('vh_savings', JSON.stringify(data.savings || []));
        localStorage.setItem('vh_debts', JSON.stringify(data.debts || []));
      } else {
        throw new Error('API failed');
      }
    } catch (err) {
      setDbStatus('offline');
      const savedTx = localStorage.getItem('vh_transactions');
      const savedSav = localStorage.getItem('vh_savings');
      const savedDebt = localStorage.getItem('vh_debts');
      if (savedTx && allTransactions.length === 0) setAllTransactions(JSON.parse(savedTx));
      if (savedSav && allSavings.length === 0) setAllSavings(JSON.parse(savedSav));
      if (savedDebt && allDebts.length === 0) setAllDebts(JSON.parse(savedDebt));
    } finally {
      setIsLoading(false);
      if (!isBackground) setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // فلتەرکردنی داتاکان بەپێی هەڵبژاردنی سەرەوە
  const activeTransactions = workspace === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => (t.workspace || 'factory') === workspace);

  const activeSavings = workspace === 'all' 
    ? allSavings 
    : allSavings.filter(t => (t.workspace || 'factory') === workspace);

  const activeDebts = workspace === 'all' 
    ? allDebts 
    : allDebts.filter(t => (t.workspace || 'factory') === workspace);

  // ژماردنی ئایتمەکان
  const factoryTxCount = allTransactions.filter(t => (t.workspace || 'factory') === 'factory').length;
  const personalTxCount = allTransactions.filter(t => t.workspace === 'personal').length;
  const factoryDebtCount = allDebts.filter(t => (t.workspace || 'factory') === 'factory').length;
  const personalDebtCount = allDebts.filter(t => t.workspace === 'personal').length;

  // ---------------------------------------------------------
  // بەشی ژمێریاری
  // ---------------------------------------------------------
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!totalAmount || parseFloat(totalAmount) < 0 || !paidAmount || parseFloat(paidAmount) < 0 || !personName || !jobType) return;

    const dateStr = transactionDate ? new Date(transactionDate).toLocaleDateString('ku-IQ') : new Date().toLocaleDateString('ku-IQ');
    const timeStr = new Date().toLocaleTimeString('ku-IQ', { hour: '2-digit', minute:'2-digit' });
    const parsedTotal = parseFloat(totalAmount);
    const parsedPaid = parseFloat(paidAmount);
    const remaining = parsedTotal - parsedPaid;

    const initialPayments = parsedPaid > 0 ? [{
      id: 'pay_' + Date.now(),
      amount: parsedPaid,
      date: dateStr + ' ' + timeStr,
      note: 'پێشەکی / پارەی دراو',
      remainingAfter: remaining
    }] : [];

    const transactionData = {
      type,
      totalAmount: parsedTotal,
      paidAmount: parsedPaid,
      remainingAmount: remaining,
      currency,
      personName,
      jobType,
      description,
      workspace: formWorkspace,
      date: dateStr + ' - ' + timeStr,
      payments: initialPayments,
      createdAt: Date.now()
    };

    // نوێکردنەوەی خێرا (Optimistic UI)
    if (editingId) {
      setAllTransactions(allTransactions.map(t => t.id === editingId ? { ...transactionData, id: editingId } : t));
      await fetch(`/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      setEditingId(null);
      showToast('✅ مامەڵەکە بە سەرکەوتوویی نوێکرایەوە');
    } else {
      const tempId = 'tx_' + Date.now();
      setAllTransactions([{ ...transactionData, id: tempId }, ...allTransactions]);
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      showToast('✅ مامەڵەکە لە داتابەیس پاشەکەوت کرا');
    }

    fetchAllData(true);
    setTotalAmount(''); 
    setPaidAmount(''); 
    setPersonName(''); 
    setJobType(''); 
    setDescription(''); 
    setTransactionDate(getTodayDate());
  };

  const handleDelete = async (id) => {
    if (!confirm('ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟')) return;
    setAllTransactions(allTransactions.filter(t => t.id !== id));
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    showToast('🗑️ تۆمارەکە سڕایەوە');
    fetchAllData(true);
  };
  
  const handleEdit = (t) => {
    setType(t.type); 
    setTotalAmount(t.totalAmount); 
    setPaidAmount(t.paidAmount); 
    setCurrency(t.currency);
    setPersonName(t.personName); 
    setJobType(t.jobType); 
    setDescription(t.description || ''); 
    setFormWorkspace(t.workspace || 'factory');
    setEditingId(t.id);
  };

  const cancelEdit = () => {
    setEditingId(null); 
    setTotalAmount(''); 
    setPaidAmount(''); 
    setPersonName(''); 
    setJobType(''); 
    setDescription(''); 
    setTransactionDate(getTodayDate());
  };

  const calculateTotal = (transType, transCurrency) => {
    return activeTransactions
      .filter(t => t.type === transType && t.currency === transCurrency)
      .reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  };

  const incomeUSD = calculateTotal('income', 'USD'); 
  const expenseUSD = calculateTotal('expense', 'USD');
  const balanceUSD = incomeUSD - expenseUSD;
  const incomeIQD = calculateTotal('income', 'IQD'); 
  const expenseIQD = calculateTotal('expense', 'IQD');
  const balanceIQD = incomeIQD - expenseIQD;

  // ---------------------------------------------------------
  // زیادکردنی قیست و پارەدان
  // ---------------------------------------------------------
  const handleAddInstallment = async (e) => {
    e.preventDefault();
    if (!installmentModalItem || !installmentAmount || parseFloat(installmentAmount) <= 0) return;

    const paymentVal = parseFloat(installmentAmount);
    const dateStr = installmentDate ? new Date(installmentDate).toLocaleDateString('ku-IQ') : new Date().toLocaleDateString('ku-IQ');
    const timeStr = new Date().toLocaleTimeString('ku-IQ', { hour: '2-digit', minute:'2-digit' });

    const newPaymentEntry = {
      id: 'pay_' + Date.now(),
      amount: paymentVal,
      date: dateStr + ' ' + timeStr,
      note: installmentNote || 'قیستی مانگانە / پارەدان'
    };

    await fetch('/api/installments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType: installmentModalItem.isDebt ? 'debt' : 'transaction',
        id: installmentModalItem.id,
        payment: newPaymentEntry
      })
    });

    showToast('✅ قیستەکە لە داتابەیس تۆمارکرا و لە بڕی ماوە کەمکرایەوە');
    fetchAllData(true);
    setInstallmentModalItem(null);
    setInstallmentAmount('');
    setInstallmentNote('');
    setInstallmentDate(getTodayDate());
  };

  // ---------------------------------------------------------
  // بەشی پاشەکەوت
  // ---------------------------------------------------------
  const handleAddSavings = async (e) => {
    e.preventDefault();
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) return;
    
    const dateStr = savingsDate ? new Date(savingsDate).toLocaleDateString('ku-IQ') : new Date().toLocaleDateString('ku-IQ');
    const timeStr = new Date().toLocaleTimeString('ku-IQ', { hour: '2-digit', minute:'2-digit' });

    const savingsData = {
      type: savingsType, 
      amount: parseFloat(savingsAmount), 
      currency: savingsCurrency,
      note: savingsNote || (savingsType === 'add' ? 'پاشەکەوت کرا' : 'لە پاشەکەوت دەرهێنرا'),
      workspace: savingsWorkspace,
      date: dateStr + ' - ' + timeStr,
      createdAt: Date.now()
    };

    setAllSavings([{ ...savingsData, id: 'sav_' + Date.now() }, ...allSavings]);

    await fetch('/api/savings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savingsData)
    });

    showToast('✅ پارەی دەخیلە پاشەکەوت کرا');
    fetchAllData(true);
    setSavingsAmount(''); 
    setSavingsNote(''); 
    setSavingsDate(getTodayDate());
  };

  const handleDeleteSavings = async (id) => {
    if (!confirm('ئایا دڵنیایت لە سڕینەوە؟')) return;
    setAllSavings(allSavings.filter(t => t.id !== id));
    await fetch(`/api/savings/${id}`, { method: 'DELETE' });
    showToast('🗑️ پاشەکەوت سڕایەوە');
    fetchAllData(true);
  };

  const calculateSavingsTotal = (calcCurrency) => {
    return activeSavings
      .filter(t => t.currency === calcCurrency)
      .reduce((acc, curr) => curr.type === 'add' ? acc + (curr.amount || 0) : acc - (curr.amount || 0), 0);
  };
  const totalSavingsUSD = calculateSavingsTotal('USD');
  const totalSavingsIQD = calculateSavingsTotal('IQD');

  // ---------------------------------------------------------
  // بەشی قەرزەکان
  // ---------------------------------------------------------
  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!debtAmount || parseFloat(debtAmount) <= 0 || !debtName) return;

    const dateStr = debtDate ? new Date(debtDate).toLocaleDateString('ku-IQ') : new Date().toLocaleDateString('ku-IQ');
    const timeStr = new Date().toLocaleTimeString('ku-IQ', { hour: '2-digit', minute:'2-digit' });
    const parsedAmount = parseFloat(debtAmount);

    const debtData = {
      type: debtType, 
      name: debtName, 
      jobType: debtNote || 'قەرز',
      totalAmount: parsedAmount,
      paidAmount: 0,
      amount: parsedAmount, 
      currency: debtCurrency,
      note: debtNote, 
      workspace: debtWorkspace,
      payments: [],
      date: dateStr + ' - ' + timeStr,
      createdAt: Date.now()
    };

    if (editingDebtId) {
      setAllDebts(allDebts.map(d => d.id === editingDebtId ? { ...debtData, id: editingDebtId } : d));
      await fetch(`/api/debts/${editingDebtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtData)
      });
      setEditingDebtId(null);
      showToast('✅ قەرزەکە نوێکرایەوە');
    } else {
      setAllDebts([{ ...debtData, id: 'debt_' + Date.now() }, ...allDebts]);
      await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtData)
      });
      showToast('✅ قەرزەکە لە داتابەیس پاشەکەوت کرا');
    }

    fetchAllData(true);
    setDebtName(''); 
    setDebtAmount(''); 
    setDebtNote(''); 
    setDebtDate(getTodayDate());
  };

  const handleDeleteDebt = async (id) => {
    if (!confirm('ئایا دڵنیایت لە سڕینەوە؟')) return;
    setAllDebts(allDebts.filter(t => t.id !== id));
    await fetch(`/api/debts/${id}`, { method: 'DELETE' });
    showToast('🗑️ قەرزەکە سڕایەوە');
    fetchAllData(true);
  };

  const handleEditDebt = (t) => {
    setDebtType(t.type); 
    setDebtName(t.name); 
    setDebtAmount(t.amount); 
    setDebtCurrency(t.currency);
    setDebtNote(t.note || ''); 
    setDebtWorkspace(t.workspace || 'factory');
    setEditingDebtId(t.id);
  };

  const cancelEditDebt = () => {
    setEditingDebtId(null); 
    setDebtName(''); 
    setDebtAmount(''); 
    setDebtNote(''); 
    setDebtDate(getTodayDate());
  };

  const calcDebtTotal = (calcType, calcCurrency) => {
    return activeDebts
      .filter(t => t.type === calcType && t.currency === calcCurrency)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  };
  const totalOwesMeUSD = calcDebtTotal('owes_me', 'USD'); 
  const totalOwesMeIQD = calcDebtTotal('owes_me', 'IQD');
  const totalIOweUSD = calcDebtTotal('i_owe', 'USD');     
  const totalIOweIQD = calcDebtTotal('i_owe', 'IQD');

  // باکئەپ
  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData })
        });
        if (res.ok) {
          showToast('✅ باکئەپەکە بە سەرکەوتوویی گەڕێنرایەوە');
          fetchAllData();
          setShowBackupModal(false);
        }
      } catch (err) {
        alert('فایلی باکئەپەکە کێشەی هەیە');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col justify-center items-center bg-[#fcfbf9] text-[#123524] gap-3">
        <Loader2 className="animate-spin" size={40} />
        <p className="text-xs font-bold text-gray-500">پەیوەستبوون بە داتابەیسی VENS HOME...</p>
      </div>
    );
  }

  return (
    <>
      {/* پەیامی ئاگادارکردنەوە (Toast Notification) */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#123524] text-[#D4B872] px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs border border-[#D4B872] flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* بەرنامەی سەرەکی */}
      <div className={`flex flex-col h-screen bg-[#fcfbf9] text-[#1a211e] font-sans ${receiptToPrint ? 'hidden' : 'flex'}`} dir="rtl">
        
        {/* هێدەری سەرەوە */}
        <header className="bg-[#123524] p-3 shadow-md shrink-0 z-20 rounded-b-xl border-b-4 border-[#D4B872]">
          <div className="max-w-6xl mx-auto flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#D4B872] flex items-center justify-center font-black text-[#123524] text-xs border-2 border-white/20">VH</div>
                <div>
                  <h1 className="text-lg font-black tracking-wide leading-tight text-[#D4B872]">VENS HOME</h1>
                  <p className="text-[9px] text-white/70 -mt-1 font-bold tracking-[0.1em]">M O B I L Y A T</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowBackupModal(true)} 
                  title="داتابەیس و باکئەپ"
                  className="bg-[#0b2418] hover:bg-[#1a4331] text-[#D4B872] p-1.5 px-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-[#1a4331] transition-all"
                >
                  <Database size={13} />
                  <span className="hidden sm:inline">داتابەیس</span>
                  <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-400' : 'bg-orange-400'}`}></span>
                </button>

                {/* فلتەری کارگە / شەخسی / هەمووی */}
                <div className="bg-[#0b2418] p-1 rounded-lg flex border border-[#1a4331] text-[11px]">
                   <button 
                     onClick={() => handleWorkspaceChange('all')} 
                     className={`px-2 py-1 rounded-md font-bold transition-all ${workspace === 'all' ? 'bg-[#D4B872] text-[#123524]' : 'text-gray-400 hover:text-white'}`}
                   >
                     هەمووی ({allTransactions.length + allDebts.length})
                   </button>
                   <button 
                     onClick={() => handleWorkspaceChange('factory')} 
                     className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${workspace === 'factory' ? 'bg-[#D4B872] text-[#123524]' : 'text-gray-400 hover:text-white'}`}
                   >
                     <Building2 size={11} /> کارگە ({factoryTxCount + factoryDebtCount})
                   </button>
                   <button 
                     onClick={() => handleWorkspaceChange('personal')} 
                     className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${workspace === 'personal' ? 'bg-[#D4B872] text-[#123524]' : 'text-gray-400 hover:text-white'}`}
                   >
                     <UserCircle size={11} /> شەخسی ({personalTxCount + personalDebtCount})
                   </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* بەشی ناوەڕاست */}
        <main className="flex-1 overflow-hidden flex flex-col max-w-6xl mx-auto w-full mt-2">
          
          {/* =================== پەڕەی 1: ژمێریاری =================== */}
          {activeTab === 'accounting' && (
            <div className="flex flex-col gap-2 p-2 h-full overflow-hidden">
              <div className="bg-white rounded-xl shadow-sm border border-[#e8e4d8] p-2 grid grid-cols-3 gap-2 shrink-0">
                <div className="bg-[#f5f2ea] rounded-lg p-1.5 border border-[#D4B872] flex flex-col justify-center text-center">
                  <div className="text-[10px] text-[#123524] font-bold mb-1 flex justify-center items-center gap-1"><Wallet size={12}/> خەزێنە</div>
                  <div className={`font-black text-[13px] ${balanceUSD >= 0 ? 'text-[#123524]' : 'text-red-600'}`} dir="ltr">${balanceUSD.toLocaleString()}</div>
                  <div className={`font-bold text-[11px] mt-0.5 ${balanceIQD >= 0 ? 'text-[#123524]' : 'text-red-600'}`} dir="ltr">{balanceIQD.toLocaleString()} ع</div>
                </div>
                <div className="bg-[#eaf1ec] rounded-lg p-1.5 border border-[#c1d6c8] flex flex-col justify-center text-center">
                  <div className="text-[10px] text-[#15462e] font-bold mb-1 flex justify-center items-center gap-1"><TrendingUp size={12}/> هاتوو</div>
                  <div className="font-black text-[13px] text-[#15462e]" dir="ltr">${incomeUSD.toLocaleString()}</div>
                  <div className="font-bold text-[11px] text-[#15462e] mt-0.5" dir="ltr">{incomeIQD.toLocaleString()} ع</div>
                </div>
                <div className="bg-[#fae8e8] rounded-lg p-1.5 border border-[#f5caca] flex flex-col justify-center text-center">
                  <div className="text-[10px] text-red-800 font-bold mb-1 flex justify-center items-center gap-1"><TrendingDown size={12}/> ڕۆشتوو</div>
                  <div className="font-black text-[13px] text-red-700" dir="ltr">${expenseUSD.toLocaleString()}</div>
                  <div className="font-bold text-[11px] text-red-700 mt-0.5" dir="ltr">{expenseIQD.toLocaleString()} ع</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e8e4d8] p-2 shrink-0 relative overflow-hidden">
                {editingId && <div className="absolute top-0 right-0 left-0 h-1 bg-[#D4B872]"></div>}
                <form onSubmit={handleAddTransaction} className="flex flex-col gap-2 pt-1">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setType('income')} className={`flex-1 p-1.5 rounded-lg text-xs font-bold border-2 flex justify-center items-center gap-1 transition-all ${type === 'income' ? 'border-[#123524] bg-[#123524] text-[#D4B872]' : 'border-[#e8e4d8] text-gray-400'}`}><TrendingUp size={14} /> هاتوو</button>
                    <button type="button" onClick={() => setType('expense')} className={`flex-1 p-1.5 rounded-lg text-xs font-bold border-2 flex justify-center items-center gap-1 transition-all ${type === 'expense' ? 'border-red-600 bg-red-50 text-red-700' : 'border-[#e8e4d8] text-gray-400'}`}><TrendingDown size={14} /> ڕۆشتوو</button>
                    
                    {/* جۆری حساب: کارگە یان شەخسی */}
                    <select 
                      value={formWorkspace} 
                      onChange={(e) => setFormWorkspace(e.target.value)} 
                      className="w-28 p-1.5 text-xs font-bold border border-gray-200 bg-gray-50 rounded-lg outline-none text-[#123524]"
                    >
                      <option value="factory">🏢 کارگە</option>
                      <option value="personal">👤 شەخسی</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCurrency('USD')} className={`flex-1 p-1 rounded-lg text-xs font-bold border flex justify-center items-center gap-1 transition-all ${currency === 'USD' ? 'border-[#D4B872] bg-[#fdfbf6] text-[#b3954e]' : 'border-gray-200 text-gray-400'}`}><DollarSign size={14} /> دۆلار</button>
                    <button type="button" onClick={() => setCurrency('IQD')} className={`flex-1 p-1 rounded-lg text-xs font-bold border flex justify-center items-center gap-1 transition-all ${currency === 'IQD' ? 'border-[#123524] bg-[#f0f4f2] text-[#123524]' : 'border-gray-200 text-gray-400'}`}><Coins size={14} /> دینار</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" inputMode="decimal" required value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" placeholder="بڕی گشتی" dir="ltr" step="any" />
                    <input type="number" inputMode="decimal" required value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" placeholder="بڕی دراو / پێشەکی" dir="ltr" step="any" />
                  </div>
                  <div className="flex gap-2">
                    <input type="text" required value={personName} onChange={(e) => setPersonName(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" placeholder="ناوی کەس" />
                    <input type="text" required value={jobType} onChange={(e) => setJobType(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" placeholder="جۆری کار (مێز، قەنەفە، تەختەخەو...)" />
                  </div>
                  <div className="flex gap-2">
                    <input type="date" required value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="w-[30%] p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-[#D4B872]" placeholder="تێبینی (ئارەزوومەندانە)..." />
                    {editingId && (<button type="button" onClick={cancelEdit} className="px-3 bg-red-100 text-red-600 rounded-lg" title="هەڵوەشاندنەوە"><X size={16} /></button>)}
                    <button type="submit" className={`w-[30%] text-[#123524] p-2 rounded-lg text-xs hover:opacity-90 flex justify-center items-center gap-1 font-black bg-[#D4B872]`}>
                      {editingId ? <Edit size={14}/> : <Plus size={14} />} {editingId ? 'نوێکردنەوە' : 'زیادکردن'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e8e4d8] flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-right text-[11px]">
                    <thead className="text-[#123524] bg-[#f5f2ea] sticky top-0 border-b border-[#e8e4d8] shadow-sm z-10 text-[10px]">
                      <tr>
                        <th className="px-2 py-2 font-black">ناو و کار</th>
                        <th className="px-1 py-2 font-black text-center">حساب</th>
                        <th className="px-1 py-2 font-black text-center">گشتی</th>
                        <th className="px-1 py-2 font-black text-center">دراو</th>
                        <th className="px-1 py-2 font-black text-center">ماوە</th>
                        <th className="px-2 py-2 font-black text-center w-24">کردارەکان</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTransactions.length === 0 ? (
                        <tr><td colSpan={6} className="px-2 py-8 text-center text-gray-400 font-medium">هیچ مامەڵەیەک تۆمار نەکراوە...</td></tr>
                      ) : (
                        activeTransactions.map((t) => (
                          <tr key={t.id} className="border-b border-gray-100 hover:bg-[#fcfbf9]">
                            <td className="px-2 py-1.5 leading-tight">
                              <div className="truncate max-w-[100px] md:max-w-[150px] font-bold text-[#123524] flex items-center gap-1"><User size={10} className="text-[#D4B872] shrink-0"/> {t.personName}</div>
                              <div className="truncate max-w-[100px] md:max-w-[150px] text-[9px] text-[#1e583e] flex items-center gap-1 mt-0.5"><Briefcase size={9} className="text-[#D4B872] shrink-0"/> {t.jobType}</div>
                              {t.description && <div className="truncate max-w-[100px] md:max-w-[150px] text-[9px] text-gray-400 mt-0.5">{t.description}</div>}
                            </td>
                            <td className="px-1 py-1.5 text-center">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${t.workspace === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'}`}>
                                {t.workspace === 'personal' ? 'شەخسی' : 'کارگە'}
                              </span>
                            </td>
                            <td className="px-1 py-1.5 text-center font-bold text-gray-500" dir="ltr">{Number(t.totalAmount).toLocaleString()} {t.currency === 'USD' ? '$' : 'ع'}</td>
                            <td className="px-1 py-1.5 text-center font-black" dir="ltr">
                              <span className={t.type === 'income' ? 'text-[#123524]' : 'text-red-600'}>{Number(t.paidAmount).toLocaleString()}</span>
                            </td>
                            <td className="px-1 py-1.5 text-center font-bold text-orange-600" dir="ltr">
                              {Number(t.remainingAmount).toLocaleString()}
                              {t.payments && t.payments.length > 1 && (
                                <span className="text-[9px] block text-gray-400 font-normal">({t.payments.length} جار دراوە)</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {t.remainingAmount > 0 && (
                                  <button 
                                    onClick={() => setInstallmentModalItem({ ...t, isDebt: false })} 
                                    title="وەرگرتنی قیست / پارەدان" 
                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 p-1.5 rounded-md transition-colors font-bold text-[10px] flex items-center gap-0.5"
                                  >
                                    <PlusCircle size={12} /> قیست
                                  </button>
                                )}
                                <button onClick={() => handleEdit(t)} title="دەستکاری" className="text-[#123524] hover:bg-[#f5f2ea] p-1.5 rounded-md transition-colors"><Edit size={12} /></button>
                                <button onClick={() => setReceiptToPrint(t)} title="چاپکردنی پسوڵە" className="text-[#123524] bg-[#D4B872]/30 hover:bg-[#D4B872] p-1.5 rounded-md transition-colors"><Printer size={12} /></button>
                                <button onClick={() => handleDelete(t.id)} title="سڕینەوە" className="text-red-400 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================== پەڕەی 2: قەرزەکان و قیستەکان =================== */}
          {activeTab === 'debts' && (
            <div className="flex flex-col gap-3 p-3 h-full overflow-hidden bg-orange-50/50">
              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-3 grid grid-cols-2 gap-2 shrink-0">
                <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100 text-center">
                  <div className="text-[11px] text-emerald-800 font-bold mb-1">کۆی قەرزاری خەڵکە بۆم</div>
                  <div className="font-black text-sm text-emerald-600" dir="ltr">${totalOwesMeUSD.toLocaleString()}</div>
                  <div className="font-bold text-xs text-emerald-600 mt-0.5" dir="ltr">{totalOwesMeIQD.toLocaleString()} ع</div>
                </div>
                <div className="bg-red-50 rounded-lg p-2 border border-red-100 text-center">
                  <div className="text-[11px] text-red-800 font-bold mb-1">کۆی قەرزاری منم بۆ خەڵک</div>
                  <div className="font-black text-sm text-red-600" dir="ltr">${totalIOweUSD.toLocaleString()}</div>
                  <div className="font-bold text-xs text-red-600 mt-0.5" dir="ltr">{totalIOweIQD.toLocaleString()} ع</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-3 shrink-0">
                <form onSubmit={handleAddDebt} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDebtType('owes_me')} className={`flex-1 p-2 rounded-lg text-xs font-bold border-2 flex justify-center items-center gap-1 transition-all ${debtType === 'owes_me' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}><ArrowDownToLine size={14} /> خەڵک قەرزارمە</button>
                    <button type="button" onClick={() => setDebtType('i_owe')} className={`flex-1 p-2 rounded-lg text-xs font-bold border-2 flex justify-center items-center gap-1 transition-all ${debtType === 'i_owe' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}><ArrowUpFromLine size={14} /> من قەرزارم</button>
                    
                    <select 
                      value={debtWorkspace} 
                      onChange={(e) => setDebtWorkspace(e.target.value)} 
                      className="w-28 p-2 text-xs font-bold border border-gray-200 bg-gray-50 rounded-lg outline-none text-[#123524]"
                    >
                      <option value="factory">🏢 کارگە</option>
                      <option value="personal">👤 شەخسی</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" required value={debtName} onChange={(e) => setDebtName(e.target.value)} className="w-[40%] p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-orange-400" placeholder="ناوی کەسەکە" />
                    <input type="number" inputMode="decimal" required value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-orange-400" placeholder="بڕی قەرز" dir="ltr" step="any" />
                    <select value={debtCurrency} onChange={(e) => setDebtCurrency(e.target.value)} className="w-[20%] p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-orange-400">
                      <option value="USD">$</option><option value="IQD">د.ع</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="date" required value={debtDate} onChange={(e) => setDebtDate(e.target.value)} className="w-[30%] p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-orange-400" />
                    <input type="text" value={debtNote} onChange={(e) => setDebtNote(e.target.value)} className="flex-1 p-2 text-xs border border-gray-200 bg-gray-50 rounded-lg outline-none focus:border-orange-400" placeholder="تێبینی / جۆری ئیش..." />
                    {editingDebtId && (<button type="button" onClick={cancelEditDebt} className="px-3 bg-red-100 text-red-600 rounded-lg" title="هەڵوەشاندنەوە"><X size={16} /></button>)}
                    <button type="submit" className={`w-[30%] p-2 rounded-lg text-xs font-black transition-colors flex justify-center items-center gap-1 text-white ${debtType === 'owes_me' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                      {editingDebtId ? <Edit size={14}/> : <Plus size={14} />} {editingDebtId ? 'نوێکردنەوە' : 'زیادکردنی قەرز'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-orange-100 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-2 border-b bg-orange-50/50 text-xs font-black text-gray-700 flex justify-between items-center">
                  <span>لیستی قەرزەکان ({activeDebts.length})</span>
                  <span className="text-[10px] text-gray-400 font-normal">کلیک لەسەر [قیست] بکە بۆ وەرگرتنی قیستی نوێ</span>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {activeDebts.length === 0 ? (
                     <div className="text-center text-gray-400 text-xs py-4 font-medium">هیچ قەرزێک تۆمار نەکراوە...</div>
                  ) : (
                    activeDebts.map((t) => (
                      <div key={t.id} className="p-2.5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow transition-shadow flex flex-col gap-2">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                               <div className={`p-2 rounded-full ${t.type === 'owes_me' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                 {t.type === 'owes_me' ? <ArrowDownToLine size={16}/> : <ArrowUpFromLine size={16}/>}
                               </div>
                               <div>
                                 <div className="text-sm font-black text-gray-800 flex items-center gap-2">
                                   {t.name}
                                   <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${t.workspace === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'}`}>
                                     {t.workspace === 'personal' ? 'شەخسی' : 'کارگە'}
                                   </span>
                                 </div>
                                 {t.note && <div className="text-xs text-gray-500 font-medium">{t.note}</div>}
                                 <div className="text-[10px] text-gray-400 mt-0.5">{t.date}</div>
                               </div>
                            </div>
                            <div className="flex flex-col items-end">
                               <div className="text-[10px] text-gray-400 font-bold">بڕی ماوە:</div>
                               <div className={`text-base font-black ${t.type === 'owes_me' ? 'text-emerald-600' : 'text-red-600'}`} dir="ltr">
                                 {Number(t.amount).toLocaleString()} {t.currency === 'USD' ? '$' : 'ع'}
                               </div>
                            </div>
                         </div>

                         {/* مێژووی قیستەکان */}
                         {t.payments && t.payments.length > 0 && (
                           <div className="bg-[#fcfbf9] rounded-lg p-2 border border-gray-100 text-[11px]">
                             <div className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1">
                               <History size={11} className="text-[#D4B872]" /> تۆماری قیست و پارەدانەکان ({t.payments.length}):
                             </div>
                             <div className="space-y-1">
                               {t.payments.map((p, idx) => (
                                 <div key={p.id || idx} className="flex justify-between items-center text-[10px] bg-white p-1 rounded border border-gray-100">
                                   <span className="text-gray-600">#{idx + 1} - {p.date} ({p.note})</span>
                                   <span className="font-bold text-emerald-700" dir="ltr">+{Number(p.amount).toLocaleString()} {t.currency === 'USD' ? '$' : 'ع'}</span>
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}

                         <div className="flex justify-between items-center pt-1 border-t border-gray-50">
                            <div className="flex gap-1">
                               <button 
                                 onClick={() => setInstallmentModalItem({ ...t, isDebt: true })} 
                                 className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                               >
                                 <PlusCircle size={13} /> زیادکردنی قیست
                               </button>
                               <button 
                                 onClick={() => setReceiptToPrint({
                                   ...t,
                                   personName: t.name,
                                   jobType: t.jobType || t.note || 'حیسابی قەرز',
                                   totalAmount: t.totalAmount || t.amount,
                                   paidAmount: t.paidAmount || (t.payments ? t.payments.reduce((acc, p) => acc + p.amount, 0) : 0),
                                   remainingAmount: t.amount,
                                   currency: t.currency || 'USD'
                                 })}
                                 className="bg-[#123524] text-[#D4B872] hover:bg-[#1a4331] px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                               >
                                 <Printer size={13} /> پسوڵە
                               </button>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => handleEditDebt(t)} title="دەستکاری" className="text-gray-400 hover:text-gray-700 p-1"><Edit size={14} /></button>
                               <button onClick={() => handleDeleteDebt(t.id)} title="سڕینەوە" className="text-red-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================== پەڕەی 3: پاشەکەوت =================== */}
          {activeTab === 'savings' && (
            <div className="flex flex-col gap-3 p-3 h-full overflow-hidden bg-[#123524]/5">
              <div className="bg-[#123524] rounded-2xl shadow-md p-4 shrink-0 text-center relative overflow-hidden border-2 border-[#D4B872]">
                <PiggyBank size={100} className="absolute -left-6 -bottom-6 text-[#1a4331] opacity-50 rotate-[-15deg] pointer-events-none" />
                <h2 className="text-sm font-bold text-[#D4B872] mb-3 flex items-center justify-center gap-2">
                  <PiggyBank size={18} /> کۆی پاشەکەوت 
                  ({workspace === 'all' ? 'گشتی' : workspace === 'factory' ? 'کارگە' : 'شەخسی'})
                </h2>
                <div className="flex justify-around items-center">
                  <div className="text-center z-10">
                    <div className="text-xl font-black text-white" dir="ltr">${totalSavingsUSD.toLocaleString()}</div>
                    <div className="text-xs text-[#D4B872] font-bold mt-1">دۆلار</div>
                  </div>
                  <div className="h-10 w-px bg-[#1a4331]"></div>
                  <div className="text-center z-10">
                    <div className="text-xl font-black text-white" dir="ltr">{totalSavingsIQD.toLocaleString()}</div>
                    <div className="text-xs text-[#D4B872] font-bold mt-1">دینار</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e8e4d8] p-3 shrink-0">
                <form onSubmit={handleAddSavings} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSavingsType('add')} className={`flex-1 p-2 rounded-lg text-sm font-bold border-2 flex justify-center items-center gap-2 transition-all ${savingsType === 'add' ? 'border-[#123524] bg-[#123524] text-[#D4B872]' : 'border-gray-200 text-gray-400'}`}><ArrowDownToLine size={16} /> خستنە ناوەوە</button>
                    <button type="button" onClick={() => setSavingsType('withdraw')} className={`flex-1 p-2 rounded-lg text-sm font-bold border-2 flex justify-center items-center gap-2 transition-all ${savingsType === 'withdraw' ? 'border-gray-500 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-400'}`}><ArrowUpFromLine size={16} /> دەرهێنان</button>
                    
                    <select 
                      value={savingsWorkspace} 
                      onChange={(e) => setSavingsWorkspace(e.target.value)} 
                      className="w-28 p-2 text-xs font-bold border border-gray-200 bg-gray-50 rounded-lg outline-none text-[#123524]"
                    >
                      <option value="factory">🏢 کارگە</option>
                      <option value="personal">👤 شەخسی</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSavingsCurrency('USD')} className={`flex-1 p-1.5 rounded-lg text-xs font-bold border flex justify-center items-center gap-1 transition-colors ${savingsCurrency === 'USD' ? 'border-[#D4B872] bg-[#fdfbf6] text-[#b3954e]' : 'border-gray-200 text-gray-500'}`}><DollarSign size={14} /> دۆلار</button>
                    <button type="button" onClick={() => setSavingsCurrency('IQD')} className={`flex-1 p-1.5 rounded-lg text-xs font-bold border flex justify-center items-center gap-1 transition-colors ${savingsCurrency === 'IQD' ? 'border-[#123524] bg-[#f0f4f2] text-[#123524]' : 'border-gray-200 text-gray-500'}`}><Coins size={14} /> دینار</button>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" inputMode="decimal" required value={savingsAmount} onChange={(e) => setSavingsAmount(e.target.value)} className="w-[30%] p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872]" placeholder="بڕی پارە" dir="ltr" step="any" />
                    <input type="date" required value={savingsDate} onChange={(e) => setSavingsDate(e.target.value)} className="w-[30%] p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872]" />
                    <input type="text" value={savingsNote} onChange={(e) => setSavingsNote(e.target.value)} className="flex-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872]" placeholder="تێبینی (ئارەزوومەندانە)" />
                  </div>
                  <button type="submit" className={`w-full p-2 rounded-lg text-sm font-black transition-colors flex justify-center items-center gap-2 ${savingsType === 'add' ? 'bg-[#D4B872] text-[#123524]' : 'bg-gray-800 text-white'}`}>
                    {savingsType === 'add' ? 'زیادکردن' : 'دەرهێنان'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#e8e4d8] flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-2 border-b bg-[#f5f2ea] text-xs font-black text-[#123524]">تۆماری دەخیلە</div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                  {activeSavings.length === 0 ? (
                     <div className="text-center text-gray-400 text-xs py-4 font-medium">هیچ پارەیەک نییە...</div>
                  ) : (
                    activeSavings.map((t) => (
                      <div key={t.id} className="flex justify-between items-center p-2 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow transition-shadow">
                         <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-full ${t.type === 'add' ? 'bg-[#eaf1ec] text-[#123524]' : 'bg-gray-100 text-gray-600'}`}>
                              {t.type === 'add' ? <ArrowDownToLine size={14}/> : <ArrowUpFromLine size={14}/>}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#123524]">{t.note}</div>
                              <div className="text-[9px] text-gray-400">{t.date}</div>
                            </div>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <div className={`text-sm font-black ${t.type === 'add' ? 'text-[#123524]' : 'text-gray-600'}`} dir="ltr">
                              {t.type === 'add' ? '+' : '-'} {Number(t.amount).toLocaleString()} {t.currency === 'USD' ? '$' : 'ع'}
                            </div>
                            <button onClick={() => handleDeleteSavings(t.id)} title="سڕینەوە" className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* باڕی خوارەوە */}
        <nav className="bg-white border-t border-gray-200 flex justify-around items-center p-1.5 pb-2 shrink-0 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20">
          <button onClick={() => setActiveTab('accounting')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all w-20 ${activeTab === 'accounting' ? 'text-[#123524] bg-[#f5f2ea] font-black' : 'text-gray-400 hover:text-gray-600'}`}>
            <ReceiptText size={18} />
            <span className="text-[9px]">ژمێریاری</span>
          </button>
          
          <button onClick={() => setActiveTab('debts')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all w-20 ${activeTab === 'debts' ? 'text-[#123524] bg-[#f5f2ea] font-black' : 'text-gray-400 hover:text-gray-600'}`}>
            <Handshake size={18} />
            <span className="text-[9px]">قەرز و قیست</span>
          </button>

          <button onClick={() => setActiveTab('savings')} className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all w-20 ${activeTab === 'savings' ? 'text-[#123524] bg-[#f5f2ea] font-black' : 'text-gray-400 hover:text-gray-600'}`}>
            <PiggyBank size={18} />
            <span className="text-[9px]">پاشەکەوت</span>
          </button>
        </nav>
      </div>

      {/* ========================================= */}
      {/* مۆداڵی داتابەیس و باکئەپ */}
      {/* ========================================= */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border-2 border-[#D4B872]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-base text-[#123524] flex items-center gap-2">
                <Database size={18} className="text-[#D4B872]" /> بەڕێوەبردنی بنکەی زانیاری (Database)
              </h3>
              <button onClick={() => setShowBackupModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-900">داتابەیسی هەمیشەیی چالاکە</h4>
                  <p className="text-[10px] text-emerald-700">هەموو زانیارییەکان بە پارێزراوی لە ناوخۆی سیستەمەکە پاشەکەوت دەبن.</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-3 space-y-3 bg-[#fcfbf9]">
                <h4 className="text-xs font-bold text-gray-700">هەڵگرتنی باکئەپی پارێزراو:</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDownloadBackup}
                    className="flex-1 bg-[#123524] text-[#D4B872] hover:bg-[#1a4331] p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download size={14} /> داگرتنی باکئەپ (JSON)
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Upload size={14} /> گەڕاندنەوەی باکئەپ
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleRestoreFile} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
              </div>

              <button 
                onClick={() => setShowBackupModal(false)}
                className="w-full p-2.5 bg-gray-200 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-300 transition-colors"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* مۆداڵی وەرگرتنی قیستی نوێ / پارەدان */}
      {/* ========================================= */}
      {installmentModalItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border-2 border-[#D4B872]">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-black text-base text-[#123524] flex items-center gap-2">
                <PlusCircle size={18} className="text-[#D4B872]" /> تۆمارکردنی قیست / پارەدان
              </h3>
              <button onClick={() => setInstallmentModalItem(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#fcfbf9] p-3 rounded-xl border border-gray-200 mb-4 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500 font-bold">ناوی کەس:</span>
                <span className="font-black text-[#123524]">{installmentModalItem.personName || installmentModalItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">بڕی ماوەی پێشوو:</span>
                <span className="font-black text-red-600" dir="ltr">
                  {Number(installmentModalItem.amount ?? installmentModalItem.remainingAmount ?? 0).toLocaleString()} {installmentModalItem.currency === 'USD' ? '$' : 'ع'}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddInstallment} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">بڕی قیستی وەرگیراو:</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  step="any"
                  required 
                  value={installmentAmount} 
                  onChange={(e) => setInstallmentAmount(e.target.value)} 
                  placeholder="بڕی پارەی دراو..." 
                  className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872] font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">بەرواری پارەدان:</label>
                <input 
                  type="date" 
                  required 
                  value={installmentDate} 
                  onChange={(e) => setInstallmentDate(e.target.value)} 
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">تێبینی / ژمارەی قیست:</label>
                <input 
                  type="text" 
                  value={installmentNote} 
                  onChange={(e) => setInstallmentNote(e.target.value)} 
                  placeholder="وەک: قیستی مانگی یەکەم، قیستی دووەم..." 
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-[#D4B872]"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => setInstallmentModalItem(null)} 
                  className="flex-1 p-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  داخستن
                </button>
                <button 
                  type="submit" 
                  className="flex-1 p-2.5 bg-[#123524] text-[#D4B872] rounded-xl text-xs font-black hover:bg-[#1a4331] flex items-center justify-center gap-1 shadow-md"
                >
                  <CheckCircle2 size={16} /> تۆمارکردنی قیست
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* پەڕەی تایبەت بە پسوڵەی فەرمی (بە هێدەری جێگیر لە سەرەوە) */}
      {/* ========================================================================= */}
      {receiptToPrint && (
        <div className="fixed inset-0 bg-gray-800/80 z-50 flex items-center justify-center p-2 md:p-6 print:bg-white print:p-0 overflow-y-auto" dir="rtl">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh] print:max-h-none print:h-auto print:shadow-none print:rounded-none print:w-full">
             
             {/* دوگمەکانی کۆنتڕۆڵ */}
             <div className="bg-[#123524] p-3 flex justify-between items-center shrink-0 print:hidden z-30">
               <button onClick={() => setReceiptToPrint(null)} className="text-white hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-bold">
                 <X size={16} /> داخستن
               </button>
               <button onClick={() => window.print()} className="bg-[#D4B872] text-[#123524] px-5 py-2 font-black rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-xs shadow-md">
                 <Printer size={16} /> چاپکردنی پسوڵە
               </button>
             </div>

             {/* بەشی ناوەڕۆکی پسوڵەکە */}
             <div className="overflow-y-auto flex-1 bg-white font-sans text-[#1a211e]" id="receipt-content">
                
                {/* 🌟 ئەم بەشە بە جێگیری لە سەرەوەی پسوڵەکە دەمێنێتەوە (Sticky Header) 🌟 */}
                <div className="sticky top-0 bg-white z-20 px-8 pt-8 pb-4 border-b border-gray-200 shadow-sm print:static print:p-0 print:shadow-none print:border-b-0">
                   
                   {/* ١. لۆگۆی ماڵی کەشخە VENS HOME و باجی VH */}
                   <div className="flex flex-col items-center justify-center text-center mb-4">
                      <div className="flex items-center gap-3 mb-1">
                         <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black text-[#b38f38] tracking-wide">
                              ماڵی کەشخە
                            </div>
                            <div className="text-2xl md:text-3xl font-black text-[#123524] tracking-widest leading-none mt-0.5">
                              VENS HOME
                            </div>
                         </div>
                         <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white border-2 border-[#D4B872] flex items-center justify-center font-black text-[#967428] text-lg md:text-xl shadow-sm shrink-0">
                           VH
                         </div>
                      </div>

                      <h1 className="text-xl md:text-2xl font-black text-[#123524] mt-2 mb-1 tracking-wide">
                        هەژماری ڤێنس هۆم
                      </h1>
                      <p className="text-xs font-bold text-gray-500 tracking-wider flex items-center justify-center gap-1.5" dir="ltr">
                        {receiptToPrint.workspace === 'personal' ? 'هەژماری شەخسی' : 'هەژماری کارگە'} — <span className="font-bold text-gray-800">0776 151 6525</span>
                      </p>
                   </div>

                   {/* ٢. خشتەی زانیارییەکان */}
                   <div className="grid grid-cols-2 gap-x-10 gap-y-2.5 text-sm md:text-base pt-2">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                         <span className="font-bold text-gray-700">ناو:</span>
                         <span className="font-black text-[#123524] text-base">{receiptToPrint.personName || receiptToPrint.name || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                         <span className="font-bold text-gray-700">بەروار:</span>
                         <span className="font-bold text-[#123524]" dir="ltr">{receiptToPrint.date?.split(' - ')[0] || getTodayDate()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                         <span className="font-bold text-gray-700">جۆری ئیش:</span>
                         <span className="font-black text-[#123524]">{receiptToPrint.jobType || receiptToPrint.note || '—'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                         <span className="font-bold text-gray-700">کۆی پارە:</span>
                         <span className="font-black text-[#123524] text-base" dir="ltr">
                           {Number(receiptToPrint.totalAmount ?? receiptToPrint.amount ?? 0).toLocaleString()} {receiptToPrint.currency === 'USD' ? '$' : 'د.ع'}
                         </span>
                      </div>
                   </div>

                </div>

                {/* بەشی ناوەڕۆکی خشتەی قیستەکان */}
                <div className="p-8 pt-6">
                   
                   {/* ٣. خشتەی قیستەکان و پارە وەرگیراوەکان */}
                   <div className="mb-6">
                      <table className="w-full border border-gray-400 text-center text-xs md:text-sm">
                         <thead className="bg-[#123524] text-[#D4B872]">
                            <tr className="border-b border-gray-400">
                               <th className="p-2.5 font-black w-12 border-l border-gray-400">#</th>
                               <th className="p-2.5 font-black border-l border-gray-400">پارەی وەرگیراو</th>
                               <th className="p-2.5 font-black border-l border-gray-400">بەروار</th>
                               <th className="p-2.5 font-black">ماوە</th>
                            </tr>
                         </thead>
                         <tbody>
                            {(!receiptToPrint.payments || receiptToPrint.payments.length === 0) ? (
                               <tr className="border-b border-gray-300">
                                  <td colSpan={4} className="p-5 text-center text-gray-400 font-medium">
                                    هیچ پارەدانێک تۆمار نەکراوە
                                  </td>
                               </tr>
                            ) : (
                               receiptToPrint.payments.map((pay, idx) => (
                                  <tr key={pay.id || idx} className="border-b border-gray-300 hover:bg-gray-50">
                                     <td className="p-2.5 font-bold border-l border-gray-300">{idx + 1}</td>
                                     <td className="p-2.5 font-black text-[#123524] border-l border-gray-300" dir="ltr">
                                        {Number(pay.amount).toLocaleString()} {receiptToPrint.currency === 'USD' ? '$' : 'د.ع'}
                                     </td>
                                     <td className="p-2.5 text-gray-700 border-l border-gray-300" dir="ltr">
                                        {pay.date || '—'}
                                     </td>
                                     <td className="p-2.5 font-bold text-red-600" dir="ltr">
                                        {Number(pay.remainingAfter !== undefined ? pay.remainingAfter : (receiptToPrint.remainingAmount ?? 0)).toLocaleString()} {receiptToPrint.currency === 'USD' ? '$' : 'د.ع'}
                                     </td>
                                  </tr>
                               ))
                            )}
                         </tbody>
                      </table>
                   </div>

                   {/* کۆی گشتی و باڵانس */}
                   <div className="bg-[#fcfbf9] rounded-xl p-4 border border-[#D4B872]/40 flex justify-between items-center mb-8 text-xs md:text-sm">
                      <div>
                         <span className="text-gray-500 font-bold block">کۆی پارەی وەرگیراو:</span>
                         <span className="font-black text-[#123524] text-base md:text-lg" dir="ltr">
                           {Number(receiptToPrint.paidAmount || (receiptToPrint.payments ? receiptToPrint.payments.reduce((acc, p) => acc + p.amount, 0) : 0)).toLocaleString()} {receiptToPrint.currency === 'USD' ? '$' : 'د.ع'}
                         </span>
                      </div>
                      <div className="h-8 w-px bg-gray-200"></div>
                      <div className="text-left">
                         <span className="text-gray-500 font-bold block">بڕی کۆتایی ماوە:</span>
                         <span className="font-black text-red-600 text-base md:text-lg" dir="ltr">
                           {Number(receiptToPrint.remainingAmount ?? receiptToPrint.amount ?? 0).toLocaleString()} {receiptToPrint.currency === 'USD' ? '$' : 'د.ع'}
                         </span>
                      </div>
                   </div>

                   {/* واژووی لایەنەکان */}
                   <div className="flex justify-between items-end pt-4 border-t-2 border-gray-100">
                      <div className="text-center w-1/3">
                         <p className="font-bold text-gray-400 text-xs mb-8">واژووی کڕیار</p>
                         <div className="w-28 border-b-2 border-gray-300 border-dashed mx-auto"></div>
                      </div>
                      
                      <div className="text-center w-1/3 px-2">
                          <p className="font-black text-[#123524] text-sm mb-0.5">VENS HOME</p>
                          <p className="text-[10px] text-[#D4B872] font-bold">هەمیشە باشترینەکان لای ئێمە دەستدەکەوێت</p>
                      </div>
                      
                      <div className="text-center w-1/3">
                         <p className="font-bold text-gray-400 text-xs mb-8">واژووی پێشانگا</p>
                         <div className="w-28 border-b-2 border-gray-300 border-dashed mx-auto"></div>
                      </div>
                   </div>

                </div>

             </div>
          </div>
        </div>
      )}
    </>
  );
}
