/**
 * LOGIK UTAMA - script.js
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot
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
 * 2. INTEGRASI TELEGRAM BOT (BROWSER-SIDE PDF GENERATION)
 * Menggunakan html2pdf.js untuk menukar HTML kepada Blob PDF
 */
async function hantarKeTelegram(peserta) {
    const element = document.querySelector('.certificate');
    if (!element) return alert("Sijil tidak dijumpai! Sila buka pralihat (preview) terlebih dahulu.");

    // Konfigurasi penukaran ke PDF
    const opt = {
        margin: 0,
        filename: `Sijil_${peserta.nama.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: currentOrientation 
        }
    };

    try {
        console.log("Sedang menjana fail PDF...");
        
        // 1. Jana PDF sebagai Blob (Data mentah fail)
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');

        // 2. Bungkus ke dalam FormData
        const formData = new FormData();
        formData.append('file', pdfBlob, opt.filename);
        formData.append('nama', peserta.nama);

        // 3. Hantar ke app.py (Endpoint: /upload_pdf)
        const response = await fetch('http://localhost:5000/upload_pdf', {
            method: 'POST',
            body: formData 
        });

        const result = await response.json();
        if (result.status === 'success') {
            alert(`✅ Sijil ${peserta.nama} berjaya dihantar ke Telegram!`);
        } else {
            alert("❌ Gagal: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("⚠️ Ralat! Pastikan server Python (app.py) aktif di terminal.");
    }
}

function hantarKeTelegramByIndex(idx) {
    if(masterData[idx]) {
        // Paparkan preview dahulu supaya elemen .certificate wujud dalam DOM
        showPreview(idx);
        // Beri sedikit masa untuk rendering selesai sebelum jana PDF
        setTimeout(() => hantarKeTelegram(masterData[idx]), 800);
    }
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
 * 4. LOGIK MODAL & PREVIEW
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="printSingleCertByIndex(${idx})" class="action-btn" style="background:#27ae60; margin:0;">
                    🖨️ CETAK FIZIKAL
                </button>
                <button onclick="hantarKeTelegram(masterData[${idx}])" class="action-btn" style="background:#0088cc; margin:0;">
                    🚀 HANTAR KE TELEGRAM (PDF)
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

    let certsContent = selectedData.map((item) => {
        const originalIndex = masterData.indexOf(item);
        return `
            <div class="preview-item-container" style="width:100%; text-align:center; margin-bottom:80px; padding:20px; background:#f9f9f9; border-radius:10px;">
                <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="printSingleCertByIndex(${originalIndex})" 
                            style="background:#2ecc71; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        🖨️ CETAK: ${item.nama}
                    </button>
                    <button onclick="hantarKeTelegram(masterData[${originalIndex}])" 
                            style="background:#0088cc; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        🚀 HANTAR TELEGRAM
                    </button>
                </div>
                ${createCertTemplate(item, currentOrientation)}
                <hr class="preview-divider no-print">
            </div>
        `;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;

    document.getElementById('modal-confirm-btn').onclick = function() {
        if(confirm(`Cetak semua ${selectedData.length} sijil secara pukal?`)) {
            executeFinalPrint(selectedData, currentOrientation);
        }
    };

    modal.style.display = 'block';
    modal.scrollTop = 0;
}

/**
 * 5. FUNGSI HELPER CETAKAN
 */
function printSingleCertByIndex(idx) {
    if(masterData[idx]) {
        printSingleCert(masterData[idx], currentOrientation);
    }
}

/**
 * 6. UTILITI UI
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
