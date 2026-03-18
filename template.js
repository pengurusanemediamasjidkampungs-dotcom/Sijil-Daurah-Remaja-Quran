/**
 * TEMPLATE ENGINE - template.js
 * Fungsi: Membina struktur HTML Sijil secara dinamik
 */

function createCertTemplate(item, orientation) {
    // 1. Logik Auto-Kesan: Adakah ini Pembimbing atau Peserta?
    const isPembimbing = (item.kumpulan === "PEMBIMBING");

    // 2. Tetapan Teks Berbeza
    const tajukSijil = isPembimbing ? "SIJIL PENGHARGAAN" : "SIJIL PENYERTAAN";
    
    const ayatPerakuan = isPembimbing 
        ? "Dengan tulus ikhlas merakamkan setinggi-tinggi penghargaan kepada" 
        : "Dengan ini diperakukan bahawa";

    const perananDanStatus = isPembimbing 
        ? `atas sumbangan bakti dan khidmat sebagai<br>
           <strong style="font-size: 1.2em; color: #996515;">PEMBIMBING PROGRAM</strong>`
        : `telah mengikuti dan menyempurnakan program`;

    // 3. Pulangkan Template HTML
    return `
        <div class="certificate ${orientation}">
            <div class="content-overlay">
                
                <div class="header-complete-center">
                    <img src="logo_masjid.png" class="logo-center-top" alt="Logo Masjid">
                    <div class="header-text-only">
                        <img src="nama_masjid_khat.png" class="mosque-name-logo" alt="Nama Masjid Khat">
                        <h1 class="title">${tajukSijil}</h1>
                        <p class="sub-title">${ayatPerakuan}</p>
                    </div>
                </div>

                <div class="participant-section">
                    <div class="participant-name">${item.nama}</div>
                    <p class="participant-ic">NO. KP: ${item.ic}</p>
                    
                    <p class="program-info-final">
                        ${perananDanStatus}<br>
                        <span style="font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.4em; color: #1a1a1a;">
                            DAURAH REMAJA QURANIC 2026
                        </span><br>
                        pada Ramadan 1447H / 2026M<br>
                        bertempat di Masjid Kampung Sungai Lang Baru
                    </p>
                </div>

                <div class="footer-section">
                    <div class="logo-bottom-left-wrapper">
                        <img src="logo_program.png" class="logo-program-bottom" alt="Logo Program">
                    </div>
                    
                    <div class="signatures-wrapper">
                        <div class="sig-box">
                            <img src="signature.png" class="signature-img" alt="Tandatangan">
                            <div class="sig-line single-sig">
                                <strong>(NAZIR / PENGERUSI)</strong><br>
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
 * Fungsi pembantu untuk cetakan fizikal satu persatu
 */
function printSingleCert(item, orientation) {
    const container = document.getElementById('certificate-container');
    container.innerHTML = createCertTemplate(item, orientation);
    window.print();
    container.innerHTML = ''; // Kosongkan balik selepas print
}
