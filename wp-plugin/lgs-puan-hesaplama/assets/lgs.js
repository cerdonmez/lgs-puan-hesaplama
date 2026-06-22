(function () {
    'use strict';

    class LGSCalculator {
        constructor() {
            this.percentileData = null;
            this.isDataLoaded = false;
            this.percentileUrl = (window.LGS_PUAN_HESAPLAMA_CONFIG && window.LGS_PUAN_HESAPLAMA_CONFIG.percentileUrl) || '';
            this.examConfig = {
                "2021": {
                    baseScore: 200.0041389,
                    coefficients: { turkce: 3.4460333333, matematik: 5.7878333333, fen: 3.5622833333, tarih: 1.4750888889, din: 1.5924444444, dil: 1.3397527778 }
                },
                "2022": {
                    baseScore: 200.0135764,
                    coefficients: { turkce: 3.9205004724, matematik: 4.9299339624, fen: 3.7032127364, tarih: 1.7522674531, din: 1.6606273581, dil: 1.4786207551 }
                },
                "2023": {
                    baseScore: 194.752082,
                    coefficients: { turkce: 4.348683717, matematik: 4.253881347, fen: 4.123078077, tarih: 1.66650784, din: 1.899422486, dil: 1.507575189 }
                },
                "2024": {
                    baseScore: 196.6198,
                    coefficients: { turkce: 4.107, matematik: 4.632, fen: 3.889, tarih: 1.729, din: 1.818, dil: 1.531 }
                },
                "2025": {
                    baseScore: 178.0515,
                    coefficients: { turkce: 4.526870, matematik: 4.647365, fen: 4.117870, tarih: 1.935070, din: 1.985870, dil: 1.689720 }
                }
            };

            this.subjects = [
                { id: 'turkce', name: 'Türkçe', questions: 20, coefficient: 'turkce' },
                { id: 'tarih', name: 'T.C. İnkılap Tarihi', questions: 10, coefficient: 'tarih' },
                { id: 'din', name: 'Din Kültürü ve Ahlak', questions: 10, coefficient: 'din' },
                { id: 'dil', name: 'Yabancı Dil', questions: 10, coefficient: 'dil' },
                { id: 'matematik', name: 'Matematik', questions: 20, coefficient: 'matematik' },
                { id: 'fen', name: 'Fen Bilimleri', questions: 20, coefficient: 'fen' }
            ];

            this.init();
        }

        async init() {
            this.setupEventListeners();
            this.renderSubjects();
            await this.loadPercentileData();
        }

        async loadPercentileData() {
            if (!this.percentileUrl) {
                this.showAlert('Yüzdelik dilim veri yolu bulunamadı.', 'warning');
                return;
            }
            try {
                const response = await fetch(this.percentileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                this.percentileData = await response.json();
                this.isDataLoaded = true;
            } catch (error) {
                console.error('Error loading percentile data:', error);
                this.showAlert('Yüzdelik dilim verileri yüklenemedi. Hesaplama sadece puan üzerinden yapılacak.', 'warning');
            }
        }

        setupEventListeners() {
            const form = document.getElementById('lgsForm');
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));

            document.addEventListener('input', (e) => {
                if (e.target.matches('.form-input')) {
                    this.validateInput(e.target);
                }
            });
        }

        renderSubjects() {
            const container = document.getElementById('subjectsGrid');
            let html = `<div class="subjects-table-wrapper"><table class="subjects-table"><thead><tr><th>Ders</th><th>Doğru</th><th>Yanlış</th><th>Boş</th></tr></thead><tbody>`;
            for (const subject of this.subjects) {
                html += `<tr>
                    <td>${subject.name}</td>
                    <td><input type="number" class="form-input subject-correct" id="${subject.id}Correct" min="0" max="${subject.questions}" value="${subject.questions}" data-subject="${subject.id}" data-type="correct" readonly tabindex="-1" title="Sadece yanlış ve boş sayılarını giriniz; doğru otomatik hesaplanır."></td>
                    <td><input type="number" class="form-input subject-wrong" id="${subject.id}Wrong" min="0" max="${subject.questions}" value="0" data-subject="${subject.id}" data-type="wrong" required></td>
                    <td><input type="number" class="form-input subject-blank" id="${subject.id}Blank" min="0" max="${subject.questions}" value="0" data-subject="${subject.id}" data-type="blank" required></td>
                </tr>`;
            }
            html += `</tbody></table></div>`;
            container.innerHTML = html;
        }

        validateInput(input) {
            const subject = input.dataset.subject;
            const subjectConfig = this.subjects.find(s => s.id === subject);
            const correctInput = document.getElementById(`${subject}Correct`);
            const wrongInput = document.getElementById(`${subject}Wrong`);
            const blankInput = document.getElementById(`${subject}Blank`);
            let wrong = parseInt(wrongInput.value) || 0;
            let blank = parseInt(blankInput.value) || 0;
            input.classList.remove('error');

            if (wrong < 0) { wrong = 0; wrongInput.value = 0; }
            if (blank < 0) { blank = 0; blankInput.value = 0; }
            if (wrong > subjectConfig.questions) {
                wrong = subjectConfig.questions;
                wrongInput.value = wrong;
            }
            if (blank > subjectConfig.questions) {
                blank = subjectConfig.questions;
                blankInput.value = blank;
            }

            if (wrong + blank > subjectConfig.questions) {
                wrongInput.classList.add('error');
                blankInput.classList.add('error');
                this.showAlert(`${subjectConfig.name} dersi için yanlış + boş toplamı ${subjectConfig.questions}'i geçemez!`, 'error');
            } else {
                wrongInput.classList.remove('error');
                blankInput.classList.remove('error');
                this.clearAlert();
            }

            correctInput.value = Math.max(0, subjectConfig.questions - wrong - blank);
        }

        async handleFormSubmit(e) {
            e.preventDefault();

            const inputs = document.querySelectorAll('.form-input');
            let hasError = false;

            inputs.forEach(input => {
                this.validateInput(input);
                if (input.classList.contains('error')) {
                    hasError = true;
                }
            });

            if (hasError) {
                this.showAlert('Lütfen hatalı girişleri düzeltin!', 'error');
                return;
            }

            this.showLoading(true);
            this.clearAlert();

            try {
                const results = await this.calculateAllScores();
                this.displayAllResults(results);
            } catch (error) {
                console.error('Calculation error:', error);
                this.showAlert('Hesaplama sırasında bir hata oluştu!', 'error');
            } finally {
                this.showLoading(false);
            }
        }

        async calculateAllScores() {
            const allResults = {};
            for (const year of Object.keys(this.examConfig)) {
                try {
                    allResults[year] = await this.calculateScore(year);
                } catch (e) {
                    allResults[year] = null;
                }
            }
            return allResults;
        }

        async calculateScore(year) {
            const config = this.examConfig[year];
            const subjectResults = {};

            for (const subject of this.subjects) {
                const correct = parseInt(document.getElementById(`${subject.id}Correct`).value) || 0;
                const wrong = parseInt(document.getElementById(`${subject.id}Wrong`).value) || 0;
                const blank = subject.questions - correct - wrong;
                const net = Math.max(0, correct - (wrong / 3));

                subjectResults[subject.id] = {
                    name: subject.name,
                    questions: subject.questions,
                    correct,
                    wrong,
                    blank,
                    net: parseFloat(net.toFixed(3)),
                    coefficient: config.coefficients[subject.coefficient],
                    weightedScore: net * config.coefficients[subject.coefficient]
                };
            }

            const totalNet = Object.values(subjectResults).reduce((sum, subject) => sum + subject.net, 0);
            const totalWeighted = Object.values(subjectResults).reduce((sum, subject) => sum + subject.weightedScore, 0);
            const rawScore = config.baseScore + totalWeighted;

            const maxScore = config.baseScore + this.subjects.reduce((sum, subject) =>
                sum + (subject.questions * config.coefficients[subject.coefficient]), 0
            );

            const normalizedScore = (rawScore / maxScore) * 500;

            const percentiles = {};
            if (this.isDataLoaded && this.percentileData) {
                percentiles[year] = this.calculatePercentile(normalizedScore, year);
            }

            return {
                year,
                subjects: subjectResults,
                totals: {
                    totalQuestions: 90,
                    totalNet: parseFloat(totalNet.toFixed(3)),
                    rawScore: parseFloat(rawScore.toFixed(4)),
                    normalizedScore: parseFloat(normalizedScore.toFixed(4)),
                    percentage: parseFloat(((totalNet / 90) * 100).toFixed(1))
                },
                percentiles
            };
        }

        calculatePercentile(score, year) {
            if (!this.percentileData || !this.percentileData[year]) {
                return null;
            }

            const yearData = this.percentileData[year];
            if (!yearData.length) return null;

            if (score >= yearData[0].puan) {
                return parseFloat(yearData[0].yuzdelik.toFixed(2));
            }
            if (score <= yearData[yearData.length - 1].puan) {
                return parseFloat(yearData[yearData.length - 1].yuzdelik.toFixed(2));
            }

            for (let i = 0; i < yearData.length - 1; i++) {
                const hi = yearData[i];
                const lo = yearData[i + 1];
                if (score <= hi.puan && score >= lo.puan) {
                    const span = hi.puan - lo.puan;
                    if (span === 0) return parseFloat(hi.yuzdelik.toFixed(2));
                    const t = (hi.puan - score) / span;
                    const interpolated = hi.yuzdelik + (lo.yuzdelik - hi.yuzdelik) * t;
                    return parseFloat(interpolated.toFixed(2));
                }
            }

            return parseFloat(yearData[yearData.length - 1].yuzdelik.toFixed(2));
        }

        displayAllResults(allResults) {
            const resultsContainer = document.getElementById('results');
            const resultsBody = document.getElementById('resultsBody');
            const years = Object.keys(this.examConfig).sort((a, b) => b - a);

            let totalCorrect = 0, totalWrong = 0, totalBlank = 0;
            for (const subject of this.subjects) {
                const correct = parseInt(document.getElementById(`${subject.id}Correct`).value) || 0;
                const wrong = parseInt(document.getElementById(`${subject.id}Wrong`).value) || 0;
                const blank = parseInt(document.getElementById(`${subject.id}Blank`).value) || 0;
                totalCorrect += correct;
                totalWrong += wrong;
                totalBlank += blank;
            }

            let summaryHtml = `<div class="results-summary">
                <span><strong>Toplam Doğru:</strong> ${totalCorrect}</span>
                <span><strong>Toplam Yanlış:</strong> ${totalWrong}</span>
                <span><strong>Toplam Boş:</strong> ${totalBlank}</span>
            </div>`;

            let html = summaryHtml + `<div class="results-table-wrapper"><table class="results-table"><thead><tr><th>Bilgi</th>`;
            for (const year of years) {
                html += `<th>${year} LGS</th>`;
            }
            html += `</tr></thead><tbody>`;

            for (const subject of this.subjects) {
                html += `<tr><td>${subject.name}</td>`;
                for (const year of years) {
                    const results = allResults[year];
                    const subj = results && results.subjects[subject.id];
                    const value = (subj && subj.net !== undefined && subj.net !== null) ? subj.net : '-';
                    html += `<td>${value}</td>`;
                }
                html += `</tr>`;
            }

            html += `<tr><td>Toplam Net</td>`;
            for (const year of years) {
                const r = allResults[year];
                html += `<td>${r && r.totals && r.totals.totalNet !== undefined ? r.totals.totalNet : '-'}</td>`;
            }
            html += `</tr>`;

            html += `<tr><td>Doğru Yüzdesi (%)</td>`;
            for (const year of years) {
                const r = allResults[year];
                html += `<td>${r && r.totals && r.totals.percentage !== undefined ? r.totals.percentage : '-'}</td>`;
            }
            html += `</tr>`;

            html += `<tr><td>LGS Puanı (MSP)</td>`;
            for (const year of years) {
                const r = allResults[year];
                html += `<td>${r && r.totals && r.totals.normalizedScore !== undefined ? r.totals.normalizedScore : '-'}</td>`;
            }
            html += `</tr>`;

            html += `<tr><td>Yüzdelik Dilim</td>`;
            for (const year of years) {
                const r = allResults[year];
                const yu = r && r.percentiles && r.percentiles[year];
                html += `<td>${yu !== undefined && yu !== null ? '%' + yu : '-'}</td>`;
            }
            html += `</tr>`;
            html += `</tbody></table></div>`;

            html += `<a href="https://ogrenmeucgeni.com.tr/lgs-tercih-robotu/" target="_blank" class="tercih-robotu-btn">LGS Tercih Robotu'na Git</a>`;

            html += `<div class="disclaimer" style="margin-top:2rem;">
                        <h5>⚠️ Önemli Uyarılar</h5>
                        <ul>
                            <li>Bu hesaplamalar yaklaşık değerlerdir ve bilgilendirme amaçlıdır.</li>
                            <li>Gerçek puanınız MEB'in kullandığı detaylı formüle göre farklılık gösterebilir.</li>
                            <li>Yüzdelik dilim tahminleri geçmiş yılların verilerine dayanmaktadır.</li>
                            <li>Resmi sonuçlar için MEB'in açıklayacağı sonuçları bekleyiniz.</li>
                        </ul>
                    </div>`;
            resultsBody.innerHTML = html;
            resultsContainer.classList.add('active');
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        showLoading(show) {
            const loading = document.getElementById('loading');
            const button = document.getElementById('calculateBtn');

            if (show) {
                loading.classList.add('active');
                button.disabled = true;
            } else {
                loading.classList.remove('active');
                button.disabled = false;
            }
        }

        showAlert(message, type = 'error') {
            const container = document.getElementById('alertContainer');
            container.innerHTML = `
                <div class="alert alert-${type} active">
                    ${type === 'error' ? '❌' : '⚠️'} ${message}
                </div>
            `;
            setTimeout(() => this.clearAlert(), 5000);
        }

        clearAlert() {
            const container = document.getElementById('alertContainer');
            container.innerHTML = '';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new LGSCalculator());
    } else {
        new LGSCalculator();
    }
})();
