<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use App\Models\Location;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $warehouse1 = Warehouse::create([
            'name' => 'Main Warehouse',
            'code' => 'WH001',
            'address' => 'Jl. Raya No. 123, Jakarta',
            'phone' => '021-12345678',
        ]);

        $warehouse2 = Warehouse::create([
            'name' => 'Secondary Warehouse',
            'code' => 'WH002',
            'address' => 'Jl. Sudirman No. 456, Surabaya',
            'phone' => '031-87654321',
        ]);

        // Create locations for each warehouse
        $locations = [
            ['name' => 'Rack A1', 'code' => 'A1'],
            ['name' => 'Rack A2', 'code' => 'A2'],
            ['name' => 'Rack B1', 'code' => 'B1'],
            ['name' => 'Rack B2', 'code' => 'B2'],
        ];

        foreach ([$warehouse1, $warehouse2] as $warehouse) {
            foreach ($locations as $location) {
                Location::create([
                    'warehouse_id' => $warehouse->id,
                    'name' => $location['name'],
                    'code' => $warehouse->code . '-' . $location['code'],
                    'description' => 'Storage location ' . $location['name'],
                ]);
            }
        }
    }
}
