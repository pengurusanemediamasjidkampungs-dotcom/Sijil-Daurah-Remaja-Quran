/**
 * LOGIK UTAMA - script.js (VERSI STABIL: PESERTA + PEMBIMBING + ANTI-PAGE-KOSONG)
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 */

let masterData = [];
let currentOrientation = 'portrait'; 

/**
 * 1. MUAT DATA DARI DUA SUMBER
 */
async function loadData() {
    const statusText = document.getElementById('status-text');
    try {
        const resPeserta = await fetch('data.json');
        const dataPeserta = await resPeserta.json();

        const resPembimbing = await fetch('pembimbing_daurah.json');
        const dataPembimbing = await resPembimbing.json();
        
        const pembimbingProcessed = dataPembimbing.map(p => ({
            ...p,
            kumpulan: p.kumpulan || "PEMBIMBING" 
        }));

        masterData = [...pembimbingProcessed, ...dataPeserta];
        renderNameList(masterData);
        
        // DEFAULT VALUES (Apple-inspired UI scale)
        document.documentElement.style.setProperty('--logo-size', '250px');
        document.documentElement.style.setProperty('--logo-program-size', '150px');
        document.documentElement.style.setProperty('--name-size', '28px');
        document.documentElement.style.setProperty('--content-spacing', '0px');
        
        statusText.innerText = `${masterData.length} rekod sedia ada (Termasuk Pembimbing).`;
    } catch (e) {
        console.error(e);
        statusText.innerText = "Ralat: Pastikan fail JSON wujud dalam repo!";
    }
}

function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    if (!listDiv) return;

    listDiv.innerHTML = data.map((item, index) => {
        const isPembimbing = item.kumpulan === "PEMBIMBING";
        return `
        <div class="name-item" data-group="${item.kumpulan || 'ALL'}" style="${isPembimbing ? 'border-left: 4px solid #d4af37;' : ''}">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                <label for="user-${index}">
                    <span class="preview-link" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                    <br><small>${item.ic} | <b>${item.kumpulan}</b></small>
                </label>
            </div>
            <div class="action-buttons-list" style="display: flex; gap: 5px;">
                <button onclick="printSingleCertByIndex(${index})" class="no-print btn-quick-print">🖨️</button>
                <button onclick="hantarKeTelegramByIndex(${index})" class="no-print btn-quick-telegram">🚀</button>
            </div>
        </div>
    `}).join('');
}

/**
 * 2. INTEGRASI TELEGRAM BOT (FIXED: ANTI-PAGE-KOSONG)
 */
async function hantarKeTelegram(peserta) {
    const element = document.querySelector('.certificate');
    if (!element) return { status: 'error', message: 'Sijil tidak dijumpai!' };

    const opt = {
        margin: [0, 0, 0, 0], // Top, Left, Bottom, Right (Fix page kosong)
        filename: `Sijil_${peserta.nama.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false, 
            letterRendering: true,
            scrollY: 0 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: currentOrientation, compress: true },
        pagebreak: { mode: 'avoid-all' } // Elakkan page kedua kosong
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
                alert("⚠️ Gagal! Pastikan Server Python aktif.");
            }
        }, 1200); 
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
            <h4 style="margin-top:0; color:#333; border-bottom:2px solid #d4af37; padding-bottom:5px;">Kawalan Kekemasan (Live)</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                <div><label>Logo Masjid: <span id="val-logo-size">250px</span></label><input type="range" min="50" max="400" value="250" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)"></div>
                <div><label>Logo Daurah: <span id="val-logo-program-size">150px</span></label><input type="range" min="50" max="400" value="150" style="width:100%" oninput="updateLiveStyle('logo-program-size', this.value)"></div>
                <div><label>Saiz Nama: <span id="val-name-size">28px</span></label><input type="range" min="10" max="100" value="28" style="width:100%" oninput="updateLiveStyle('name-size', this.value)"></div>
                <div><label>Jarak: <span id="val-content-spacing">0px</span></label><input type="range" min="0" max="100" value="0" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)"></div>
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
                <button onclick="printSingleCertByIndex(${idx})" class="action-btn" style="background:#27ae60; margin:0;">🖨️ CETAK</button>
                <button onclick="hantarKeTelegram(masterData[${idx}])" class="action-btn" style="background:#0088cc; margin:0;">🚀 KE TELEGRAM</button>
            </div>
            ${createCertTemplate(masterData[idx], currentOrientation)}
        </div>
    `;
    modal.style.display = 'block';
}

function generateAndPreviewBulk() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih nama!");

    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    let certsContent = Array.from(checked).map(cb => {
        const item = masterData[cb.value];
        const originalIndex = cb.value;
        return `
            <div class="preview-item-container" style="width:100%; text-align:center; margin-bottom:80px; padding:20px; background:#f9f9f9; border-radius:10px;">
                <div class="no-print" style="margin-bottom: 20px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="printSingleCertByIndex(${originalIndex})" style="background:#2ecc71; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer;">🖨️ CETAK: ${item.nama}</button>
                    <button onclick="hantarKeTelegram(masterData[${originalIndex}])" style="background:#0088cc; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer;">🚀 TELEGRAM</button>
                </div>
                ${createCertTemplate(item, currentOrientation)}
                <hr class="preview-divider no-print">
            </div>`;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;
    modal.style.display = 'block';
}

/**
 * 5. FUNGSI HELPER & UI
 */
function printSingleCertByIndex(idx) { if(masterData[idx]) printSingleCert(masterData[idx], currentOrientation); }

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
        const isMatch = (group === "ALL" || item.getAttribute('data-group') === group);
        item.style.display = isMatch ? "flex" : "none";
    });
}

function toggleAll(status) {
    document.querySelectorAll('.name-item').forEach(item => {
        if(item.style.display !== "none") item.querySelector('.cert-checkbox').checked = status;
    });
}

function closePreview() { document.getElementById('preview-modal').style.display = 'none'; }

/**
 * 6. AUTO-RUN BULK (ANTI-NAMA-SAMA + TAPIS PILIHAN SAHAJA)
 */
async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Pilih sekurang-kurangnya satu nama!");

    if (!confirm(`Hantar ${checked.length} sijil pilihan sahaja?`)) return;

    const statusText = document.getElementById('status-text');
    const btnAsal = event.target;
    btnAsal.disabled = true;
    btnAsal.innerText = "⌛ SEDANG DIPROSES...";

    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        statusText.innerText = `⏳ Menghantar (${i + 1}/${checked.length}): ${peserta.nama}`;
        
        showPreview(idx); // Paksa render DOM unik
        await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 2 saat

        try {
            await hantarKeTelegram(peserta);
        } catch (err) {
            console.error(err);
        }
    }

    statusText.innerText = `✅ Selesai! ${checked.length} sijil unik dihantar.`;
    btnAsal.disabled = false;
    btnAsal.innerText = "🚀 AUTO-RUN KE TELEGRAM";
}

loadData();
