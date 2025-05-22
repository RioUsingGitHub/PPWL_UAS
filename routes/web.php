<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockItemController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ScanController;

// Public routes
Route::get('/', function () {
    return auth()->check() ? redirect('/dashboard') : redirect('/login');
});

// Protected routes
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Products
    Route::resource('products', ProductController::class);
    Route::get('/api/products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('/api/products/barcode/{barcode}', [ProductController::class, 'findByBarcode'])->name('products.barcode');
    
    // Stock Management
    Route::prefix('stock')->name('stock.')->group(function () {
        Route::get('/', [StockItemController::class, 'index'])->name('index');
        Route::get('/adjustment', [StockItemController::class, 'adjustment'])->name('adjustment');
        Route::post('/adjustment', [StockItemController::class, 'processAdjustment'])->name('adjustment.process');
        Route::post('/transfer', [StockItemController::class, 'transfer'])->name('transfer');
        Route::get('/movements', [StockItemController::class, 'movementHistory'])->name('movements');
    });
    
    // Warehouses & Locations
    Route::resource('warehouses', WarehouseController::class);
    Route::prefix('warehouses/{warehouse}')->name('warehouses.')->group(function () {
        Route::get('/locations', [WarehouseController::class, 'locations'])->name('locations');
        Route::get('/locations/create', [WarehouseController::class, 'createLocation'])->name('locations.create');
        Route::post('/locations', [WarehouseController::class, 'storeLocation'])->name('locations.store');
        Route::get('/locations/{location}/edit', [WarehouseController::class, 'editLocation'])->name('locations.edit');
        Route::put('/locations/{location}', [WarehouseController::class, 'updateLocation'])->name('locations.update');
        Route::delete('/locations/{location}', [WarehouseController::class, 'destroyLocation'])->name('locations.destroy');
    });
    
    // Users (Admin only)
    Route::resource('users', UserController::class)->middleware('permission:manage-users');
    Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])
        ->name('users.toggle-status')
        ->middleware('permission:manage-users');
    
    // Barcode Scanning
    Route::prefix('scan')->name('scan.')->group(function () {
        Route::get('/', [ScanController::class, 'index'])->name('index');
        Route::post('/product', [ScanController::class, 'scanProduct'])->name('product');
        Route::post('/transaction', [ScanController::class, 'quickTransaction'])->name('transaction');
        Route::get('/history', [ScanController::class, 'history'])->name('history');
        Route::get('/bulk', [ScanController::class, 'bulkScan'])->name('bulk');
        Route::post('/bulk', [ScanController::class, 'processBulkScan'])->name('bulk.process');
    });
    
    // Audit Logs (Admin only)
    Route::get('/audit-logs', function () {
        $movements = \App\Models\MovementHistory::with(['product', 'location.warehouse', 'user'])
            ->latest()
            ->paginate(20);
            
        return Inertia::render('AuditLogs/Index', [
            'movements' => $movements,
        ]);
    })->name('audit-logs')->middleware('permission:view-audit-logs');
});