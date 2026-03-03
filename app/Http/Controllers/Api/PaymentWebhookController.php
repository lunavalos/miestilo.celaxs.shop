<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\PaymentWebhookLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Handle Stripe Webhooks.
     */
    public function stripe(Request $request)
    {
        $payload = $request->all();
        $sigHeader = $request->header('Stripe-Signature');

        // Get active stripe setting (sandbox or production)
        $setting = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();
        $webhookSecret = $setting ? $setting->getSetting('webhook_secret') : null;

        $isValid = false;
        // En un entorno real usaríamos Stripe\Webhook::constructEvent
        // Aquí simulamos la validación si el secreto está configurado
        if ($webhookSecret && $sigHeader) {
            $isValid = true;
        }

        $log = PaymentWebhookLog::create([
            'provider' => 'stripe',
            'event_type' => $payload['type'] ?? 'unknown',
            'payload' => $payload,
            'status' => 200,
            'is_valid_signature' => $isValid,
        ]);

        if (!$isValid) {
            $log->update(['status' => 401, 'error_message' => 'Firma de webhook inválida']);
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Lógica según el tipo de evento
        $order = null;
        if (isset($payload['data']['object']['metadata']['order_id'])) {
            $order = Order::find($payload['data']['object']['metadata']['order_id']);
        }

        if ($payload['type'] === 'payment_intent.succeeded') {
            if ($order && $order->payment_status !== 'paid') {
                $order->update([
                    'status' => 'paid',
                    'payment_status' => 'paid',
                    'transaction_id' => $payload['data']['object']['id'] ?? null
                ]);
            }
        } elseif ($payload['type'] === 'payment_intent.payment_failed') {
            if ($order) {
                $order->update(['payment_status' => 'failed']);
            }
        } elseif ($payload['type'] === 'charge.refunded') {
            if ($order) {
                $order->update(['payment_status' => 'refunded', 'status' => 'cancelled']);
            }
        } elseif ($payload['type'] === 'charge.dispute.created') {
            if ($order) {
                $order->update(['payment_status' => 'disputed']);
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Handle Mercado Pago Webhooks.
     */
    public function mercadopago(Request $request)
    {
        $payload = $request->all();
        $type = $payload['type'] ?? ($payload['topic'] ?? 'unknown');

        $log = PaymentWebhookLog::create([
            'provider' => 'mercadopago',
            'event_type' => $type,
            'payload' => $payload,
            'status' => 200,
            'is_valid_signature' => true,
        ]);

        // Si es una notificación de pago (v1 o v2)
        if ($type === 'payment') {
            $paymentId = $payload['data']['id'] ?? ($payload['id'] ?? null);

            // Aquí en un entorno real usaríamos el SDK de MP para consultar /v1/payments/$paymentId
            // y verificar que el status sea 'approved'.
            // Por ahora, si llega el evento de pago y tenemos el external_reference, actualizamos.

            // Simulación de obtención de orden desde el payload si MP lo envía o tras consulta API
            $externalReference = $payload['external_reference'] ?? null;
            if ($externalReference) {
                $order = Order::find($externalReference);
                if ($order) {
                    $order->update([
                        'status' => 'paid',
                        'payment_status' => 'paid',
                        'transaction_id' => (string) $paymentId
                    ]);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}
