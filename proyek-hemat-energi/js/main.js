// main.js - Skrip Interaktivitas Global Kampanye Hemat Daya (Fase 1, 2, & 3)

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('is-active');
        });
    }

    // 2. Inisialisasi Kalkulator Hemat Energi (di halaman Aksi)
    initEnergyCalculator();

    // 3. Inisialisasi Tantangan 7 Hari (Checklist dengan LocalStorage)
    initChallengeTracker();

    // 4. Inisialisasi Ikrar Komitmen Siswa (Pledge Wall)
    initPledgeWall();
});

// ==========================================
// A. KALKULATOR HEMAT ENERGI
// ==========================================
function initEnergyCalculator() {
    const sLaptop = document.getElementById('sliderLaptop');
    const sAC = document.getElementById('sliderAC');
    const sLampu = document.getElementById('sliderLampu');

    if (!sLaptop || !sAC || !sLampu) return;

    const vLaptop = document.getElementById('valLaptop');
    const vAC = document.getElementById('valAC');
    const vLampu = document.getElementById('valLampu');

    const resKwh = document.getElementById('resKwh');
    const resCo2 = document.getElementById('resCo2');
    const resRupiah = document.getElementById('resRupiah');

    function calculate() {
        const laptopCount = parseInt(sLaptop.value, 10);
        const acCount = parseInt(sAC.value, 10);
        const lampuCount = parseInt(sLampu.value, 10);

        vLaptop.textContent = laptopCount;
        vAC.textContent = acCount;
        vLampu.textContent = lampuCount;

        // Asumsi per hari sekolah (22 hari sebulan)
        // Laptop: 65W (0.065 kW) dimatikan 1 jam istirahat
        // AC: 750W (0.75 kW) dimatikan 1 jam lebih awal
        // Lampu: 40W (0.04 kW) dimatikan 1 jam istirahat
        const kwhLaptop = laptopCount * 0.065 * 1 * 22;
        const kwhAC = acCount * 0.75 * 1 * 22;
        const kwhLampu = lampuCount * 0.04 * 1 * 22;

        const totalKwh = Math.round(kwhLaptop + kwhAC + kwhLampu);
        const totalCo2 = Math.round(totalKwh * 0.87); // 0.87 kg CO2 / kWh
        const totalRupiah = Math.round(totalKwh * 1444.70); // Tarif R-1 / TR rata-rata

        if (resKwh) resKwh.textContent = totalKwh.toLocaleString('id-ID');
        if (resCo2) resCo2.textContent = totalCo2.toLocaleString('id-ID');
        if (resRupiah) resRupiah.textContent = `Rp ${totalRupiah.toLocaleString('id-ID')}`;
    }

    sLaptop.addEventListener('input', calculate);
    sAC.addEventListener('input', calculate);
    sLampu.addEventListener('input', calculate);

    calculate(); // Hitung awal saat halaman dimuat
}

// ==========================================
// B. TANTANGAN 7 HARI (LOCAL STORAGE)
// ==========================================
function initChallengeTracker() {
    const container = document.getElementById('challengeContainer');
    const counter = document.getElementById('challengeCounter');
    const progress = document.getElementById('challengeProgress');

    if (!container || !counter || !progress) return;

    const STORAGE_KEY = 'wikrama_eco_challenge_state';
    let savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    const items = container.querySelectorAll('.challenge-item');

    function updateView() {
        let completedCount = 0;

        items.forEach(item => {
            const id = item.getAttribute('data-id');
            const checkbox = item.querySelector('.challenge-checkbox');
            const isChecked = !!savedState[id];

            checkbox.checked = isChecked;
            if (isChecked) {
                item.classList.add('completed');
                completedCount++;
            } else {
                item.classList.remove('completed');
            }
        });

        const total = items.length;
        const percent = Math.round((completedCount / total) * 100);

        counter.textContent = `${completedCount} / ${total} Tuntas (${percent}%)`;
        progress.style.width = `${percent}%`;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    }

    items.forEach(item => {
        const checkbox = item.querySelector('.challenge-checkbox');
        const id = item.getAttribute('data-id');

        checkbox.addEventListener('change', () => {
            savedState[id] = checkbox.checked;
            updateView();
        });
    });

    updateView();
}

// ==========================================
// C. WALL OF COMMITMENT (IKRAR SISWA)
// ==========================================
function initPledgeWall() {
    const form = document.getElementById('pledgeForm');
    const container = document.getElementById('pledgeListContainer');
    const countEl = document.getElementById('pledgeTotalCount');

    if (!form || !container || !countEl) return;

    const STORAGE_KEY = 'wikrama_eco_pledges';
    
    // Default initial pledges dari perwakilan jurusan
    const defaultPledges = [
        { name: 'Naufal Arrasyid', rombel: 'PPLG', commitment: 'Matikan laptop saat jam istirahat siang', time: 'Baru saja' },
        { name: 'Siti Rahmawati', rombel: 'PMN', commitment: 'Cabut charger laptop/ponsel setelah 100%', time: '10 menit lalu' },
        { name: 'Rian Pratama', rombel: 'HTL', commitment: 'Jaga suhu AC kelas tetap 24°C–25°C', time: '25 menit lalu' },
        { name: 'Aisyah Putri', rombel: 'KLN', commitment: 'Piket 5 menit cek kelistrikan lab sebelum pulang', time: '1 jam lalu' },
        { name: 'Dimas Setiawan', rombel: 'TJKT', commitment: 'Berani ingatkan teman yang lupa matikan listrik', time: '2 jam lalu' }
    ];

    let pledges = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!pledges || pledges.length === 0) {
        pledges = defaultPledges;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pledges));
    }

    function renderPledges() {
        countEl.textContent = pledges.length;
        container.innerHTML = pledges.slice(0, 15).map(p => `
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.7rem 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                    <strong style="color: var(--primary);">${escapeHtml(p.name)}</strong>
                    <span style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 12px; margin-left: 0.4rem;">${escapeHtml(p.rombel)}</span>
                    <div style="font-size: 0.85rem; color: #334155; margin-top: 0.15rem;">"${escapeHtml(p.commitment)}"</div>
                </div>
                <small style="color: var(--text-muted); font-size: 0.78rem;">${p.time || 'Baru saja'}</small>
            </div>
        `).join('');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('pledgeName');
        const rombelInput = document.getElementById('pledgeRombel');
        const commitmentInput = document.getElementById('pledgeCommitment');

        const name = nameInput.value.trim();
        const rombel = rombelInput.value;
        const commitment = commitmentInput.value;

        if (!name || !rombel || !commitment) return;

        pledges.unshift({
            name: name,
            rombel: rombel,
            commitment: commitment,
            time: 'Baru saja'
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(pledges));
        renderPledges();

        nameInput.value = '';
        alert('Terima kasih atas komitmenmu! Janji aksimu telah tercatat di papan ikrar siswa.');
    });

    renderPledges();
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
