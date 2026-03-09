<?php

namespace App\Http\Controllers\Admin;

use App\Models\Order;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function show(Order $order)
    {
        return Inertia::render('Admin/OrderShow', [
            'order' => $order->load('phoneModel.brand')
        ]);
    }
}
