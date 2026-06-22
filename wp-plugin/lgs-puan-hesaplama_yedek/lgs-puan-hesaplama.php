<?php
/**
 * Plugin Name: LGS Puan Hesaplama
 * Plugin URI:  https://ogrenmeucgeni.com.tr/
 * Description: Liselere Geçiş Sınavı (LGS) puan ve yüzdelik dilim hesaplayıcı. Sayfaya [lgs_puan_hesaplama] kısa kodu ile eklenir.
 * Version:     1.0.0
 * Author:      Öğrenme Üçgeni
 * Author URI:  https://ogrenmeucgeni.com.tr/
 * License:     GPL-2.0-or-later
 * Text Domain: lgs-puan-hesaplama
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'LGS_PUAN_HESAPLAMA_VERSION', '1.0.0' );
define( 'LGS_PUAN_HESAPLAMA_PATH', plugin_dir_path( __FILE__ ) );
define( 'LGS_PUAN_HESAPLAMA_URL', plugin_dir_url( __FILE__ ) );

/**
 * Frontend assetlerini kaydet (yalnızca shortcode kullanıldığında yüklenir).
 */
function lgs_puan_hesaplama_register_assets() {
    wp_register_style(
        'lgs-puan-hesaplama',
        LGS_PUAN_HESAPLAMA_URL . 'assets/lgs.css',
        array(),
        LGS_PUAN_HESAPLAMA_VERSION
    );

    wp_register_script(
        'lgs-puan-hesaplama',
        LGS_PUAN_HESAPLAMA_URL . 'assets/lgs.js',
        array(),
        LGS_PUAN_HESAPLAMA_VERSION,
        true
    );

    $uploads        = wp_upload_dir();
    $percentile_url = trailingslashit( $uploads['baseurl'] ) . 'wp-percentage/LGSdilimler.json';

    /**
     * LGSdilimler.json dosyasının URL'sini değiştirmek için filtre.
     * Varsayılan: /wp-content/uploads/wp-percentage/LGSdilimler.json
     */
    $percentile_url = apply_filters( 'lgs_puan_hesaplama_percentile_url', $percentile_url );

    wp_localize_script(
        'lgs-puan-hesaplama',
        'LGS_PUAN_HESAPLAMA_CONFIG',
        array(
            'percentileUrl' => $percentile_url,
        )
    );
}
add_action( 'wp_enqueue_scripts', 'lgs_puan_hesaplama_register_assets' );

/**
 * [lgs_puan_hesaplama] shortcode'unu kaydet.
 */
function lgs_puan_hesaplama_shortcode( $atts ) {
    wp_enqueue_style( 'lgs-puan-hesaplama' );
    wp_enqueue_script( 'lgs-puan-hesaplama' );

    ob_start();
    include LGS_PUAN_HESAPLAMA_PATH . 'templates/calculator.php';
    return ob_get_clean();
}
add_shortcode( 'lgs_puan_hesaplama', 'lgs_puan_hesaplama_shortcode' );
