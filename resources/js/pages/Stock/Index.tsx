import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState } from 'react';

interface StockIndexProps {
    stock_items: {
        data: Array<{
            id: number;
            quantity: number;
            unit_cost: number;
            expiry_date?: string;
            batch_number?: string;
            is_expired?: boolean;
            is_near_expiry?: boolean;
            product?: {
                id: number;
                name: string;
                sku: string;
                min_stock: number;
            };
            location?: {
                id: number;
                name: string;
                warehouse?: {
                    id: number;
                    name: string;
                };
            };
        }>;
        links: { url: string | null; label: string; active: boolean }[];
    };
    warehouses: Array<{
        id: number;
        name: string;
    }>;
    filters: { 
        search?: string; 
        warehouse_id?: string; 
        low_stock?: boolean; 
        expired?: boolean; 
    };
}

export default function StockIndex({ stock_items, warehouses, filters }: StockIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [lowStock, setLowStock] = useState(!!filters.low_stock);
    const [expired, setExpired] = useState(!!filters.expired);
    const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
    const adjustmentForm = useForm<{
        product_id: number;
        location_id: number;
        type: string;
        quantity: number;
        notes: string;
        reference_number: string;
    }>({
        product_id: 0,
        location_id: 0,
        type: 'in',
        quantity: 0,
        notes: '',
        reference_number: '',
    });

    const openAdjustment = () => setIsAdjustmentOpen(true);
    const closeAdjustment = () => {
        adjustmentForm.reset();
        setIsAdjustmentOpen(false);
    };

    const handleAdjustment = (e: React.FormEvent) => {
        e.preventDefault();
        adjustmentForm.post('/stock/adjustment', {
            onSuccess: closeAdjustment,
        });
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (warehouseId) params.append('warehouse_id', warehouseId);
        if (lowStock) params.append('low_stock', '1');
        if (expired) params.append('expired', '1');
        window.location.href = `/stock?${params.toString()}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    const getStatusBadge = (item: any) => {
        if (!item.expiry_date) return <span className="text-gray-500">-</span>;
        
        if (item.is_expired) {
            return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Expired</span>;
        }
        
        if (item.is_near_expiry) {
            return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hampir Expired</span>;
        }
        
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">OK</span>;
    };

    const isLowStock = (item: any) => {
        return item.quantity <= (item.product?.min_stock || 0);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Stock Management</h2>}>
            <Head title="Stock" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-5">
                <div className="mb-4 flex items-center justify-between bg-white px-4 py-4 shadow sm:rounded-xl">
                    <form onSubmit={handleFilter} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Cari produk/SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500"
                        />

                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="form-select rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500"
                        >
                            <option value="">Semua Gudang</option>
                            {warehouses?.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>

                        <label className="flex items-center space-x-1">
                            <input 
                                type="checkbox" 
                                checked={lowStock} 
                                onChange={(e) => setLowStock(e.target.checked)} 
                                className="form-checkbox" 
                            />
                            <span className="text-sm">Stok Rendah</span>
                        </label>

                        <label className="flex items-center space-x-1">
                            <input 
                                type="checkbox" 
                                checked={expired} 
                                onChange={(e) => setExpired(e.target.checked)} 
                                className="form-checkbox" 
                            />
                            <span className="text-sm">Kedaluwarsa</span>
                        </label>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Filter
                        </button>
                    </form>

                    <div className="flex space-x-3">
                        <button
                            onClick={openAdjustment}
                            className="inline-flex items-center justify-center min-w-[140px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Stock Adjustment
                        </button>
                        <Link
                            href="/stock/movement-history"
                            className="inline-flex items-center justify-center min-w-[140px] h-[40px] px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                        >
                            Movement History
                        </Link>
                    </div>
                </div>

                <div className="overflow-scroll bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Produk', 'SKU', 'Gudang', 'Lokasi', 'Quantity', 'Unit Cost', 'Batch', 'Expired Date', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {stock_items?.data?.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.product?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.product?.sku || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.location?.warehouse?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.location?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">Rp {item.unit_cost?.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.batch_number || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.is_expired ? (
                                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Expired</span>
                                        ) : item.is_near_expiry ? (
                                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Hampir Expired</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">OK</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <Link 
                                                href={`/stock/${item.id}`} 
                                                className="inline-flex items-center justify-center min-w-[60px] h-[32px] px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    adjustmentForm.setData({
                                                        product_id: item.product?.id || 0,
                                                        location_id: item.location?.id || 0,
                                                        type: 'adjustment',
                                                        quantity: 0,
                                                        notes: '',
                                                        reference_number: '',
                                                    });
                                                    openAdjustment();
                                                }}
                                                className="inline-flex items-center justify-center min-w-[60px] h-[32px] px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                                            >
                                                Adjust
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center space-x-1">
                    {stock_items?.links?.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`inline-flex items-center justify-center min-w-[40px] h-[40px] px-3 py-2 text-sm font-medium rounded border transition-colors duration-200 ${
                                link.active 
                                    ? 'bg-blue-500 text-white border-blue-500' 
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>

                <Transition appear show={isAdjustmentOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-10" onClose={closeAdjustment}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="bg-opacity-25 fixed inset-0 bg-black/60" />
                        </Transition.Child>
                        <div className="fixed inset-0 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4 text-center">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95"
                                    enterTo="opacity-100 scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100"
                                    leaveTo="opacity-0 scale-95"
                                >
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">
                                            Stock Adjustment
                                        </Dialog.Title>
                                        <form onSubmit={handleAdjustment} className="mt-4 space-y-4">
                                            <select
                                                value={adjustmentForm.data.type}
                                                onChange={(e) => adjustmentForm.setData('type', e.target.value)}
                                                className="form-select w-full rounded-md border-gray-300"
                                                required
                                            >
                                                <option value="in">Stock In</option>
                                                <option value="out">Stock Out</option>
                                                <option value="adjustment">Adjustment</option>
                                            </select>

                                            <input
                                                type="number"
                                                placeholder="Quantity"
                                                value={adjustmentForm.data.quantity}
                                                onChange={(e) => adjustmentForm.setData('quantity', parseInt(e.target.value))}
                                                className="form-input w-full rounded-md border-gray-300"
                                                required
                                                min="1"
                                            />

                                            <input
                                                placeholder="Reference Number"
                                                value={adjustmentForm.data.reference_number}
                                                onChange={(e) => adjustmentForm.setData('reference_number', e.target.value)}
                                                className="form-input w-full rounded-md border-gray-300"
                                            />

                                            <textarea
                                                placeholder="Notes"
                                                value={adjustmentForm.data.notes}
                                                onChange={(e) => adjustmentForm.setData('notes', e.target.value)}
                                                className="form-textarea w-full rounded-md border-gray-300"
                                                rows={3}
                                            />

                                            <div className="mt-6 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={closeAdjustment}
                                                    className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                    disabled={adjustmentForm.processing}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="inline-flex items-center justify-center min-w-[120px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md transition-colors duration-200" 
                                                    disabled={adjustmentForm.processing}
                                                >
                                                    {adjustmentForm.processing ? 'Processing...' : 'Save Adjustment'}
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </AuthenticatedLayout>
    );
}
