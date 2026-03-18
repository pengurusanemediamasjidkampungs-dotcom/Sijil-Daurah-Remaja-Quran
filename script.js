/**
 * LOGIK UTAMA - script.js
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 * Modul Tambahan: Cetakan Khas Pembimbing
 */

let masterData = [];
let currentOrientation = 'portrait'; // DEFAULT SET KE PORTRAIT

/**
 * 1. DATA PEMBIMBING (HARDCODED)
 */
const dataPembimbing = [
    { id: "P1", nama: "MUHAMMAD AIMAN BIN MOHAMAD RAFEE", ic: "960908-10-6031", kumpulan: "PEMBIMBING" },
    { id: "P2", nama: "MUHAMMAD NUAIM BIN MOHD DARHA", ic: "901010-10-6297", kumpulan: "PEMBIMBING" },
    { id: "P3", nama: "MUHAMMAD AIDIL 'ARIF BIN MOHD DARHA", ic: "970210-10-5511", kumpulan: "PEMBIMBING" }
];

/**
 * 2. MUAT DATA PESERTA & RENDER
 */
async function loadData() {
    const statusEl = document.getElementById('status-text');
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error("Gagal mengambil data.json");
        
        const jsonData = await res.json();
        masterData = [...dataPembimbing, ...jsonData];
        
        renderNameList(masterData);
        
        // DEFAULT CSS VARIABLES
        document.documentElement.style.setProperty('--logo-size', '250px');
        document.documentElement.style.setProperty('--logo-program-size', '150px');
        document.documentElement.style.setProperty('--name-size', '28px');
        document.documentElement.style.setProperty('--content-spacing', '0px');
        
        if(statusEl) statusEl.innerText = `${masterData.length} data sedia ada.`;
    } catch (e) {
        console.error(e);
        if(statusEl) statusEl.innerText = "Ralat: Pastikan fail data.json wujud!";
    }
}

function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    if (!listDiv) return;

    listDiv.innerHTML = data.map((item, index) => {
        const isP = item.kumpulan === "PEMBIMBING";
        return `
            <div class="name-item" data-group="${item.kumpulan || 'ALL'}" style="${isP ? 'border-left: 5px solid #d4af37; background: #fffcf0;' : ''}">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                    <label for="user-${index}">
                        <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();" style="${isP ? 'font-weight:bold; color:#b8860b;' : ''}">
                            ${item.nama} ${isP ? '⭐' : ''}
                        </span>
                        <br><small>${item.ic} | <b>${item.kumpulan}</b></small>
                    </label>
                </div>
                <div class="action-buttons-list" style="display: flex; gap: 5px;">
                    <button onclick="printSingleCertByIndex(${index})" class="no-print btn-quick-print">🖨️</button>
                    <button onclick="hantarKeTelegramByIndex(${index})" class="no-print btn-quick-telegram">🚀</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * 3. LIVE CONTROL ENGINE
 */
function updateLiveStyle(prop, value) {
    document.documentElement.style.setProperty(`--${prop}`, value + 'px');
    const label = document.getElementById(`val-${prop}`);
    if (label) label.innerText = value + 'px';
}

function injectControlPanel() {
    return `
        <div class="control-panel-live no-print">
            <h4 style="margin:0 0 10px 0; color:#333; border-bottom:2px solid #d4af37;">⚙️ Pelarasan Saiz (Live)</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px;">
                <div><label>Logo Masjid: <span id="val-logo-size">250px</span></label><input type="range" min="50" max="400" value="250" oninput="updateLiveStyle('logo-size', this.value)"></div>
                <div><label>Logo Program: <span id="val-logo-program-size">150px</span></label><input type="range" min="50" max="400" value="150" oninput="updateLiveStyle('logo-program-size', this.value)"></div>
                <div><label>Saiz Nama: <span id="val-name-size">28px</span></label><input type="range" min="10" max="100" value="28" oninput="updateLiveStyle('name-size', this.value)"></div>
                <div><label>Jarak Teks: <span id="val-content-spacing">0px</span></label><input type="range" min="0" max="100" value="0" oninput="updateLiveStyle('content-spacing', this.value)"></div>
            </div>
        </div>
    `;
}

/**
 * 4. LOGIK MODAL & PREVIEW (PESERTA & PEMBIMBING)
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    if(!masterData[idx]) return;

    // SYNC ORIENTASI TERKINI SEBELUM RENDER
    currentOrientation = document.getElementById('orientation-selector').value;

    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="printSingleCertByIndex(${idx})" class="action-btn" style="background:#27ae60;">🖨️ CETAK SEKARANG</button>
                <button onclick="hantarKeTelegramByIndex(${idx})" class="action-btn" style="background:#0088cc;">🚀 HANTAR TELEGRAM</button>
            </div>
            ${createCertTemplate(masterData[idx], currentOrientation)}
        </div>
    `;
    modal.style.display = 'block';
}

function generateSijilPembimbing() {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');

    // SYNC ORIENTASI TERKINI
    currentOrientation = document.getElementById('orientation-selector').value;

    let certsContent = dataPembimbing.map((item) => `
        <div class="preview-item-container" style="margin-bottom:50px;">
            ${createCertTemplate(item, currentOrientation)}
            <hr class="preview-divider no-print">
        </div>
    `).join('');

    area.innerHTML = injectControlPanel() + `
        <div class="no-print" style="text-align:center; margin-bottom:20px;">
            <button onclick="executeFinalPrintWithData('PEMBIMBING')" class="action-btn" style="background:#d4af37; color:black; padding:15px 40px;">🖨️ CETAK SEMUA PEMBIMBING</button>
        </div>
    ` + certsContent;

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

/**
 * 5. FUNGSI BULK & AUTOMATION
 */
function generateAndPreviewBulk() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    // SYNC ORIENTASI TERKINI
    currentOrientation = document.getElementById('orientation-selector').value;
    
    const selectedData = Array.from(checked).map(cb => masterData[cb.value]);

    let certsContent = selectedData.map((item) => `
        <div class="preview-item-container" style="margin-bottom:50px;">
            ${createCertTemplate(item, currentOrientation)}
            <hr class="preview-divider no-print">
        </div>
    `).join('');

    area.innerHTML = injectControlPanel() + `
        <div class="no-print" style="text-align:center; margin-bottom:20px;">
            <button onclick="executeFinalPrintWithData()" class="action-btn" style="background:#27ae60; padding:15px 40px;">🖨️ CETAK SEMUA YANG DIPILIH</button>
        </div>
    ` + certsContent;

    modal.style.display = 'block';
}

async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const sahkan = confirm(`Hantar ${checked.length} sijil secara automatik ke Telegram?`);
    if (!sahkan) return;

    // SYNC ORIENTASI
    currentOrientation = document.getElementById('orientation-selector').value;

    const statusText = document.getElementById('status-text');
    const btnAsal = event.target;
    btnAsal.disabled = true;
    btnAsal.innerHTML = "⌛ SEDANG MEMPROSES...";

    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        if(statusText) statusText.innerText = `⏳ Memproses (${i + 1}/${checked.length}): ${peserta.nama}`;

        try {
            await hantarSijilKeTelegram(peserta, currentOrientation);
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            console.error(`Gagal hantar: ${peserta.nama}`, err);
        }
    }

    if(statusText) statusText.innerText = `✅ Selesai! ${checked.length} sijil diproses.`;
    btnAsal.disabled = false;
    btnAsal.innerHTML = "🚀 AUTO-RUN KE TELEGRAM";
    alert("Proses Bulk Selesai!");
}

/**
 * 6. UTILITI & UI HELPER
 */
function executeFinalPrintWithData(type = 'SELECTED') {
    let dataToPrint = [];
    if(type === 'PEMBIMBING') {
        dataToPrint = dataPembimbing;
    } else {
        const checked = document.querySelectorAll('.cert-checkbox:checked');
        dataToPrint = Array.from(checked).map(cb => masterData[cb.value]);
    }
    
    currentOrientation = document.getElementById('orientation-selector').value;
    executeFinalPrint(dataToPrint, currentOrientation);
}

function printSingleCertByIndex(idx) {
    currentOrientation = document.getElementById('orientation-selector').value;
    if(masterData[idx]) printSingleCert(masterData[idx], currentOrientation);
}

function hantarKeTelegramByIndex(idx) {
    currentOrientation = document.getElementById('orientation-selector').value;
    if(masterData[idx]) hantarSijilKeTelegram(masterData[idx], currentOrientation);
}

function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    const certs = document.querySelectorAll('.certificate');
    certs.forEach(c => {
        if(currentOrientation === 'portrait') c.classList.add('portrait');
        else c.classList.remove('portrait');
    });
}

function filterData() {
    const group = document.getElementById('group-filter').value;
    document.querySelectorAll('.name-item').forEach(item => {
        const itemGroup = item.getAttribute('data-group');
        const isMatch = (group === "ALL" || itemGroup === group);
        item.style.display = isMatch ? "flex" : "none";
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

loadData();
