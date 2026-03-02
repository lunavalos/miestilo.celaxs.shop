<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Datos de facturación
            $table->string('first_name')->nullable()->after('customer_email');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('country')->default('México')->after('last_name');
            $table->string('address_line1')->nullable()->after('country');
            $table->string('address_line2')->nullable()->after('address_line1');
            $table->string('city')->nullable()->after('address_line2');
            $table->string('state')->nullable()->after('city');
            $table->string('zip_code')->nullable()->after('state');
            $table->string('phone')->nullable()->after('zip_code');
            $table->string('order_notes')->nullable()->after('phone');
            // Pago
            $table->string('payment_method')->default('card')->after('order_notes');
            $table->string('payment_status')->default('pending')->after('payment_method');
            $table->string('transaction_id')->nullable()->after('payment_status');
            // Precio de envio
            $table->decimal('shipping_price', 10, 2)->default(100.00)->after('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
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
                'payment_method',
                'payment_status',
                'transaction_id',
                'shipping_price',
            ]);
        });
    }
};
