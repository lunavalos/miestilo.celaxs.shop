<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with('phoneModel.brand')->latest()->get();
        return response()->json($orders);
    }

    public function show(Order $order)
    {
        return response()->json($order->load('phoneModel.brand'));
    }

    /**
     * Prepare a preorder (PENDING_PAYMENT) and create PaymentIntent.
     */
    public function prepare(Request $request)
    {
        // GATING: Verificar si el pago está activo antes de permitir crear la preorden
        $stripeConfig = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();
        if (!$stripeConfig) {
            return response()->json([
                'success' => false,
                'message' => 'El canal de pago no está activo. Por favor contacta al administrador.'
            ], 403);
        }

        $validated = $request->validate([
            'customer_email' => 'required|email',
            'model_id' => 'required|exists:models,id',
            'customization_data' => 'required|array',
            'preview_image' => 'nullable|string',
            'total_price' => 'required|numeric|min:0',
            // Billing fields
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'country' => 'nullable|string|max:100',
            'address_line1' => 'required|string|max:255',
            'address_line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'zip_code' => 'required|string|max:20',
            'phone' => 'nullable|string|max:30',
            'order_notes' => 'nullable|string|max:1000',
            // Payment
            'payment_method' => 'required|in:card',
            'shipping_price' => 'nullable|numeric|min:0',
            // Shipping fields
            'shipping_first_name' => 'nullable|string|max:100',
            'shipping_last_name' => 'nullable|string|max:100',
            'shipping_country' => 'nullable|string|max:100',
            'shipping_address_line1' => 'nullable|string|max:255',
            'shipping_address_line2' => 'nullable|string|max:255',
            'shipping_city' => 'nullable|string|max:100',
            'shipping_state' => 'nullable|string|max:100',
            'shipping_zip_code' => 'nullable|string|max:20',
            'shipping_phone' => 'nullable|string|max:30',
        ]);

        // Create preorder in PENDING_PAYMENT status
        $validated['status'] = 'pending';
        $validated['payment_status'] = 'pending_payment';
        $validated['shipping_price'] = $validated['shipping_price'] ?? 100.00;

        $order = Order::create($validated);

        // Get active Stripe config
        $paymentConfig = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();
        if (!$paymentConfig) {
            return response()->json([
                'success' => false,
                'message' => 'Método de pago no disponible actualmente.'
            ], 400);
        }

        $secretKey = $paymentConfig->getSetting('secret_key');
        $publicKey = $paymentConfig->getSetting('public_key');
        $env = $paymentConfig->environment;

        // Final check for configuration completeness
        $isConfigured = true;
        if ($env === 'sandbox') {
            if (!str_starts_with($publicKey ?? '', 'pk_test_') || !str_starts_with($secretKey ?? '', 'sk_test_'))
                $isConfigured = false;
        } else {
            if (!str_starts_with($publicKey ?? '', 'pk_live_') || !str_starts_with($secretKey ?? '', 'sk_live_'))
                $isConfigured = false;
        }

        if (!$isConfigured) {
            return response()->json([
                'success' => false,
                'message' => 'Pago no disponible: configuración incompleta.'
            ], 400);
        }

        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://api.stripe.com/v1/payment_intents', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $secretKey,
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'form_params' => [
                    'amount' => $validated['total_price'] * 100,
                    'currency' => 'mxn',
                    'description' => 'Preorden #' . $order->id,
                    'metadata' => ['order_id' => $order->id],
                ]
            ]);
            $stripeData = json_decode($response->getBody()->getContents(), true);

            // Link intent ID to order
            $order->update(['transaction_id' => $stripeData['id']]);

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'client_secret' => $stripeData['client_secret'],
                'public_key' => $publicKey
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe Intent Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al conectar con la pasarela.'], 500);
        }
    }

    /**
     * Finalize the order after payment succeeded.
     */
    public function confirm(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'payment_intent_id' => 'required|string',
        ]);

        $order = Order::findOrFail($validated['order_id']);
        $paymentConfig = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();

        if (!$paymentConfig)
            return response()->json(['message' => 'Error de sistema'], 500);

        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->get('https://api.stripe.com/v1/payment_intents/' . $validated['payment_intent_id'], [
                'headers' => ['Authorization' => 'Bearer ' . $paymentConfig->getSetting('secret_key')]
            ]);
            $stripeData = json_decode($response->getBody()->getContents(), true);

            if ($stripeData['status'] === 'succeeded') {
                $order->update([
                    'payment_status' => 'paid',
                    'status' => 'processing',
                    'transaction_id' => $stripeData['id']
                ]);
                Log::info("Order {$order->id} confirmed as PAID via Stripe Intent {$stripeData['id']}");
                return response()->json(['success' => true, 'message' => '¡Pago confirmado!']);
            }

            Log::warning("Order {$order->id} confirmation failed: Stripe Intent {$stripeData['id']} status: {$stripeData['status']}");
            return response()->json(['success' => false, 'message' => 'El pago no ha sido completado. Estado: ' . $stripeData['status']], 400);
        } catch (\Exception $e) {
            Log::error('Confirm Error: ' . $e->getMessage());
            return response()->json(['message' => 'Error al validar el pago.'], 500);
        }
    }

    /**
     * Professional public config endpoint.
     */
    public function getPaymentConfig()
    {
        $config = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();

        if (!$config) {
            return response()->json([
                'provider' => 'stripe',
                'is_active' => false,
                'message' => 'No hay pasarela activa o está fuera de servicio.'
            ]);
        }

        return response()->json([
            'provider' => 'stripe',
            'is_active' => true,
            'environment' => $config->environment,
            'publishable_key' => $config->settings['public_key'] ?? '',
            'message' => 'OK'
        ]);
    }
}
