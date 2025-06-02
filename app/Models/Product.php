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
                $uuidNoDash = str_replace('-', '', (string) Str::uuid()); 
                $product->barcode = substr($uuidNoDash, 0, 12); 
            }
        });

        static::created(function ($product) {
            $product->stockItems()->create([
                'location_id'  => 1,       // change this if you want a different default
                'quantity'     => 0,
                'unit_cost'    => 0.00,
                'expiry_date'  => null,
                'batch_number' => null,
            ]);
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
