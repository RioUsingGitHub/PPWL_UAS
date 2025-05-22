import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, DashboardStats, MovementHistory, StockByWarehouse } from '@/types';
import { 
    CubeIcon, 
    UserGroupIcon, 
    BuildingStorefrontIcon, 
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface DashboardPageProps extends PageProps {
    stats: DashboardStats;
    recent_movements: MovementHistory[];
    stock_by_warehouse: StockByWarehouse[];
}

export default function Dashboard({ 
    stats, 
    recent_movements, 
    stock_by_warehouse 
}: DashboardPageProps) {
    const statCards = [
        {
            name: 'Total Products',
            value: stats.total_products,
            icon: CubeIcon,
            color: 'bg-blue-500',
        },
        {
            name: 'Total Users',
            value: stats.total_users,
            icon: UserGroupIcon,
            color: 'bg-green-500',
        },
        {
            name: 'Total Warehouses',
            value: stats.total_warehouses,
            icon: BuildingStorefrontIcon,
            color: 'bg-purple-500',
        },
        {
            name: 'Low Stock Products',
            value: stats.low_stock_products,
            icon: ExclamationTriangleIcon,
            color: 'bg-red-500',
        },
    ];

    const getMovementTypeColor = (type: string) => {
        switch (type) {
            case 'in':
                return 'bg-green-100 text-green-800';
            case 'out':
                return 'bg-red-100 text-red-800';
            case 'adjustment':
                return 'bg-blue-100 text-blue-800';
            case 'transfer':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {statCards.map((stat) => (
                            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className={`${stat.color} p-3 rounded-md`}>
                                                <stat.icon className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {stat.name}
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {stat.value.toLocaleString()}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Movements */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Recent Stock Movements
                                </h3>
                                <div className="space-y-4">
                                    {recent_movements.length > 0 ? (
                                        recent_movements.map((movement) => (
                                            <div key={movement.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}
                                                    >
                                                        {movement.type.toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {movement.product?.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {movement.location?.warehouse?.name} - {movement.location?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(movement.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No recent movements</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stock by Warehouse */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Stock by Warehouse
                                </h3>
                                <div className="space-y-4">
                                    {stock_by_warehouse.length > 0 ? (
                                        stock_by_warehouse.map((warehouse) => (
                                            <div key={warehouse.name} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {warehouse.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {warehouse.total_items.toLocaleString()} items
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Rp {warehouse.total_value.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No warehouse data</p>
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