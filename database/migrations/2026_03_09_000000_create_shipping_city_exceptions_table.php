<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shipping_city_exceptions', function (Blueprint $table) {
            $table->id();
            $table->string('state_name');
            $table->string('city_name');
            $table->string('city_name_normalized');
            $table->enum('match_type', ['city', 'exact_cp', 'cp_range']);
            $table->string('cp_start')->nullable();
            $table->string('cp_end')->nullable();
            $table->decimal('price', 10, 2);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_city_exceptions');
    }
};
