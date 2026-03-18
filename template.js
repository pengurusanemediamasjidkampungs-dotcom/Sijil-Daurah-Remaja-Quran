function createCertTemplate(item, orientation) {
    // Tentukan tajuk dan ayat berdasarkan kumpulan
    const isPembimbing = (item.kumpulan === "PEMBIMBING");
    
    const tajukSijil = isPembimbing ? "SIJIL PENGHARGAAN" : "SIJIL PENYERTAAN";
    const ayatPerakuan = isPembimbing 
        ? "Dengan tulus ikhlas merakamkan setinggi-tinggi penghargaan kepada" 
        : "Dengan ini diperakukan bahawa";
    const peranan = isPembimbing 
        ? "atas sumbangan bakti dan khidmat sebagai<br><b>PEMBIMBING PROGRAM</b>" 
        : "telah menghadiri";

    return `
        <div class="certificate ${orientation}">
            <div class="content-overlay">
                <div class="header-complete-center">
                    <img src="logo_masjid.png" class="logo-center-top">
                    <h1 class="title">${tajukSijil}</h1>
                </div>

                <div class="participant-section">
                    <p class="sub-title">${ayatPerakuan}</p>
                    <div class="participant-name">${item.nama}</div>
                    <p class="participant-ic">No. KP: ${item.ic}</p>
                    
                    <p class="program-info-final">
                        ${peranan}<br>
                        <span style="font-family: 'Cinzel', serif; font-weight: bold; font-size: 1.2em;">
                            DAURAH REMAJA QURANIC 2026
                        </span><br>
                        pada Ramadan 1447H / 2026M<br>
                        anjuran Masjid Kampung Sungai Lang Baru
                    </p>
                </div>
                
                ...
            </div>
        </div>
    `;
}
