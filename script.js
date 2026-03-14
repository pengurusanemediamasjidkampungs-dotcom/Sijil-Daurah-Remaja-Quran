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

// 3. Template Sijil (Pusat Kawalan Reka Bentuk)
function createCertTemplate(item) {
    return `
        <div class="certificate">
            <div class="content-overlay">
                <div class="header-with-logos">
                    <img src="logo_masjid.png" class="logo-left" alt="Logo Masjid">
                    <div class="header-text">
                        <p class="institution">MASJID KAMPUNG SUNGAI LANG BARU</p>
                        <h1 class="title">Sijil Penyertaan</h1>
                        <p class="sub-title">Dengan ini diperakukan bahawa</p>
                    </div>
                    <img src="logo_daurahquran.png" class="logo-right" alt="Logo Program">
                </div>

                <div class="participant-name">${item.nama}</div>
                <div class="participant-ic">No. K/P: ${item.ic}</div>

                <div class="program-info">
                    Telah berjaya mengikuti <strong>sepanjang sesi</strong> intensif setiap Sabtu & Ahad (8:15 AM - 10:45 AM)<br>
                    <span class="program-name">DAURAH REMAJA QURAN 2026</span><br>
                    Sepanjang Bulan Ramadan 1447H
                </div>

                <table class="sessions-grid">
                    <tr><td>Sesi 1: 28 Feb</td><td>Sesi 2: 1 Mac</td><td>Sesi 3: 7 Mac</td><td>Sesi 4: 8 Mac</td></tr>
                    <tr><td>Sesi 5: 14 Mac</td><td>Sesi 6: 15 Mac</td><td>Sesi 7: 21 Mac</td><td>Sesi 8: 22 Mac</td></tr>
                </table>

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

// 4. Logik Preview (Munculkan Modal)
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const printBtn = document.getElementById('modal-print-btn');
    
    // Papar template dalam modal
    area.innerHTML = createCertTemplate(masterData[idx]);
    
    // Konfigurasi butang cetak dalam modal
    printBtn.onclick = function() {
        printSingleCert(idx);
    };

    // Papar modal & reset scroll
    document.getElementById('preview-modal').style.display = 'block';
    document.getElementById('preview-modal').scrollTop = 0;
}

// 5. Cetak Sijil Tunggal dari Preview
function printSingleCert(idx) {
    const container = document.getElementById('certificate-container');
    container.innerHTML = createCertTemplate(masterData[idx]);
    
    setTimeout(() => {
        window.print();
    }, 500);
}

// 6. Cetak Pukal (Bulk Print)
function generateAndPrint() {
    const container = document.getElementById('certificate-container');
    container.innerHTML = '';
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    checked.forEach(cb => {
        container.innerHTML += createCertTemplate(masterData[cb.value]) + '<div class="page-break"></div>';
    });

    document.getElementById('status-text').innerText = "Menyediakan dokumen cetakan...";
    
    setTimeout(() => { 
        window.print(); 
        document.getElementById('status-text').innerText = "Cetakan selesai.";
    }, 800);
}

// 7. Tutup Modal
function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
    document.getElementById('preview-area').innerHTML = ''; 
}

// 8. Tapis & Pilih Semua (Filter Functions)
function filterData() {
    const group = document.getElementById('group-filter').value;
    document.querySelectorAll('.name-item').forEach(item => {
        const match = (group === "ALL" || item.getAttribute('data-group') === group);
        item.style.display = match ? "flex" : "none";
        item.querySelector('input').checked = match;
    });
}

function toggleAll(status) {
    document.querySelectorAll('.cert-checkbox').forEach(cb => {
        if(cb.parentElement.style.display !== "none") cb.checked = status;
    });
}

// Jalankan loadData sebaik fail script.js dimuatkan
loadData();
