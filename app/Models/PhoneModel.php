<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneModel extends Model
{
    protected $table = 'models';
    protected $fillable = ['brand_id', 'name', 'price', 'image_normal', 'image_transparent', 'active'];

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'model_id');
    }
}
