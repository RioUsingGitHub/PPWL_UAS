<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class MovementHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'location_id',
        'user_id',
        'type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'notes',
        'reference_number',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getTypeColorAttribute()
    {
        return match($this->type) {
            'in' => 'green',
            'out' => 'red',
            'adjustment' => 'blue',
            'transfer' => 'purple',
            default => 'gray'
        };
    }
}
