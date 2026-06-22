<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div id="lgs-app">
    <div class="container">
        <header class="header">
            <h1>LGS Puan Hesaplayıcı</h1>
            <p>Liselere Geçiş Sınavı puan hesaplama ve yüzdelik dilim belirleme aracı</p>
        </header>

        <main class="calculator-card">
            <div class="card-header">
                <h2>Sınav Bilgilerinizi Girin</h2>
            </div>

            <div class="card-body">
                <form id="lgsForm">
                    <div class="subjects-grid" id="subjectsGrid"></div>

                    <button type="submit" class="calculate-btn" id="calculateBtn">
                        Puanı Hesapla
                    </button>
                </form>

                <div id="loading" class="loading">
                    <div class="spinner"></div>
                    <p>Puanınız hesaplanıyor...</p>
                </div>

                <div id="alertContainer"></div>
            </div>
        </main>

        <div id="results" class="results">
            <div class="results-header">
                <h3>LGS Puan Sonuçlarınız</h3>
                <p>Detaylı analiz ve yüzdelik dilim bilgileriniz</p>
            </div>
            <div class="results-body" id="resultsBody"></div>
        </div>
    </div>
</div>
