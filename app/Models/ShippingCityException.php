<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingCityException extends Model
{
    use HasFactory;

    protected $fillable = [
        'state_name',
        'city_name',
        'city_name_normalized',
        'match_type',
        'cp_start',
        'cp_end',
        'price',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
        'price' => 'decimal:2',
    ];

    /**
     * Helper to normalize city names.
     */
    public static function normalize(string $name): string
    {
        // Lowercase
        $name = mb_strtolower($name, 'UTF-8');
        
        // Remove accents
        $accents = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
            'ñ' => 'n'
        ];
        $name = strtr($name, $accents);
        
        // Remove double spaces and trim
        $name = preg_replace('/\s+/', ' ', $name);
        $name = trim($name);
        
        return $name;
    }
}
