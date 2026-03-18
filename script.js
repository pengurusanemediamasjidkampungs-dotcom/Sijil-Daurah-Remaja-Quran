/**
 * LOGIK UTAMA - script.js
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 * Modul Tambahan: Cetakan Khas Pembimbing
 */

let masterData = [];
let currentOrientation = 'portrait';

/**
 * 1. DATA PEMBIMBING (HARDCODED)
 * Data ini tidak bergantung pada data.json untuk akses pantas.
 */
const dataPembimbing = [
    { nama: "MUHAMMAD AIMAN BIN MOHAMAD RAFEE", ic: "960908-10-6031", kumpulan: "PEMBIMBING" },
    { nama: "MUHAMMAD NUAIM BIN MOHD DARHA", ic: "901010-10-6297", kumpulan: "PEMBIMBING" },
    { nama: "MUHAMMAD AIDIL 'ARIF BIN MOHD DARHA", ic: "970210-10-5511", kumpulan: "PEMBIMBING" }
];

/**
 * 2. MUAT DATA PESERTA & RENDER
 */
async function loadData() {
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error("Gagal mengambil data.json");
        masterData = await res.json();
        renderNameList(masterData);
        
        // TETAPKAN NILAI DEFAULT PADA CSS VARIABLES
        document.documentElement.style.setProperty('--logo-size', '250px');
        document.documentElement.style.setProperty('--logo-program-size', '150px');
        document.documentElement.style.setProperty('--name-size', '28px');
        document.documentElement.style.setProperty('--content-spacing', '0px');
        
        document.getElementById('status-text').innerText = `${masterData.length} peserta sedia ada.`;
    } catch (e) {
        console.error(e);
        const statusEl = document.getElementById('status-text');
        if(statusEl) statusEl.innerText = "Ralat: Pastikan fail data.json wujud!";
    }
}

function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    if (!listDiv) return;

    listDiv.innerHTML = data.map((item, index) => `
        <div class="name-item" data-group="${item.kumpulan || 'ALL'}">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                <label for="user-${index}">
                    <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                    <br><small>${item.ic}</small>
                </label>
            </div>
            <div class="action-buttons-list" style="display: flex; gap: 5px;">
                <button onclick="printSingleCertByIndex(${index})" class="no-print btn-quick-print">
                    CETAK 🖨️
                </button>
                <button onclick="hantarKeTelegramByIndex(${index})" class="no-print btn-quick-telegram">
                    BOT 🚀
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * 3. INTEGRASI TELEGRAM BOT
 */
async function hantarKeTelegram(peserta) {
    const element = document.querySelector('.certificate');
    if (!element) return { status: 'error', message: 'Sijil tidak dijumpai!' };

    const opt = {
        margin: 0,
        filename: `Sijil_${peserta.nama.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: currentOrientation }
    };

    try {
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        const formData = new FormData();
        formData.append('file', pdfBlob, opt.filename);
        formData.append('nama', peserta.nama);

        const response = await fetch('http://localhost:5000/upload_pdf', {
            method: 'POST',
            body: formData 
        });

        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function hantarKeTelegramByIndex(idx) {
    if(masterData[idx]) {
        showPreview(idx);
        setTimeout(async () => {
            try {
                const res = await hantarKeTelegram(masterData[idx]);
                if (res.status === 'success') alert(`✅ Berjaya hantar: ${masterData[idx].nama}`);
            } catch (e) {
                alert("⚠️ Gagal menghantar. Semak console.");
            }
        }, 1200);
    }
}

/**
 * 4. LIVE CONTROL ENGINE
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
                <div><label>Saiz Logo Masjid: <span id="val-logo-size">250px</span></label><input type="range" min="50" max="400" value="250" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)"></div>
                <div><label>Saiz Logo Program: <span id="val-logo-program-size">150px</span></label><input type="range" min="50" max="400" value="150" style="width:100%" oninput="updateLiveStyle('logo-program-size', this.value)"></div>
                <div><label>Saiz Nama: <span id="val-name-size">28px</span></label><input type="range" min="10" max="100" value="28" style="width:100%" oninput="updateLiveStyle('name-size', this.value)"></div>
                <div><label>Jarak Kandungan: <span id="val-content-spacing">0px</span></label><input type="range" min="0" max="100" value="0" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)"></div>
            </div>
        </div>
    `;
}

/**
 * 5. LOGIK MODAL & PREVIEW (PESERTA & PEMBIMBING)
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="printSingleCertByIndex(${idx})" class="action-btn" style="background:#27ae60; margin:0;">🖨️ CETAK FIZIKAL</button>
                <button onclick="hantarKeTelegram(masterData[${idx}])" class="action-btn" style="background:#0088cc; margin:0;">🚀 HANTAR KE TELEGRAM (PDF)</button>
            </div>
            ${createCertTemplate(masterData[idx], currentOrientation)}
        </div>
    `;
    modal.style.display = 'block';
}

function generateSijilPembimbing() {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');

    let certsContent = dataPembimbing.map((item) => {
        return `
            <div class="preview-item-container" style="width:100%; text-align:center; margin-bottom:80px; padding:20px; background:#fffceb; border: 2px dashed #d4af37; border-radius:10px;">
                <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: center;">
                    <span style="background:#d4af37; color:white; padding:5px 15px; border-radius:20px; font-size:12px;">MOD PEMBIMBING</span>
                </div>
                ${createCertTemplate(item, currentOrientation)}
                <hr class="preview-divider no-print">
            </div>
        `;
    }).join('');

    area.innerHTML = injectControlPanel() + `
        <div style="text-align:center; margin-bottom:20px;" class="no-print">
            <button onclick="window.print()" class="action-btn" style="background:#27ae60; padding:15px 40px; font-size:18px;">🖨️ CETAK SEMUA PEMBIMBING</button>
        </div>
    ` + certsContent;

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

function generateAndPreviewBulk() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    const selectedData = Array.from(checked).map(cb => masterData[cb.value]);

    let certsContent = selectedData.map((item) => {
        const originalIndex = masterData.indexOf(item);
        return `
            <div class="preview-item-container" style="width:100%; text-align:center; margin-bottom:80px; padding:20px; background:#f9f9f9; border-radius:10px;">
                <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="printSingleCertByIndex(${originalIndex})" style="background:#2ecc71; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold;">🖨️ CETAK: ${item.nama}</button>
                    <button onclick="hantarKeTelegram(masterData[${originalIndex}])" style="background:#0088cc; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold;">🚀 HANTAR TELEGRAM</button>
                </div>
                ${createCertTemplate(item, currentOrientation)}
                <hr class="preview-divider no-print">
            </div>
        `;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;
    modal.style.display = 'block';
}

/**
 * 6. UTILITI & HELPER
 */
function printSingleCertByIndex(idx) {
    if(masterData[idx]) printSingleCert(masterData[idx], currentOrientation);
}

function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    const modal = document.getElementById('preview-modal');
    if (modal.style.display === 'block') {
        document.querySelectorAll('.certificate').forEach(c => {
            currentOrientation === 'portrait' ? c.classList.add('portrait') : c.classList.remove('portrait');
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
        if(item.style.display !== "none") item.querySelector('.cert-checkbox').checked = status;
    });
}

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
    document.getElementById('preview-area').innerHTML = ''; 
}

/**
 * 7. AUTO-RUN BULK TELEGRAM
 */
async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const sahkan = confirm(`Hantar ${checked.length} sijil secara automatik?`);
    if (!sahkan) return;

    const statusText = document.getElementById('status-text');
    const btnAsal = event.target;
    btnAsal.disabled = true;
    btnAsal.innerText = "⌛ SEDANG DIPROSES...";

    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        if(statusText) statusText.innerText = `⏳ Menghantar (${i + 1}/${checked.length}): ${peserta.nama}`;

        try {
            showPreview(idx);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const res = await hantarKeTelegram(peserta);
            if(res.status === 'success') console.log(`Berjaya: ${peserta.nama}`);
        } catch (err) {
            console.error(`Gagal teknikal: ${peserta.nama}`, err);
        }
    }

    if(statusText) statusText.innerText = `✅ Selesai! ${checked.length} sijil unik dihantar.`;
    btnAsal.disabled = false;
    btnAsal.innerText = "🚀 AUTO-RUN KE TELEGRAM";
    alert("Proses Bulk Selesai. Sila semak Bot Telegram anda.");
}

// Inisialisasi
loadData();
