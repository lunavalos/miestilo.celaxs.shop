<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Brand;
use App\Models\PhoneModel;
use App\Models\Order;
use App\Models\User;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// API Routes
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\ModelController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ShippingZoneController;

Route::prefix('api')->group(function () {
    Route::get('/brands', [BrandController::class, 'index']);
    Route::get('/models', [ModelController::class, 'index']);
    Route::get('/models/{model}', [ModelController::class, 'show']);
    Route::get('/shipping-zones', [ShippingZoneController::class, 'index']); // Public access to zones/states
    Route::post('/shipping/calculate', [ShippingZoneController::class, 'calculate']); // Calculate shipping based on city/CP

    // Public Orders & Payments
    Route::post('/orders/prepare', [OrderController::class, 'prepare']);
    Route::post('/orders/confirm', [OrderController::class, 'confirm']);
    Route::get('/payments/config', [OrderController::class, 'getPaymentConfig']);

    // Admin routes (autenticado)
    Route::middleware('auth')->group(function () {
        Route::apiResource('brands', BrandController::class)->except(['index']);
        Route::apiResource('models', ModelController::class)->except(['index', 'show']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
        
        // Usuarios
        Route::post('/admin/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::delete('/admin/users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);

        // Módulo Profesional Stripe / Pagos
        Route::prefix('admin')->group(function () {
            Route::get('/stripe-settings', [\App\Http\Controllers\Admin\StripeSettingController::class, 'index']);
            Route::put('/stripe-settings', [\App\Http\Controllers\Admin\StripeSettingController::class, 'update']);
            Route::post('/stripe-settings/test', [\App\Http\Controllers\Admin\StripeSettingController::class, 'testConnection']);
            Route::apiResource('shipping-zones', \App\Http\Controllers\Api\ShippingZoneController::class);
            Route::apiResource('shipping-city-exceptions', \App\Http\Controllers\Admin\ShippingExceptionController::class);
        });
    });
});

Route::get('/admin', function () {
    if (auth()->check()) {
        return redirect()->route('admin.dashboard');
    }
    return redirect()->route('login');
});

// Public Pages
Route::get('/personalizar', function () {
    return Inertia::render('Customizer');
})->name('customizer');

// Admin Pages (Inertia Renders)
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('admin.dashboard');
    Route::get('/orders/{order}', [\App\Http\Controllers\Admin\OrderController::class, 'show'])->name('admin.orders.show');

    Route::get('/payment-gateway', function () {
        return Inertia::render('Admin/PaymentGateway');
    })->name('admin.payments');

    Route::get('/stripe-settings', function () {
        return \Inertia\Inertia::render('Admin/StripeSettings');
    })->name('admin.stripe.settings');

    Route::get('/shipping-settings', function () {
        return \Inertia\Inertia::render('Admin/ShippingSettings');
    })->name('admin.shipping.settings');
});

// Webhooks (Public)
Route::post('/api/payments/webhook/stripe', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'stripe']);
Route::post('/api/payments/webhook/mercadopago', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'mercadopago']);

require __DIR__ . '/auth.php';

