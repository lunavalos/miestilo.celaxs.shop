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
        $motorola = Brand::create([
            'name' => 'Motorola',
            'logo' => '/storage/brands/Motorola-Logo-.png',
            'active' => true,
        ]);

        $samsung = Brand::create([
            'name' => 'Samsung',
            'logo' => '/storage/brands/Samsung.png',
            'active' => true,
        ]);

        $huawei = Brand::create([
            'name' => 'Huawei',
            'logo' => '/storage/brands/huawei.webp',
            'active' => true,
        ]);

        $xiaomi = Brand::create([
            'name' => 'Xiaomi',
            'logo' => '/storage/brands/Xiaomi-Logo.png',
            'active' => true,
        ]);

        // Motorola models
        $motoModels = [
            ['name' => 'Edge 40 Neo', 'image' => 'edge-40-neo.png'],
            ['name' => 'Edge 40', 'image' => 'edge-40.png'],
            ['name' => 'Edge 50 Fusion', 'image' => 'edge-50-fusion.png'],
            ['name' => 'Edge 50 Pro', 'image' => 'edge-50-pro.png'],
            ['name' => 'Edge 50 Ultra', 'image' => 'edge-50-ultra.png'],
            ['name' => 'G04', 'image' => 'g04.png'],
            ['name' => 'G24', 'image' => 'g24.png'],
            ['name' => 'G34', 'image' => 'g34.png'],
            ['name' => 'G54', 'image' => 'g54.png'],
            ['name' => 'G55', 'image' => 'g55.png'],
            ['name' => 'G60 / G60s', 'image' => 'g60-g60s.png'],
            ['name' => 'G84', 'image' => 'g84.png'],
            ['name' => 'G85', 'image' => 'g85.png'],
        ];

        foreach ($motoModels as $model) {
            PhoneModel::create([
                'brand_id' => $motorola->id,
                'name' => $model['name'],
                'image_normal' => '/storage/models/normal/' . $model['image'],
                'image_transparent' => '/storage/models/transparent/' . $model['image'],
                'active' => true,
            ]);
        }

        // Samsung models
        $samsungModels = [
            ['name' => 'A10 / A10s', 'image' => 'a10-a10s.png'],
            ['name' => 'A14', 'image' => 'a14.png'],
            ['name' => 'A20 / A30', 'image' => 'a20-a30.png'],
            ['name' => 'A20s', 'image' => 'a20s.png'],
            ['name' => 'A21s', 'image' => 'a21s.png'],
            ['name' => 'A24', 'image' => 'a24.png'],
            ['name' => 'A25', 'image' => 'a25.png'],
            ['name' => 'A30', 'image' => 'a30.png'],
            ['name' => 'A32 4G', 'image' => 'a32-4g.png'],
            ['name' => 'A34', 'image' => 'a34.png'],
            ['name' => 'A35', 'image' => 'a35.png'],
            ['name' => 'A50', 'image' => 'a50.png'],
            ['name' => 'A54', 'image' => 'a54.png'],
            ['name' => 'A55', 'image' => 'a55.png'],
            ['name' => 'S21 Ultra', 'image' => 's21-ultra.png'],
            ['name' => 'S22 Ultra', 'image' => 's22-ultra.png'],
            ['name' => 'S22', 'image' => 's22.png'],
            ['name' => 'S23 FE', 'image' => 's23-fe.png'],
            ['name' => 'S23 Plus', 'image' => 's23-plus.png'],
            ['name' => 'S23 Ultra', 'image' => 's23-ultra.png'],
            ['name' => 'S23', 'image' => 's23.png'],
            ['name' => 'S24 FE', 'image' => 's24-fe.png'],
            ['name' => 'S24 Plus', 'image' => 's24-plus.png'],
            ['name' => 'S24 Ultra', 'image' => 's24-ultra.png'],
            ['name' => 'S24', 'image' => 's24.png'],
            ['name' => 'S25 Plus', 'image' => 's25-plus.png'],
            ['name' => 'S25 Ultra', 'image' => 's25-ultra.png'],
            ['name' => 'S25', 'image' => 's25.png'],
        ];

        foreach ($samsungModels as $model) {
            PhoneModel::create([
                'brand_id' => $samsung->id,
                'name' => $model['name'],
                'image_normal' => '/storage/models/normal/' . $model['image'],
                'image_transparent' => '/storage/models/transparent/' . $model['image'],
                'active' => true,
            ]);
        }

        // Huawei models
        $huaweiModels = [
            ['name' => 'P30 Lite', 'image' => 'p30-lite.png'],
            ['name' => 'Y9 2019', 'image' => 'y9-2019.png'],
            ['name' => 'Y9 Prime', 'image' => 'y9-prime.png'],
            ['name' => 'Y9s', 'image' => 'y9s.png'],
        ];

        foreach ($huaweiModels as $model) {
            PhoneModel::create([
                'brand_id' => $huawei->id,
                'name' => $model['name'],
                'image_normal' => '/storage/models/normal/' . $model['image'],
                'image_transparent' => '/storage/models/transparent/' . $model['image'],
                'active' => true,
            ]);
        }

        // Xiaomi models
        $xiaomiModels = [
            ['name' => 'Note 10', 'image' => 'note-10.png'],
            ['name' => 'Note 11', 'image' => 'note-11.png'],
            ['name' => 'Note 12', 'image' => 'note-12.png'],
            ['name' => 'Note 13 4G', 'image' => 'note-13-4g.png'],
            ['name' => 'Note 13 5G', 'image' => 'note-13-5g.png'],
            ['name' => 'Note 13 Pro 4G', 'image' => 'note-13-pro-4g.png'],
            ['name' => 'Note 13 Pro 5G', 'image' => 'note-13-pro-5g.png'],
            ['name' => 'Note 14 Pro', 'image' => 'note-14-pro.png'],
            ['name' => 'Note 14', 'image' => 'note-14.png'],
            ['name' => 'Note 9s', 'image' => 'note-9s.png'],
        ];

        foreach ($xiaomiModels as $model) {
            PhoneModel::create([
                'brand_id' => $xiaomi->id,
                'name' => $model['name'],
                'image_normal' => '/storage/models/normal/' . $model['image'],
                'image_transparent' => '/storage/models/transparent/' . $model['image'],
                'active' => true,
            ]);
        }
    }
}
