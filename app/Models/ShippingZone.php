<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingZone extends Model
{
    protected $fillable = ['name', 'price', 'states'];

    protected $casts = [
        'states' => 'array',
        'price' => 'decimal:2',
    ];
}
