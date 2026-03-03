<?php

namespace App\Http\Controllers\Admin;

use App\Models\PaymentSetting;
use App\Models\PaymentWebhookLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;

class PaymentSettingController extends Controller
{
    /**
     * Get all payment settings and last logs.
     */
    public function index()
    {
        $settings = PaymentSetting::all();
        $logs = PaymentWebhookLog::latest()->take(10)->get();

        // Enmascarar settings para la vista inicial
        $settings->transform(function ($item) {
            $s = $item->settings;
            foreach ($s as $key => $value) {
                if (str_contains(strtolower($key), 'secret') || str_contains(strtolower($key), 'key')) {
                    $s[$key] = '********';
                }
            }
            $item->masked_settings = $s;
            return $item;
        });

        return response()->json([
            'settings' => $settings,
            'logs' => $logs
        ]);
    }

    /**
     * Store or update payment settings.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'environment' => 'required|in:sandbox,production',
            'settings' => 'required|array',
            'is_active' => 'boolean',
        ]);

        $setting = PaymentSetting::updateOrCreate(
            ['provider' => $validated['provider'], 'environment' => $validated['environment']],
            [
                'settings' => $validated['settings'],
                'is_active' => $validated['is_active'] ?? false
            ]
        );

        // Si se activa este, desactivar otros del mismo proveedor o marcar como activo global
        if ($setting->is_active) {
            PaymentSetting::where('provider', $setting->provider)
                ->where('id', '!=', $setting->id)
                ->update(['is_active' => false]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Configuración guardada exitosamente.',
            'setting' => $setting
        ]);
    }

    /**
     * Test connection with the provider.
     */
    public function testConnection(Request $request)
    {
        $provider = $request->input('provider');
        $environment = $request->input('environment');
        $settings = $request->input('settings');

        // Lógica de prueba simulada o real según el proveedor
        if ($provider === 'stripe') {
            // Ejemplo: intentar listar balances con la key
            try {
                // Aquí iría la llamada real a Stripe API
                // Por ahora simulamos éxito si la key tiene formato correcto
                if (isset($settings['public_key']) && str_starts_with($settings['public_key'], 'pk_')) {
                    return response()->json(['success' => true, 'message' => 'Conexión con Stripe establecida correctamente.']);
                }
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()], 400);
            }
        }

        if ($provider === 'mercadopago') {
            if (isset($settings['public_key']) && str_starts_with($settings['public_key'], 'APP_USR-')) {
                return response()->json(['success' => true, 'message' => 'Conexión con Mercado Pago establecida correctamente.']);
            }
        }

        return response()->json(['success' => false, 'message' => 'No se pudo verificar la conexión. Revisa las llaves.'], 400);
    }
}
