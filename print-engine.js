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

    // 1. Bersihkan sisa data lama sebelum mula proses berat
    container.innerHTML = ''; 

    // 2. Bina semua sijil dengan Page Break
    const content = selectedData.map((item, index) => {
        let html = createCertTemplate(item, orientation);
        if (index < selectedData.length - 1) {
            html += '<div class="page-break" style="page-break-after: always;"></div>';
        }
        return html;
    }).join('');

    // 3. Masukkan ke dalam DOM
    container.innerHTML = content;

    // 4. Tunggu render imej selesai (2 saat) sebelum cetak
    setTimeout(() => { 
        window.print(); 
        
        // 5. Kosongkan semula selepas dialog cetakan keluar untuk jimat RAM
        setTimeout(() => { 
            container.innerHTML = ''; 
        }, 2000);
    }, 2000); 
}

/**
 * 3. Fungsi Cetakan Tunggal (Single Print) - DIKEMASKINI
 * Fokus: Kelajuan render tinggi dan pembersihan memori pantas.
 */
function printSingleCert(item, orientation) {
    const container = document.getElementById('certificate-container');
    if (!container) return;
    
    // 1. Bersihkan container serta-merta (Pembersihan memori awal)
    container.innerHTML = ''; 
    
    // 2. Masukkan template sijil tunggal
    container.innerHTML = createCertTemplate(item, orientation);
    
    // 3. Delay pendek (500ms) untuk memastikan browser sempat memuatkan logo/imej
    setTimeout(() => {
        window.print();
        
        /**
         * 4. Pembersihan Memori Pantas
         * Kita gunakan delay 1 saat supaya proses penghantaran data ke 'print spooler' 
         * printer tidak terganggu sebelum container dikosongkan.
         */
        setTimeout(() => {
            container.innerHTML = '';
        }, 1000);
    }, 500);
}
