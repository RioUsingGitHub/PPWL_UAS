<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockItem;
use App\Models\Location;
use App\Models\MovementHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ScanController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:scan-barcode');
    }

    public function index()
    {
        $locations = Location::with('warehouse')
            ->where('is_active', true)
            ->get();

        return Inertia::render('Scan/Index', [
            'locations' => $locations,
        ]);
    }

    public function scanProduct(Request $request)
    {
        $validated = $request->validate([
            'barcode' => 'required|string',
        ]);

        $product = Product::where('barcode', $validated['barcode'])
            ->where('is_active', true)
            ->with(['stockItems.location.warehouse'])
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found with barcode: ' . $validated['barcode']
            ], 404);
        }

        return inertia('ScanResultComponent', [
            'success' => true,
            'product' => $product,
        ]);
    }

    public function quickTransaction(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'location_id' => 'required|exists:locations,id',
            'type' => 'required|in:in,out',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        return DB::transaction(function () use ($validated) {
            $stockItem = StockItem::firstOrCreate(
                [
                    'product_id' => $validated['product_id'],
                    'location_id' => $validated['location_id'],
                ],
                ['quantity' => 0, 'unit_cost' => 0]
            );

            $previousQuantity = $stockItem->quantity;
            
            if ($validated['type'] === 'in') {
                $newQuantity = $previousQuantity + $validated['quantity'];
            } else { // out
                if ($previousQuantity < $validated['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient stock. Available: ' . $previousQuantity
                    ], 400);
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
                'reference_number' => 'SCAN-' . time(),
            ]);

            $product = Product::with('stockItems.location.warehouse')
                ->find($validated['product_id']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction completed successfully.',
                'product' => $product,
                'movement' => [
                    'type' => $validated['type'],
                    'quantity' => $validated['quantity'],
                    'previous_quantity' => $previousQuantity,
                    'new_quantity' => $newQuantity,
                ]
            ]);
        });
    }

    public function history(Request $request)
    {
        $query = MovementHistory::with(['product', 'location.warehouse', 'user'])
            ->where('user_id', Auth::id());

        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        } else {
            $query->whereDate('created_at', today());
        }

        $movements = $query->latest()->paginate(20);

        return Inertia::render('Scan/History', [
            'movements' => $movements,
            'date' => $request->date ?: today()->format('Y-m-d'),
        ]);
    }

    public function bulkScan()
    {
        return Inertia::render('Scan/Bulk');
    }

    public function processBulkScan(Request $request)
    {
        $validated = $request->validate([
            'scans' => 'required|array|min:1',
            'scans.*.barcode' => 'required|string',
            'scans.*.location_id' => 'required|exists:locations,id',
            'scans.*.type' => 'required|in:in,out',
            'scans.*.quantity' => 'required|integer|min:1',
            'scans.*.notes' => 'nullable|string',
        ]);

        $results = [];
        $successCount = 0;
        $errorCount = 0;

        DB::transaction(function () use ($validated, &$results, &$successCount, &$errorCount) {
            foreach ($validated['scans'] as $scan) {
                try {
                    $product = Product::where('barcode', $scan['barcode'])
                        ->where('is_active', true)
                        ->first();

                    if (!$product) {
                        $results[] = [
                            'barcode' => $scan['barcode'],
                            'success' => false,
                            'message' => 'Product not found'
                        ];
                        $errorCount++;
                        continue;
                    }

                    $stockItem = StockItem::firstOrCreate(
                        [
                            'product_id' => $product->id,
                            'location_id' => $scan['location_id'],
                        ],
                        ['quantity' => 0, 'unit_cost' => 0]
                    );

                    $previousQuantity = $stockItem->quantity;
                    
                    if ($scan['type'] === 'in') {
                        $newQuantity = $previousQuantity + $scan['quantity'];
                    } else {
                        if ($previousQuantity < $scan['quantity']) {
                            $results[] = [
                                'barcode' => $scan['barcode'],
                                'success' => false,
                                'message' => 'Insufficient stock'
                            ];
                            $errorCount++;
                            continue;
                        }
                        $newQuantity = $previousQuantity - $scan['quantity'];
                    }

                    $stockItem->update(['quantity' => $newQuantity]);

                    MovementHistory::create([
                        'product_id' => $product->id,
                        'location_id' => $scan['location_id'],
                        'user_id' => Auth::id(),
                        'type' => $scan['type'],
                        'quantity' => $scan['quantity'],
                        'previous_quantity' => $previousQuantity,
                        'new_quantity' => $newQuantity,
                        'notes' => $scan['notes'],
                        'reference_number' => 'BULK-' . time(),
                    ]);

                    $results[] = [
                        'barcode' => $scan['barcode'],
                        'product_name' => $product->name,
                        'success' => true,
                        'message' => 'Processed successfully'
                    ];
                    $successCount++;

                } catch (\Exception $e) {
                    $results[] = [
                        'barcode' => $scan['barcode'],
                        'success' => false,
                        'message' => 'Error: ' . $e->getMessage()
                    ];
                    $errorCount++;
                }
            }
        });

        return response()->json([
            'success' => true,
            'results' => $results,
            'summary' => [
                'total' => count($validated['scans']),
                'success' => $successCount,
                'errors' => $errorCount,
            ]
        ]);
    }
}