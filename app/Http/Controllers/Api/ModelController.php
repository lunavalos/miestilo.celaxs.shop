<?php

namespace App\Http\Controllers\Api;

use App\Models\PhoneModel;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ModelController extends Controller
{
    public function index(Request $request)
    {
        $query = PhoneModel::where('active', true);

        if ($request->has('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        $models = $query->with('brand')->get();
        return response()->json($models);
    }

    public function show(PhoneModel $model)
    {
        return response()->json($model->load('brand'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:brands,id',
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'image_normal' => 'required|image',
            'image_transparent' => 'required|image',
            'active' => 'boolean',
        ]);

        if ($request->hasFile('image_normal')) {
            $path = $request->file('image_normal')->store('models/normal', 'public');
            $validated['image_normal'] = '/storage/' . $path;
        }

        if ($request->hasFile('image_transparent')) {
            $path = $request->file('image_transparent')->store('models/transparent', 'public');
            $validated['image_transparent'] = '/storage/' . $path;
        }

        $model = PhoneModel::create($validated);
        return response()->json($model, 201);
    }

    public function update(Request $request, PhoneModel $model)
    {
        $validated = $request->validate([
            'brand_id' => 'exists:brands,id',
            'name' => 'string|max:255',
            'price' => 'numeric|min:0',
            'image_normal' => 'image',
            'image_transparent' => 'image',
            'active' => 'boolean',
        ]);

        if ($request->hasFile('image_normal')) {
            $path = $request->file('image_normal')->store('models/normal', 'public');
            $validated['image_normal'] = '/storage/' . $path;
        }

        if ($request->hasFile('image_transparent')) {
            $path = $request->file('image_transparent')->store('models/transparent', 'public');
            $validated['image_transparent'] = '/storage/' . $path;
        }

        $model->update($validated);
        return response()->json($model);
    }

    public function destroy(PhoneModel $model)
    {
        $model->delete();
        return response()->json(null, 204);
    }
}
