<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ShippingZoneSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zones = [
            [
                'name' => 'Local / Noreste',
                'price' => 120.00,
                'states' => ['Coahuila', 'Nuevo León', 'Tamaulipas']
            ],
            [
                'name' => 'Norte cercano',
                'price' => 150.00,
                'states' => ['Chihuahua', 'Durango', 'Zacatecas', 'San Luis Potosí', 'Aguascalientes']
            ],
            [
                'name' => 'Centro / Occidente',
                'price' => 180.00,
                'states' => ['CDMX', 'Estado de México', 'Querétaro', 'Hidalgo', 'Morelos', 'Puebla', 'Tlaxcala', 'Guanajuato', 'Jalisco', 'Michoacán', 'Colima', 'Nayarit', 'Veracruz']
            ],
            [
                'name' => 'Lejana / Remota',
                'price' => 220.00,
                'states' => ['Baja California', 'Baja California Sur', 'Sonora', 'Sinaloa', 'Guerrero', 'Oaxaca', 'Chiapas', 'Tabasco', 'Campeche', 'Yucatán', 'Quintana Roo']
            ],
        ];

        foreach ($zones as $zone) {
            \App\Models\ShippingZone::create([
                'name' => $zone['name'],
                'price' => $zone['price'],
                'states' => $zone['states'],
            ]);
        }
    }
}
