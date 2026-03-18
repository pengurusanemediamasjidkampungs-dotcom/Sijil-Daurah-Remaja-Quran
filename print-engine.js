/**
 * PRINT ENGINE - SISTEM PENGURUSAN SIJIL DAURAH 2026
 * Fungsi: Penjana Template, Logik Cetakan Chrome, & Integrasi API Python
 */

/**
 * 1. Penjana Template Sijil (Logik Dinamik)
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
 * 2. Fungsi Cetakan Pukal (Bulk Print) - Chrome
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
    }, 1000); 
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
 * 4. Integrasi Telegram (Melalui Backend app.py)
 * Versi ini menghantar arahan ke Python, Python hantar PDF ke Telegram.
 */
async function hantarSijilKeTelegram(item) {
    console.log(`Menghantar arahan ke server untuk: ${item.nama}`);
    
    try {
        const res = await fetch('/api/send_telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama: item.nama,
                ic: item.ic,
                kumpulan: item.kumpulan
            })
        });

        const result = await res.json();

        if (res.ok) {
            console.log(`✅ Success: ${result.message}`);
            return true;
        } else {
            console.error(`❌ Server Error: ${result.message}`);
            return false;
        }
    } catch (error) {
        console.error("❌ Network Error:", error);
        return false;
    }
}
