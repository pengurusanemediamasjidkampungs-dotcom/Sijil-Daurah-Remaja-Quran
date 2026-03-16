/**
 * PRINT ENGINE - SISTEM PENGURUSAN SIJIL
 * Fokus: Template, Preview, dan Eksekusi Cetakan
 */

// 1. Template Sijil (Data-to-HTML)
function createCertTemplate(item, orientation = 'landscape') {
    const portraitClass = (orientation === 'portrait') ? 'portrait' : '';
    
    return `
        <div class="certificate ${portraitClass}">
            <div class="content-overlay">
                <div class="header-complete-center">
                    <img src="logo_masjid.png" class="logo-center-top" alt="Logo Masjid">
                    <div class="header-text-only">
                        <img src="khatmklsb.png" class="mosque-name-logo" alt="Masjid Kampung Sungai Lang Baru">
                        <h1 class="title">Sijil Penyertaan</h1>
                        <p class="sub-title">Dengan ini diperakukan bahawa</p>
                    </div>
                </div>

                <div class="participant-section">
                    <div class="participant-name">${item.nama}</div>
                    <div class="participant-ic">No. K/P: ${item.ic}</div>
                </div>

                <div class="program-info-final">
                    <span>telah menghadiri</span><br>
                    <strong style="font-size: 1.2em; color: var(--dark-gold);">DAURAH REMAJA QURANIC 2026</strong><br>
                    <span>pada</span><br>
                    <strong>Ramadan 1447 (Tahun 2026)</strong><br>
                    <span>anjuran</span><br>
                    <strong>Masjid Kampung Sungai Lang Baru</strong>
                </div>

                <div class="footer-section">
                    <div class="logo-bottom-left-wrapper">
                        <img src="logo_daurahquran.png" class="logo-program-bottom" alt="Logo Program">
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

// 2. Eksekusi Cetakan Pukal
function executeFinalPrint(selectedData, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return;

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
        setTimeout(() => { container.innerHTML = ''; }, 1000);
    }, 2000); 
}

// 3. Cetak Sijil Tunggal
function printSingleCert(item, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return;
    
    container.innerHTML = createCertTemplate(item, orientation);
    setTimeout(() => {
        window.print();
        container.innerHTML = '';
    }, 500);
}
