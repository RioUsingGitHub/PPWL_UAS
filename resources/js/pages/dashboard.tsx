import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { BuildingStorefrontIcon, ClipboardDocumentListIcon, CubeIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Head } from '@inertiajs/react';
import { DashboardStats, Location, MovementHistory, StockByWarehouse, Product, User } from '@/types';

interface props {
    stats: DashboardStats;
    recent_movements: MovementHistory;
    stock_by_warehouse: {
        data: StockByWarehouse[];
        locations: Location[];
    };
}

export default function Dashboard({ stats, recent_movements, stock_by_warehouse }: props) {
    const statCards = [
        {
            name: 'Total Produk',
            value: stats.total_products,
            icon: CubeIcon,
            gradient: 'from-blue-500 via-blue-400 to-cyan-400',
            change: '+12.5%',
            changeType: 'increase',
            subtitle: 'Item inventaris aktif',
        },
        {
            name: 'Total Pengguna',
            value: stats.total_users,
            icon: UserGroupIcon,
            gradient: 'from-emerald-500 via-green-400 to-lime-300',
            change: '+8.2%',
            changeType: 'increase',
            subtitle: 'Pengguna Sistems',
        },
        {
            name: 'Total Gudang',
            value: stats.total_warehouses,
            icon: BuildingStorefrontIcon,
            gradient: 'from-purple-500 via-fuchsia-400 to-pink-300',
            change: '+2.1%',
            changeType: 'increase',
            subtitle: 'Lokasi penyimpanan',
        },
        {
            name: 'Produk Stok Rendah',
            value: stats.low_stock_products,
            icon: ExclamationTriangleIcon,
            gradient: 'from-red-500 via-orange-400 to-yellow-300',
            change: '-15.3%',
            changeType: 'decrease',
            subtitle: 'Membutuhkan perhatian',
        },
    ];

    // Given a movement “type” string, return a small tailwind badge class
    // (e.g. 'in', 'out', 'adjustment', 'transfer', etc.)
    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'in':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case 'out':
                return 'bg-red-100 text-red-700 border border-red-200';
            case 'adjustment':
                return 'bg-blue-100 text-blue-700 border border-blue-200';
            case 'transfer':
                return 'bg-purple-100 text-purple-700 border border-purple-200';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-200';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-3xl font-bold text-transparent">Beranda</h2>
                        <p className="mt-1 text-gray-600">Selamat datang kembali! Lihat apa yang terjadi pada inventori anda..</p>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* ========== Stats Cards ========== */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.name}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${stat.gradient}`}
                        >
                            <div className="absolute inset-0 bg-white/10" />
                            <div className="relative p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="mb-1 text-sm font-medium text-white/80">{stat.name}</p>
                                        <p className="mb-2 text-3xl font-bold text-white">{stat.value.toLocaleString()}</p>
                                        <p className="text-xs text-white/70">{stat.subtitle}</p>
                                    </div>
                                    <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center">
                                    {stat.changeType === 'increase' ? (
                                        <svg
                                            className="mr-1 h-4 w-4 text-white/80"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="mr-1 h-4 w-4 text-white/80"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12l-5-5L4 17" />
                                        </svg>
                                    )}
                                    <span className="text-sm font-medium text-white/80">{stat.change}</span>
                                    <span className="ml-1 text-sm text-white/60">vs bulan lalu</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ========== Recent Movements & Top Warehouses ========== */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* ---- Recent Movements (up to 5 items) ---- */}
                    <div className="rounded-2xl border border-white/20 bg-white/90 p-6 shadow-lg backdrop-blur-sm lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">Gerakan Terbaru</h3>
                        </div>

                        <div className="space-y-4">
                            {recent_movements.length > 0 ? (
                                recent_movements.slice(0, 5).map((movement) => (
                                    <div
                                        key={movement.id}
                                        className="flex items-center justify-between rounded-xl bg-gray-50/50 p-3 transition-colors duration-200 hover:bg-gray-100/50"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span
                                                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${getMovementTypeColor(movement.type)}`}
                                            >
                                                {movement.type.toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="max-w-32 truncate text-sm font-semibold text-gray-900">{movement.product?.name}</p>
                                                <p className="max-w-32 truncate text-xs text-gray-500">{movement.location?.warehouse?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                {movement.type === 'out' ? '-' : '+'}
                                                {movement.quantity}
                                            </p>
                                            <p className="text-xs text-gray-400">{new Date(movement.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                                        <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">No recent movements</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ---- Top Warehouses (up to 4) ---- */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/20 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800">Gudang Teratas</h3>
                            </div>
                            <div className="space-y-4">
                                {stock_by_warehouse.length > 0 ? (
                                    stock_by_warehouse.slice(0, 4).map((warehouse, index) => (
                                        <div
                                            key={warehouse.name}
                                            className={`flex items-center justify-between rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 p-3 transition-all duration-200 hover:from-purple-100 hover:to-pink-100`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white ${
                                                        index === 0
                                                            ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                                                            : index === 1
                                                                ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                                                : index === 2
                                                                    ? 'bg-gradient-to-r from-orange-400 to-red-400'
                                                                    : 'bg-gradient-to-r from-purple-400 to-pink-400'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="max-w-32 truncate text-sm font-semibold text-gray-900">{warehouse.name}</p>
                                                    <p className="text-xs text-gray-500">{warehouse.total_items.toLocaleString()} items</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-purple-700">Rp {warehouse.total_value.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                            <BuildingStorefrontIcon className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <p className="text-sm text-gray-500">No warehouse data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========== (Removed all “Charts” & “Performance Metrics” sections) ========== */}
            </div>
        </AuthenticatedLayout>
    );
}
