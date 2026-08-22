// ====== GANTI DENGAN URL WEB APP BARU ANDA ======
const API_URL = 'https://script.google.com/macros/s/AKfycbzlrlkq4whXcjTQ2DCrqvQV0jeeY31P2cJKxZz1TKl5V-pqBztTQan3p0d-G_VRgyTP/exec'; 
let appData = null;

// Format Rupiah
function formatRupiahFormat(angka) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka); }
function inputRupiah(input) { let angka = input.value.replace(/[^0-9]/g, ''); input.value = angka.replace(/\B(?=(\d{3})+(?!\d))/g, "."); }

// ==========================================
// ROUTING & TOMBOL KEMBALI (SMART BACK BUTTON)
// ==========================================
// Mencegah aplikasi keluar saat tombol kembali ditekan saat popup terbuka
window.addEventListener('popstate', (e) => {
  if (document.body.classList.contains('swal2-shown')) { 
    Swal.close(); 
    return; 
  }
  const hash = location.hash;
  if (hash === '#riwayat') renderHistory(true);
  else if (hash === '#pengaturan') renderSettings(true);
  else renderDashboard(true);
});

const nativeSwalFire = Swal.fire;
Swal.fire = function(...args) {
  if (!document.body.classList.contains('swal2-shown')) {
    history.pushState({ isPopup: true }, "", location.hash || "#");
  }
  return nativeSwalFire.apply(this, args).then((result) => {
    setTimeout(() => { 
      if (!document.body.classList.contains('swal2-shown') && history.state && history.state.isPopup) {
        history.back(); 
      }
    }, 150);
    return result;
  });
};

// ==========================================
// 0. SISTEM LOGIN & INISIALISASI
// ==========================================
window.onload = () => {
  if (sessionStorage.getItem('isLoggedIn') === 'true') {
    tampilkanMainApp();
  } else {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
  }
};

async function prosesLogin() {
  const user = document.getElementById('inputUser').value;
  const pass = document.getElementById('inputPass').value;

  if (!user || !pass) {
    Swal.fire('Perhatian', 'Username dan Password harus diisi!', 'warning');
    return;
  }

  Swal.fire({ title: 'Otentikasi...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  
  try {
    const res = await fetch(API_URL, { 
      method: 'POST', 
      body: JSON.stringify({ action: 'login', data: { username: user, password: pass } }) 
    });
    const result = await res.json();

    if (result.success) {
      sessionStorage.setItem('isLoggedIn', 'true');
      Swal.close();
      document.getElementById('inputUser').value = '';
      document.getElementById('inputPass').value = '';
      tampilkanMainApp();
    } else {
      Swal.fire('Gagal Masuk', result.message, 'error');
    }
  } catch (e) {
    Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
  }
}

// ==========================================
// FITUR SHOW/HIDE PASSWORD
// ==========================================
function togglePassword() {
  const passInput = document.getElementById('inputPass');
  const ikonMata = document.getElementById('ikonMata');
  
  if (passInput.type === 'password') {
    passInput.type = 'text';
    ikonMata.classList.remove('fa-eye');
    ikonMata.classList.add('fa-eye-slash');
  } else {
    passInput.type = 'password';
    ikonMata.classList.remove('fa-eye-slash');
    ikonMata.classList.add('fa-eye');
  }
}

function prosesLogout() {
  Swal.fire({
    title: 'Keluar?', text: 'Sesi Anda akan ditutup.', icon: 'question',
    showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Ya, Keluar'
  }).then((r) => {
    if (r.isConfirmed) {
      sessionStorage.removeItem('isLoggedIn');
      document.getElementById('main-app').classList.add('hidden');
      document.getElementById('login-screen').classList.remove('hidden');
      appData = null; 
      history.pushState(null, "", window.location.pathname); // Hapus hash riwayat
    }
  });
}

async function tampilkanMainApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  
  document.getElementById('app-content').innerHTML = `
    <div class="animate-pulse flex flex-col gap-5 mt-5">
      <div class="h-24 bg-slate-200 rounded-2xl w-full"></div>
      <div class="grid grid-cols-2 gap-4"><div class="h-16 bg-slate-200 rounded-2xl"></div><div class="h-16 bg-slate-200 rounded-2xl"></div></div>
      <div class="h-40 bg-slate-200 rounded-2xl w-full"></div>
    </div>`;
  
  await muatData();
}

async function muatData() {
  try {
    const response = await fetch(API_URL);
    appData = await response.json();
    
    // Tampilkan layar sesuai hash url saat direfresh
    const hash = location.hash;
    if (hash === '#riwayat') renderHistory(true);
    else if (hash === '#pengaturan') renderSettings(true);
    else renderDashboard(true);

  } catch (error) {
    document.getElementById('app-content').innerHTML = `<p class="text-center text-rose-500 mt-10">Gagal terhubung ke database.</p>`;
  }
}

function ubahNav(index) {
  const btns = document.querySelectorAll('.nav-btn');
  btns.forEach(btn => btn.className = 'nav-btn text-slate-400 flex flex-col items-center gap-1 w-16 transition-colors');
  if(btns[index]) btns[index].className = 'nav-btn text-primary flex flex-col items-center gap-1 w-16 font-bold transition-colors';
}

// ==========================================
// 1. DASHBOARD UTAMA
// ==========================================
function renderDashboard(isBack = false) {
  if (!isBack) history.pushState({ page: 'dashboard' }, "", "#beranda");
  ubahNav(0);
  if (!appData) return;

  const recentTrx = appData.transaksi.slice(0, 5).map(t => {
    const isMasuk = t.jenis === 'Pemasukan';
    const color = isMasuk ? 'text-emerald-500' : 'text-rose-500';
    return `
      <div class="flex justify-between items-center p-4 bg-light rounded-2xl mb-3 border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full ${isMasuk ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} flex items-center justify-center text-sm">
            <i class="fas ${isMasuk ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
          </div>
          <div><h4 class="font-bold text-sm text-slate-700">${t.kategori}</h4><p class="text-[10px] text-slate-400">${t.keterangan || t.jenis} • ${new Date(t.tanggal).toLocaleDateString('id-ID')}</p></div>
        </div>
        <div class="font-bold text-sm ${color}">${isMasuk ? '+' : '-'} ${formatRupiahFormat(t.nominal).replace('Rp','')}</div>
      </div>`;
  }).join('');

  document.getElementById('app-content').innerHTML = `
    <div class="fade-in pb-10">
      <div class="flex flex-col items-center mt-2 mb-8">
        <div class="w-20 h-20 rounded-full bg-blue-50 border-[3px] border-white shadow-md flex items-center justify-center text-3xl text-primary mb-3"><i class="fas fa-wallet"></i></div>
        <p class="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Saldo</p>
        <h2 class="text-3xl font-extrabold text-slate-800">${formatRupiahFormat(appData.saldo)}</h2>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-8">
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center"><div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2"><i class="fas fa-arrow-down text-xs"></i></div><p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Pemasukan</p><p class="text-sm font-bold text-emerald-600">${formatRupiahFormat(appData.pemasukan)}</p></div>
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center"><div class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-2"><i class="fas fa-arrow-up text-xs"></i></div><p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Pengeluaran</p><p class="text-sm font-bold text-rose-600">${formatRupiahFormat(appData.pengeluaran)}</p></div>
      </div>
      <div class="flex justify-between items-center mb-4"><h3 class="text-sm font-bold text-slate-700">Riwayat Terakhir</h3><button onclick="renderHistory()" class="text-xs text-primary font-semibold">Lihat Semua</button></div>
      <div>${recentTrx.length > 0 ? recentTrx : '<p class="text-center text-xs text-slate-400 py-6">Belum ada transaksi</p>'}</div>
    </div>`;
}

// ==========================================
// 2. TRANSAKSI (INPUT)
// ==========================================
function pilihTransaksi() {
  Swal.fire({
    title: '<span class="text-lg font-bold">Tambah Catatan</span>',
    html: `
      <div class="grid grid-cols-2 gap-3 mt-4">
        <div onclick="bukaForm('Pemasukan')" class="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl cursor-pointer hover:bg-emerald-100 flex flex-col items-center gap-2"><div class="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl shadow-md"><i class="fas fa-plus"></i></div><p class="text-xs font-bold text-emerald-800 text-center mt-1">Pemasukan</p></div>
        <div onclick="bukaForm('Pengeluaran')" class="bg-rose-50 border border-rose-100 p-4 rounded-2xl cursor-pointer hover:bg-rose-100 flex flex-col items-center gap-2"><div class="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center text-xl shadow-md"><i class="fas fa-minus"></i></div><p class="text-xs font-bold text-rose-800 text-center mt-1">Pengeluaran</p></div>
      </div>`,
    showConfirmButton: false, showCloseButton: true, position: 'bottom', customClass: { popup: 'rounded-t-3xl pb-6' }
  });
}

function bukaForm(jenis) {
  Swal.close();
  setTimeout(() => {
    let opsiKategori = appData.kategori[jenis].map(k => `<option value="${k}">${k}</option>`).join('');
    Swal.fire({
      width: '100%', title: `<h3 class="text-lg font-extrabold text-slate-800">Catat ${jenis}</h3>`,
      html: `
        <div class="text-left mt-4">
          <label class="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase">Tanggal</label><input type="date" id="t-tanggal" value="${new Date().toISOString().split('T')[0]}" class="w-full border border-slate-200 rounded-xl p-3 mb-4 bg-light outline-none">
          <label class="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase">Kategori</label><select id="t-kategori" class="w-full border border-slate-200 rounded-xl p-3 mb-4 bg-light outline-none">${opsiKategori || '<option value="Lainnya">Lainnya</option>'}</select>
          <label class="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase">Nominal</label><div class="relative mb-4"><span class="absolute left-4 top-3 text-slate-500 font-bold">Rp</span><input type="text" id="t-nominal" class="w-full border border-slate-200 rounded-xl p-3 pl-10 text-base font-bold outline-none" placeholder="0" oninput="inputRupiah(this)"></div>
          <label class="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase">Keterangan (Opsional)</label><textarea id="t-ket" class="w-full border border-slate-200 rounded-xl p-3 bg-light outline-none" rows="2" placeholder="Catatan..."></textarea>
        </div>`,
      showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal',
      customClass: { popup: 'rounded-[32px] absolute bottom-0 m-0 w-full max-w-[480px]', confirmButton: `${jenis === 'Pemasukan' ? 'bg-emerald-600' : 'bg-rose-600'} text-white font-bold py-3 px-4 rounded-xl w-full`, cancelButton: 'bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl w-full', actions: 'flex gap-3 w-full px-5 pb-5 mt-4' },
      preConfirm: () => { if (!document.getElementById('t-nominal').value) { Swal.showValidationMessage('Masukkan nominal!'); return false; } }
    }).then((r) => { if (r.isConfirmed) kirimTransaksi(jenis); });
  }, 200);
}

async function kirimTransaksi(jenis) {
  const payload = { action: 'tambah_transaksi', data: { tanggal: document.getElementById('t-tanggal').value, jenis: jenis, kategori: document.getElementById('t-kategori').value, nominal: Number(document.getElementById('t-nominal').value.replace(/\./g, '')), keterangan: document.getElementById('t-ket').value } };
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try { await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }); await muatData(); Swal.close(); } catch(e) { Swal.fire('Error', 'Gagal menyimpan.', 'error'); }
}

// ==========================================
// 3. RIWAYAT
// ==========================================
function renderHistory(isBack = false) {
  if (!isBack) history.pushState({ page: 'riwayat' }, "", "#riwayat");
  ubahNav(1); 
  if (!appData) return;

  const listTrx = appData.transaksi.map(t => {
    const isMasuk = t.jenis === 'Pemasukan';
    return `<div class="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-sm flex justify-between items-center cursor-pointer hover:bg-slate-50 transition" onclick="hapusTransaksi(${t.row}, '${t.kategori}')"><div><div class="flex items-center gap-2 mb-1"><span class="text-[9px] font-bold px-2 py-0.5 rounded-md ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">${t.jenis.toUpperCase()}</span><h4 class="font-bold text-sm text-slate-700">${t.kategori}</h4></div><p class="text-[11px] text-slate-400"><i class="far fa-calendar-alt"></i> ${new Date(t.tanggal).toLocaleDateString('id-ID')} - ${t.keterangan || '-'}</p></div><div class="font-bold text-sm ${isMasuk ? 'text-emerald-500' : 'text-rose-500'}">${isMasuk ? '+' : '-'} ${formatRupiahFormat(t.nominal).replace('Rp','')}</div></div>`;
  }).join('');
  document.getElementById('app-content').innerHTML = `<div class="fade-in pb-10"><h2 class="text-lg font-bold text-slate-800 mb-4">Riwayat Transaksi</h2><p class="text-xs text-slate-400 mb-4">* Ketuk transaksi untuk menghapus</p>${listTrx.length > 0 ? listTrx : '<div class="text-center py-10 text-slate-400">Belum ada riwayat</div>'}</div>`;
}

function hapusTransaksi(row, kategori) {
  Swal.fire({ title: 'Hapus Transaksi?', text: `Hapus catatan [${kategori}]?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Ya, Hapus' }).then(async (r) => {
    if (r.isConfirmed) { Swal.fire({ title: 'Menghapus...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'hapus_transaksi', data: { row: row } }) }); await muatData(); renderHistory(); Swal.close(); }
  });
}

// ==========================================
// 4. PENGATURAN (KATEGORI & RESET)
// ==========================================
let kategoriLokal = [];
function renderSettings(isBack = false) {
  if (!isBack) history.pushState({ page: 'pengaturan' }, "", "#pengaturan");
  ubahNav(-1); 
  if (!appData) return;

  if (kategoriLokal.length === 0) {
    appData.kategori.Pemasukan.forEach(k => kategoriLokal.push({jenis: 'Pemasukan', nama: k}));
    appData.kategori.Pengeluaran.forEach(k => kategoriLokal.push({jenis: 'Pengeluaran', nama: k}));
  }
  const listHtml = kategoriLokal.map((k, i) => `<div class="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm mb-2"><select onchange="kategoriLokal[${i}].jenis = this.value" class="text-xs font-bold border-none outline-none bg-transparent ${k.jenis==='Pemasukan'?'text-emerald-600':'text-rose-600'}"><option value="Pemasukan" ${k.jenis==='Pemasukan'?'selected':''}>Pemasukan</option><option value="Pengeluaran" ${k.jenis==='Pengeluaran'?'selected':''}>Pengeluaran</option></select><input type="text" value="${k.nama}" onchange="kategoriLokal[${i}].nama = this.value" class="flex-1 text-sm outline-none border-b border-transparent focus:border-primary"><button onclick="kategoriLokal.splice(${i}, 1); renderSettings(true);" class="text-slate-300 hover:text-rose-500"><i class="fas fa-times"></i></button></div>`).join('');
  
  document.getElementById('app-content').innerHTML = `
    <div class="fade-in pb-10">
      <div class="flex items-center gap-3 mb-6"><button onclick="renderDashboard()" class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="text-lg font-bold text-slate-800">Pengaturan Kategori</h2></div>
      <div class="mb-4">${listHtml}</div>
      <button onclick="kategoriLokal.push({jenis:'Pengeluaran', nama:''}); renderSettings(true);" class="w-full bg-slate-50 border border-slate-200 text-slate-500 font-bold py-3 rounded-xl mb-4 hover:bg-slate-100 transition border-dashed"><i class="fas fa-plus mr-1"></i> Tambah Kategori</button>
      <button onclick="simpanKategori()" class="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-blue-700 transition mb-8">Simpan Perubahan</button>
      <div class="border-t border-slate-200 pt-6 mt-2"><h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Zona Berbahaya</h3><button onclick="resetSemuaData()" class="w-full bg-rose-50 text-rose-600 font-bold py-3.5 rounded-xl hover:bg-rose-100 transition border border-rose-200 shadow-sm"><i class="fas fa-exclamation-triangle mr-1"></i> Reset Ke Pengaturan Awal</button></div>
    </div>`;
}

async function simpanKategori() {
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'simpan_kategori', data: kategoriLokal }) }); kategoriLokal = []; await muatData(); Swal.fire({ icon: 'success', title: 'Berhasil', showConfirmButton: false, timer: 1000 }); renderSettings(true); } 
  catch(e) { Swal.fire('Error', 'Gagal menyimpan.', 'error'); }
}

function resetSemuaData() {
  Swal.fire({ title: 'Reset Semua Data?', html: 'Seluruh riwayat akan dihapus.<br><span class="text-rose-500 font-bold">Data tidak dapat dikembalikan!</span>', icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Ya, Reset Total' }).then(async (r) => {
    if (r.isConfirmed) { Swal.fire({ title: 'Mereset...', allowOutsideClick: false, didOpen: () => Swal.showLoading() }); try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'reset_semua' }) }); kategoriLokal = []; await muatData(); Swal.fire('Berhasil!', 'Data direset', 'success'); renderSettings(true); } catch (e) { Swal.fire('Error', 'Gagal mereset.', 'error'); } }
  });
}

// ==========================================
// PWA: NOTIFIKASI INSTALL APLIKASI
// ==========================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBanner = document.getElementById('install-banner');
  if (installBanner && !localStorage.getItem('pwa_ditolak')) {
    installBanner.classList.remove('hidden');
    setTimeout(() => { 
      installBanner.classList.remove('-translate-y-20', 'opacity-0'); 
      installBanner.classList.add('translate-y-0', 'opacity-100'); 
    }, 100);
  }
});

document.getElementById('btn-install')?.addEventListener('click', async () => {
  const installBanner = document.getElementById('install-banner');
  installBanner.classList.add('-translate-y-20', 'opacity-0');
  setTimeout(() => installBanner.classList.add('hidden'), 500);
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null; 
  }
});

document.getElementById('btn-tutup-install')?.addEventListener('click', () => {
  const installBanner = document.getElementById('install-banner');
  installBanner.classList.add('-translate-y-20', 'opacity-0');
  setTimeout(() => installBanner.classList.add('hidden'), 500);
  localStorage.setItem('pwa_ditolak', 'true');
});