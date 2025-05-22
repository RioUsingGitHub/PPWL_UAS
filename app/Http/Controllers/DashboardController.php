<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockItem;
use App\Models\MovementHistory;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalProducts = Product::where('is_active', true)->count();
        $totalUsers = User::where('is_active', true)->count();
        $totalWarehouses = Warehouse::where('is_active', true)->count();
        
        $lowStockProducts = Product::with('stockItems')
            ->where('is_active', true)
            ->get()
            ->filter(function ($product) {
                return $product->total_stock <= $product->min_stock;
            })
            ->count();

        $recentMovements = MovementHistory::with(['product', 'location.warehouse', 'user'])
            ->latest()
            ->take(10)
            ->get();

        $stockByWarehouse = Warehouse::with(['locations.stockItems.product'])
            ->where('is_active', true)
            ->get()
            ->map(function ($warehouse) {
                $totalValue = $warehouse->locations->flatMap->stockItems->sum(function ($stock) {
                    return $stock->quantity * $stock->product->price;
                });
                
                return [
                    'name' => $warehouse->name,
                    'total_items' => $warehouse->locations->flatMap->stockItems->sum('quantity'),
                    'total_value' => $totalValue,
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'total_products' => $totalProducts,
                'total_users' => $totalUsers,
                'total_warehouses' => $totalWarehouses,
                'low_stock_products' => $lowStockProducts,
            ],
            'recent_movements' => $recentMovements,
            'stock_by_warehouse' => $stockByWarehouse,
        ]);
    }
}