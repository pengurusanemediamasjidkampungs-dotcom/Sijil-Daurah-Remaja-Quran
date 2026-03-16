/**
 * PRINT ENGINE - SISTEM PENGURUSAN SIJIL DAURAH 2026
 * Fokus: Penjana Template HTML dan Logik Cetakan
 */

/**
 * 1. Penjana Template Sijil
 * Membina struktur HTML sijil berdasarkan data peserta dan orientasi.
 */
function createCertTemplate(item, orientation = 'landscape') {
    const portraitClass = (orientation === 'portrait') ? 'portrait' : '';
    
    return `
        <div class="certificate ${portraitClass}">
            <div class="content-overlay">
                <div class="header-complete-center">
                    <img src="logo_masjid.png" 
                         class="logo-center-top" 
                         style="height: var(--logo-size) !important;" 
                         alt="Logo Masjid">
                    
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
                    <span>pada Ramadan 1447 (Tahun 2026)</span><br>
                    <span>anjuran <strong>Masjid Kampung Sungai Lang Baru</strong></span>
                </div>

                <div class="footer-section">
                    <div class="logo-bottom-left-wrapper">
                        <img src="logo_daurahquran.png" 
                             class="logo-program-bottom" 
                             style="height: var(--logo-program-size) !important;" 
                             alt="Logo Program">
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
 * 2. Fungsi Cetakan Pukal (Bulk Print)
 * Mengambil senarai peserta yang dipilih dan menyusunnya dalam container tersembunyi.
 */
function executeFinalPrint(selectedData, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return alert("Ralat: Container cetakan tidak dijumpai!");

    // Bina semua sijil dengan Page Break di antaranya
    const content = selectedData.map((item, index) => {
        let html = createCertTemplate(item, orientation);
        if (index < selectedData.length - 1) {
            html += '<div class="page-break" style="page-break-after: always;"></div>';
        }
        return html;
    }).join('');

    // Masukkan ke dalam DOM
    container.innerHTML = content;

    // Tunggu render selesai (2 saat) sebelum panggil dialog cetakan
    setTimeout(() => { 
        window.print(); 
        
        // Kosongkan semula container selepas dialog cetakan ditutup (opsional)
        setTimeout(() => { 
            container.innerHTML = ''; 
        }, 1000);
    }, 2000); 
}

/**
 * 3. Fungsi Cetakan Tunggal (Single Print)
 * Digunakan apabila klik butang cetak pada mod pralihat individu.
 */
function printSingleCert(item, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return;
    
    container.innerHTML = createCertTemplate(item, orientation);
    
    // Masa menunggu lebih singkat untuk satu sijil
    setTimeout(() => {
        window.print();
        container.innerHTML = '';
    }, 500);
}
