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
            <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
            <label for="user-${index}">
                <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                <br><small>${item.ic}</small>
            </label>
        </div>
    `).join('');
}

/**
 * 2. LIVE CONTROL ENGINE
 */
function updateLiveStyle(prop, value) {
    // Kemaskini variable CSS di peringkat root (document)
    document.documentElement.style.setProperty(`--${prop}`, value + 'px');
    
    // Kemaskini teks label pada slider
    const label = document.getElementById(`val-${prop}`);
    if (label) label.innerText = value + 'px';
}

function injectControlPanel() {
    return `
        <div class="control-panel-live no-print" style="background:#f8f9fa; padding:20px; border:1px solid #ddd; border-radius:10px; margin-bottom:25px; width:100%; font-family:sans-serif; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h4 style="margin-top:0; color:#333; border-bottom:2px solid #d4af37; padding-bottom:5px;">Kawalan Kekemasan Sijil (Live)</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                
                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Saiz Logo Masjid: <span id="val-logo-size">140px</span></label>
                    <input type="range" min="50" max="250" value="140" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)">
                </div>

                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Saiz Logo Program: <span id="val-logo-program-size">120px</span></label>
                    <input type="range" min="50" max="250" value="120" style="width:100%" oninput="updateLiveStyle('logo-program-size', this.value)">
                </div>

                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Saiz Nama: <span id="val-name-size">48px</span></label>
                    <input type="range" min="20" max="100" value="48" style="width:100%" oninput="updateLiveStyle('name-size', this.value)">
                </div>

                <div>
                    <label style="font-weight:bold; display:block; margin-bottom:5px;">Jarak Kandungan: <span id="val-content-spacing">25px</span></label>
                    <input type="range" min="0" max="100" value="25" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)">
                </div>

            </div>
            <p style="font-size:11px; color:#666; margin-top:15px; font-style:italic;">*Pelarasan ini bersifat sementara untuk sesi cetakan ini sahaja.</p>
        </div>
    `;
}

/**
 * 3. LOGIK MODAL & PREVIEW
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    // Panggil template dari print-engine.js
    area.innerHTML = injectControlPanel() + createCertTemplate(masterData[idx], currentOrientation);
    
    confirmBtn.onclick = function() {
        if(confirm(`Cetak sijil untuk ${masterData[idx].nama}?`)) {
            printSingleCert(masterData[idx], currentOrientation);
        }
    };

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

function generateAndPreviewBulk() {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const selectedData = Array.from(checked).map(cb => masterData[cb.value]);

    // Bina kandungan pralihat (dengan divider)
    let certsContent = selectedData.map((item) => createCertTemplate(item, currentOrientation)).join('<hr class="preview-divider">');

    area.innerHTML = injectControlPanel() + certsContent;

    confirmBtn.onclick = function() {
        if(confirm(`Adakah anda pasti untuk mencetak ${selectedData.length} sijil?`)) {
            executeFinalPrint(selectedData, currentOrientation);
        }
    };

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

/**
 * 4. UTILITI UI (Filter, Toggle, Orientation)
 */
function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    // Jika pralihat sedang dibuka, kemaskini paparan secara live
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
        
        // Uncheck jika disembunyikan untuk elak tersalah cetak
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

// Mula sistem
loadData();
