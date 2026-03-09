<?php

namespace App\Http\Controllers\Api;

use App\Models\ShippingZone;
use App\Models\ShippingCityException;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ShippingZoneController extends Controller
{
    public function index()
    {
        return response()->json(ShippingZone::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'states' => 'nullable|array',
        ]);

        $zone = ShippingZone::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Zona de envío creada correctamente.',
            'zone' => $zone
        ]);
    }

    public function update(Request $request, ShippingZone $shippingZone)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'price' => 'sometimes|required|numeric|min:0',
            'states' => 'nullable|array',
        ]);

        $shippingZone->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Zona de envío actualizada correctamente.',
            'zone' => $shippingZone
        ]);
    }

    public function destroy(ShippingZone $shippingZone)
    {
        $shippingZone->delete();

        return response()->json([
            'success' => true,
            'message' => 'Zona de envío eliminada correctamente.'
        ]);
    }

    public function calculate(Request $request)
    {
        $state = $request->state;
        $city = $request->city;

        if (!$state) {
            return response()->json(['price' => 0]);
        }

        $normalizedCity = ShippingCityException::normalize($city ?? '');

        // 1. City Complete (Normalized) - Prioridad máxima
        if ($normalizedCity) {
            $cityMatch = ShippingCityException::where('state_name', $state)
                ->where('match_type', 'city')
                ->where('city_name_normalized', $normalizedCity)
                ->where('active', true)
                ->first();
            if ($cityMatch) return response()->json(['price' => (float)$cityMatch->price, 'match' => 'city']);
        }

        // 2. Default State Zone
        $zones = ShippingZone::all();
        $matchingZone = $zones->filter(function ($z) use ($state) {
            return in_array($state, $z->states ?? []);
        })->first();

        if ($matchingZone) {
            return response()->json(['price' => (float)$matchingZone->price, 'match' => 'state']);
        }

        // Final fallback
        return response()->json(['price' => 150.00, 'match' => 'fallback']);
    }
}
