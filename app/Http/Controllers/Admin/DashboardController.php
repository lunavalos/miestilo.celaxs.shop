<?php

namespace App\Http\Controllers\Admin;

use App\Models\Brand;
use App\Models\PhoneModel;
use App\Models\Order;
use App\Models\User;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Only consider 'paid' orders for most statistics as requested
        $paidOrdersQuery = Order::where('payment_status', 'paid');

        $stats = [
            'most_sold_models' => (clone $paidOrdersQuery)->select('model_id')
                ->selectRaw('count(*) as total')
                ->with('phoneModel.brand')
                ->groupBy('model_id')
                ->orderByDesc('total')
                ->take(5)
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->phoneModel->name ?? 'Desconocido',
                        'brand' => $item->phoneModel->brand->name ?? '',
                        'total' => $item->total
                    ];
                }),
            'top_zones' => (clone $paidOrdersQuery)->selectRaw('COALESCE(shipping_state, state) as zone_name')
                ->selectRaw('count(*) as total')
                ->groupBy('zone_name')
                ->orderByDesc('total')
                ->get()
                ->map(function($item) {
                    return [
                        'name' => $item->zone_name,
                        'total' => $item->total
                    ];
                }),
            'status_counts' => [
                ['name' => 'Pendiente', 'value' => (clone $paidOrdersQuery)->where('status', 'pendiente')->count()],
                ['name' => 'En Proceso', 'value' => (clone $paidOrdersQuery)->where('status', 'en proceso')->count()],
                ['name' => 'Enviado', 'value' => (clone $paidOrdersQuery)->where('status', 'enviado')->count()],
                ['name' => 'Entregado', 'value' => (clone $paidOrdersQuery)->where('status', 'entregado')->count()],
            ],
            'total_revenue' => (clone $paidOrdersQuery)->sum('total_price'),
            'orders_count' => (clone $paidOrdersQuery)->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'brands' => Brand::with('models')->orderBy('name')->get(),
            'models' => PhoneModel::with('brand')->orderBy('name')->get(),
            // The user wants orders to only reflect if paid, so we filter the main list too
            'orders' => Order::with(['phoneModel.brand'])
                ->where('payment_status', 'paid')
                ->latest()
                ->get(),
            'users' => User::orderBy('name')->get(['id', 'name', 'email', 'is_admin', 'created_at']),
            'dashboard_stats' => $stats,
        ]);
    }
}
