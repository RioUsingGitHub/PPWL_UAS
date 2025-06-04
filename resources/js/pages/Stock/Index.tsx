import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useMemo, useState } from 'react';
import { StockItem, Warehouse, Location } from '@/types';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}
interface StockIndexProps {
    stock_items: {
        data: StockItem[];
        links: PaginationLink[];
    };
    warehouses: {
        data: Warehouse[];
        links: PaginationLink[];
    };
    locations: {
        data: Location[];
        links: PaginationLink[];
    };
    filters: {
        search?: string;
        warehouse_id?: string;
        low_stock?: string;
        expired?: string;
    };
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StockIndex({ stock_items, warehouses, locations, filters }: StockIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [lowStock, setLowStock] = useState(!!filters.low_stock);
    const [expired, setExpired] = useState(!!filters.expired);

    const allWarehouses = warehouses.data || [];
    const allLocations = allWarehouses.flatMap(w => w.locations || []);

    console.log('allWarehouses', allWarehouses);
    console.log('allLocations', allLocations);

    // Per-row adjustment modal
    const [adjustWarehouseId, setAdjustWarehouseId] = useState<number>(0);
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<StockItem | null>(null);
    const adjustForm = useForm<{
        product_id: number;
        location_id?: number;
        type: 'in' | 'out' | 'adjustment';
        quantity: number;
        notes: string;
        reference_number: string;
    }>({
        product_id: 0,
        location_id: 0,
        type: 'adjustment',
        quantity: 1,
        notes: '',
        reference_number: '',
    });

    const openAdjust = (item: StockItem) => {
        setCurrentItem(item);
        setAdjustWarehouseId(item.location?.warehouse?.id ?? 0);
        adjustForm.setData({
            product_id: item.product_id,
            location_id: item.location?.id ?? 0,
            type: 'adjustment',
            quantity: 1,
            notes: '',
            reference_number: '',
        });
        setIsAdjustOpen(true);
    };

    const closeAdjust = () => {
        adjustForm.reset();
        setCurrentItem(null);
        setIsAdjustOpen(false);
    };
    const handleAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        adjustForm.post('/stock/adjustment', { onSuccess: closeAdjust });
    };

    const handleDelete = (item: StockItem) => {
        if (!confirm('Delete this stock item?')) return;
        router.delete(`/stock/${item.id}`, { preserveScroll: true });
    };

    // Bulk Adjustment Modal State
    const [showBulk, setShowBulk] = useState(false);
    const [bulkSearch, setBulkSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkType, setBulkType] = useState<'in' | 'out' | 'adjustment'>('adjustment');
    const [bulkQuantity, setBulkQuantity] = useState('');
    const [bulkNotes, setBulkNotes] = useState('');
    const [bulkReference, setBulkReference] = useState('');
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    const filteredBulkStock = useMemo((): StockItem[] => {
        if (!bulkSearch) return stock_items.data;
        return stock_items.data.filter(
            (item: StockItem) =>
                item.product?.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
                item.product?.sku.toLowerCase().includes(bulkSearch.toLowerCase()),
        );
    }, [bulkSearch, stock_items.data]);

    const handleCheck = (id: number, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((sid) => sid !== id)));
    };

    const handleCheckAll = (checked: boolean) => {
        setSelectedIds(checked ? filteredBulkStock.map((item: StockItem) => item.id) : []);
    };

    const handleBulkAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        setBulkError(null);
        if (selectedIds.length === 0) {
            setBulkError('Pilih minimal satu stock item!');
            return;
        }
        if (!bulkQuantity || isNaN(Number(bulkQuantity)) || Number(bulkQuantity) < 1) {
            setBulkError('Jumlah penyesuaian harus diisi dan lebih dari 0!');
            return;
        }
        setBulkProcessing(true);
        for (const id of selectedIds) {
            const item = stock_items.data.find((i) => i.id === id);
            if (!item) continue;
            await router.post(
                '/stock/adjustment',
                {
                    product_id: item.product?.id ?? 0,
                    location_id: item.location?.id ?? 0,
                    type: bulkType,
                    quantity: Number(bulkQuantity),
                    notes: bulkNotes,
                    reference_number: bulkReference,
                },
                { preserveScroll: true, preserveState: true },
            );
        }
        setBulkProcessing(false);
        setShowBulk(false);
        setSelectedIds([]);
        setBulkType('adjustment');
        setBulkQuantity('');
        setBulkNotes('');
        setBulkReference('');
    };

    // Modal View
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewItem, setViewItem] = useState<StockItem | null>(null);

    const openView = (item: StockItem) => {
        setViewItem(item);
        setIsViewOpen(true);
    };
    const closeView = () => {
        setViewItem(null);
        setIsViewOpen(false);
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

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Stock Management
                </h2>
            }
        >
            <Head title="Stocks" />
            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                {/* Filter Bar Container */}
                <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between bg-white px-4 py-4 shadow rounded-xl">
                    
                    {/* Form Pencarian & Filter */}
                    <form
                        onSubmit={handleFilter}
                        className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2 w-full min-w-0"
                    >
                    {/* Input teks “Cari Produk/SKU…” */}
                    <input
                        type="text"
                        placeholder="Cari Produk/SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full md:w-auto min-w-0 rounded-md border border-gray-300 px-4 py-2 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />

                    {/* Dropdown “Semua Gudang” */}
                    <select
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        className="w-full md:w-auto min-w-0 max-w-full rounded-md border border-gray-300 bg-white px-4 py-2 shadow-sm"
                    >
                        <option value="">Semua Gudang</option>
                        {warehouses?.data?.map((w: Warehouse) => (
                        <option key={w.id} value={w.id}>
                            {w.name}
                        </option>
                        ))}
                    </select>

                    {/* Checkbox “Stok Rendah” */}
                    <label className="flex items-center space-x-1 rounded-md bg-yellow-50 px-3 py-2 w-full md:w-auto">
                        <input
                        type="checkbox"
                        checked={lowStock}
                        onChange={(e) => setLowStock(e.target.checked)}
                    />
                        <span className="text-sm text-yellow-800">Stok Rendah</span>
                    </label>

                    {/* Checkbox “Kadaluarsa” */}
                    <label className="flex items-center space-x-1 rounded-md bg-red-50 px-3 py-2 w-full md:w-auto">
                        <input
                        type="checkbox"
                        checked={expired}
                        onChange={(e) => setExpired(e.target.checked)}
                    />
                        <span className="text-sm text-blue-800">Kadaluarsa</span>
                    </label>

                    {/* Tombol “Cari” */}
                    <button
                        type="submit"
                        className="btn btn-primary w-full md:w-auto min-w-0 rounded-md bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 font-semibold px-4 py-2 text-white shadow-sm transition-transform duration-200 hover:scale-105"
                    >
                        Search
                    </button>
                    </form>

                    {/* Tombol “Penyesuaian Massal” */}
                    <button
                        type="button"
                        onClick={() => setShowBulk(true)}
                        className="btn btn-secondary mt-2 w-full md:mt-0 md:ml-4 md:w-auto rounded-md bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-500 font-semibold px-4 py-2 text-white shadow-sm transition-transform duration-200 hover:scale-105"
                    >
                        Bulk Adjust
                    </button>
                </div>

                {/* TABEL STOCK */}
                <div className="overflow-x-auto bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                            <tr>
                                {['Produk', 'SKU', 'Gudang', 'Lokasi', 'Kelompok', 'Jumlah', 'Unit', 'Harga', 'Tanggal Kadaluarsa', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-6 py-3 text-left text-xs font-bold tracking-wider text-blue-700 uppercase">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {stock_items.data.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                                        Tidak ada stok barang yang ditemukan.
                                    </td>
                                </tr>
                            )}
                            {stock_items.data.map((item: StockItem) => (
                                <tr key={item.id} className={item.is_expired ? 'opacity-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.product?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.product?.sku ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.location?.warehouse?.name ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.location?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.batch_number ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.product?.unit ?? '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.unit_cost !== null
                                        ? Number(item.unit_cost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                                        : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.expiry_date ?? 'Tidak ada data')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                    {item.is_expired ? (
                                        <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">Kadaluarsa</span>
                                    ) : item.is_near_expiry ? (
                                        <span className="rounded bg-yellow-500 px-2 py-1 text-xs text-white">Hampir Kadaluwarsa</span>
                                    ) : (
                                        <span className="rounded bg-green-100 px-2 py-1 text-xs flex items-center justify-center text-green-800">OK</span>
                                    )}
                                    </td>
                                    <td className="space-x-2 px-6 py-4 text-center whitespace-nowrap">
                                    <button onClick={() => openView(item)} className="btn btn-sm rounded-md bg-indigo-200 px-2 py-1">
                                        View
                                    </button>
                                    <button onClick={() => openAdjust(item)} className="btn btn-sm rounded-md bg-amber-200 px-2 py-1">
                                        Adjust
                                    </button>
                                    <button onClick={() => handleDelete(item)} className="btn btn-sm rounded-md bg-red-500 px-2 py-1 text-white">
                                        Hapus
                                    </button>
                                    </td>
                                </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                <div className="mt-4 flex justify-center space-x-1">
                    {stock_items.links.map((link: PaginationLink, i: number) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`rounded border px-3 py-1 ${link.active ? 'bg-gray-300' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
                
                {/* BULK ADJUSTMENT MODAL*/}
                <Transition appear show={showBulk} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={() => setShowBulk(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="bg-opacity-40 fixed inset-0 bg-black/60" />
                        </Transition.Child>
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="flex w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
                                    {/* LEFT: Data Picker */}
                                    <div className="flex w-1/2 flex-col border-r bg-gray-50 p-6">
                                        <h3 className="mb-2 text-lg font-semibold">Pilih Data Stock</h3>
                                        <input
                                            type="text"
                                            className="form-input mb-2 w-full rounded border border-gray-300 p-2"
                                            placeholder="Cari nama/SKU..."
                                            value={bulkSearch}
                                            onChange={(e) => setBulkSearch(e.target.value)}
                                        />
                                        <div className="mb-2 flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredBulkStock.length && filteredBulkStock.length > 0}
                                                onChange={(e) => handleCheckAll(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Pilih Semua</span>
                                        </div>
                                        <div className="flex-1 overflow-y-scroll rounded border bg-white max-h-80">
                                            {filteredBulkStock.length === 0 && <div className="py-8 text-center text-gray-400">Tidak ada data</div>}
                                            {filteredBulkStock.map((item: StockItem) => (
                                                <label
                                                    key={item.id}
                                                    className="flex cursor-pointer items-center border-b px-2 py-1 hover:bg-gray-100"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={(e) => handleCheck(item.id, e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="flex-1 text-sm">
                                                        <b>{item.product?.name ?? '-'}</b> ({item.product?.sku ?? '-'}) | {item.location?.warehouse?.name} /{' '}
                                                        {item.location?.name ?? '-'}
                                                    </span>
                                                    <span className="ml-2 text-xs text-gray-500">Qty: {item.quantity}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* RIGHT: Bulk Adjust Form */}
                                    <div className="flex w-1/2 flex-col p-6">
                                        <h3 className="mb-4 text-lg font-semibold">Bulk Stock Adjustment</h3>
                                        <form onSubmit={handleBulkAdjust} className="flex flex-1 flex-col gap-3">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Jenis Penyesuaian</label>
                                                <select
                                                    value={bulkType}
                                                    onChange={(e) => setBulkType(e.target.value as any)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="in">Masuk (+)</option>
                                                    <option value="out">Keluar (-)</option>
                                                    <option value="adjustment">Penyesuaian</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Jumlah Penyesuaian</label>
                                                <input
                                                    type="number"
                                                    value={bulkQuantity}
                                                    min={1}
                                                    onChange={(e) => setBulkQuantity(e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">No Referensi (opsional)</label>
                                                <input
                                                    type="text"
                                                    value={bulkReference}
                                                    onChange={(e) => setBulkReference(e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Catatan (opsional)</label>
                                                <textarea
                                                    value={bulkNotes}
                                                    onChange={(e) => setBulkNotes(e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                            {bulkError && <div className="mt-2 text-sm text-red-500">{bulkError}</div>}
                                            <div className="flex-1" />
                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowBulk(false)}
                                                    className="btn rounded bg-gray-200 px-4 py-2"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={bulkProcessing || selectedIds.length === 0}
                                                    className="btn rounded bg-blue-600 px-4 py-2 text-white"
                                                >
                                                    {bulkProcessing ? 'Memproses...' : `Adjust ${selectedIds.length} Data`}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>

                {/* Per-row Adjustment Modal */}
                <Transition appear show={isAdjustOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={closeAdjust}>
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
                                        <Dialog.Title className="mb-4 text-lg font-medium text-gray-900">Sesuaikan Stok</Dialog.Title>
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                adjustForm.post('/stock/adjustment', {
                                                    onSuccess: () => {
                                                        closeAdjust();
                                                        window.location.reload(); // reload data agar tabel berubah
                                                    },
                                                });
                                            }}
                                            className="space-y-4"
                                        >
                                            {/* Produk */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Produk</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={currentItem?.product?.name || ''}
                                                    className="w-full rounded border border-gray-200 bg-gray-100 p-2 text-gray-700"
                                                />
                                            </div>
                                            {/* Gudang */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Gudang</label>
                                                <select
                                                    value={adjustWarehouseId}
                                                    onChange={(e) => {
                                                        setAdjustWarehouseId(Number(e.target.value));
                                                        adjustForm.setData('location_id', 0);
                                                    }}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">Pilih Gudang</option>
                                                    {allWarehouses.map((w) => (
                                                        <option key={w.id} value={w.id}>
                                                            {w.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {/* Lokasi */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Lokasi</label>
                                                <select
                                                    value={adjustForm.data.location_id}
                                                    onChange={(e) => adjustForm.setData('location_id', Number(e.target.value))}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                >
                                                    <option value="">Pilih Lokasi</option>
                                                    {allLocations
                                                        .filter((loc) => loc.warehouse_id === adjustWarehouseId)
                                                        .map((loc) => (
                                                            <option key={loc.id} value={loc.id}>
                                                                {loc.name}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            {/* Jenis Penyesuaian */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Jenis Penyesuaian</label>
                                                <select
                                                    value={adjustForm.data.type}
                                                    onChange={(e) => adjustForm.setData('type', e.target.value as any)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                >
                                                    <option value="in">Masuk</option>
                                                    <option value="out">Keluar</option>
                                                    <option value="adjustment">Sesuaikan</option>
                                                </select>
                                            </div>
                                            {/* Jumlah */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Jumlah</label>
                                                <input
                                                    type="number"
                                                    placeholder="Quantity"
                                                    value={adjustForm.data.quantity}
                                                    onChange={(e) => adjustForm.setData('quantity', parseInt(e.target.value))}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    required
                                                />
                                                {adjustForm.errors.quantity && (
                                                    <div className="mt-1 text-xs text-red-500">{adjustForm.errors.quantity}</div>
                                                )}
                                            </div>
                                            {/* No Referensi */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">No Referensi (opsional)</label>
                                                <input
                                                    placeholder="No Referensi"
                                                    value={adjustForm.data.reference_number}
                                                    onChange={(e) => adjustForm.setData('reference_number', e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                            {/* Catatan */}
                                            <div>
                                                <label className="mb-1 block text-sm font-semibold text-gray-700">Catatan (opsional)</label>
                                                <input
                                                    placeholder="Catatan"
                                                    value={adjustForm.data.notes}
                                                    onChange={(e) => adjustForm.setData('notes', e.target.value)}
                                                    className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                />
                                            </div>
                                            {/* Tombol */}
                                            <div className="mt-6 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={closeAdjust}
                                                    className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300"
                                                    disabled={adjustForm.processing}
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                                                    disabled={adjustForm.processing}
                                                >
                                                    Simpan
                                                </button>
                                            </div>
                                        </form>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition>

                {/* MODAL VIEW DETAIL STOCK */}
                <Transition appear show={isViewOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={closeView}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="bg-opacity-40 fixed inset-0 bg-black/60" />
                        </Transition.Child>
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                                    <Dialog.Title className="mb-4 text-lg font-semibold">Detail Stock</Dialog.Title>
                                    {viewItem && (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-gray-500">Nama Produk</div>
                                                <div className="font-medium">{viewItem.product?.name ?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">SKU</div>
                                                <div className="font-medium">{viewItem.product?.sku?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Gudang</div>
                                                <div className="font-medium">{viewItem.location?.warehouse?.name?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Lokasi</div>
                                                <div className="font-medium">{viewItem.location?.name?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Kelompok</div>
                                                <div className="font-medium">{viewItem.batch_number ?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Jumlah</div>
                                                <div className="font-medium">{viewItem.quantity}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Unit</div>
                                                <div className="font-medium">{viewItem.product?.unit?? '-'}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Harga Unit</div>
                                                <div className="font-medium">
                                                    {viewItem.unit_cost !== null
                                                        ? Number(viewItem.unit_cost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
                                                        : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Tanggal Kadaluarsa</div>
                                                <div className="font-medium">{formatDate(viewItem.expiry_date?? '-')}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Status</div>
                                                <div>
                                                    {viewItem.is_expired ? (
                                                        <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">Kadaluarsa</span>
                                                    ) : viewItem.is_near_expiry ? (
                                                        <span className="rounded bg-yellow-500 px-2 py-1 text-xs text-white">Hampir Kadaluarsa</span>
                                                    ) : (
                                                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">OK</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-6 flex justify-end">
                                        <button onClick={closeView} className="btn rounded bg-gray-200 px-4 py-2">
                                            Tutup
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition>
            </div>
        </AuthenticatedLayout>
    );
}
