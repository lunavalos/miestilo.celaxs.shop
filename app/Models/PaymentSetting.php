<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class PaymentSetting extends Model
{
    protected $fillable = [
        'provider',
        'environment',
        'settings',
        'is_active',
        'last_verified_at',
        'last_error',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_verified_at' => 'datetime',
    ];

    /**
     * Get the settings and decrypt them.
     */
    public function getSettingsAttribute($value)
    {
        try {
            return json_decode(Crypt::decryptString($value), true);
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Set the settings and encrypt them.
     */
    public function setSettingsAttribute($value)
    {
        $this->attributes['settings'] = Crypt::encryptString(json_encode($value));
    }

    /**
     * Helper to get a specific key from settings.
     */
    public function getSetting($key, $default = null)
    {
        return $this->settings[$key] ?? $default;
    }
}
