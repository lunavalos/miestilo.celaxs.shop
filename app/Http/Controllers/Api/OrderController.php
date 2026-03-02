<?php

namespace App\Http\Controllers\Api;

use App\Models\Order;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

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

    public function store(Request $request)
    {
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
            // Shipping fields (optional)
            'shipping_first_name' => 'nullable|string|max:100',
            'shipping_last_name' => 'nullable|string|max:100',
            'shipping_country' => 'nullable|string|max:100',
            'shipping_shipping_address_line1' => 'nullable|string|max:255',
            'shipping_shipping_address_line2' => 'nullable|string|max:255',
            'shipping_city' => 'nullable|string|max:100',
            'shipping_state' => 'nullable|string|max:100',
            'shipping_zip_code' => 'nullable|string|max:20',
            'shipping_phone' => 'nullable|string|max:30',
        ]);

        // Aquí se integraría el procesamiento del pago real (Stripe, Conekta, etc.)
        // Por ahora guardamos el pedido como "pending" esperando webhook o confirmación
        $validated['status'] = 'pending';
        $validated['payment_status'] = 'pending';
        $validated['shipping_price'] = $validated['shipping_price'] ?? 100.00;

        $order = Order::create($validated);

        return response()->json([
            'success' => true,
            'order' => $order,
            'message' => 'Pedido creado exitosamente. Procesa el pago para confirmar.',
        ], 201);
    }
}
