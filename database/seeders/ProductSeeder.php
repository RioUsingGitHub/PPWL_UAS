<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\StockItem;
use App\Models\Location;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Laptop Dell XPS 13',
                'description' => 'High-performance laptop',
                'sku' => 'DELL-XPS-13',
                'price' => 15000000,
                'unit' => 'pcs',
                'category' => 'Electronics',
                'min_stock' => 5,
            ],
            [
                'name' => 'Mouse Wireless Logitech',
                'description' => 'Wireless optical mouse',
                'sku' => 'LGT-MOUSE-001',
                'price' => 250000,
                'unit' => 'pcs',
                'category' => 'Electronics',
                'min_stock' => 10,
            ],
            [
                'name' => 'Keyboard Mechanical',
                'description' => 'RGB mechanical keyboard',
                'sku' => 'KB-MECH-001',
                'price' => 750000,
                'unit' => 'pcs',
                'category' => 'Electronics',
                'min_stock' => 8,
            ],
        ];

        $locations = Location::all();

        foreach ($products as $productData) {
            $product = Product::create($productData);

            // Add stock to random locations
            $randomLocations = $locations->random(2);
            foreach ($randomLocations as $location) {
                StockItem::create([
                    'product_id' => $product->id,
                    'location_id' => $location->id,
                    'quantity' => rand(5, 20),
                    'unit_cost' => $product->price * 0.8,
                ]);
            }
        }
    }
}
