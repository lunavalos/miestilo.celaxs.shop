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

Route::prefix('api')->group(function () {
    Route::get('/brands', [BrandController::class, 'index']);
    Route::get('/models', [ModelController::class, 'index']);
    Route::get('/models/{model}', [ModelController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);

    // Admin routes (autenticado)
    Route::middleware('auth')->group(function () {
        Route::apiResource('brands', BrandController::class)->except(['index']);
        Route::apiResource('models', ModelController::class)->except(['index', 'show']);
        Route::get('/orders', [OrderController::class, 'index']);
        // Usuarios
        Route::post('/admin/users', [\App\Http\Controllers\Api\UserController::class, 'store']);
        Route::delete('/admin/users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy']);
    });
});

// Public Pages
Route::get('/personalizar', function () {
    return Inertia::render('Customizer');
})->name('customizer');

// Admin Pages
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Admin/Dashboard', [
            'brands' => Brand::with('models')->orderBy('name')->get(),
            'models' => PhoneModel::with('brand')->orderBy('name')->get(),
            'orders' => Order::with('phoneModel')->latest()->get(),
            'users' => User::orderBy('name')->get(['id', 'name', 'email', 'is_admin', 'created_at']),
        ]);
    })->name('admin.dashboard');
});

require __DIR__ . '/auth.php';

