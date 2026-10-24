import React, { useState, useEffect } from 'react';

export default function App() {
  // 👤 FOYDALANUVCHI SEANSI VA AKKAUNT
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('react_ombor_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState('login'); // 'login' yoki 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // 📦 OMBOR MA'LUMOTLARI
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('react_ombor_data');
    return saved ? JSON.parse(saved) : [];
  });

  const [isPro, setIsPro] = useState(() => {
    return localStorage.getItem('react_ombor_is_pro') === 'true';
  });

  const [form, setForm] = useState({
    name: '',
    blockPrice: '',
    count: '',
    sellPrice: ''
  });

  // MODALLAR VA TOAST
  const [modal, setModal] = useState({ show: false, id: null, type: null, title: '' });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // KARTA FORMASI
  const [cardForm, setCardForm] = useState({ cardNumber: '', expiry: '', cardHolder: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    localStorage.setItem('react_ombor_data', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('react_ombor_is_pro', isPro);
  }, [isPro]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('react_ombor_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('react_ombor_user');
    }
  }, [currentUser]);

  // TOAST BILDIRISHNOMA
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 3500);
  };

  // 🔑 AUTHENTICATION LOGIKASI
  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('react_ombor_accounts') || '[]');

    if (authMode === 'register') {
      if (!authForm.name.trim() || !authForm.email.trim() || !authForm.password) {
        showToast("Barcha maydonlarni to'ldiring!", "error");
        return;
      }

      const existingUser = users.find(u => u.email.toLowerCase() === authForm.email.toLowerCase());
      if (existingUser) {
        showToast("Bu email bilan ro'yxatdan o'tilgan!", "error");
        return;
      }

      const newUser = { id: Date.now(), name: authForm.name, email: authForm.email, password: authForm.password };
      users.push(newUser);
      localStorage.setItem('react_ombor_accounts', JSON.stringify(users));

      setCurrentUser(newUser);
      showToast(`Hush kelibsiz, ${newUser.name}!`, "success");
    } else {
      const user = users.find(u => u.email.toLowerCase() === authForm.email.toLowerCase() && u.password === authForm.password);
      if (!user) {
        showToast("Email yoki parol noto'g'ri!", "error");
        return;
      }

      setCurrentUser(user);
      showToast(`Tizimga kirildi: ${user.name}`, "success");
    }

    setAuthForm({ name: '', email: '', password: '' });
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    setShowLogoutConfirm(false);
    showToast("Tizimdan chiqdingiz", "info");
  };

  // OMBOR VA TO'LOV LOGIKASI
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCardChange = (e) => {
    let { name, value } = e.target;
    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 3) value = value.substring(0, 2) + '/' + value.substring(2);
    }
    setCardForm({ ...cardForm, [name]: value });
  };

  const name = form.name.trim();
  const blockPrice = parseFloat(form.blockPrice) || 0;
  const count = parseInt(form.count) || 0;
  const sellPrice = parseFloat(form.sellPrice) || 0;

  const unitCost = count > 0 ? blockPrice / count : 0;
  const totalRevenue = sellPrice * count;
  const netProfit = totalRevenue - blockPrice;
  const margin = blockPrice > 0 ? ((netProfit / blockPrice) * 100).toFixed(1) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isPro && inventory.length >= 10) {
      setShowPaywall(true);
      return;
    }

    if (!name || blockPrice <= 0 || count <= 0 || sellPrice < 0) {
      showToast("Iltimos, barcha maydonlarni to'g'ri to'ldiring!", "error");
      return;
    }

    const newItem = { id: Date.now(), name, blockPrice, count, sellPrice };
    setInventory([...inventory, newItem]);
    setForm({ name: '', blockPrice: '', count: '', sellPrice: '' });
    showToast("Mahsulot omborga saqlandi!", "success");
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (cardForm.cardNumber.replace(/\s/g, '').length < 16 || cardForm.expiry.length < 5 || !cardForm.cardHolder.trim()) {
      showToast("Karta ma'lumotlarini to'liq va to'g'ri kiriting!", "error");
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPro(true);
      setShowPaymentForm(false);
      setShowPaywall(false);
      showToast("🎉 To'lov muvaffaqiyatli o'tdi! PRO ta'rif faollashdi.", "success");
    }, 2000);
  };

  const openModal = (id, type, title) => setModal({ show: true, id, type, title });

  const confirmAction = () => {
    if (modal.type === 'single') {
      setInventory(inventory.filter(item => item.id !== modal.id));
      showToast("Mahsulot o'chirildi", "info");
    } else if (modal.type === 'all') {
      setInventory([]);
      showToast("Barcha mahsulotlar o'chirildi", "info");
    }
    setModal({ show: false, id: null, type: null, title: '' });
  };

  const totalInvestment = inventory.reduce((acc, item) => acc + item.blockPrice, 0);
  const totalRevSum = inventory.reduce((acc, item) => acc + (item.sellPrice * item.count), 0);
  const totalProfitSum = totalRevSum - totalInvestment;

  const formatUZS = (val) => new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 relative font-sans">
      
      {/* 🔔 CUSTOM TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md text-sm font-bold text-white ${
            toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
            toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
            'bg-slate-800/90 border-slate-600 text-slate-200'
          }`}>
            <i className={`text-lg fa-solid ${
              toast.type === 'error' ? 'fa-circle-xmark text-rose-400' :
              toast.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-info text-blue-400'
            }`}></i>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* 🚪 LOGOUT CONFIRMATION MODAL */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-5 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl mx-auto">
              <i className="fa-solid fa-right-from-bracket"></i>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Tizimdan chiqasizmi?</h3>
              <p className="text-xs text-slate-400">Rostan ham akkountingizdan chiqib ketmoqchimisiz?</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2.5 rounded-xl transition text-sm">
                Yo'q, qolaman
              </button>
              <button onClick={confirmLogout} className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-rose-500/20 text-sm">
                Ha, chiqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 AUTHENTICATION MODALI */}
      {!currentUser ? (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mx-auto">
                <i className="fa-solid fa-user-lock"></i>
              </div>
              <h2 className="text-2xl font-black text-white">
                {authMode === 'login' ? 'Tizimga Kirish' : 'Ro\'yxatdan O\'tish'}
              </h2>
              <p className="text-slate-400 text-xs">Ombor tizimidan foydalanish uchun hisobingizga kiring</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Ismingiz</label>
                  <input type="text" name="name" value={authForm.name} onChange={handleAuthChange} placeholder="Firdavs" required
                         className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Email Manzil</label>
                <input type="email" name="email" value={authForm.email} onChange={handleAuthChange} placeholder="user@gmail.com" required
                       className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Parol</label>
                <input type="password" name="password" value={authForm.password} onChange={handleAuthChange} placeholder="••••••••" required
                       className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-95">
                {authMode === 'login' ? 'Kirish' : 'Ro\'yxatdan O\'tish'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-700/60">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-xs font-semibold text-emerald-400 hover:underline">
                {authMode === 'login' ? "Akkauntingiz yo'qmi? Ro'yxatdan o'ting" : "Akkauntingiz bormi? Tizimga kiring"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 💳 KARTA BILAN TO'LOV QILISH MODALI */}
          {showPaymentForm && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-emerald-500/40 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2 text-white font-extrabold text-lg">
                    <i className="fa-solid fa-credit-card text-emerald-400"></i> PRO Obuna Xaridi
                  </div>
                  <button onClick={() => setShowPaymentForm(false)} className="text-slate-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>

                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 rounded-2xl text-white space-y-3 shadow-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">Uzcard / Humo / Visa</span>
                    <i className="fa-solid fa-wifi text-lg"></i>
                  </div>
                  <p className="font-mono text-lg tracking-widest">{cardForm.cardNumber || '**** **** **** ****'}</p>
                  <div className="flex justify-between text-xs font-mono">
                    <span>{cardForm.cardHolder.toUpperCase() || 'ISM FAMILIYA'}</span>
                    <span>{cardForm.expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Karta Raqami</label>
                    <input type="text" name="cardNumber" value={cardForm.cardNumber} onChange={handleCardChange} placeholder="8600 0000 0000 0000" required
                           className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono transition"/>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Muddati (MM/YY)</label>
                      <input type="text" name="expiry" value={cardForm.expiry} onChange={handleCardChange} placeholder="12/28" required
                             className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 font-mono transition"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Summa</label>
                      <input type="text" value="5.00 $" disabled className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-emerald-400 font-bold"/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Karta Egasining Ismi</label>
                    <input type="text" name="cardHolder" value={cardForm.cardHolder} onChange={handleCardChange} placeholder="FIRDAVS RAHIMJONOV" required
                           className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white uppercase focus:outline-none focus:border-emerald-500 transition"/>
                  </div>

                  <button type="submit" disabled={isProcessing} className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                    {isProcessing ? <><i className="fa-solid fa-spinner animate-spin"></i> To'lov amalga oshirilmoqda...</> : <><i className="fa-solid fa-lock"></i> 5.00 $ To'lov Qilish</>}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 👑 PAYWALL MODAL */}
          {showPaywall && !showPaymentForm && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-emerald-500/40 p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200 relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 text-2xl font-black mx-auto shadow-lg shadow-emerald-500/20">
                  <i className="fa-solid fa-crown"></i>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                    Bepul limit tugadi
                  </span>
                  <h3 className="text-2xl font-extrabold text-white">PRO Ta'rifga o'ting!</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Bepul ta'rifda maksimal <strong className="text-emerald-400">10 ta mahsulot</strong> qo'shishingiz mumkin. Cheksiz mahsulotlar uchun PRO tarifni xarid qiling.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button onClick={() => setShowPaymentForm(true)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2">
                    <i className="fa-solid fa-credit-card"></i> Karta orqali xarid qilish ($5.00)
                  </button>
                  <button onClick={() => setShowPaywall(false)} className="w-full bg-slate-700/50 hover:bg-slate-700 text-slate-400 font-semibold py-2.5 rounded-xl transition text-xs">
                    Keyinroq / Yopish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🗑 DELETE CONFIRM MODAL */}
          {modal.show && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xl mx-auto">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white">Ishonchingiz komilmi?</h3>
                  <p className="text-sm text-slate-400">{modal.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button onClick={() => setModal({ show: false, id: null, type: null, title: '' })} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-xl transition">
                    Bekor qilish
                  </button>
                  <button onClick={confirmAction} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl transition shadow-lg shadow-rose-500/20">
                    Ha, o'chirish
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HEADER (USER PROFILE + LIMIT STATUS) */}
          <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-400 flex items-center gap-3">
                <i className="fa-solid fa-boxes-packing"></i> React Ombor Tizimi
              </h1>
              <p className="text-slate-400 text-sm mt-1">Vite + React + Tailwind CSS orqali qurilgan dastur</p>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-end">
              {/* USER PROFILE INFO */}
              <div className="flex items-center gap-2.5 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-700 text-slate-200 text-xs font-bold">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <i className="fa-solid fa-user"></i>
                </div>
                <span>{currentUser.name}</span>
                <button onClick={() => setShowLogoutConfirm(true)} className="text-rose-400 hover:text-rose-300 ml-1.5 p-1 transition" title="Tizimdan chiqish">
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>

              {/* 👑 PRO TARIF / LIMIT STATUS (BOSGANDA TO'LOV OYNASINI OCHADI) */}
              <button 
                onClick={() => setShowPaymentForm(true)}
                className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-900 px-4 py-2 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition cursor-pointer group"
                title="PRO Ta'rif xarid qilish"
              >
                {isPro ? (
                  <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                    <i className="fa-solid fa-crown text-amber-400 text-base animate-bounce"></i> PRO TA'RIF (CHEKSIZ)
                  </div>
                ) : (
                  <>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400 group-hover:text-emerald-400 transition">PRO O'tish ($5)</p>
                      <p className={`text-xs font-black ${inventory.length >= 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {inventory.length} / 10 ta
                      </p>
                    </div>
                    <div className="w-2 h-8 bg-slate-700 rounded-full overflow-hidden flex flex-col justify-end">
                      <div className={`w-full transition-all duration-300 ${inventory.length >= 10 ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ height: `${(inventory.length / 10) * 100}%` }}></div>
                    </div>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* STATS DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Jami Sarmoya</p>
                <h3 className="text-2xl font-black text-white mt-1">{formatUZS(totalInvestment)}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl">
                <i className="fa-solid fa-wallet"></i>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Kutilayotgan Tushum</p>
                <h3 className="text-2xl font-black text-white mt-1">{formatUZS(totalRevSum)}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl">
                <i className="fa-solid fa-chart-line"></i>
              </div>
            </div>

            <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Umumiy Sof Foyda / Ziyon</p>
                <h3 className={`text-2xl font-black mt-1 ${totalProfitSum > 0 ? 'text-emerald-400' : totalProfitSum < 0 ? 'text-rose-400' : 'text-yellow-400'}`}>
                  {totalProfitSum > 0 ? '+' : ''}{formatUZS(totalProfitSum)}
                </h3>
              </div>
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl ${totalProfitSum > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : totalProfitSum < 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'}`}>
                <i className="fa-solid fa-coins"></i>
              </div>
            </div>
          </div>

          {/* FORM & LIVE PREVIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                <i className="fa-solid fa-calculator text-emerald-400"></i> Mahsulot Qo'shish
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Mahsulot Nomi</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Masalan: Coca-Cola 1.5L" required className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">1 Blok Narxi</label>
                    <input type="number" name="blockPrice" value={form.blockPrice} onChange={handleChange} placeholder="100000" min="1" required className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Blokda Nechta?</label>
                    <input type="number" name="count" value={form.count} onChange={handleChange} placeholder="6" min="1" required className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">1 Dona Sotish Narxi</label>
                  <input type="number" name="sellPrice" value={form.sellPrice} onChange={handleChange} placeholder="12000" min="0" required className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"/>
                </div>

                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95">
                  <i className="fa-solid fa-plus"></i> Omborga Saqlash
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                  <i className="fa-solid fa-chart-pie text-emerald-400"></i> Jonli Tahlil (Live Preview)
                </h2>

                <div className={`mt-4 p-5 rounded-2xl border transition-all duration-300 ${netProfit > 0 ? 'bg-emerald-950/20 border-emerald-500/40' : netProfit < 0 ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-900 border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Kiritilayotgan Tovar</span>
                      <h3 className="text-xl font-black text-white mt-0.5">{name || "Ma'lumot kiritilmadi..."}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${netProfit > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : netProfit < 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {netProfit > 0 ? `FOYDA (+${margin}%)` : netProfit < 0 ? `ZARAR (${margin}%)` : 'KUTILMOQDA'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 font-medium">1 Dona Tannarxi</p>
                      <p className="text-lg font-extrabold text-white mt-1">{formatUZS(unitCost)}</p>
                    </div>
                    <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 font-medium">Jami Sotuv Tushumi</p>
                      <p className="text-lg font-extrabold text-white mt-1">{formatUZS(totalRevenue)}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Sof Foyda / Ziyon</p>
                      <p className={`text-2xl font-black mt-0.5 ${netProfit > 0 ? 'text-emerald-400' : netProfit < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {netProfit > 0 ? '+' : ''}{formatUZS(netProfit)}
                      </p>
                    </div>
                    <div className={`text-3xl ${netProfit > 0 ? 'text-emerald-400' : netProfit < 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                      <i className={`fa-solid ${netProfit > 0 ? 'fa-arrow-trend-up' : netProfit < 0 ? 'fa-arrow-trend-down' : 'fa-calculator'}`}></i>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 text-center mt-4">
                💡 React state mexanizmi orqali har bir harf kiritilishi bilan natija darhol yangilanadi.
              </p>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-emerald-400"></i> Ombordagi Mahsulotlar Ro'yxati
              </h2>
              {inventory.length > 0 && (
                <button onClick={() => openModal(null, 'all', "Ombordagi barcha mahsulotlar o'chirib yuboriladi!")} className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 self-start sm:self-auto">
                  <i className="fa-solid fa-trash-can"></i> Bazani Tozalash
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/80 text-slate-400 border-b border-slate-700 text-xs uppercase tracking-wider">
                    <th className="p-3">Mahsulot Nomi</th>
                    <th className="p-3">Blok Narxi</th>
                    <th className="p-3">Dona Son</th>
                    <th className="p-3">1 Dona Tannarxi</th>
                    <th className="p-3">Sotish Narxi</th>
                    <th className="p-3">Jami Tushum</th>
                    <th className="p-3">Foyda / Ziyon</th>
                    <th className="p-3 text-center">O'chirish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {inventory.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-500">
                        <i className="fa-solid fa-box-open text-2xl mb-2 block"></i>
                        Ombor bo'sh. Yuqoridagi forma orqali mahsulot qo'shing!
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item) => {
                      const uCost = item.blockPrice / item.count;
                      const tRev = item.sellPrice * item.count;
                      const profit = tRev - item.blockPrice;

                      return (
                        <tr key={item.id} className="hover:bg-slate-700/30 transition">
                          <td className="p-3 font-bold text-white">{item.name}</td>
                          <td className="p-3">{formatUZS(item.blockPrice)}</td>
                          <td className="p-3 font-semibold text-slate-300">{item.count} ta</td>
                          <td className="p-3 text-slate-300">{formatUZS(uCost)}</td>
                          <td className="p-3 text-slate-300">{formatUZS(item.sellPrice)}</td>
                          <td className="p-3 font-semibold text-white">{formatUZS(tRev)}</td>
                          <td className={`p-3 font-black ${profit > 0 ? 'text-emerald-400' : profit < 0 ? 'text-rose-400' : 'text-yellow-400'}`}>
                            {profit > 0 ? '+' : ''}{formatUZS(profit)}
                          </td>
                          <td className="p-3 text-center">
                            <button onClick={() => openModal(item.id, 'single', `"${item.name}" mahsuloti ombordan o'chiriladi.`)} className="text-rose-400 hover:text-rose-300 p-1 transition" title="O'chirish">
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}