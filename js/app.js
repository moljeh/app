// Ganti dengan nomor WhatsApp Anda (Gunakan 62, tanpa 0 atau +)
const ADMIN_PHONE = "6282333166659"; 

// Format Rupiah
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
}

// Template Card Produk
const createProductCard = (product) => {
    return `
        <div class="product-card fade-in">
            <div class="card-img">
                <img src="${product.gambar}" alt="${product.nama}">
                <span class="badge">${product.kategori}</span>
            </div>
            <div class="card-body">
                <h3>${product.nama}</h3>
                <p class="price">${formatRupiah(product.harga)}</p>
                <div class="card-actions">
                    <a href="${product.demo}" target="_blank" class="btn btn-outline">Live Demo</a>
                    <a href="detail.html?id=${product.id}" class="btn btn-primary">Detail</a>
                </div>
            </div>
        </div>
    `;
};

// Routing Sederhana berdasarkan atribut data-page di HTML
const page = document.body.dataset.page;

// Logika Halaman HOME
if (page === "home") {
    const featuredContainer = document.getElementById("featured-products");
    if(featuredContainer) {
        const featured = products.slice(0, 4); // Ambil 4 produk pertama
        featuredContainer.innerHTML = featured.map(createProductCard).join('');
    }
}

// Logika Halaman PRODUK (Katalog)
if (page === "products") {
    const productGrid = document.getElementById("product-grid");
    const searchInput = document.getElementById("search-input");
    const filterBtns = document.querySelectorAll(".filter-btn");

    const renderProducts = (data) => {
        if(data.length === 0) {
            productGrid.innerHTML = `<p class="no-result" style="grid-column: 1/-1; text-align: center; color: #6B7280; margin-top: 2rem;">Produk tidak ditemukan.</p>`;
            return;
        }
        productGrid.innerHTML = data.map(createProductCard).join('');
    };

    renderProducts(products); // Render awal

    let currentCategory = 'All';
    let searchQuery = '';

    const filterData = () => {
        let filtered = products;
        
        if (currentCategory !== 'All') {
            filtered = filtered.filter(p => p.kategori === currentCategory);
        }
        
        if (searchQuery) {
            filtered = filtered.filter(p => p.nama.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        
        renderProducts(filtered);
    };

    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        filterData();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.filter;
            filterData();
        });
    });
}

// Logika Halaman DETAIL
if (page === "detail") {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
        document.getElementById("detail-image").src = product.gambar;
        document.getElementById("detail-name").textContent = product.nama;
        document.getElementById("detail-category").textContent = product.kategori;
        document.getElementById("detail-price").textContent = formatRupiah(product.harga);
        document.getElementById("detail-desc").textContent = product.deskripsi;
        document.getElementById("demo-link").href = product.demo;

        const featuresList = document.getElementById("detail-features");
        featuresList.innerHTML = product.fitur.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('');

        const techList = document.getElementById("detail-tech");
        techList.innerHTML = product.teknologi.map(t => `<span class="tech-badge">${t}</span>`).join('');

        document.getElementById("btn-order").addEventListener("click", () => {
            const message = `Halo Admin, saya ingin membeli template:\n\nNama Produk: *${product.nama}*\nHarga: *${formatRupiah(product.harga)}*\nKategori: ${product.kategori}\nLink Demo: ${product.demo}\n\nMohon informasi pembayaran.`;
            const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    } else {
        document.getElementById("product-detail-container").innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 5rem 0;">
                <h2>Produk tidak ditemukan</h2>
                <br>
                <a href="products.html" class="btn btn-primary">Kembali ke Katalog</a>
            </div>
        `;
    }
}

// --- REGISTER SERVICE WORKER UNTUK PWA ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker terdaftar dengan sukses dengan scope: ', registration.scope);
            }, err => {
                console.log('Pendaftaran ServiceWorker gagal: ', err);
            });
    });
}