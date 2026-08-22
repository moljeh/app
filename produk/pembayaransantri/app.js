// GANTI DENGAN URL WEB APP GAS ANDA YANG BARU SETELAH DEPLOY!
const API_URL = 'https://script.google.com/macros/s/AKfycbyXGzYbE94YgBQLoNGBSSuvNz5kGQlzMTrrxfYsIVTLAVoGfFXnIVtH2dggNDm_C5jocw/exec';
let appData = null;
let dataSettingLokal = [];
const PIN_SISTEM = "112233"; 

// Variabel Global untuk mengingat filter laporan
window.laporanTabAktif = null;
window.laporanKelasAktif = 'Semua';

// ==========================================
// SINKRONISASI TOMBOL KEMBALI & ROUTING CERDAS
// ==========================================
window.addEventListener('popstate', (e) => {
  if (document.body.classList.contains('swal2-shown')) { Swal.close(); return; }
  const hash = location.hash;
  if (hash === '#santri') renderPembayaran(filterTingkat, true);
  else if (hash === '#laporan') renderLaporan(window.laporanTabAktif, window.laporanKelasAktif, true);
  else if (hash === '#pengaturan') renderSetting(true);
  else renderDashboard(true);
});

const nativeSwalFire = Swal.fire;
Swal.fire = function(...args) {
  if (!document.body.classList.contains('swal2-shown')) history.pushState({ isPopup: true }, "", location.hash || "#");
  return nativeSwalFire.apply(this, args).then((result) => {
    setTimeout(() => { if (!document.body.classList.contains('swal2-shown') && history.state && history.state.isPopup) history.back(); }, 150); 
    return result;
  });
};

// ==========================================
// INISIALISASI & LOGIN
// ==========================================
if (sessionStorage.getItem('sudahLogin') === 'true') {
  document.getElementById('login-screen')?.classList.add('hidden');
  tampilkanAplikasiUtama();
} else {
  document.getElementById('login-screen')?.classList.remove('hidden');
}

function prosesLogin() {
  if (document.getElementById('inputPassword').value === PIN_SISTEM) {
    sessionStorage.setItem('sudahLogin', 'true'); 
    tampilkanAplikasiUtama();
  } else {
    Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'PIN salah!', confirmButtonColor: '#0f766e' });
    document.getElementById('inputPassword').value = ''; 
  }
}

function prosesLogout() {
  Swal.fire({
    title: 'Keluar dari Sistem?',
    text: 'Sesi Anda akan ditutup dan membutuhkan PIN untuk masuk kembali.',
    icon: 'question',
    showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#94a3b8',
    confirmButtonText: '<i class="fas fa-sign-out-alt mr-1"></i> Ya, Keluar', cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-[32px]' }
}).then((result) => {
  if (result.isConfirmed) { sessionStorage.removeItem('sudahLogin'); location.reload(); }
});
}

async function tampilkanAplikasiUtama() {
  document.getElementById('login-screen')?.classList.add('hidden');
  document.getElementById('main-app')?.classList.remove('hidden');
  try {
    const response = await fetch(API_URL);
    appData = await response.json();
    dataSettingLokal = JSON.parse(JSON.stringify(appData.setting));
    
    const hash = location.hash;
    if (hash === '#santri') renderPembayaran(filterTingkat, true);
    else if (hash === '#laporan') renderLaporan(window.laporanTabAktif, window.laporanKelasAktif, true);
    else if (hash === '#pengaturan') renderSetting(true);
    else renderDashboard(true);
  } catch (error) { Swal.fire('Error', 'Gagal memuat data dari server.', 'error'); }
}

async function muatUlangDataTanpaReload() { 
  const response = await fetch(API_URL); 
  appData = await response.json(); 
  dataSettingLokal = JSON.parse(JSON.stringify(appData.setting));
  const hash = location.hash; 
  if (hash === '#santri') renderPembayaran(filterTingkat, true); 
  else if (hash === '#laporan') renderLaporan(window.laporanTabAktif, window.laporanKelasAktif, true); 
  else if (hash === '#pengaturan') renderSetting(true);
  else renderDashboard(true); 
}

function formatRupiah(input) {
  let angka = input.value.replace(/[^0-9]/g, '');
  input.value = angka.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateNav(index) { 
  document.querySelectorAll('.nav-btn').forEach((btn, i) => {
    if (i === index) btn.className = 'nav-btn text-emerald-600 flex flex-col items-center gap-1 transform scale-110 transition-all font-bold';
    else btn.className = 'nav-btn text-gray-400 flex flex-col items-center gap-1 hover:text-emerald-500 transition-colors opacity-60 hover:opacity-100 font-normal';
  }); 
}

// ==========================================
// DASHBOARD
// ==========================================
function renderDashboard(isBack = false) {
  if (!isBack) history.pushState({ page: 'dashboard' }, "", "#beranda");
  updateNav(0); if (!appData) return;
  
  let htmlKas = appData.setting.map((set, i) => {
    let kas = appData.rekapKas[set.jenis] || { masuk: 0, keluar: 0 };
    let saldo = kas.masuk - kas.keluar;
    let icon = i % 2 === 0 ? "fa-tag text-teal-500" : "fa-tags text-blue-500";
    return `
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <div class="flex justify-between items-center mb-3 border-b pb-2">
          <h3 class="font-bold text-gray-700 flex items-center gap-2"><i class="fas ${icon}"></i> Kas ${set.jenis}</h3>
          <span class="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold border border-emerald-100">Saldo: Rp ${saldo.toLocaleString('id-ID')}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-center">
          <div class="bg-blue-50 p-2 rounded-xl border border-blue-100"><p class="text-[9px] text-gray-500 uppercase mb-1">Total Masuk</p><p class="text-sm font-bold text-blue-600">Rp ${kas.masuk.toLocaleString('id-ID')}</p></div>
          <div class="bg-red-50 p-2 rounded-xl border border-red-100"><p class="text-[9px] text-gray-500 uppercase mb-1">Total Keluar</p><p class="text-sm font-bold text-red-500">Rp ${kas.keluar.toLocaleString('id-ID')}</p></div>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('app-content').innerHTML = `
    <div class="fade-in px-5">
      <a href="santri.html" class="flex justify-center items-center gap-2 w-full bg-teal-600 text-white font-bold py-3.5 rounded-2xl hover:bg-teal-700 transition shadow-md mb-5"><i class="fas fa-external-link-alt"></i> Buka Portal Santri</a>
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex justify-center items-center text-xl"><i class="fas fa-users"></i></div>
        <div><p class="text-xs text-gray-500 font-semibold uppercase">Total Santri Aktif</p><h2 class="text-2xl font-bold text-gray-800">${appData.statistik.totalSantri} Orang</h2></div>
      </div>
      ${htmlKas}
    </div>
  `;
}

// ==========================================
// MENU SANTRI & PEMBAYARAN
// ==========================================
let filterTingkat = 'Semua';
function renderPembayaran(filterManual = null, isBack = false) {
  if (!isBack) history.pushState({ page: 'pembayaran' }, "", "#santri");
  updateNav(1); if (!appData) return;
  if (filterManual) filterTingkat = filterManual; 
  
  const uniqueClasses = [...new Set(appData.santri.map(s => s.kelas).filter(k => k))].sort();
  let dataSantri = filterTingkat === 'Semua' ? appData.santri : appData.santri.filter(s => s.kelas === filterTingkat);

  const listHTML = dataSantri.map((s, index) => {
    return `<div class="santri-card bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-3 flex justify-between items-center hover:bg-gray-50 transition cursor-pointer" onclick="bukaFormPembayaran('${s.nis}', '${s.nama.replace(/'/g, "\\'")}', '${s.kelas.replace(/'/g, "\\'")}')">
      <div class="flex items-center gap-3"><div class="w-10 h-10 min-w-[40px] bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm border border-teal-100">${index + 1}</div>
       <div class="flex-1 pr-2"><h4 class="font-bold text-sm break-words leading-tight">${s.nama}</h4><p class="text-xs text-gray-500">${s.nis} • ${s.kelas}</p></div>
      </div>
      <button onclick="lihatRiwayat('${s.nis}', '${s.nama.replace(/'/g, "\\'")}', '${s.kelas.replace(/'/g, "\\'")}', event)" class="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold border border-blue-100 hover:bg-blue-500 hover:text-white transition-colors shadow-sm flex items-center gap-1 z-10"><i class="fas fa-history"></i> Riwayat</button>
    </div>`
  }).join('');

  document.getElementById('app-content').innerHTML = `
   <div class="max-w-2xl mx-auto pb-20 pt-4 px-7">
      <div class="relative mb-4">
        <select onchange="renderPembayaran(this.value)" class="w-full bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-emerald-500 cursor-pointer appearance-none">
          <option value="Semua" ${filterTingkat === 'Semua' ? 'selected' : ''}>🌍 Semua Data Santri</option>
          ${uniqueClasses.map(c => `<option value="${c}" ${filterTingkat === c ? 'selected' : ''}>🏫 Kelas ${c}</option>`).join('')}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-500"><i class="fas fa-chevron-down"></i></div>
      </div>
     
	 <div class="flex items-center gap-2 mb-6">
        <div class="relative flex-1"><i class="fas fa-search absolute left-4 top-3.5 text-gray-400 text-sm"></i><input type="text" id="inputPencarian" onkeyup="filterSantri()" placeholder="Cari nama atau NIS..." class="w-full bg-white border border-gray-100 shadow-sm rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"></div>
        <!-- TOMBOL RESET DITAMBAHKAN DI SINI -->
        <button onclick="resetDataSantri()" class="bg-white border border-gray-100 shadow-sm text-red-500 px-4 py-3.5 rounded-2xl hover:bg-red-50 transition-all" title="Kosongkan Data Santri"><i class="fas fa-trash-alt text-lg"></i></button>
        <button onclick="bukaFormImport()" class="bg-white border border-gray-100 shadow-sm text-blue-600 px-4 py-3.5 rounded-2xl hover:bg-blue-50 transition-all"><i class="fas fa-file-import text-lg"></i></button>
      </div>
	 
      ${dataSantri.length === 0 ? '<p class="text-center text-sm text-gray-400 py-10">Data tidak ditemukan.</p>' : ''}
      <div class="pb-10" id="listSantri">${listHTML}</div>
    </div>`;
}
function filterSantri() { const k = document.getElementById('inputPencarian').value.toLowerCase(); document.querySelectorAll('.santri-card').forEach(c => c.style.display = c.innerText.toLowerCase().includes(k) ? "flex" : "none"); }

function bukaFormPembayaran(nis = '', nama = '', kelas = '') {
  let optTagihan = appData.setting.map(s => `<option value="${s.jenis}" style="color: #1f2937;">${s.jenis}</option>`).join('');
  Swal.fire({
    width: '400px', title: `<div class="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl border border-teal-100 shadow-sm mt-2"><i class="fas fa-wallet"></i></div><h3 class="text-xl font-extrabold text-gray-800">Input Pembayaran</h3>`,
    html: `
      <div class="text-left mt-2 px-1">
        <input type="hidden" id="swal-nis" value="${nis}">
        <label class="block text-[11px] font-bold mb-1.5 text-gray-500 uppercase tracking-wider">Nama Santri</label>
        <div class="relative mb-4"><div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-500"><i class="fas fa-user-graduate"></i></div><input id="swal-nama" class="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 text-gray-700 text-sm font-semibold outline-none" value="${nama}" readonly></div>
        <input type="hidden" id="swal-kelas" value="${kelas}">
        <label class="block text-[11px] font-bold mb-1.5 text-gray-500 uppercase tracking-wider">Jenis Tagihan</label>
        <div class="relative mb-4"><div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-500"><i class="fas fa-tags"></i></div><select id="swal-jenis" class="w-full border border-gray-200 rounded-xl p-3 pl-10 bg-white text-gray-700 text-sm font-semibold outline-none appearance-none cursor-pointer">${optTagihan}</select><div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400"><i class="fas fa-chevron-down text-[10px]"></i></div></div>
        <label class="block text-[11px] font-bold mb-1.5 text-gray-500 uppercase tracking-wider">Nominal Bayar</label>
        <div class="relative mb-2"><span class="absolute left-4 top-3 text-teal-600 text-sm font-black">Rp</span><input id="swal-nominal" type="text" class="w-full border border-gray-200 rounded-xl p-3 pl-11 text-base font-black bg-white outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-teal-700 shadow-inner" placeholder="0" oninput="formatRupiah(this)"></div>
      </div>`,
    showCancelButton: true, buttonsStyling: false, confirmButtonText: '<i class="fas fa-check-circle mr-1"></i> Simpan', cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-[32px]', confirmButton: 'bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl w-full', cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold py-3 px-4 rounded-xl w-full', actions: 'flex gap-3 w-full px-5 pb-2 mt-4', htmlContainer: 'm-0 px-5' }
  }).then((r) => { if (r.isConfirmed) simpanData(); });
}

async function simpanData() {
  let nisKirim = "";
  let namaKirim = "";
  let elNama = document.getElementById('swal-nama');
  let elNis = document.getElementById('swal-nis');
  
  if (elNis) {
      nisKirim = elNis.value;
      namaKirim = elNama.value;
  } else {
      let val = elNama.value;
      if(val && val.includes('|')) {
         let split = val.split('|');
         nisKirim = split[0];
         namaKirim = split[1];
      } else {
         namaKirim = val;
      }
  }

  if (!nisKirim || nisKirim === "") {
     Swal.fire('Gagal', 'Sistem menolak: Santri tidak memiliki NIS. Silakan perbaiki Master Data Santri Anda.', 'error');
     return;
  }

  const payload = { 
    action: 'simpan_pembayaran', 
    data: { nis: nisKirim, nama: namaKirim, kelas: document.getElementById('swal-kelas').value, jenis: document.getElementById('swal-jenis').value, nominal: Number(document.getElementById('swal-nominal').value.replace(/\./g, '')) } 
  };
  
  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });
  try {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) }); const result = await res.json();
    if(result.success) { await muatUlangDataTanpaReload(); Swal.fire({ icon: 'success', title: 'Sukses!', text: result.message, timer: 1500, showConfirmButton: false }); } 
    else Swal.fire('Gagal', result.message, 'warning');
  } catch (e) { Swal.fire('Error', 'Data gagal terkirim.', 'error'); }
}

function lihatRiwayat(nisSantri, namaSantri, kelasSantri, event) {
  if (event) event.stopPropagation(); if (!appData) return;
  const k = kelasSantri.toUpperCase();
  
  const riwayatSantri = appData.pembayaran.filter(p => p.nis === nisSantri || (p.nis === "" && p.nama === namaSantri && p.kelas === kelasSantri));

  let infoSisaPanel = appData.setting.map(set => {
    let target = k.includes('TK') ? set.TK : (k.includes('IBT') ? set.IBT : (k.includes('SANA') ? set.SANA : 0));
    let total = riwayatSantri.filter(r => r.jenis === set.jenis).reduce((sum, r) => sum + r.nominal, 0);
    let sisa = target - total;
    let isSelesai = (target > 0 && sisa <= 0) || (target === 0 && total > 0);
    let textStatus = isSelesai ? '<i class="fas fa-check-circle mr-1"></i> SELESAI' : 'Sisa Rp ' + Math.max(0, sisa).toLocaleString('id-ID');
    let colorStatus = isSelesai ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100' : 'text-red-500';

    return `<div class="bg-white p-3.5 rounded-xl mb-2 border border-gray-100 flex justify-between items-center shadow-sm"><div class="text-left"><p class="text-[9px] font-bold text-gray-500 uppercase tracking-wider">${set.jenis}</p></div><div class="text-right font-bold text-sm ${colorStatus}">${textStatus}</div></div>`;
  }).join('');

  let listRiwayat = riwayatSantri.length === 0 ? `<div class="text-center py-4"><p class="text-xs text-gray-400">Belum ada cicilan.</p></div>` : riwayatSantri.map(r => `<div class="flex justify-between items-center border-b border-gray-100 py-3 last:border-0"><div class="text-left"><p class="text-xs font-bold text-gray-800 uppercase">${r.jenis}</p><p class="text-[10px] text-gray-400 mt-0.5"><i class="far fa-calendar-alt"></i> ${new Date(r.tanggal).toLocaleDateString('id-ID')}</p></div><div class="text-right font-bold text-emerald-600 text-sm flex items-center gap-3"><span>+ Rp ${r.nominal.toLocaleString('id-ID')}</span><button onclick="hapusRiwayat('${r.jenis}', ${r.row})" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md"><i class="fas fa-trash-alt"></i></button></div></div>`).join('');

  Swal.fire({ title: `<div class="text-base text-gray-800 pt-2 font-bold"><i class="fas fa-history text-blue-500 mr-1"></i> Detail Pembayaran</div>`, html: `<p class="text-xs text-gray-500 mb-3 font-bold border-b pb-2">${namaSantri} <span class="block font-normal mt-1">${kelasSantri}</span><span class="block text-[9px] font-bold text-gray-400 mt-1">NIS: ${nisSantri}</span></p>${infoSisaPanel}<p class="text-[10px] font-bold text-gray-400 uppercase text-left mb-1 px-1 mt-3">Riwayat Cicilan</p><div class="max-h-48 overflow-y-auto hide-scroll bg-white p-3 rounded-2xl shadow-inner border border-gray-100">${listRiwayat}</div>`, showCloseButton: true, showConfirmButton: false, customClass: { popup: 'rounded-[32px] bg-gray-50' } });
}

function hapusRiwayat(jenis, row) { 
  Swal.fire({ title: 'Hapus Transaksi?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya!' }).then(async (r) => { 
    if (r.isConfirmed) { 
      Swal.fire({title:'Menghapus...', didOpen:()=>Swal.showLoading()}); 
      await fetch(API_URL, {method:'POST', body:JSON.stringify({action:'hapus_pembayaran', data:{jenis: jenis, index: row}})}); 
      await muatUlangDataTanpaReload();
      Swal.close(); 
    } 
  }); 
}

// ==========================================
// TRANSAKSI CEPAT
// ==========================================
function bukaTransaksiCepat() { Swal.fire({ title: 'Pilih Transaksi', html: `<div class="grid grid-cols-2 gap-3 mt-4"><div onclick="bukaInputPemasukan()" class="bg-teal-50 border border-teal-200 p-4 rounded-2xl cursor-pointer hover:bg-teal-100 flex flex-col items-center gap-2"><div class="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-xl shadow-md"><i class="fas fa-hand-holding-usd"></i></div><p class="text-xs font-bold text-teal-800 text-center mt-1">Terima<br>Pembayaran</p></div><div onclick="bukaInputPengeluaran()" class="bg-red-50 border border-red-200 p-4 rounded-2xl cursor-pointer hover:bg-red-100 flex flex-col items-center gap-2"><div class="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl shadow-md"><i class="fas fa-file-invoice-dollar"></i></div><p class="text-xs font-bold text-red-800 text-center mt-1">Catat<br>Pengeluaran</p></div></div>`, showConfirmButton: false, showCloseButton: true, position: 'bottom', customClass: { popup: 'rounded-t-3xl' } }); }

function bukaInputPemasukan() {
  Swal.close(); setTimeout(() => { if (!appData) return;
    const uniqueClasses = [...new Set(appData.santri.map(s => s.kelas).filter(k => k))].sort();
    let optK = '<option value="" disabled selected>-- Pilih Kelas --</option>' + uniqueClasses.map(c => `<option value="${c}">${c}</option>`).join('');
    let optT = appData.setting.map(s => `<option value="${s.jenis}">${s.jenis}</option>`).join('');
    Swal.fire({ width: '400px', title: `<h3 class="text-xl font-extrabold text-gray-800">Terima Pembayaran</h3>`, html: `<div class="text-left mt-2"><div class="mb-4"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Kelas</label><select id="swal-kelas" onchange="updateDropdownSantri(this.value)" class="w-full border p-3 rounded-xl">${optK}</select></div><div class="mb-4"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Santri</label><select id="swal-nama" class="w-full border p-3 rounded-xl bg-gray-100" disabled><option value="">Pilih kelas dulu...</option></select></div><div class="mb-4"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Jenis Tagihan</label><select id="swal-jenis" class="w-full border p-3 rounded-xl">${optT}</select></div><div class="mb-2"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Nominal</label><input id="swal-nominal" type="text" class="w-full border p-3 rounded-xl" oninput="formatRupiah(this)"></div></div>`, showCancelButton: true, confirmButtonText: 'Simpan', customClass: { popup: 'rounded-[32px]', confirmButton: 'bg-teal-600 text-white font-bold py-3 px-4 rounded-xl w-full' }, 
    preConfirm: () => { 
      const elNama = document.getElementById('swal-nama').value;
      if (!document.getElementById('swal-kelas').value || !elNama || !document.getElementById('swal-nominal').value) { Swal.showValidationMessage('Lengkapi data!'); return false; } 
      if (!elNama.includes('|')) { Swal.showValidationMessage('Santri tidak memiliki NIS. Harap perbaiki Master Data!'); return false; }
    } }).then((r) => { if (r.isConfirmed) simpanData(); });
  }, 300);
}

function updateDropdownSantri(k) { 
  const sel = document.getElementById('swal-nama'); 
  sel.innerHTML = '<option value="" disabled selected>-- Pilih Nama --</option>' + appData.santri.filter(s => s.kelas === k).sort((a,b)=>a.nama.localeCompare(b.nama)).map(s => `<option value="${s.nis}|${s.nama}">${s.nama} (${s.nis})</option>`).join(''); 
  sel.disabled = false; sel.classList.remove('bg-gray-100'); 
}

function bukaInputPengeluaran() {
  Swal.close(); setTimeout(() => {
    let optT = appData.setting.map(s => `<option value="${s.jenis}">${s.jenis}</option>`).join('');
    Swal.fire({ width: '400px', title: `<h3 class="text-xl font-extrabold text-gray-800">Catat Pengeluaran</h3>`, html: `<div class="text-left mt-2"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Ambil dari Kas</label><select id="swal-kat" class="w-full border p-3 rounded-xl mb-4">${optT}</select><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Nominal</label><input id="swal-nom" type="text" class="w-full border p-3 rounded-xl mb-4" oninput="formatRupiah(this)"><label class="block text-[11px] font-bold mb-1 text-gray-500 uppercase">Keterangan</label><textarea id="swal-ket" class="w-full border p-3 rounded-xl"></textarea></div>`, showCancelButton: true, confirmButtonText: 'Simpan', customClass: { popup: 'rounded-[32px]', confirmButton: 'bg-red-500 text-white font-bold py-3 px-4 rounded-xl w-full' } }).then((r) => { if (r.isConfirmed) prosesSimpanPengeluaran(); });
  }, 300);
}

async function prosesSimpanPengeluaran() { 
  let inputKategori = document.getElementById('swal-kat').value;
  let inputNominal = Number(document.getElementById('swal-nom').value.replace(/\./g, ''));
  let inputKeterangan = document.getElementById('swal-ket').value;

  if (!inputKategori || inputNominal <= 0) {
    Swal.fire('Peringatan', 'Kategori dan nominal tidak boleh kosong!', 'warning');
    return;
  }

  Swal.fire({ title:'Mencatat...', allowOutsideClick: false, didOpen:()=>Swal.showLoading()}); 
  try { 
    const res = await fetch(API_URL, {
      method:'POST', 
      body:JSON.stringify({
        action:'simpan_pengeluaran', 
        data: { kategori: inputKategori, nominal: inputNominal, keterangan: inputKeterangan }
      })
    }); 
    const result = await res.json(); 
    if(result.success) { await muatUlangDataTanpaReload(); Swal.fire('Sukses', result.message, 'success'); } 
    else { Swal.fire('Gagal', result.message, 'error'); }
  } catch (e) { Swal.fire('Error', 'Data gagal terkirim.', 'error'); } 
}

// ==========================================
// LAPORAN DINAMIS & DOWNLOAD PDF 
// ==========================================
function renderLaporan(tabAktif = null, kelasAktif = null, isBack = false) {
  if (!isBack) history.pushState({ page: 'laporan' }, "", "#laporan"); updateNav(2); 
  if (!appData || appData.setting.length === 0) return;
  
  if (!tabAktif) tabAktif = window.laporanTabAktif || appData.setting[0].jenis;
  if (!kelasAktif) kelasAktif = window.laporanKelasAktif || 'Semua';
  
  window.laporanTabAktif = tabAktif;
  window.laporanKelasAktif = kelasAktif;

  // Filter Data Transaksi berdasarkan Tagihan & Kelas
  let dBayar = appData.pembayaran.filter(d => d.jenis === tabAktif);
  if (kelasAktif !== 'Semua') {
      dBayar = dBayar.filter(d => d.kelas === kelasAktif);
  }

  // Menghitung Target Berdasarkan Filter Kelas
  let targetTotal = 0;
  let santriFilter = appData.santri;
  if (kelasAktif !== 'Semua') {
      santriFilter = santriFilter.filter(s => s.kelas === kelasAktif);
  }

  santriFilter.forEach(s => {
    let k = s.kelas.toUpperCase(); let set = appData.setting.find(x => x.jenis === tabAktif);
    if(set) targetTotal += k.includes('TK') ? set.TK : (k.includes('IBT') ? set.IBT : (k.includes('SANA') ? set.SANA : 0));
  });

  const msk = dBayar.reduce((s, i) => s + i.nominal, 0); const sisa = Math.max(0, targetTotal - msk);
  const persen = targetTotal === 0 ? 0 : Math.round((msk / targetTotal) * 100);

  // Buat Opsi Dropdown
  const uniqueClasses = [...new Set(appData.santri.map(s => s.kelas).filter(k => k))].sort();
  
  let dropdownTagihanHTML = appData.setting.map(s => `<option value="${s.jenis}" ${tabAktif === s.jenis ? 'selected' : ''}>📋 Tagihan: ${s.jenis}</option>`).join('');
  let dropdownKelasHTML = `<option value="Semua" ${kelasAktif === 'Semua' ? 'selected' : ''}>🌍 Semua Kelas</option>` + uniqueClasses.map(c => `<option value="${c}" ${kelasAktif === c ? 'selected' : ''}>🏫 Kelas ${c}</option>`).join('');

  document.getElementById('app-content').innerHTML = `
    <div class="max-w-2xl mx-auto pb-12 pt-4 px-7">
      
<!-- DUA DROPDOWN FILTER BERSAMPINGAN -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="relative">
          <select onchange="renderLaporan(this.value, window.laporanKelasAktif)" class="w-full bg-white border border-gray-100 shadow-sm rounded-2xl pl-3 pr-8 py-3.5 text-xs font-bold text-emerald-700 outline-none focus:border-emerald-500 cursor-pointer appearance-none transition-all truncate">${dropdownTagihanHTML}</select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-emerald-500"><i class="fas fa-chevron-down bg-white pl-1"></i></div>
        </div>
        <div class="relative">
          <select onchange="renderLaporan(window.laporanTabAktif, this.value)" class="w-full bg-white border border-gray-100 shadow-sm rounded-2xl pl-3 pr-8 py-3.5 text-xs font-bold text-gray-700 outline-none focus:border-emerald-500 cursor-pointer appearance-none transition-all truncate">${dropdownKelasHTML}</select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"><i class="fas fa-chevron-down bg-white pl-1"></i></div>
        </div>
      </div>

      <div class="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[32px] p-7 shadow-xl shadow-emerald-200 mb-8 relative overflow-hidden"><div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div><div class="relative z-10"><p class="text-emerald-100 text-[11px] font-medium uppercase tracking-widest mb-1">Sisa Kekurangan</p><h2 class="text-3xl font-extrabold text-white mb-6">Rp ${sisa.toLocaleString('id-ID')}</h2><div class="mb-6"><div class="flex justify-between text-[11px] text-emerald-100 mb-2 font-medium"><span>Progress Pembayaran</span><span class="font-bold text-white">${persen}%</span></div><div class="w-full bg-emerald-900/40 rounded-full h-2.5"><div class="bg-white h-2.5 rounded-full transition-all duration-1000 shadow-sm" style="width: ${persen}%"></div></div></div></div></div>
      <div class="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 mb-8"><h3 class="text-[11px] font-bold text-gray-500 mb-4 uppercase tracking-wider flex items-center gap-2"><i class="fas fa-chart-pie text-emerald-500 text-sm"></i> Statistik Pembayaran</h3><div class="relative h-48 w-full flex justify-center"><canvas id="laporanChart"></canvas></div></div>
      <div>
        <div class="flex justify-between items-end mb-4">
            <h3 class="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2"><i class="fas fa-history text-emerald-500 text-sm"></i> Riwayat Terbaru</h3>
            <button onclick="downloadLaporan()" class="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-red-200 hover:bg-red-100 transition-colors shadow-sm flex items-center gap-1"><i class="fas fa-file-pdf"></i> Download PDF</button>
        </div>
        ${dBayar.length === 0 ? '<div class="text-center py-10 text-xs text-gray-400">Belum ada transaksi di kelas ini.</div>' : ''}
        <div class="flex flex-col gap-3">${dBayar.map((t, i) => `<div class="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex justify-between items-center overflow-hidden"><div class="flex items-center gap-3.5 flex-1"><div class="w-10 h-10 min-w-[40px] rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center justify-center font-bold text-sm border">${i + 1}</div><div class="flex-1 pr-2"><h4 class="font-bold text-sm text-gray-800 break-words leading-tight">${t.nama}</h4><p class="text-[10px] text-gray-400 mt-0.5">${t.kelas} • ${new Date(t.tanggal).toLocaleDateString('id-ID')}</p></div></div><div class="text-right flex-shrink-0 ml-3"><p class="text-sm font-bold text-emerald-600">+ Rp ${t.nominal.toLocaleString('id-ID')}</p></div></div>`).join('')}</div>
      </div>
    </div>`;
  if (window.myChart instanceof Chart) window.myChart.destroy();
  window.myChart = new Chart(document.getElementById('laporanChart'), { type: 'doughnut', data: { labels: ['Dana Masuk', 'Kekurangan Target'], datasets: [{ data: [msk, sisa === 0 && msk === 0 ? 1 : sisa], backgroundColor: ['#10b981', '#f3f4f6'], borderWidth: 0, hoverOffset: 5 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 11 }, color: '#6b7280' } } } } });
}

// LOGIKA CETAK PDF + SUMMARY KAS TERINTEGRASI + FILTER KELAS
function downloadLaporan() {
  if (!appData || !window.laporanTabAktif) return;
  const tabAktif = window.laporanTabAktif;
  const kelasAktif = window.laporanKelasAktif || 'Semua';
  
  let dBayar = appData.pembayaran.filter(d => d.jenis === tabAktif);
  if (kelasAktif !== 'Semua') {
      dBayar = dBayar.filter(d => d.kelas === kelasAktif);
  }
  
  let kas = appData.rekapKas[tabAktif] || { masuk: 0, keluar: 0 };
  if (dBayar.length === 0) { 
    Swal.fire('Info', 'Belum ada transaksi untuk di-download.', 'info'); 
    return; 
  }

  Swal.fire({ title: 'Membuat PDF...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'legal');

  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = 'https://semoljeh.github.io/tahun/logo.png'; 
  
  img.onload = function() {
    
    // KOP SURAT
    doc.addImage(img, 'PNG', 15, 10, 22, 22); 
    doc.setFontSize(14); 
    doc.setFont("helvetica", "bold");
    doc.text("BIRO KEUANGAN MADASA", 112, 16, { align: "center" });
    doc.setFontSize(12);
    doc.text("LAPORAN REKAPITULASI PEMBAYARAN SANTRI", 112, 22, { align: "center" });
    
    // Keterangan Tagihan menyesuaikan Filter Kelas
    doc.setFontSize(10); 
    doc.setFont("helvetica", "normal");
    if (kelasAktif === 'Semua') {
        doc.text(`JENIS TAGIHAN: ${tabAktif.toUpperCase()}`, 112, 28, { align: "center" });
    } else {
        doc.text(`TAGIHAN: ${tabAktif.toUpperCase()} | KELAS: ${kelasAktif.toUpperCase()}`, 112, 28, { align: "center" });
    }
    
    // Garis Ganda Kop Surat
    doc.setLineWidth(0.8); 
    doc.line(14, 33, 202, 33);
    doc.setLineWidth(0.2); 
    doc.line(14, 34.5, 202, 34.5);
    
    doc.setFontSize(9); 
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 41);

    // TABEL TRANSAKSI
    const tableColumn = ["No", "Tanggal", "NIS", "Nama Santri", "Kelas", "Nominal (Rp)"];
    let totalPemasukanTabel = 0;
    
    const tableRows = dBayar.map((t, i) => {
      totalPemasukanTabel += t.nominal;
      let nisAktif = t.nis;
      if (!nisAktif || nisAktif === "" || nisAktif === "-") {
         let cariSantri = appData.santri.find(s => s.nama === t.nama && s.kelas === t.kelas);
         if (cariSantri) nisAktif = cariSantri.nis;
      }
      return [ i + 1, new Date(t.tanggal).toLocaleDateString('id-ID'), nisAktif || "-", t.nama, t.kelas, t.nominal.toLocaleString('id-ID') ];
    });

    // MENYATUKAN RINGKASAN KE DALAM BARIS TABEL PALING BAWAH
    tableRows.push([
      { content: 'TOTAL PEMASUKAN', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      { content: totalPemasukanTabel.toLocaleString('id-ID'), styles: { fontStyle: 'bold' } }
    ]);

    // Jika difilter "Semua", tampilkan Pengeluaran & Sisa Saldo. Jika per kelas, sembunyikan.
    if (kelasAktif === 'Semua') {
        let totalKeluar = kas.keluar;
        let sisaSaldo = totalPemasukanTabel - totalKeluar;
        tableRows.push([
          { content: 'TOTAL PENGELUARAN', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
          { content: totalKeluar.toLocaleString('id-ID'), styles: { fontStyle: 'bold' } }
        ]);
        tableRows.push([
          { content: 'SISA SALDO (KAS)', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [230, 244, 241] } }, 
          { content: sisaSaldo.toLocaleString('id-ID'), styles: { fontStyle: 'bold', fillColor: [230, 244, 241] } }
        ]);
    }

    doc.autoTable({
      head: [tableColumn], 
      body: tableRows, 
      startY: 45, 
      theme: 'grid',
      headStyles: { fillColor: [15, 118, 110], halign: 'center', valign: 'middle', fontStyle: 'bold' }, 
      styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
      columnStyles: { 
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 28 }, 
        2: { halign: 'center', cellWidth: 25 }, 
        4: { halign: 'center', cellWidth: 35 }, 
        5: { halign: 'right', cellWidth: 32 } 
      }
    });

    // TANDA TANGAN BENDAHARA
    let finalY = doc.lastAutoTable.finalY || 45;
    finalY += 15;

    if (finalY > 300) { doc.addPage(); finalY = 20; }
    
    const today = new Date();
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const tanggalFormat = `${today.getDate()} ${namaBulan[today.getMonth()]} ${today.getFullYear()}`;
    
    doc.setFontSize(11);
    doc.text(`Bangkalan, ${tanggalFormat}`, 160, finalY, { align: "center" });
    doc.text("Bendahara", 160, finalY + 5, { align: "center" });
    doc.text("( .......................................... )", 160, finalY + 25, { align: "center" });

    doc.save(`Laporan_${tabAktif}_${kelasAktif}_${today.getTime()}.pdf`);
    Swal.close();
  };

  img.onerror = function() {
    Swal.fire('Error', 'Gagal memuat logo untuk PDF. Pastikan koneksi internet stabil.', 'error');
  };
}

// ==========================================
// PENGATURAN (TAMBAH / HAPUS MANUAL)
// ==========================================
function renderSetting(isBack = false) {
  if (!isBack) history.pushState({ page: 'setting' }, "", "#pengaturan"); updateNav(3); 
  let htmlCards = "";
  if (dataSettingLokal.length === 0) {
    htmlCards = `<div class="bg-white p-8 rounded-[24px] shadow-sm border border-gray-200 mb-5 text-center border-dashed border-2"><i class="fas fa-folder-open text-4xl text-gray-300 mb-3 block"></i><p class="text-sm text-gray-500 font-bold">Semua Tagihan Dihapus</p><p class="text-[11px] text-gray-400 mt-1">Silakan klik tombol di bawah untuk membuat catatan tagihan baru.</p></div>`;
  } else {
    htmlCards = dataSettingLokal.map((set, i) => `
      <div class="bg-white p-5 rounded-[24px] shadow-sm border border-gray-200 mb-5 relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
        <button onclick="hapusFormSetting(${i})" class="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50" title="Hapus Jenis Tagihan"><i class="fas fa-trash-alt"></i></button>
        <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 pr-8">
           <div class="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-lg"><i class="fas fa-tag"></i></div>
           <div class="flex-1">
              <label class="text-[9px] font-bold text-gray-400 uppercase mb-0.5 block">Nama Tagihan ${i + 1}</label>
              <input type="text" id="set_nama_${i}" value="${set.jenis}" onchange="updateDataLokal(${i}, 'jenis', this.value)" class="w-full text-sm font-bold text-gray-800 bg-transparent outline-none focus:border-teal-500 border-b-2 border-transparent transition-colors" placeholder="Ketik jenis pembayaran...">
           </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div><label class="text-[9px] font-bold text-gray-500 uppercase">TK</label><input type="text" id="set_tk_${i}" value="${set.TK.toLocaleString('id-ID')}" oninput="formatRupiah(this); updateDataLokal(${i}, 'TK', this.value)" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-teal-700 outline-none"></div>
          <div><label class="text-[9px] font-bold text-gray-500 uppercase">IBT</label><input type="text" id="set_ibt_${i}" value="${set.IBT.toLocaleString('id-ID')}" oninput="formatRupiah(this); updateDataLokal(${i}, 'IBT', this.value)" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-teal-700 outline-none"></div>
          <div><label class="text-[9px] font-bold text-gray-500 uppercase">SANA</label><input type="text" id="set_sana_${i}" value="${set.SANA.toLocaleString('id-ID')}" oninput="formatRupiah(this); updateDataLokal(${i}, 'SANA', this.value)" class="w-full mt-1 border border-gray-200 rounded-xl p-2.5 text-xs font-bold text-teal-700 outline-none"></div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('app-content').innerHTML = `
   <div class="max-w-2xl mx-auto pb-24 pt-4 px-7">
      <h2 class="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2"><i class="fas fa-sliders-h text-emerald-500"></i> Pengaturan Biaya</h2>
      <p class="text-xs text-gray-500 mb-5">Anda bisa menambah catatan jenis baru dan menghapusnya.</p>
      ${htmlCards}
      <button onclick="tambahFormSetting()" class="w-full bg-blue-50 text-blue-600 font-bold py-3.5 rounded-2xl hover:bg-blue-100 transition shadow-sm mb-4 border border-blue-200 border-dashed"><i class="fas fa-plus mr-2"></i> Tambah Pencatatan Baru</button>
      <button onclick="simpanSettingBiaya()" class="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-2xl hover:bg-emerald-700 transition shadow-md"><i class="fas fa-save mr-2"></i> Simpan Pengaturan</button>
    </div>`;
}

function updateDataLokal(i, key, val) { if (key === 'jenis') dataSettingLokal[i][key] = val; else dataSettingLokal[i][key] = Number(val.replace(/\./g, '')); }
function tambahFormSetting() { dataSettingLokal.push({ jenis: "", TK: 0, IBT: 0, SANA: 0 }); renderSetting(true); }
function hapusFormSetting(i) {
  Swal.fire({ title: 'Hapus Tagihan?', text:'Catatan ini tidak akan disimpan ke database.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Hapus' }).then((r) => {
    if(r.isConfirmed) { dataSettingLokal.splice(i, 1); renderSetting(true); }
  });
}

async function simpanSettingBiaya() {
  let dataToSave = dataSettingLokal.map((set, i) => {
     let inputNama = document.getElementById('set_nama_' + i);
     return { jenis: inputNama ? inputNama.value.trim() : set.jenis, TK: Number(document.getElementById('set_tk_' + i).value.replace(/\./g, '')), IBT: Number(document.getElementById('set_ibt_' + i).value.replace(/\./g, '')), SANA: Number(document.getElementById('set_sana_' + i).value.replace(/\./g, '')) };
  }).filter(s => s.jenis !== ""); 

  Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() }});
  try {
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'simpan_setting', data: dataToSave }) });
    const result = await res.json();
    if (result.success) { await muatUlangDataTanpaReload(); Swal.fire({ icon: 'success', title: 'Berhasil!', timer: 1500, showConfirmButton: false }); } 
    else Swal.fire('Gagal', result.message, 'error');
  } catch (error) { Swal.fire('Error', error.message, 'error'); }
}

// ==========================================
// IMPORT EXCEL DLL & DOWNLOAD TEMPLATE
// ==========================================
function downloadTemplate() {
  const templateData = [
    { "NIS": "84260001", "Nama Lengkap": "MOH RIZIEQ", "JK": "L", "TTL": "Bangkalan, 11 Oktober 2010", "Kelas": "SANA - Kelas 2", "Alamat": "Telentean Dsn Longkak", "Ayah": "Masudi", "Ibu": "Maryatun", "HP": "081330206609" },
    { "NIS": "84260002", "Nama Lengkap": "SITI MARYAM", "JK": "P", "TTL": "Surabaya, 1 Januari 2012", "Kelas": "IBT - Kelas VI", "Alamat": "Jl. Contoh No 123", "Ayah": "Budi", "Ibu": "Siti", "HP": "081234567890" }
  ];
  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Santri");
  XLSX.writeFile(workbook, "Template_Data_Santri.xlsx");
}

function bukaFormImport() {
  Swal.fire({
    title: '<h3 class="text-xl font-extrabold text-gray-800 mt-2">Import Master Data</h3>',
    html: `
      <div class="text-left mt-2 text-sm">
        <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-100 shadow-sm"><i class="fas fa-file-excel"></i></div>
        <p class="text-xs text-gray-500 mb-3 text-center leading-relaxed">
          Sistem kini mendukung sinkronisasi <b>semua kolom</b> dari Excel Anda:<br>
          <span class="font-bold text-gray-700 bg-gray-100 px-2 py-1.5 rounded-md mt-2 inline-block shadow-inner border border-gray-200 text-[10px]">NIS, Nama, JK, TTL, Kelas, Alamat, Ayah, Ibu, HP</span>
        </p>
        <div class="flex justify-center mb-4">
           <button onclick="downloadTemplate()" class="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-sm"><i class="fas fa-download"></i> Download Template Excel</button>
        </div>
        <div class="relative group">
          <input type="file" id="fileImport" accept=".xlsx, .xls, .csv" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-gray-200 rounded-xl bg-gray-50 p-1.5 outline-none transition-all shadow-inner">
        </div>
      </div>
    `,
    showCancelButton: true, buttonsStyling: false, confirmButtonText: '<i class="fas fa-cloud-upload-alt mr-1"></i> Mulai Sinkronisasi', cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-[32px]', confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl w-full transition-colors shadow-md', cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold py-3 px-4 rounded-xl w-full transition-colors', actions: 'flex gap-3 w-full px-5 pb-2 mt-4', htmlContainer: 'm-0 px-5' },
    preConfirm: () => { const file = document.getElementById('fileImport').files[0]; if (!file) { Swal.showValidationMessage('Silakan pilih file Excel!'); return false; } return file; }
  }).then((result) => {
    if (result.isConfirmed) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const raw = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const d = raw.map(row => {
          const getVal = (keyMatch) => { for (let k in row) { if (k.toString().toUpperCase().trim().includes(keyMatch)) return row[k]; } return "-"; };
          return { NIS: getVal('NIS') !== "-" ? getVal('NIS') : getVal('NO'), Nama: getVal('NAMA'), JK: getVal('JK'), TTL: getVal('TTL'), Kelas: getVal('KELAS'), Alamat: getVal('ALAMAT'), Ayah: getVal('AYAH'), Ibu: getVal('IBU'), HP: getVal('HP') };
        });
        kirimDataImportKeServer(d);
      };
      reader.readAsArrayBuffer(result.value);
    }
  });
}

async function kirimDataImportKeServer(d) { 
  Swal.fire({ title:'Mengupload...', didOpen:()=>Swal.showLoading()}); 
  try { 
    await fetch(API_URL, {method:'POST', body:JSON.stringify({action:'import_santri', data: d})}); 
    await muatUlangDataTanpaReload(); 
    Swal.fire('Sukses', 'Data berhasil diimport', 'success'); 
  } catch (e) { Swal.fire('Info', 'Cek database', 'info'); } 
}

function resetDataSantri() {
  Swal.fire({
    title: 'Reset Data Santri?',
    text: 'Semua data santri akan dihapus. Aksi ini tidak dapat dibatalkan!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#94a3b8',
    confirmButtonText: '<i class="fas fa-trash-alt mr-1"></i> Ya, Kosongkan!',
    cancelButtonText: 'Batal',
    customClass: { popup: 'rounded-[32px]' }
  }).then(async (r) => {
    if (r.isConfirmed) {
      Swal.fire({ title: 'Menghapus Data...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      try {
        const res = await fetch(API_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'reset_santri' }) 
        });
        const result = await res.json();
        if (result.success) {
          await muatUlangDataTanpaReload();
          Swal.fire('Berhasil!', result.message, 'success');
        } else {
          Swal.fire('Gagal', result.message, 'error');
        }
      } catch (e) {
        Swal.fire('Error', 'Terjadi kesalahan saat menghapus data.', 'error');
      }
    }
  });
}

// ==========================================
// PWA: NOTIFIKASI INSTALL APLIKASI
// ==========================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); deferredPrompt = e;
  const installBanner = document.getElementById('install-banner');
  if (installBanner && !localStorage.getItem('pwa_ditolak')) {
    installBanner.classList.remove('hidden');
    setTimeout(() => { installBanner.classList.remove('-translate-y-20', 'opacity-0'); installBanner.classList.add('translate-y-0', 'opacity-100'); }, 100);
  }
});

document.getElementById('btn-install')?.addEventListener('click', async () => {
  const installBanner = document.getElementById('install-banner');
  installBanner.classList.add('-translate-y-20', 'opacity-0');
  setTimeout(() => installBanner.classList.add('hidden'), 500);
  if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; deferredPrompt = null; }
});

document.getElementById('btn-tutup-install')?.addEventListener('click', () => {
  const installBanner = document.getElementById('install-banner');
  installBanner.classList.add('-translate-y-20', 'opacity-0');
  setTimeout(() => installBanner.classList.add('hidden'), 500);
  localStorage.setItem('pwa_ditolak', 'true');
});