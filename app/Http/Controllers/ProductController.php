<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:manage-products');
    }

    public function index(Request $request)
    {
        $query = Product::with('stockItems.location.warehouse');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('sku', 'like', '%' . $request->search . '%')
                  ->orWhere('barcode', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->has('low_stock')) {
            $query->whereRaw('(SELECT SUM(quantity) FROM stock_items WHERE product_id = products.id) <= min_stock');
        }

        $products = $query->latest()->paginate(15);

        $categories = Product::distinct()->pluck('category')->filter()->values();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'low_stock']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'required|string|unique:products,sku',
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'category' => 'nullable|string|max:100',
            'min_stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        Product::create($validated);

        return redirect()->route('products.index')
            ->with('message', 'Product created successfully.');
    }

    public function show(Product $product)
    {
        $product->load([
            'stockItems.location.warehouse',
            'movementHistories' => function ($query) {
                $query->with(['location.warehouse', 'user'])->latest()->take(20);
            }
        ]);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => ['required', 'string', Rule::unique('products', 'sku')->ignore($product)],
            'price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'category' => 'nullable|string|max:100',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return redirect()->route('products.index')
            ->with('message', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return redirect()->route('products.index')
            ->with('message', 'Product deleted successfully.');
    }

    public function search(Request $request)
    {
        $query = Product::where('is_active', true);

        if ($request->q) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('sku', 'like', '%' . $request->q . '%')
                  ->orWhere('barcode', 'like', '%' . $request->q . '%');
            });
        }

        $products = $query->take(10)->get(['id', 'name', 'sku', 'barcode', 'unit']);

        return response()->json($products);
    }

    public function findByBarcode(Request $request)
    {
        $product = Product::where('barcode', $request->barcode)
            ->where('is_active', true)
            ->with('stockItems.location.warehouse')
            ->first();

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        return response()->json($product);
    }
}