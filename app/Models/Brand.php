<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = ['name', 'logo', 'active'];

    public function models()
    {
        return $this->hasMany(PhoneModel::class);
    }
}
