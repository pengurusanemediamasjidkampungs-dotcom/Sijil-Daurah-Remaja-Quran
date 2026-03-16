/**
 * SISTEM PENGURUSAN SIJIL DAURAH 2026
 * Logik Utama: script.js
 */

let masterData = [];

// 1. Muat data dari data.json apabila halaman dibuka
async function loadData() {
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error("Gagal mengambil data.json");
        masterData = await res.json();
        renderNameList(masterData);
        document.getElementById('status-text').innerText = `${masterData.length} peserta sedia ada.`;
    } catch (e) {
        console.error(e);
        document.getElementById('status-text').innerText = "Ralat: Pastikan fail data.json wujud!";
    }
}

// 2. Papar senarai nama pada panel kawalan
function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    listDiv.innerHTML = '';
    data.forEach((item, index) => {
        listDiv.innerHTML += `
            <div class="name-item" data-group="${item.kumpulan}">
                <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                <label for="user-${index}">
                    <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                    <br><small>${item.ic}</small>
                </label>
            </div>
        `;
    });
}

// 3. Template Sijil (KEMASKINI: Nama Masjid diganti dengan Logo PNG & Rujukan Kandungan)
function createCertTemplate(item) {
    return `
        <div class="certificate">
            <div class="content-overlay">
                <div class="header-with-logos">
                    <img src="logo_masjid.png" class="logo-left" alt="Logo Masjid">
                    <div class="header-text">
                        <img src="khatmklsb.png" class="mosque-name-logo" alt="Masjid Kampung Sungai Lang Baru">
                        
                        <h1 class="title">Sijil Penyertaan</h1>
                        <div class="program-name-top">DAURAH REMAJA QURANIC 2026</div>
                        <p class="sub-title">Dengan ini diperakukan bahawa</p>
                    </div>
                    <img src="logo_daurahquran.png" class="logo-right" alt="Logo Program">
                </div>

                <div class="participant-name">${item.nama}</div>
                <div class="participant-ic">No. K/P: ${item.ic}</div>

                <div class="program-info-final">
                    yang telah berlangsung sepanjang bulan <strong>Ramadhan 1447H</strong><br>
                    bermula dari sesi 1 pada <strong>28 Februari 2026</strong> sehingga sesi 8 pada <strong>22 Mac 2026</strong><br>
                    anjuran Masjid Kampung Sungai Lang Baru setiap hari Sabtu dan Ahad.
                </div>

                <div class="signatures">
                    <div class="sig-wrapper">
                        <img src="tandatangannazir.png" class="signature-img">
                        <div class="sig-line single-sig">
                            <strong>( NAZIR MASJID )</strong><br>
                            Masjid Kampung Sungai Lang Baru
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 4. Logik Preview Individu (Klik pada nama)
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    area.innerHTML = createCertTemplate(masterData[idx]);
    
    confirmBtn.onclick = function() {
        if(confirm("Cetak sijil untuk " + masterData[idx].nama + "?")) {
            printSingleCert(idx);
        }
    };

    document.getElementById('preview-modal').style.display = 'block';
    document.getElementById('preview-modal').scrollTop = 0;
}

// 5. Fungsi untuk Pralihat Pukal (Bulk Preview - Butang Hijau Utama)
function generateAndPreviewBulk() {
    const area = document.getElementById('preview-area');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    area.innerHTML = '';

    checked.forEach((cb, index) => {
        const idx = cb.value;
        area.innerHTML += createCertTemplate(masterData[idx]);
        
        if (index < checked.length - 1) {
            area.innerHTML += '<hr class="preview-divider" style="margin: 40px 0; border: 1px dashed #ccc; border-top:none;">';
        }
    });

    confirmBtn.onclick = function() {
        if(confirm("Adakah anda pasti semua maklumat betul? Kertas sijil asal tidak boleh dipadam jika salah cetak.")) {
            executeFinalPrint();
        }
    };

    document.getElementById('preview-modal').style.display = 'block';
    document.getElementById('preview-modal').scrollTop = 0;
}

// 6. Fungsi Eksekusi Cetakan Terakhir (Window Print)
function executeFinalPrint() {
    const container = document.getElementById('certificate-container');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    container.innerHTML = '';

    checked.forEach((cb, index) => {
        container.innerHTML += createCertTemplate(masterData[cb.value]);
        if (index < checked.length - 1) {
            container.innerHTML += '<div class="page-break"></div>';
        }
    });

    closePreview();

    document.getElementById('status-text').innerText = "Sedang menghantar ke pencetak...";
    
    setTimeout(() => { 
        window.print(); 
        document.getElementById('status-text').innerText = "Cetakan selesai.";
        container.innerHTML = ''; 
    }, 1000);
}

// 7. Fungsi Cetak Sijil Tunggal (Dipanggil dari pengesahan individu)
function printSingleCert(idx) {
    const container = document.getElementById('certificate-container');
    container.innerHTML = ''; 
    container.innerHTML = createCertTemplate(masterData[idx]);
    
    closePreview();

    setTimeout(() => {
        window.print();
        container.innerHTML = '';
    }, 500);
}

// 8. Tutup Modal
function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
    document.getElementById('preview-area').innerHTML = ''; 
}

// 9. Tapis & Pilih Semua
function filterData() {
    const group = document.getElementById('group-filter').value;
    document.querySelectorAll('.name-item').forEach(item => {
        const match = (group === "ALL" || item.getAttribute('data-group') === group);
        item.style.display = match ? "flex" : "none";
        if(!match) item.querySelector('input').checked = false;
    });
}

function toggleAll(status) {
    document.querySelectorAll('.cert-checkbox').forEach(cb => {
        if(cb.parentElement.style.display !== "none") cb.checked = status;
    });
}

// Jalankan loadData
loadData();
