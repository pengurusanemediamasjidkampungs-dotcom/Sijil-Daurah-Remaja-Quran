/**
 * LOGIK UTAMA - script.js (VERSI LENGKAP & STABIL)
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 */

let masterData = [];
let currentOrientation = 'landscape'; 

/**
 * 1. MUAT DATA DARI DUA SUMBER (Peserta & Pembimbing)
 */
async function loadData() {
    const statusText = document.getElementById('status-text');
    try {
        // Ambil data peserta (data.json)
        const resPeserta = await fetch('data.json');
        const dataPeserta = await resPeserta.json();

        // Ambil data pembimbing (pembimbing_daurah.json)
        const resPembimbing = await fetch('pembimbing_daurah.json');
        const dataPembimbing = await resPembimbing.json();
        
        const pembimbingProcessed = dataPembimbing.map(p => ({
            ...p,
            kumpulan: p.kumpulan || "PEMBIMBING" 
        }));

        // Gabungkan kedua-dua array (Pembimbing di atas)
        masterData = [...pembimbingProcessed, ...dataPeserta];
        
        renderNameList(masterData);
        
        // TETAPKAN NILAI DEFAULT PADA CSS VARIABLES
        document.documentElement.style.setProperty('--logo-size', '140px');
        document.documentElement.style.setProperty('--logo-program-size', '120px');
        document.documentElement.style.setProperty('--name-size', '48px');
        document.documentElement.style.setProperty('--content-spacing', '25px');
        
        statusText.innerText = `${masterData.length} rekod sedia ada (Termasuk Pembimbing).`;
    } catch (e) {
        console.error(e);
        statusText.innerText = "Ralat: Pastikan fail JSON wujud dalam folder root!";
    }
}

function renderNameList(data) {
    const listDiv = document.getElementById('name-list');
    if (!listDiv) return;

    listDiv.innerHTML = data.map((item, index) => {
        const isPembimbing = item.kumpulan === "PEMBIMBING";
        
        return `
        <div class="name-item" data-group="${item.kumpulan || 'ALL'}" style="${isPembimbing ? 'border-left: 5px solid #d4af37; background: #fffdf0;' : ''}">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="cert-checkbox" id="user-${index}" value="${index}" checked>
                <label for="user-${index}">
                    <span class="preview-link" style="cursor:pointer; font-weight:bold;" onclick="showPreview(${index}); event.preventDefault();">${item.nama}</span>
                    <br><small>${item.ic} | <b>${item.kumpulan}</b></small>
                </label>
            </div>
            <div class="action-buttons-list" style="display: flex; gap: 5px;">
                <button onclick="printSingleCertByIndex(${index})" class="no-print" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:4px; padding:5px;">🖨️</button>
                <button onclick="hantarKeTelegramByIndex(${index})" class="no-print" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:4px; padding:5px;">🚀</button>
            </div>
        </div>
    `}).join('');
}

/**
 * 2. INTEGRASI TELEGRAM BOT (BROWSER-SIDE PDF GENERATION)
 */
async function hantarKeTelegram(peserta) {
    const element = document.querySelector('.certificate');
    if (!element) return { status: 'error', message: 'Sijil tidak dijumpai!' };

    const opt = {
        margin: 0,
        filename: `Sijil_${peserta.nama.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: currentOrientation },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
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

async function hantarKeTelegramByIndex(idx) {
    if(masterData[idx]) {
        showPreview(idx);
        setTimeout(async () => {
            try {
                const res = await hantarKeTelegram(masterData[idx]);
                if (res.status === 'success') alert(`✅ Berjaya hantar: ${masterData[idx].nama}`);
            } catch (e) {
                alert("⚠️ Gagal! Pastikan Server Python di Ubuntu aktif.");
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
        <div class="control-panel-live no-print" style="margin-bottom:20px; border:1px solid #ddd; padding:15px; border-radius:8px; background:#fcfcfc;">
            <h4 style="margin:0 0 10px 0; color:#333; border-bottom:2px solid #d4af37;">Kawalan Kekemasan (Live)</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px;">
                <div><label>Saiz Logo: <span id="val-logo-size">140px</span></label><input type="range" min="50" max="400" value="140" style="width:100%" oninput="updateLiveStyle('logo-size', this.value)"></div>
                <div><label>Saiz Nama: <span id="val-name-size">48px</span></label><input type="range" min="10" max="100" value="48" style="width:100%" oninput="updateLiveStyle('name-size', this.value)"></div>
                <div><label>Jarak: <span id="val-content-spacing">25px</span></label><input type="range" min="0" max="100" value="25" style="width:100%" oninput="updateLiveStyle('content-spacing', this.value)"></div>
            </div>
        </div>
    `;
}

/**
 * 4. LOGIK MODAL & PREVIEW (SINGLE & BULK)
 */
function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    
    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            <div class="no-print" style="margin-bottom: 15px; display: flex; gap: 10px; justify-content: center;">
                <button onclick="printSingleCertByIndex(${idx})" style="background:#27ae60; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">🖨️ CETAK FIZIKAL</button>
                <button onclick="hantarKeTelegram(masterData[${idx}])" style="background:#0088cc; color:white; padding:10px 20px; border:none; border-radius:5px; cursor:pointer;">🚀 KE TELEGRAM</button>
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
            <div class="preview-item-container" style="margin-bottom:50px; border-bottom:2px dashed #ccc; padding-bottom:30px;">
                <div class="no-print" style="margin-bottom: 10px; text-align:center;">
                    <b>Preview: ${item.nama}</b>
                </div>
                ${createCertTemplate(item, currentOrientation)}
            </div>
        `;
    }).join('');

    area.innerHTML = injectControlPanel() + certsContent;
    modal.style.display = 'block';
}

/**
 * 5. FUNGSI HELPER & UTILITI
 */
function printSingleCertByIndex(idx) {
    if(masterData[idx]) printSingleCert(masterData[idx], currentOrientation);
}

function updateOrientation() {
    currentOrientation = document.getElementById('orientation-selector').value;
    const modal = document.getElementById('preview-modal');
    if (modal.style.display === 'block') {
        document.querySelectorAll('.certificate').forEach(c => {
            c.className = `certificate ${currentOrientation}`;
        });
    }
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
        if(item.style.display !== "none") item.querySelector('.cert-checkbox').checked = status;
    });
}

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
}

/**
 * 6. AUTO-RUN BULK (DENGAN 2 SAAT DELAY - JANGAN BUANG!)
 */
async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Pilih sekurang-kurangnya satu!");

    if (!confirm(`Hantar ${checked.length} sijil?`)) return;

    const statusText = document.getElementById('status-text');
    const btnAsal = event.target;
    btnAsal.disabled = true;
    btnAsal.innerText = "⏳ SEDANG PROSES...";

    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        statusText.innerHTML = `⏳ <b>(${i + 1}/${checked.length})</b> Memproses: ${peserta.nama}`;

        showPreview(idx);
        // Delay 2 saat untuk render unik
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await hantarKeTelegram(peserta);
        } catch (err) {
            console.error(err);
        }
    }

    statusText.innerText = `✅ Selesai menghantar ${checked.length} sijil unik!`;
    btnAsal.disabled = false;
    btnAsal.innerText = "🚀 AUTO-RUN KE TELEGRAM";
    alert("Proses Bulk Selesai!");
}

loadData();
