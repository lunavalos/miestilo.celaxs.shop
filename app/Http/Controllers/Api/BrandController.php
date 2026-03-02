<?php

namespace App\Http\Controllers\Api;

use App\Models\Brand;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BrandController extends Controller
{
    public function index()
    {
        $brands = Brand::where('active', true)
            ->with('models')
            ->get();

        return response()->json($brands);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'logo' => 'required|image',
            'active' => 'boolean',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo'] = '/storage/' . $path;
        }

        $brand = Brand::create($validated);
        return response()->json($brand, 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'logo' => 'image',
            'active' => 'boolean',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('brands', 'public');
            $validated['logo'] = '/storage/' . $path;
        }

        $brand->update($validated);
        return response()->json($brand);
    }

    public function destroy(Brand $brand)
    {
        $brand->delete();
        return response()->json(null, 204);
    }
}
