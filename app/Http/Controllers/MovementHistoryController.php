<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\MovementHistory;

class MovementHistoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view-audit-logs');
    }
    
    public function index(Request $request)
    {

        $query = MovementHistory::with(['product', 'location.warehouse', 'user']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('product', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                        ->orWhere('sku', 'like', '%' . $request->search . '%');
                })
                ->orWhereHas('user', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                });
            });
        }

        return Inertia::render('AuditLogs/Index', [
            'movements' => $query->latest()->paginate(20),
            'filters' => $request->only(['search']),
        ]);
    }

    public function destroy($id)
    {
        $movement = MovementHistory::findOrFail($id);
        $movement->delete();

        return back()
            ->with('message', 'Movement history deleted successfully.');
    }
}
