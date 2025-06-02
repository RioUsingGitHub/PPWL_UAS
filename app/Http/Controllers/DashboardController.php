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
        $totalProduk = Product::where('is_active', true)->count();
        $totalPengguna = User::where('is_active', true)->count();
        $totalGudang = Warehouse::where('is_active', true)->count();
        
        $produkStokRendah = Product::with('stockItems')
            ->where('is_active', true)
            ->get()
            ->filter(function ($produk) {
                return $produk->total_stock <= $produk->min_stock;
            })
            ->count();

        $daftarAudit = MovementHistory::with(['product', 'location.warehouse', 'user'])
            ->latest()
            ->take(10)
            ->get();

        $stokPerGudang = Warehouse::with(['locations.stockItems.product'])
            ->where('is_active', true)
            ->get()
            ->map(function ($gudang) {
                $totalNilai = $Gudang->locations->flatMap->stockItems->sum(function ($stock) {
                    return $stock->quantity * $stock->product->price;
                });
                
                return [
                    'nama' => $gudang->name,
                    'total_item' => $gudang->locations->flatMap->stockItems->sum('quantity'),
                    'total_nilai' => $totalNilai,
                ];
            });

        return Inertia::render('dashboard', [
            'statistik' => [
                'total_produk' => $totalProduk,
                'total_pengguna' => $totalPengguna,
                'total_gudang' => $totalGudang,
                'produk_stok_rendah' => $produkStokRendah,
            ],
            'daftar_audit' => $daftarAudit,
            'stok_per_gudang' => $stockPerGudang,
        ]);
    }
}