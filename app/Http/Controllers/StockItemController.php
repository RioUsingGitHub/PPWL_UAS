<?php

namespace App\Http\Controllers;

use App\Models\StockItem;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\MovementHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StockItemController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:manage-stock');
    }

    public function index(Request $request)
    {
        $query = StockItem::with(['product', 'location.warehouse']);

        if ($request->search) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->warehouse_id) {
            $query->whereHas('location', function ($q) use ($request) {
                $q->where('warehouse_id', $request->warehouse_id);
            });
        }

        if ($request->has('low_stock')) {
            $query->whereHas('product', function ($q) {
                $q->whereRaw('stock_items.quantity <= products.min_stock');
            });
        }

        if ($request->has('expired')) {
            $query->where('expiry_date', '<', now());
        }

        $stockItems = $query->latest()->paginate(20);
        
        $warehouseses = Warehouse::with(['locations' => function ($q) {
            $q->withCount('stockItems');
        }])
        ->withCount('locations');

        $warehouses = $warehouseses->latest()->paginate(10);

        Log::info('warehouses fetched:', $warehouses->toArray());

        $locations = Location::query()
        ->select([
            'id',
            'warehouse_id',
            'name',
            'code',
            DB::raw('LEFT(description, 256) as description'),
            'is_active',
            'created_at',
            'updated_at',
        ])
        ->limit(1000)
        ->get();

        Log::debug('Locations fetched:', $locations->toArray());

        return Inertia::render('Stock/Index', [
            'stock_items' => $stockItems,
            'warehouses' => $warehouses,
            'locations' => $locations,
            'filters' => $request->only(['search', 'warehouse_id', 'low_stock', 'expired']),
        ]);
    }

    public function adjustment(Request $request)
    {
        $products = Product::where('is_active', true)
            ->with('stockItems.location.warehouse')
            ->get();

        $locations = Location::with('warehouse')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Stock/Adjustment', [
            'products' => $products,
            'locations' => $locations,
        ]);
    }

    public function processAdjustment(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'location_id' => 'required|exists:locations,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'reference_number' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $stockItem = StockItem::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['location_id'],
                ],
                ['quantity' => 0, 'unit_cost' => 0]
            );

            $previousQuantity = $stockItem->quantity;
            
            if ($validated['type'] === 'in' || $validated['type'] === 'adjustment') {
                $newQuantity = $previousQuantity + $validated['quantity'];
            } else { // out
                if ($previousQuantity < $validated['quantity']) {
                    return response()->json(['error' => 'Insufficient stock'], 400);
                }
                $newQuantity = $previousQuantity - $validated['quantity'];
            }

            $stockItem->update(['quantity' => $newQuantity]);

            // Record movement history
            MovementHistory::create([
                'product_id' => $validated['product_id'],
                'location_id' => $validated['location_id'],
                'user_id' => Auth::id(),
                'type' => $validated['type'],
                'quantity' => $validated['quantity'],
                'previous_quantity' => $previousQuantity,
                'new_quantity' => $newQuantity,
                'notes' => $validated['notes'],
                'reference_number' => $validated['reference_number'],
            ]);

            return redirect()->route('stock.index')
                ->with('message', 'Stock adjustment completed successfully.');
        });
    }

    public function transfer(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_location_id' => 'required|exists:locations,id',
            'to_location_id' => 'required|exists:locations,id|different:from_location_id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $fromStock = StockItem::where('product_id', $validated['product_id'])
                ->where('location_id', $validated['from_location_id'])
                ->first();

            if (!$fromStock || $fromStock->quantity < $validated['quantity']) {
                return response()->json(['error' => 'Insufficient stock in source location'], 400);
            }

            // Reduce from source
            $fromStock->update(['quantity' => $fromStock->quantity - $validated['quantity']]);

            // Add to destination
            $toStock = StockItem::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['to_location_id'],
                ],
                ['quantity' => 0, 'unit_cost' => $fromStock->unit_cost]
            );

            $toStock->update(['quantity' => $toStock->quantity + $validated['quantity']]);

            // Record movements
            MovementHistory::create([
                'product_id' => $validated['product_id'],
                'location_id' => $validated['from_location_id'],
                'user_id' => Auth::id(),
                'type' => 'transfer',
                'quantity' => -$validated['quantity'],
                'previous_quantity' => $fromStock->quantity + $validated['quantity'],
                'new_quantity' => $fromStock->quantity,
                'notes' => $validated['notes'] . ' (Transfer out)',
            ]);

            MovementHistory::create([
                'product_id' => $validated['product_id'],
                'location_id' => $validated['to_location_id'],
                'user_id' => Auth::id(),
                'type' => 'transfer',
                'quantity' => $validated['quantity'],
                'previous_quantity' => $toStock->quantity - $validated['quantity'],
                'new_quantity' => $toStock->quantity,
                'notes' => $validated['notes'] . ' (Transfer in)',
            ]);

            return response()->json(['message' => 'Stock transfer completed successfully.']);
        });
    }

    public function movementHistory(Request $request)
    {
        $query = MovementHistory::with(['product', 'location.warehouse', 'user']);

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->location_id) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->latest()->paginate(20);

        $products = Product::where('is_active', true)->get(['id', 'name']);
        $locations = Location::with('warehouse')->where('is_active', true)->get();

        return Inertia::render('Stock/MovementHistory', [
            'movements' => $movements,
            'products' => $products,
            'locations' => $locations,
            'filters' => $request->only(['product_id', 'location_id', 'type', 'date_from', 'date_to']),
        ]);
    }
}