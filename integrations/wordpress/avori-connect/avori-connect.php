<?php
/**
 * Plugin Name: Avori Connect
 * Plugin URI:  https://avori.com
 * Description: Connects WooCommerce to Avori: pushes orders in real time and embeds the shoppable widget on your storefront.
 * Version:     1.0.0
 * Author:      Avori
 * License:     GPL-2.0-or-later
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

const AVORI_OPTION_GROUP = 'avori_connect';

/* -------------------------------------------------------------------------
 * Settings
 * ---------------------------------------------------------------------- */

add_action('admin_menu', function () {
    add_options_page('Avori Connect', 'Avori Connect', 'manage_options', 'avori-connect', 'avori_render_settings_page');
});

add_action('admin_init', function () {
    register_setting(AVORI_OPTION_GROUP, 'avori_app_url', [
        'type' => 'string',
        'default' => 'https://app.avori.com',
        'sanitize_callback' => 'esc_url_raw',
    ]);
    register_setting(AVORI_OPTION_GROUP, 'avori_brand_id', [
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    register_setting(AVORI_OPTION_GROUP, 'avori_api_key', [
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    register_setting(AVORI_OPTION_GROUP, 'avori_widget_mode', [
        'type' => 'string',
        'default' => 'floating',
        'sanitize_callback' => function ($v) {
            return in_array($v, ['floating', 'inline', 'feed', 'off'], true) ? $v : 'floating';
        },
    ]);
});

function avori_render_settings_page()
{
    ?>
    <div class="wrap">
        <h1>Avori Connect</h1>
        <p>Find your Brand ID and API key in the Avori dashboard under <strong>Settings → API keys</strong>.</p>
        <form method="post" action="options.php">
            <?php settings_fields(AVORI_OPTION_GROUP); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="avori_app_url">Avori URL</label></th>
                    <td><input name="avori_app_url" id="avori_app_url" type="url" class="regular-text"
                               value="<?php echo esc_attr(get_option('avori_app_url', 'https://app.avori.com')); ?>"/></td>
                </tr>
                <tr>
                    <th scope="row"><label for="avori_brand_id">Brand ID</label></th>
                    <td><input name="avori_brand_id" id="avori_brand_id" type="text" class="regular-text"
                               value="<?php echo esc_attr(get_option('avori_brand_id', '')); ?>"/></td>
                </tr>
                <tr>
                    <th scope="row"><label for="avori_api_key">API key</label></th>
                    <td><input name="avori_api_key" id="avori_api_key" type="password" class="regular-text"
                               value="<?php echo esc_attr(get_option('avori_api_key', '')); ?>"/>
                        <p class="description">Used server-side to push orders. Never printed on the storefront.</p></td>
                </tr>
                <tr>
                    <th scope="row"><label for="avori_widget_mode">Shoppable widget</label></th>
                    <td>
                        <select name="avori_widget_mode" id="avori_widget_mode">
                            <?php foreach (['floating' => 'Floating bubble', 'inline' => 'Inline', 'feed' => 'Feed', 'off' => 'Off'] as $value => $label) : ?>
                                <option value="<?php echo esc_attr($value); ?>" <?php selected(get_option('avori_widget_mode', 'floating'), $value); ?>>
                                    <?php echo esc_html($label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
            </table>
            <?php submit_button('Save & connect'); ?>
        </form>
    </div>
    <?php
}

/* -------------------------------------------------------------------------
 * Storefront widget
 * ---------------------------------------------------------------------- */

add_action('wp_footer', function () {
    $brand_id = get_option('avori_brand_id');
    $mode = get_option('avori_widget_mode', 'floating');
    if (!$brand_id || $mode === 'off') {
        return;
    }
    $app = untrailingslashit(get_option('avori_app_url', 'https://app.avori.com'));
    printf(
        '<div class="shop-video-widget" data-brand-id="%s" data-mode="%s"%s></div>' .
        '<script src="%s/widget.js" async></script>',
        esc_attr($brand_id),
        esc_attr($mode),
        is_product() ? sprintf(' data-product-id="woo-%d"', get_the_ID()) : '',
        esc_url($app)
    );
});

/* -------------------------------------------------------------------------
 * Order push: WooCommerce → Avori
 * ---------------------------------------------------------------------- */

function avori_status_for(WC_Order $order)
{
    switch ($order->get_status()) {
        case 'completed':
            return 'FULFILLED';
        case 'processing':
            return 'PAID';
        case 'refunded':
            return 'REFUNDED';
        case 'cancelled':
        case 'failed':
            return 'CANCELLED';
        default:
            return 'PENDING';
    }
}

function avori_push_order($order_id)
{
    $api_key = get_option('avori_api_key');
    $app = untrailingslashit(get_option('avori_app_url', 'https://app.avori.com'));
    if (!$api_key || !class_exists('WC_Order')) {
        return;
    }
    $order = wc_get_order($order_id);
    if (!$order || !$order->get_billing_email()) {
        return;
    }

    $items = [];
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $quantity = max(1, (int) $item->get_quantity());
        $items[] = [
            'name' => $item->get_name(),
            'sku' => $product && $product->get_sku() ? $product->get_sku() : 'woo-' . $item->get_product_id(),
            'quantity' => $quantity,
            'price' => round((float) $order->get_item_subtotal($item, false), 2),
        ];
    }
    if (empty($items)) {
        return;
    }

    $payload = [
        'email' => $order->get_billing_email(),
        'firstName' => $order->get_billing_first_name(),
        'lastName' => $order->get_billing_last_name(),
        'phone' => $order->get_billing_phone(),
        'orderNumber' => '#' . $order->get_order_number(),
        'externalId' => 'woo-' . $order->get_id(),
        'status' => avori_status_for($order),
        'currency' => $order->get_currency(),
        'items' => $items,
        'discountTotal' => round((float) $order->get_discount_total(), 2),
        'total' => round((float) $order->get_total(), 2),
        'discountCodes' => array_map('strtoupper', $order->get_coupon_codes()),
    ];

    wp_remote_post($app . '/api/v1/orders', [
        'timeout' => 10,
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json',
        ],
        'body' => wp_json_encode($payload),
    ]);
}

// Fires once when an order is placed; Avori dedupes on externalId, so the
// status-change hook below can safely fire for the same order later.
add_action('woocommerce_checkout_order_processed', 'avori_push_order', 20, 1);
add_action('woocommerce_order_status_changed', function ($order_id) {
    avori_push_order($order_id);
}, 20, 1);
