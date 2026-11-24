// js/charts.js - Visualisasi Data Kuesioner dengan Chart.js untuk Fase 2

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ambil Data (Fallback aman: pakai window.DATA_ENERGI atau fetch JSON jika di web server)
    let dataEnergi = window.DATA_ENERGI;

    if (!dataEnergi) {
        try {
            const response = await fetch('data-perilaku-energi.json');
            if (response.ok) {
                dataEnergi = await response.json();
            }
        } catch (e) {
            console.warn('Gagal memuat JSON via fetch, memastikan fallback data:', e);
        }
    }

    if (!dataEnergi) {
        console.error('Data energi tidak ditemukan.');
        return;
    }

    // 2. Render Kartu Ringkasan (Stat Cards)
    renderSummaryStats(dataEnergi);

    // 3. Inisialisasi Grafik-Grafik
    initItemsChart(dataEnergi);
    initMajorComparisonChart(dataEnergi);
    initCategoryDistributionChart(dataEnergi);
    initInteractiveFilterChart(dataEnergi);

    // 4. Render Tabel Rombel
    renderRombelTable(dataEnergi);
});

// A. Render Stat Cards
function renderSummaryStats(data) {
    const elRataSkor = document.getElementById('statRataSkor');
    const elTotalResponden = document.getElementById('statTotalResponden');
    const elPersenSering = document.getElementById('statPersenSering');
    const elJurusanTertinggi = document.getElementById('statJurusanTertinggi');

    if (elRataSkor) elRataSkor.innerHTML = `${data.ringkasan.rata_rata_skor} <small>/ 4.00</small>`;
    if (elTotalResponden) elTotalResponden.innerHTML = `${data.meta.jumlah_responden} <small>Siswa</small>`;
    if (elPersenSering) elPersenSering.innerHTML = `${data.ringkasan.persen_sering_rata_rata}%`;
    if (elJurusanTertinggi) elJurusanTertinggi.innerHTML = `${data.ringkasan.sorotan.jurusan_tertinggi} <small>(3.51)</small>`;
}

// B. Grafik 1: Rata-rata Skor per Butir Perilaku (P01 - P10)
function initItemsChart(data) {
    const ctx = document.getElementById('chartItems');
    if (!ctx) return;

    const labels = data.per_butir.map(item => `${item.kode}: ${item.label}`);
    const scores = data.per_butir.map(item => item.rata_rata);

    // Warna: butir tertinggi (P01, P02, P06) hijau terang, butir terendah (P04, P09, P05) oranye/kuning, lainnya hijau tua
    const backgroundColors = data.per_butir.map(item => {
        if (['P01', 'P02', 'P06'].includes(item.kode)) return '#10b981'; // Juara
        if (['P04', 'P09', 'P05'].includes(item.kode)) return '#f59e0b'; // Perhatian
        return '#1b5e43'; // Standar
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Skor (Skala 1 - 4)',
                data: scores,
                backgroundColor: backgroundColors,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal Bar agar label panjang terbaca jelas
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const item = data.per_butir[context.dataIndex];
                            return [
                                `Pertanyaan: ${item.pertanyaan}`,
                                `Persen Sering: ${item.persen_sering}% | Jarang: ${item.persen_jarang}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 2.5,
                    max: 4.0,
                    ticks: { stepSize: 0.25 },
                    title: { display: true, text: 'Rata-rata Skor Likert' }
                },
                y: {
                    ticks: {
                        font: { size: 11, weight: '600' }
                    }
                }
            }
        }
    });
}

// C. Grafik 2: Perbandingan Rata-rata Antar Jurusan
function initMajorComparisonChart(data) {
    const ctx = document.getElementById('chartMajors');
    if (!ctx) return;

    const labels = data.per_jurusan.map(j => `${j.nama} (${j.kode})`);
    const scores = data.per_jurusan.map(j => j.rata_rata_skor);
    const avgSchool = data.ringkasan.rata_rata_skor;

    const backgroundColors = data.per_jurusan.map(j => {
        if (j.rata_rata_skor >= 3.45) return '#10b981';
        if (j.rata_rata_skor >= 3.30) return '#1b5e43';
        return '#d97706'; // Perlu peningkatan
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rata-rata Skor Jurusan',
                data: scores,
                backgroundColor: backgroundColors,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            const j = data.per_jurusan[context.dataIndex];
                            return [
                                `Responden: ${j.jumlah_responden} siswa`,
                                `Sangat Baik: ${j.kategori_persen['Sangat Baik']}%`,
                                `Rata-rata Sekolah: ${avgSchool}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 2.8,
                    max: 3.8,
                    ticks: { stepSize: 0.2 },
                    title: { display: true, text: 'Rata-rata Skor (1 - 4)' }
                },
                x: {
                    ticks: {
                        maxRotation: 25,
                        minRotation: 15,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// D. Grafik 3: Distribusi Kategori Sikap Siswa (Doughnut Chart)
function initCategoryDistributionChart(data) {
    const ctx = document.getElementById('chartCategory');
    if (!ctx) return;

    const kat = data.ringkasan.kategori;
    const labels = ['Sangat Baik (3.26 - 4.00)', 'Baik (2.51 - 3.25)', 'Cukup (1.76 - 2.50)', 'Kurang (1.00 - 1.75)'];
    const counts = [kat['Sangat Baik'], kat['Baik'], kat['Cukup'], kat['Kurang']];
    const percents = [
        data.ringkasan.kategori_persen['Sangat Baik'],
        data.ringkasan.kategori_persen['Baik'],
        data.ringkasan.kategori_persen['Cukup'],
        data.ringkasan.kategori_persen['Kurang']
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: counts,
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 14, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            return ` ${context.label}: ${context.raw} siswa (${percents[index]}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// E. Grafik 4: Eksplorasi Interaktif Jurusan vs Rata-rata Sekolah
let filterChartInstance = null;

function initInteractiveFilterChart(data) {
    const ctx = document.getElementById('chartInteractiveFilter');
    const select = document.getElementById('majorFilterSelect');
    if (!ctx || !select) return;

    const itemLabels = data.per_butir.map(b => b.kode);
    const schoolAverages = data.per_butir.map(b => b.rata_rata);

    function updateChart(majorCode) {
        let targetScores = schoolAverages;
        let datasetLabel = 'Rata-rata Keseluruhan Sekolah';
        let barColor = '#1b5e43';

        if (majorCode !== 'ALL') {
            const foundMajor = data.per_jurusan.find(j => j.kode === majorCode);
            if (foundMajor) {
                targetScores = foundMajor.rata_rata_per_butir;
                datasetLabel = `Jurusan ${foundMajor.nama} (${foundMajor.kode})`;
                barColor = '#0f382c';
            }
        }

        const chartData = {
            labels: itemLabels,
            datasets: [
                {
                    label: datasetLabel,
                    data: targetScores,
                    backgroundColor: barColor,
                    borderRadius: 6
                },
                {
                    label: 'Rata-rata Sekolah (Tolok Ukur)',
                    data: schoolAverages,
                    backgroundColor: 'rgba(245, 158, 11, 0.45)',
                    borderRadius: 6
                }
            ]
        };

        if (filterChartInstance) {
            filterChartInstance.data = chartData;
            filterChartInstance.update();
        } else {
            filterChartInstance = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            min: 2.5,
                            max: 4.0,
                            ticks: { stepSize: 0.25 },
                            title: { display: true, text: 'Skor Likert' }
                        },
                        x: {
                            title: { display: true, text: 'Butir Pernyataan (P01 - P10)' }
                        }
                    },
                    plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                            callbacks: {
                                title: function(context) {
                                    const index = context[0].dataIndex;
                                    const item = data.per_butir[index];
                                    return `${item.kode}: ${item.label}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Default: Semua Sekolah
    updateChart('ALL');

    select.addEventListener('change', (e) => {
        updateChart(e.target.value);
    });
}

// F. Render Tabel 18 Rombel Ranking
function renderRombelTable(data) {
    const tableBody = document.getElementById('rombelTableBody');
    if (!tableBody) return;

    // Urutkan rombel dari skor tertinggi ke terendah
    const sortedRombel = [...data.per_rombel].sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);

    tableBody.innerHTML = sortedRombel.map((item, index) => {
        let badgeClass = 'score-high';
        if (item.rata_rata_skor < 3.25) badgeClass = 'score-mid';
        if (item.rata_rata_skor < 3.10) badgeClass = 'score-low';

        const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

        return `
            <tr>
                <td style="font-weight: 700; width: 60px;">${rankIcon}</td>
                <td><strong>${item.rombel}</strong></td>
                <td>${item.jurusan}</td>
                <td>${item.jumlah_responden} siswa</td>
                <td><span class="score-badge ${badgeClass}">${item.rata_rata_skor.toFixed(2)} / 4.00</span></td>
                <td>${item.rata_rata_total.toFixed(2)} / 40</td>
                <td>${item.kategori_persen['Sangat Baik']}%</td>
            </tr>
        `;
    }).join('');
}
