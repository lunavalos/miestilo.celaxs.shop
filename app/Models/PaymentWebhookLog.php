<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentWebhookLog extends Model
{
    protected $table = 'payment_webhooks_logs';

    protected $fillable = [
        'provider',
        'event_type',
        'payload',
        'status',
        'is_valid_signature',
        'error_message',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_valid_signature' => 'boolean',
    ];
}
