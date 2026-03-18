/**
 * PRINT ENGINE - SISTEM PENGURUSAN SIJIL DAURAH 2026
 * Fungsi: Penjana Template, Logik Cetakan Chrome, & Integrasi Telegram
 */

/**
 * 1. Penjana Template Sijil (Logik Dinamik)
 * Membina struktur HTML berdasarkan kumpulan (PEMBIMBING atau PESERTA)
 */
function createCertTemplate(item, orientation = 'landscape') {
    const portraitClass = (orientation === 'portrait') ? 'portrait' : '';
    
    // Logik Auto-Kesan Status
    const isPembimbing = (item.kumpulan === "PEMBIMBING");
    const tajukSijil = isPembimbing ? "SIJIL PENGHARGAAN" : "SIJIL PENYERTAAN";
    const ayatPerakuan = isPembimbing 
        ? "Dengan tulus ikhlas merakamkan setinggi-tinggi penghargaan kepada" 
        : "Dengan ini diperakukan bahawa";
    const perananDanStatus = isPembimbing 
        ? `atas sumbangan bakti dan khidmat sebagai<br><strong style="font-size: 1.2em; color: var(--dark-gold);">PEMBIMBING PROGRAM</strong>`
        : `telah menghadiri`;

    return `
        <div class="certificate ${portraitClass}">
            <div class="content-overlay">
                <div class="header-complete-center">
                    <img src="logo_masjid.png" class="logo-center-top" style="height: var(--logo-size) !important;" alt="Logo Masjid">
                    <div class="header-text-only">
                        <img src="khatmklsb.png" class="mosque-name-logo" alt="Masjid Khat">
                        <h1 class="title">${tajukSijil}</h1>
                        <p class="sub-title">${ayatPerakuan}</p>
                    </div>
                </div>

                <div class="participant-section">
                    <div class="participant-name">${item.nama}</div>
                    <div class="participant-ic">No. K/P: ${item.ic}</div>
                </div>

                <div class="program-info-final">
                    <span>${perananDanStatus}</span><br>
                    <strong style="font-size: 1.2em; color: var(--dark-gold);">DAURAH REMAJA QURANIC 2026</strong><br>
                    <span>pada Ramadan 1447 (Tahun 2026)</span><br>
                    <span>anjuran <strong>Masjid Kampung Sungai Lang Baru</strong></span>
                </div>

                <div class="footer-section">
                    <div class="logo-bottom-left-wrapper">
                        <img src="logo_daurahquran.png" class="logo-program-bottom" style="height: var(--logo-program-size) !important;" alt="Logo Program">
                    </div>
                    <div class="signatures-wrapper">
                        <div class="sig-box">
                            <img src="tandatangannazir.png" class="signature-img">
                            <div class="sig-line single-sig">
                                <strong>( NAZIR MASJID )</strong><br>
                                Masjid Kampung Sungai Lang Baru
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 2. Fungsi Cetakan Pukal (Bulk Print) - Untuk Browser Chrome
 */
function executeFinalPrint(selectedData, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return alert("Ralat: Container cetakan tidak dijumpai!");

    container.innerHTML = ''; 

    const content = selectedData.map((item, index) => {
        let html = createCertTemplate(item, orientation);
        if (index < selectedData.length - 1) {
            html += '<div class="page-break" style="page-break-after: always;"></div>';
        }
        return html;
    }).join('');

    container.innerHTML = content;

    setTimeout(() => { 
        window.print(); 
        setTimeout(() => { container.innerHTML = ''; }, 2000);
    }, 2000); 
}

/**
 * 3. Fungsi Cetakan Tunggal (Single Print)
 */
function printSingleCert(item, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return;
    
    container.innerHTML = createCertTemplate(item, orientation);
    
    setTimeout(() => {
        window.print();
        setTimeout(() => { container.innerHTML = ''; }, 1000);
    }, 500);
}

/**
 * 4. Fungsi Integrasi Telegram (Background PDF Generation)
 */
async function hantarSijilKeTelegram(item, orientation) {
    // Sediakan elemen tersembunyi untuk proses rendering PDF
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.innerHTML = createCertTemplate(item, orientation);
    document.body.appendChild(element);

    const opt = {
        margin: 0,
        filename: `Sijil_${item.nama}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
    };

    try {
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        
        const formData = new FormData();
        formData.append('chat_id', 'YOUR_CHAT_ID'); // Masukkan Chat ID anda
        formData.append('document', pdfBlob, `Sijil_${item.nama.replace(/ /g, '_')}.pdf`);
        formData.append('caption', `✅ Sijil Daurah 2026\n👤 Nama: ${item.nama}\n📂 Kumpulan: ${item.kumpulan}`);

        const botToken = 'YOUR_BOT_TOKEN'; // Masukkan Token Bot anda
        
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        if(res.ok) {
            console.log(`✅ Berjaya hantar sijil: ${item.nama}`);
        } else {
            console.error(`❌ Gagal hantar: ${res.statusText}`);
        }
    } catch (error) {
        console.error("Ralat PDF/Telegram:", error);
    } finally {
        document.body.removeChild(element);
    }
}
