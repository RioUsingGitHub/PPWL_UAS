<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\Location;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class WarehouseController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:manage-warehouses');
    }

    // Fix: Update the index method to properly load locations count
    public function index(Request $request)
    {
        $query = Warehouse::with(['locations' => function ($q) {
            $q->withCount('stockItems');
        }])
        ->withCount('locations'); // Add this line to get locations_count

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $warehouses = $query->latest()->paginate(10);

        // Keep locations query if needed for other purposes
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

        // log warehouses for debugging
        Log::debug('Warehouses fetched:', $warehouses->toArray());

        // log locations for debugging
        Log::debug('Locations fetched:', $locations->toArray());

        return Inertia::render('Warehouses/Index', [
            'warehouses' => $warehouses,
            'locations' => $locations,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Warehouses/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:warehouses,code|max:20',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
        ]);

        Warehouse::create($validated);

        return redirect()->route('warehouses.index')
            ->with('message', 'Warehouse created successfully.');
    }

    public function show(Warehouse $warehouse)
    {
        $warehouse->load(['locations.stockItems.product']);

        return Inertia::render('Warehouses/Show', [
            'warehouse' => $warehouse,
        ]);
    }

    public function edit(Warehouse $warehouse)
    {
        return Inertia::render('Warehouses/Edit', [
            'warehouse' => $warehouse,
        ]);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:20', Rule::unique('warehouses', 'code')->ignore($warehouse)],
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
        ]);

        $warehouse->update($validated);

        return redirect()->route('warehouses.index')
            ->with('message', 'Warehouse updated successfully.');
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return redirect()->route('warehouses.index')
            ->with('message', 'Warehouse deleted successfully.');
    }

    // Location management
    public function locations(Warehouse $warehouse)
    {
        $locations = $warehouse->locations()
            ->withCount('stockItems')
            ->latest()
            ->paginate(15);

        return Inertia::render('Warehouses/Index', [
            'warehouse' => $warehouse,
            'locations' => $locations,
        ]);
    }

    public function storeLocation(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:locations,code|max:20',
            'description' => 'nullable|string',
        ]);

        $validated['warehouse_id'] = $warehouse->id;

        Location::create($validated);

        return back()
            ->with('message', 'Location created successfully.');
    }

    public function updateLocation(Request $request, Warehouse $warehouse, Location $location)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:20', Rule::unique('locations', 'code')->ignore($location)],
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);

        return back()
            ->with('message', 'Location updated successfully.');
    }

    public function destroyLocation(Warehouse $warehouse, Location $location)
    {
        $location->delete();

        return back()
            ->with('message', 'Location deleted successfully.');
    }
}