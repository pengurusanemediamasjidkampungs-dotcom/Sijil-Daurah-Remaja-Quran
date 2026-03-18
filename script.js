/**
 * LOGIK UTAMA - script.js (FINAL VERSION: FIXED BULK GENERATION)
 * Fokus: Pengurusan Data, UI Control Panel, Integrasi html2pdf, dan Telegram Bot (Bulk)
 */

let masterData = [];
let currentOrientation = 'landscape'; // Default Daurah selalunya landscape

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
        
        // TETAPKAN NILAI DEFAULT PADA CSS VARIABLES (Ikut kesesuaian template)
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
                <button onclick="printSingleCertByIndex(${index})" class="no-print" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:4px;">🖨️</button>
                <button onclick="hantarKeTelegramByIndex(${index})" class="no-print" style="cursor:pointer; background:none; border:1px solid #ccc; border-radius:4px;">🚀</button>
            </div>
        </div>
    `}).join('');
}

/**
 * 2. INTEGRASI TELEGRAM BOT (BROWSER-SIDE PDF GENERATION)
 */
async function hantarKeTelegram(peserta) {
    const element = document.querySelector('.certificate');
    if (!element) return { status: 'error', message: 'Sijil tidak dijumpai dalam DOM!' };

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
        console.error("Ralat Penghantaran:", error);
        throw error;
    }
}

async function hantarKeTelegramByIndex(idx) {
    if(masterData[idx]) {
        showPreview(idx);
        // Delay sekejap untuk single send juga supaya UI sempat update
        setTimeout(async () => {
            try {
                const res = await hantarKeTelegram(masterData[idx]);
                if (res.status === 'success') alert(`✅ Berjaya dihantar ke Telegram: ${masterData[idx].nama}`);
            } catch (e) {
                alert("⚠️ Gagal! Pastikan app.py (Flask) anda sedang berjalan di terminal.");
            }
        }, 1000); 
    }
}

/**
 * 3. AUTO-RUN BULK (DENGAN DELAY 2 SAAT UNTUK FIX ISU NAMA SAMA)
 */
async function hantarSemuaPilihan() {
    const checked = document.querySelectorAll('.cert-checkbox:checked');
    if (checked.length === 0) return alert("Sila pilih sekurang-kurangnya satu nama!");

    const sahkan = confirm(`Hantar ${checked.length} sijil secara automatik?`);
    if (!sahkan) return;

    const statusText = document.getElementById('status-text');
    const btnAsal = document.querySelector('.btn-bulk-run') || event.target;
    btnAsal.disabled = true;
    btnAsal.style.opacity = "0.5";
    
    for (let i = 0; i < checked.length; i++) {
        const idx = checked[i].value;
        const peserta = masterData[idx];

        statusText.innerHTML = `<b style="color:#d4af37">⏳ Memproses (${i + 1}/${checked.length}):</b> ${peserta.nama}`;

        // 1. Kemaskini Preview (Tukar nama di skrin)
        showPreview(idx);
        
        // 2. MASA BERTENANG KRITIKAL (2000ms): 
        // Memberi ruang kepada browser untuk selesai render DOM sebelum html2pdf buat kerja
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // 3. Jana PDF & Upload
            const res = await hantarKeTelegram(peserta);
            console.log(`Berjaya: ${peserta.nama}`, res);
        } catch (err) {
            console.error(`Gagal: ${peserta.nama}`, err);
        }
    }

    statusText.innerText = `✅ Selesai! ${checked.length} sijil unik telah diproses.`;
    btnAsal.disabled = false;
    btnAsal.style.opacity = "1";
    alert("Proses Bulk Selesai. Sila semak folder 'output' atau Bot Telegram anda.");
}

/**
 * 4. LIVE CONTROL & UI HELPERS
 */
function updateLiveStyle(prop, value) {
    document.documentElement.style.setProperty(`--${prop}`, value + 'px');
    const label = document.getElementById(`val-${prop}`);
    if (label) label.innerText = value + 'px';
}

function injectControlPanel() {
    return `
        <div class="control-panel-live no-print" style="margin-bottom:20px; border:1px solid #ddd; padding:15px; border-radius:8px;">
            <h4 style="margin:0 0 10px 0; color:#996515;">Live Adjuster</h4>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; font-size:12px;">
                <div>Logo: <input type="range" min="50" max="300" value="140" oninput="updateLiveStyle('logo-size', this.value)"></div>
                <div>Nama: <input type="range" min="10" max="100" value="48" oninput="updateLiveStyle('name-size', this.value)"></div>
                <div>Jarak: <input type="range" min="0" max="100" value="25" oninput="updateLiveStyle('content-spacing', this.value)"></div>
            </div>
        </div>
    `;
}

function showPreview(idx) {
    const area = document.getElementById('preview-area');
    const modal = document.getElementById('preview-modal');
    if (!area || !modal) return;
    
    area.innerHTML = injectControlPanel() + `
        <div class="preview-item-container">
            ${createCertTemplate(masterData[idx], currentOrientation)}
        </div>
    `;
    modal.style.display = 'block';
}

function printSingleCertByIndex(idx) {
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
        if(item.style.display !== "none") item.querySelector('.cert-checkbox').checked = status;
    });
}

function closePreview() {
    document.getElementById('preview-modal').style.display = 'none';
}

// Mula Muat Data
loadData();
