<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingCityException;
use Illuminate\Http\Request;

class ShippingExceptionController extends Controller
{
    public function index()
    {
        return response()->json(ShippingCityException::orderBy('state_name')->orderBy('city_name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'state_name' => 'required|string',
            'city_name' => 'required|string',
            'price' => 'required|numeric|min:0',
            'active' => 'boolean',
        ]);

        $validated['match_type'] = 'city';
        $validated['city_name_normalized'] = ShippingCityException::normalize($validated['city_name']);

        $exception = ShippingCityException::create($validated);

        return response()->json($exception);
    }

    public function update(Request $request, ShippingCityException $shipping_city_exception)
    {
        $validated = $request->validate([
            'state_name' => 'required|string',
            'city_name' => 'required|string',
            'price' => 'required|numeric|min:0',
            'active' => 'boolean',
        ]);

        $validated['match_type'] = 'city';
        $validated['city_name_normalized'] = ShippingCityException::normalize($validated['city_name']);

        $shipping_city_exception->update($validated);

        return response()->json($shipping_city_exception);
    }

    public function destroy(ShippingCityException $shipping_city_exception)
    {
        $shipping_city_exception->delete();
        return response()->json(['success' => true]);
    }
}
