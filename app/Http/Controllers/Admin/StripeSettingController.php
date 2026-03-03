<?php

namespace App\Http\Controllers\Admin;

use App\Models\PaymentSetting;
use App\Models\PaymentWebhookLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class StripeSettingController extends Controller
{
    /**
     * Get Stripe settings and logs.
     */
    public function index()
    {
        try {
            $settings = PaymentSetting::where('provider', 'stripe')->where('is_active', true)->first();
            $logs = PaymentWebhookLog::where('provider', 'stripe')->latest()->take(20)->get();

            if (!$settings) {
                return response()->json([
                    'provider' => 'stripe',
                    'environment' => 'sandbox',
                    'public_key' => '',
                    'secret_key' => '',
                    'webhook_secret' => '',
                    'is_active' => false,
                    'is_configured' => false,
                    'validation_errors' => [],
                    'logs' => $logs
                ]);
            }

            $env = $settings->environment;
            $s = $settings->settings ?? [];

            // Validation logic for is_configured
            $errors = [];
            if ($env === 'sandbox') {
                if (!str_starts_with($s['public_key'] ?? '', 'pk_test_'))
                    $errors[] = 'Public Key debe iniciar con pk_test_';
                if (!str_starts_with($s['secret_key'] ?? '', 'sk_test_'))
                    $errors[] = 'Secret Key debe iniciar con sk_test_';
            } else {
                if (!str_starts_with($s['public_key'] ?? '', 'pk_live_'))
                    $errors[] = 'Public Key debe iniciar con pk_live_';
                if (!str_starts_with($s['secret_key'] ?? '', 'sk_live_'))
                    $errors[] = 'Secret Key debe iniciar con sk_live_';
                if (empty($s['webhook_secret']))
                    $errors[] = 'Webhook Secret es obligatorio en producción';
            }

            // Mask secrets
            $masked = $s;
            foreach ($masked as $key => $value) {
                if (str_contains(strtolower($key), 'secret') || str_contains(strtolower($key), 'key')) {
                    if (!empty($value))
                        $masked[$key] = '********';
                }
            }

            return response()->json([
                'provider' => 'stripe',
                'environment' => $env,
                'public_key' => $masked['public_key'] ?? '',
                'secret_key' => $masked['secret_key'] ?? '',
                'webhook_secret' => $masked['webhook_secret'] ?? '',
                'is_active' => (bool) $settings->is_active,
                'is_configured' => empty($errors) && $settings->last_verified_at,
                'last_verified_at' => $settings->last_verified_at,
                'last_error' => $settings->last_error,
                'validation_errors' => $errors ?? [],
                'logs' => $logs ?? []
            ]);
        } catch (\Exception $e) {
            Log::error('Error loading Stripe settings: ' . $e->getMessage());
            return response()->json(['message' => 'Error al cargar configuraciones de Stripe.'], 500);
        }
    }

    /**
     * Store/Update Stripe settings with strict validation.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'environment' => 'required|in:sandbox,production',
            'public_key' => 'nullable|string',
            'secret_key' => 'nullable|string',
            'webhook_secret' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $env = $validated['environment'];
        $errors = [];

        // Check prefixes (ignoring masked ones)
        if ($env === 'sandbox') {
            if (!empty($validated['public_key']) && $validated['public_key'] !== '********' && !str_starts_with($validated['public_key'], 'pk_test_')) {
                $errors['public_key'] = 'En Sandbox, debe iniciar con pk_test_';
            }
            if (!empty($validated['secret_key']) && $validated['secret_key'] !== '********' && !str_starts_with($validated['secret_key'], 'sk_test_')) {
                $errors['secret_key'] = 'En Sandbox, debe iniciar con sk_test_';
            }
        } else {
            if (!empty($validated['public_key']) && $validated['public_key'] !== '********' && !str_starts_with($validated['public_key'], 'pk_live_')) {
                $errors['public_key'] = 'En Producción, debe iniciar con pk_live_';
            }
            if (!empty($validated['secret_key']) && $validated['secret_key'] !== '********' && !str_starts_with($validated['secret_key'], 'sk_live_')) {
                $errors['secret_key'] = 'En Producción, debe iniciar con sk_live_';
            }
            if (empty($validated['webhook_secret'])) {
                $errors['webhook_secret'] = 'Webhook Secret es obligatorio en producción';
            }
        }

        if (!empty($errors)) {
            return response()->json(['message' => 'Errores de validación', 'validation_errors' => $errors], 422);
        }

        // Get existing or new
        $existing = PaymentSetting::where('provider', 'stripe')->where('environment', $env)->first();
        $finalSettings = [
            'public_key' => $validated['public_key'],
            'secret_key' => $validated['secret_key'],
            'webhook_secret' => $validated['webhook_secret'] ?? ''
        ];

        if ($existing) {
            $old = $existing->settings;
            foreach ($finalSettings as $key => $value) {
                if ($value === '********')
                    $finalSettings[$key] = $old[$key] ?? '';
            }
        }

        // Validate keys with Stripe before saving
        $validation = $this->validateStripeKey($finalSettings['secret_key'] ?? '', $env);

        $settingData = [
            'settings' => $finalSettings,
            'is_active' => $validation['success'] && ($validated['is_active'] ?? true),
            'last_verified_at' => $validation['success'] ? now() : ($existing->last_verified_at ?? null),
            'last_error' => $validation['success'] ? null : $validation['message']
        ];

        $setting = PaymentSetting::updateOrCreate(
            ['provider' => 'stripe', 'environment' => $env],
            $settingData
        );

        // Deactivate other env ONLY if this one being saved is active
        if ($setting->is_active) {
            PaymentSetting::where('provider', 'stripe')->where('id', '!=', $setting->id)->update(['is_active' => false]);
        }

        if (!$validation['success']) {
            return response()->json([
                'success' => false,
                'is_configured' => false,
                'message' => 'Configuración guardada pero el canal ha sido DESACTIVADO: ' . $validation['message']
            ], 422);
        }

        return response()->json([
            'success' => true,
            'is_configured' => true,
            'message' => 'Configuración guardada y verificada correctamente.'
        ]);
    }

    /**
     * Test connection with Stripe API.
     */
    public function testConnection(Request $request)
    {
        $environment = $request->input('environment');
        $settings = $request->input('settings') ?? [];

        // Recuperar si viene enmascarado
        $existing = PaymentSetting::where('provider', 'stripe')->where('environment', $environment)->first();
        if ($existing) {
            $oldSettings = $existing->settings;
            foreach ($settings as $key => $value) {
                if ($value === '********' && isset($oldSettings[$key])) {
                    $settings[$key] = $oldSettings[$key];
                }
            }
        }

        $secretKey = $settings['secret_key'] ?? null;

        if (!$secretKey) {
            return response()->json(['success' => false, 'message' => 'Falta la Secret Key para la prueba.'], 400);
        }

        $validation = $this->validateStripeKey($secretKey, $environment);

        return response()->json([
            'success' => $validation['success'],
            'message' => $validation['message']
        ], $validation['success'] ? 200 : 400);
    }

    /**
     * Utility to validate Stripe Key with a real request.
     */
    private function validateStripeKey($key, $env)
    {
        if (empty($key)) {
            return ['success' => false, 'message' => 'Llave vacía.'];
        }

        try {
            $response = Http::withToken($key)
                ->get('https://api.stripe.com/v1/balance');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => '¡Conexión exitosa! Las llaves son válidas para el entorno ' . strtoupper($env)
                ];
            }

            $errorData = $response->json();
            $errorMsg = $errorData['error']['message'] ?? 'Error desconocido de Stripe';
            $errorCode = $errorData['error']['code'] ?? 'N/A';

            return [
                'success' => false,
                'message' => "Stripe Error [$errorCode]: $errorMsg"
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Error de red al conectar con Stripe: ' . $e->getMessage()
            ];
        }
    }
}
