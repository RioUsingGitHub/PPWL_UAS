<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'barcode',
        'name',
        'description',
        'sku',
        'price',
        'unit',
        'category',
        'image',
        'min_stock',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($product) {
            if (!$product->barcode) {
                $product->barcode = Str::uuid();
            }
        });
    }

    public function stockItems()
    {
        return $this->hasMany(StockItem::class);
    }

    public function movementHistories()
    {
        return $this->hasMany(MovementHistory::class);
    }

    public function getTotalStockAttribute()
    {
        return $this->stockItems()->sum('quantity');
    }

    public function getIsLowStockAttribute()
    {
        return $this->total_stock <= $this->min_stock;
    }
}
