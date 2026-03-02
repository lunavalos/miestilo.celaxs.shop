<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'customer_email',
        'model_id',
        'customization_data',
        'preview_image',
        'status',
        'total_price',
        // Billing
        'first_name',
        'last_name',
        'country',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'zip_code',
        'phone',
        'order_notes',
        // Payment
        'payment_method',
        'payment_status',
        'transaction_id',
        'shipping_price',
        // Shipping address
        'shipping_first_name',
        'shipping_last_name',
        'shipping_country',
        'shipping_address_line1',
        'shipping_address_line2',
        'shipping_city',
        'shipping_state',
        'shipping_zip_code',
        'shipping_phone',
    ];

    protected $casts = [
        'customization_data' => 'array',
        'total_price' => 'decimal:2',
        'shipping_price' => 'decimal:2',
    ];

    public function phoneModel()
    {
        return $this->belongsTo(PhoneModel::class, 'model_id');
    }
}
