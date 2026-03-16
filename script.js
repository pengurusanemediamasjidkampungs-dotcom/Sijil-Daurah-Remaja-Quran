/**
 * SISTEM PENGURUSAN SIJIL DAURAH 2026
 * Logik Utama: script.js (Updated with Portrait Orientation Support)
 */

let masterData = [];
let currentOrientation = 'landscape'; // Default orientasi

// 1. Muat data dari data.json
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

// 2. Papar senarai nama
function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    listDiv.innerHTML = data.map((item, index) => `
        <div class="name-item" data-group="${item.kumpulan || 'ALL'}">
            <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
            <label for="user-${index}">
                <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                <br><small>${item.ic}</small>
            </label>
        </div>
    `).join('');
}

// 3. Live Control Panel HTML
function injectControlPanel() {
    return `
        <div class="control-panel-live no-print" style="background:#f8f9fa; padding:20px; border:1px solid #ddd; border-radius:10px; margin-bottom:25px; width:100%; font-family:sans-serif; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h4 style="margin-top:0; color:#333; border-bottom:2px solid #d4af37; padding-bottom:5px;">Kawalan Kekemasan Sijil</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Saiz Logo: <span id="val-logo-size">140px</span></label>
                    <input type="range" min="80" max="220" value="140" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)">
                </div>
                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Lebar Khat: <span id="val-khat-width">620px</span></label>
                    <input type="range" min="400" max="850" value="620" style="width:100%" oninput="updateLiveStyle('khat-width', this.value)">
                </div>
                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Saiz Nama: <span id="val-name-size">48px</span></label>
                    <input type="range" min="20" max="80" value="48" style="width:100%" oninput="updateLiveStyle('name-size', this.value)">
                </div>
                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Jarak Kandungan: <span id="val-content-spacing">25px</span></label>
                    <input type="range" min="5" max="80" value="25" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)">
                </div>
            </div>
            <p style="font-size:11px; color:#666; margin-top:15px; font-style:italic;">*Pelarasan ini hanya untuk paparan cetakan semasa dan tidak mengubah fail asal.</p>
        </div>
    `;
}

// 4. Update CSS Variables & Orientasi
function updateLiveStyle(prop, value) {
    document.documentElement.style.setProperty(`--${prop}`, value + 'px');
    const label = document.getElementById(`val-${prop}`);
    if(label) label.innerText = value + 'px';
}

function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    
    // Kemaskini semua elemen sijil yang ada dalam DOM (terutama dalam preview)
    const certs = document.querySelectorAll('.certificate');
    certs.forEach(c => {
        if(currentOrientation === 'portrait') {
            c.classList.add('portrait');
        } else {
            c.classList.remove('portrait');
        }
    });
}

// 5. Template Sijil (KEMASKINI: Sokongan Portrait Dinamik)
function createCertTemplate(item) {
    const portraitClass = (currentOrientation === 'portrait') ? 'portrait' : '';
    
    return `
        <div class="certificate ${portraitClass}">
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
                    yang telah berlangsung pada <strong>Ramadhan 1447H (28 Feb – 22 Mac 2026)</strong><br>
                    anjuran Masjid Kampung Sungai Lang Baru.
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

// 6. Logik Preview Individu
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    area.innerHTML = injectControlPanel() + createCertTemplate(masterData[idx]);
    
    confirmBtn.onclick = function() {
        if(confirm("Cetak sijil untuk " + masterData[idx].nama + "?")) {
            printSingleCert(idx);
        }
    };

    document.getElementById('preview-modal').style.display = 'block';
    document.getElementById('preview-modal').scrollTop = 0;
}

// 7. Pralihat Pukal
function generateAndPreviewBulk() {
    const area = document.getElementById('preview-area');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    let certsContent = Array.from(checked).map((cb, index) => {
        const idx = cb.value;
        let html = createCertTemplate(masterData[idx]);
        if (index < checked.length - 1) {
            html += '<hr class="preview-divider">';
        }
        return html;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;

    confirmBtn.onclick = function() {
        if(confirm("Adakah anda pasti? Sila pastikan kertas sijil telah dimasukkan ke dalam pencetak.")) {
            executeFinalPrint();
        }
    };

    document.getElementById('preview-modal').style.display = 'block';
    document.getElementById('preview-modal').scrollTop = 0;
}

// 8. Eksekusi Cetakan
function executeFinalPrint() {
    const container = document.getElementById('certificate-container');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    container.innerHTML = Array.from(checked).map((cb, index) => {
        let html = createCertTemplate(masterData[cb.value]);
        if (index < checked.length - 1) {
            html += '<div class="page-break"></div>';
        }
        return html;
    }).join('');

    closePreview();
    document.getElementById('status-text').innerText = "Sedang menyediakan dokumen...";
    
    setTimeout(() => { 
        window.print(); 
        document.getElementById('status-text').innerText = "Cetakan selesai.";
        container.innerHTML = ''; 
    }, 1000);
}

// 9. Cetak Sijil Tunggal
function printSingleCert(idx) {
    const container = document.getElementById('certificate-container');
    container.innerHTML = createCertTemplate(masterData[idx]);
    closePreview();
    setTimeout(() => {
        window.print();
        container.innerHTML = '';
    }, 500);
}

// 10. Utiliti (Tutup, Tapis, Toggle)
function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
    document.getElementById('preview-area').innerHTML = ''; 
}

function filterData() {
    const group = document.getElementById('group-filter').value;
    document.querySelectorAll('.name-item').forEach(item => {
        const itemGroup = item.getAttribute('data-group');
        const isMatch = (group === "ALL" || itemGroup === group);
        item.style.display = isMatch ? "flex" : "none";
        if(!isMatch) item.querySelector('input').checked = false;
    });
}

function toggleAll(status) {
    document.querySelectorAll('.name-item').forEach(item => {
        if(item.style.display !== "none") {
            item.querySelector('.cert-checkbox').checked = status;
        }
    });
}

// Mula
loadData();
