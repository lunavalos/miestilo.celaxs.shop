<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Brand;
use App\Models\PhoneModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::create([
            'name' => 'Adria',
            'email' => 'adria@gmail.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
        ]);

        // Create brands
        $apple = Brand::create([
            'name' => 'Apple',
            'logo' => '/storage/brands/apple.png', 
            'active' => true,
        ]);

        $huawei = Brand::create([
            'name' => 'Huawei',
            'logo' => '/storage/brands/huawei.webp',
            'active' => true,
        ]);

        $samsung = Brand::create([
            'name' => 'Samsung',
            'logo' => '/storage/brands/Samsung.png',
            'active' => true,
        ]);

        $xiaomi = Brand::create([
            'name' => 'Xiaomi',
            'logo' => '/storage/brands/Xiaomi-Logo.png',
            'active' => true,
        ]);

        // Specific Models requested
        PhoneModel::create([
            'brand_id' => $samsung->id,
            'name' => 'g54',
            'image_normal' => '/storage/models/normal/g54.png',
            'image_transparent' => '/storage/models/transparent/g54.png',
            'price' => 500.00,
            'active' => true,
        ]);

        PhoneModel::create([
            'brand_id' => $huawei->id,
            'name' => 'Y9 plus',
            'image_normal' => '/storage/models/normal/y9-plus.png',
            'image_transparent' => '/storage/models/transparent/y9-plus.png',
            'price' => 200.00,
            'active' => true,
        ]);

        $this->call([
            ShippingZoneSeeder::class,
        ]);
    }
}
