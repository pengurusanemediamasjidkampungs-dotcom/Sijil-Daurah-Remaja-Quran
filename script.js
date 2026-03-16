/**
 * LOGIK UTAMA - script.js
 * Fokus: Pengurusan Data, UI Control Panel, dan Integrasi Print Engine
 */

let masterData = [];
let currentOrientation = 'landscape';

/**
 * 1. MUAT DATA & RENDER
 */
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

function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    if (!listDiv) return;

    listDiv.innerHTML = data.map((item, index) => `
        <div class="name-item" data-group="${item.kumpulan || 'ALL'}">
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                <label for="user-${index}">
                    <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                    <br><small>${item.ic}</small>
                </label>
            </div>
            <button onclick="printSingleCertByIndex(${index})" class="no-print btn-quick-print">
                CETAK 🖨️
            </button>
        </div>
    `).join('');
}

/**
 * 2. LIVE CONTROL ENGINE
 */
function updateLiveStyle(prop, value) {
    document.documentElement.style.setProperty(`--${prop}`, value + 'px');
    const label = document.getElementById(`val-${prop}`);
    if (label) label.innerText = value + 'px';
}

function injectControlPanel() {
    return `
        <div class="control-panel-live no-print">
            <h4 style="margin-top:0; color:#333; border-bottom:2px solid #d4af37; padding-bottom:5px;">Kawalan Kekemasan Sijil (Live)</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                <div>
                    <label>Saiz Logo Masjid: <span id="val-logo-size">140px</span></label>
                    <input type="range" min="50" max="250" value="140" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)">
                </div>
                <div>
                    <label>Saiz Logo Program: <span id="val-logo-program-size">120px</span></label>
                    <input type="range" min="50" max="250" value="120" style="width:100%" oninput="updateLiveStyle('logo-program-size', this.value)">
                </div>
                <div>
                    <label>Saiz Nama: <span id="val-name-size">48px</span></label>
                    <input type="range" min="20" max="100" value="48" style="width:100%" oninput="updateLiveStyle('name-size', this.value)">
                </div>
                <div>
                    <label>Jarak Kandungan: <span id="val-content-spacing">25px</span></label>
                    <input type="range" min="0" max="100" value="25" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)">
                </div>
            </div>
        </div>
    `;
}

/**
 * 3. LOGIK MODAL & PREVIEW (DIKEMASKINI DENGAN BUTANG INDIVIDU)
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    // Paparan untuk seorang sahaja
    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            <div class="no-print" style="margin-bottom: 15px;">
                <button onclick="printSingleCertByIndex(${idx})" class="action-btn" style="background:#27ae60; margin:0;">
                    🖨️ CETAK SIJIL INI SAHAJA
                </button>
            </div>
            ${createCertTemplate(masterData[idx], currentOrientation)}
        </div>
    `;

    document.getElementById('modal-confirm-btn').onclick = function() {
        printSingleCert(masterData[idx], currentOrientation);
    };

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

function generateAndPreviewBulk() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    const selectedData = Array.from(checked).map(cb => masterData[cb.value]);

    // Bina kandungan: Setiap sijil ada butang cetak sendiri di atasnya
    let certsContent = selectedData.map((item) => {
        const originalIndex = masterData.indexOf(item);
        return `
            <div class="preview-item-container" style="width:100%; text-align:center; margin-bottom:80px; padding:20px; background:#f9f9f9; border-radius:10px;">
                <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="printSingleCertByIndex(${originalIndex})" 
                            style="background:#2ecc71; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        🖨️ CETAK SIJIL: ${item.nama}
                    </button>
                </div>
                ${createCertTemplate(item, currentOrientation)}
                <hr class="preview-divider no-print">
            </div>
        `;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;

    // Butang di bahagian bawah modal untuk cetak semua sekali
    document.getElementById('modal-confirm-btn').onclick = function() {
        if(confirm(`Cetak semua ${selectedData.length} sijil secara pukal?`)) {
            executeFinalPrint(selectedData, currentOrientation);
        }
    };

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

/**
 * 4. FUNGSI HELPER CETAKAN
 */
function printSingleCertByIndex(idx) {
    if(masterData[idx]) {
        printSingleCert(masterData[idx], currentOrientation);
    }
}

/**
 * 5. UTILITI UI (Filter, Toggle, Orientation)
 */
function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    const modal = document.getElementById('preview-modal');
    if (modal.style.display === 'block') {
        const certs = document.querySelectorAll('.certificate');
        certs.forEach(c => {
            if(currentOrientation === 'portrait') c.classList.add('portrait');
            else c.classList.remove('portrait');
        });
    }
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

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
    document.getElementById('preview-area').innerHTML = ''; 
}

// Inisialisasi
loadData();
