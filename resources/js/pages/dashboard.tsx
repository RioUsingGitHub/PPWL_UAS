import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { 
    CubeIcon, 
    UserGroupIcon, 
    BuildingStorefrontIcon, 
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard({ 
    stats, 
    recent_movements, 
    stock_by_warehouse 
}) {
    const statCards = [
        {
            name: 'Total Products',
            value: stats.total_products,
            icon: CubeIcon,
            color: 'bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 shadow-blue-200',
            iconBg: 'bg-white/80',
        },
        {
            name: 'Total Users',
            value: stats.total_users,
            icon: UserGroupIcon,
            color: 'bg-gradient-to-br from-green-500 via-emerald-400 to-lime-300 shadow-green-200',
            iconBg: 'bg-white/80',
        },
        {
            name: 'Total Warehouses',
            value: stats.total_warehouses,
            icon: BuildingStorefrontIcon,
            color: 'bg-gradient-to-br from-purple-500 via-fuchsia-400 to-pink-300 shadow-purple-200',
            iconBg: 'bg-white/80',
        },
        {
            name: 'Low Stock Products',
            value: stats.low_stock_products,
            icon: ExclamationTriangleIcon,
            color: 'bg-gradient-to-br from-red-500 via-orange-400 to-yellow-300 shadow-orange-200',
            iconBg: 'bg-white/80',
        },
    ];

    const getMovementTypeColor = (type) => {
        switch (type) {
            case 'in':
                return 'bg-green-100 text-green-700 border border-green-300 shadow-sm';
            case 'out':
                return 'bg-red-100 text-red-600 border border-red-300 shadow-sm';
            case 'adjustment':
                return 'bg-blue-100 text-blue-600 border border-blue-300 shadow-sm';
            case 'transfer':
                return 'bg-purple-100 text-purple-600 border border-purple-300 shadow-sm';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-300 shadow-sm';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            {/* Soft gradient background */}
            <div className="py-2 min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statCards.map((stat) => (
                            <div key={stat.name} className={`overflow-hidden rounded-xl shadow-md hover:scale-105 transition-transform duration-200 ${stat.color}`}>
                                <div className="p-5 flex items-center">
                                    <div className={`flex-shrink-0 rounded-lg p-2 ${stat.iconBg} shadow`}>
                                        <stat.icon className="w-7 h-7 text-blue-700" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-semibold text-white/80 truncate drop-shadow">{stat.name}</dt>
                                            <dd className="text-2xl font-bold text-white drop-shadow">{stat.value.toLocaleString()}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Movements */}
                        <div className="bg-white/90 shadow-lg rounded-xl border border-blue-100">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-bold text-blue-700 mb-4">
                                    Recent Stock Movements
                                </h3>
                                <div className="space-y-4">
                                    {recent_movements.length > 0 ? (
                                        recent_movements.map((movement) => (
                                            <div key={movement.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getMovementTypeColor(movement.type)}`}
                                                    >
                                                        {movement.type.toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {movement.product?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {movement.location?.warehouse?.name} - {movement.location?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {new Date(movement.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">No recent movements</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Stock by Warehouse */}
                        <div className="bg-white/90 shadow-lg rounded-xl border border-purple-100">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-bold text-purple-700 mb-4">
                                    Stock by Warehouse
                                </h3>
                                <div className="space-y-4">
                                    {stock_by_warehouse.length > 0 ? (
                                        stock_by_warehouse.map((warehouse) => (
                                            <div key={warehouse.name} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {warehouse.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {warehouse.total_items.toLocaleString()} items
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-purple-700">
                                                        Rp {warehouse.total_value.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">No warehouse data</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
