/**
 * LOGIK UTAMA - script.js (VERSI KEMASKINI PENUH)
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 * Integrasi: Flask API (app.py) untuk hantaran PDF
 */

let masterData = [];
let currentOrientation = 'portrait'; 

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
 * 3. LIVE CONTROL ENGINE & UI HELPERS
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
 * 4. LOGIK MODAL & PREVIEW
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    if(!masterData[idx]) return;

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

/**
 * 5. INTEGRASI TELEGRAM (HUBUNGAN KE app.py)
 */
async function hantarSijilKeTelegram(peserta) {
    console.log("Memulakan hantaran ke Telegram untuk:", peserta.nama);
    
    try {
        const response = await fetch('/api/send_telegram', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nama: peserta.nama,
                ic: peserta.ic
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("Berjaya:", result.message);
            return true;
        } else {
            console.error("Gagal:", result.message);
            alert("Ralat: " + result.message);
            return false;
        }
    } catch (error) {
        console.error("Ralat Network:", error);
        alert("Gagal menyambung ke Server Python (app.py). Pastikan server sedang berjalan!");
        return false;
    }
}

// Fungsi Trigger dari butang individu
function hantarKeTelegramByIndex(idx) {
    if(masterData[idx]) {
        hantarSijilKeTelegram(masterData[idx]);
    }
}

// Fungsi Trigger Bulk (Hantar Semua Pilihan)
async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const sahkan = confirm(`Hantar ${checked.length} sijil secara automatik ke Telegram?`);
    if (!sahkan) return;

    const statusText = document.getElementById('status-text');
    const btnAsal = document.querySelector('.btn-bulk-telegram'); 
    
    if(btnAsal) {
        btnAsal.disabled = true;
        btnAsal.innerHTML = "⌛ SEDANG MENGHANTAR...";
    }

    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        if(statusText) statusText.innerText = `⏳ Menghantar (${i + 1}/${checked.length}): ${peserta.nama}`;

        const sukses = await hantarSijilKeTelegram(peserta);
        
        // Delay 1.5 saat antara hantaran supaya tak kena 'spam block' oleh Telegram
        if(sukses) await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if(statusText) statusText.innerText = `✅ Selesai! ${checked.length} sijil telah diproses.`;
    if(btnAsal) {
        btnAsal.disabled = false;
        btnAsal.innerHTML = "🚀 AUTO-RUN KE TELEGRAM";
    }
    alert("Proses Bulk Selesai!");
}

/**
 * 6. FUNGSI CETAK & UTILITI LAIN
 */
function printSingleCertByIndex(idx) {
    currentOrientation = document.getElementById('orientation-selector').value;
    if(masterData[idx]) printSingleCert(masterData[idx], currentOrientation);
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

// Jalankan load data permulaan
loadData();
