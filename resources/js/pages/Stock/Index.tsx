import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { useState, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface Warehouse {
    id: number;
    name: string;
}
interface Product {
    id: number;
    name: string;
    sku: string;
    unit: string;
}
interface Location {
    id: number;
    name: string;
    warehouse: Warehouse;
}
interface StockItem {
    id: number;
    product: Product;
    location: Location;
    quantity: number;
    unit_cost: string | number | null;
    expiry_date: string | null;
    batch_number: string | null;
    is_expired: boolean;
    is_near_expiry: boolean;
    product_id: number;
    location_id: number;
}
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
    warehouses: Warehouse[];
    filters: {
        search?: string;
        warehouse_id?: string;
        low_stock?: string;
        expired?: string;
    };
    products?: Product[];
    locations?: Location[];
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function StockIndex({
    stock_items,
    warehouses,
    filters,
    products = [],
    locations = [],
}: StockIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [warehouseId, setWarehouseId] = useState(filters.warehouse_id || '');
    const [lowStock, setLowStock] = useState(!!filters.low_stock);
    const [expired, setExpired] = useState(!!filters.expired);

    // Per-row adjustment modal
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<StockItem | null>(null);
    const adjustForm = useForm<{
        product_id: number;
        location_id: number;
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
        adjustForm.setData({
            product_id: item.product_id,
            location_id: item.location_id,
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

    // Bulk Adjustment Form (tanpa stock_item_ids)
    const [bulkType, setBulkType] = useState<'in' | 'out' | 'adjustment'>('adjustment');
    const [bulkQuantity, setBulkQuantity] = useState('');
    const [bulkNotes, setBulkNotes] = useState('');
    const [bulkReference, setBulkReference] = useState('');
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);

    // Filtered stock for left panel in bulk adjust
    const filteredBulkStock = useMemo((): StockItem[] => {
        if (!bulkSearch) return stock_items.data;
        return stock_items.data.filter(
            (item: StockItem) =>
                item.product.name.toLowerCase().includes(bulkSearch.toLowerCase()) ||
                item.product.sku.toLowerCase().includes(bulkSearch.toLowerCase())
        );
    }, [bulkSearch, stock_items.data]);

    // Checkbox handler
    const handleCheck = (id: number, checked: boolean) => {
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((sid) => sid !== id)
        );
    };

    // Select all handler
    const handleCheckAll = (checked: boolean) => {
        setSelectedIds(checked ? filteredBulkStock.map((item: StockItem) => item.id) : []);
    };

    // Bulk adjustment submit (loop per item, tanpa stock_item_ids)
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
            const item = stock_items.data.find(i => i.id === id);
            if (!item) continue;
            await router.post('/stock/adjustment', {
                product_id: item.product.id,
                location_id: item.location.id,
                type: bulkType,
                quantity: Number(bulkQuantity),
                notes: bulkNotes,
                reference_number: bulkReference,
            }, { preserveScroll: true, preserveState: true });
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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Manajemen Stok</h2>}>
            <Head title="Stock" />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Filter Bar */}
                <div className="mb-4 flex items-center justify-between px-4 py-4 bg-white shadow sm:rounded-xl">
                    <form onSubmit={handleFilter} className="flex flex-wrap gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Cari Produk/SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input px-4 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            className="form-select bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm"
                        >
                            <option value="">Semua Gudang</option>
                            {warehouses.map((w: Warehouse) => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        <label className="flex items-center space-x-1">
                            <input
                                type="checkbox"
                                checked={lowStock}
                                onChange={(e) => setLowStock(e.target.checked)}
                            />
                            <span>Stok Rendah</span>
                        </label>
                        <label className="flex items-center space-x-1">
                            <input
                                type="checkbox"
                                checked={expired}
                                onChange={(e) => setExpired(e.target.checked)}
                            />
                            <span>Kadaluarsa</span>
                        </label>
                        <button type="submit" className="btn btn-primary bg-green-500 text-white px-4 py-2 rounded-md shadow-sm hover:scale-105 transition-transform duration-200">
                            Filter
                        </button>
                    </form>
                    <button
                        type="button"
                        onClick={() => setShowBulk(true)}
                        className="btn btn-secondary bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm hover:scale-105 transition-transform duration-200"
                    >
                        Penyesuaian Massal
                    </button>
                </div>
                {/* TABEL STOCK */}
                <div className="overflow-x-auto bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gudang</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelompok</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga Unit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Kadaluarsa</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {stock_items.data.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-6 py-4 text-center text-gray-500">Tidak ada stok barang yang ditemukan.</td>
                                </tr>
                            )}
                            {stock_items.data.map((item: StockItem) => (
                                <tr key={item.id} className={item.is_expired ? 'opacity-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.location.warehouse?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.location.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.batch_number ?? '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{item.product.unit}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.unit_cost !== null ? Number(item.unit_cost).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatDate(item.expiry_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {item.is_expired ? (
                                            <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">Kadaluarsa</span>
                                        ) : item.is_near_expiry ? (
                                            <span className="px-2 py-1 rounded bg-yellow-500 text-white text-xs">Hampir Kadaluwarsa</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">OK</span>
                                        )}
                                    </td>
                                    <td className="space-x-2 px-6 py-4 whitespace-nowrap text-center">
                                        <button onClick={() => openAdjust(item)} className="btn btn-sm rounded-md bg-indigo-200 px-2 py-1">
                                            Sesuaikan
                                        </button>
                                        <button
                                            onClick={() => openView(item)}
                                            className="btn btn-sm rounded-md bg-amber-200 px-2 py-1"
                                        >
                                            Lihat
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

                {/* BULK ADJUSTMENT MODAL */}
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
                            <div className="fixed inset-0 bg-black/60 bg-opacity-40" />
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
                                <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl flex overflow-hidden">
                                    {/* LEFT: Data Picker */}
                                    <div className="w-1/2 border-r p-6 bg-gray-50 flex flex-col">
                                        <h3 className="text-lg font-semibold mb-2">Pilih Data Stock</h3>
                                        <input
                                            type="text"
                                            className="form-input w-full mb-2 border border-gray-300 p-2 rounded"
                                            placeholder="Cari nama/SKU..."
                                            value={bulkSearch}
                                            onChange={e => setBulkSearch(e.target.value)}
                                        />
                                        <div className="flex items-center mb-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredBulkStock.length && filteredBulkStock.length > 0}
                                                onChange={e => handleCheckAll(e.target.checked)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Pilih Semua</span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto border rounded bg-white">
                                            {filteredBulkStock.length === 0 && (
                                                <div className="text-gray-400 text-center py-8">Tidak ada data</div>
                                            )}
                                            {filteredBulkStock.map((item: StockItem) => (
                                                <label key={item.id} className="flex items-center px-2 py-1 border-b cursor-pointer hover:bg-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(item.id)}
                                                        onChange={e => handleCheck(item.id, e.target.checked)}
                                                        className="mr-2"
                                                    />
                                                    <span className="flex-1 text-sm">
                                                        <b>{item.product.name}</b> ({item.product.sku}) | {item.location.warehouse?.name} / {item.location.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-2">Qty: {item.quantity}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    {/* RIGHT: Bulk Adjust Form */}
                                    <div className="w-1/2 p-6 flex flex-col">
                                        <h3 className="text-lg font-semibold mb-4">Penyesuaian stok masal</h3>
                                        <form onSubmit={handleBulkAdjust} className="flex flex-col flex-1 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Jenis Penyesuaian</label>
                                                <select
                                                    value={bulkType}
                                                    onChange={e => setBulkType(e.target.value as any)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="in">masuk (+)</option>
                                                    <option value="out">keluar (-)</option>
                                                    <option value="adjustment">Penyesuaian</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Jumlah Penyesuaian</label>
                                                <input
                                                    type="number"
                                                    value={bulkQuantity}
                                                    min={1}
                                                    onChange={e => setBulkQuantity(e.target.value)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Nomer Referensi (opsional)</label>
                                                <input
                                                    type="text"
                                                    value={bulkReference}
                                                    onChange={e => setBulkReference(e.target.value)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
                                                <textarea
                                                    value={bulkNotes}
                                                    onChange={e => setBulkNotes(e.target.value)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            {bulkError && (
                                                <div className="mt-2 text-red-500 text-sm">{bulkError}</div>
                                            )}
                                            <div className="flex-1" />
                                            <div className="flex justify-end gap-2 mt-4">
                                                <button type="button" onClick={() => setShowBulk(false)} className="btn bg-gray-200 px-4 py-2 rounded">
                                                    Batal
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={bulkProcessing || selectedIds.length === 0}
                                                    className="btn bg-blue-600 text-white px-4 py-2 rounded"
                                                >
                                                    {bulkProcessing ? 'Memproses...' : `Sesuaikan ${selectedIds.length} Data`}
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
                    <Dialog as="div" className="relative z-10" onClose={closeAdjust}>
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
                                        <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">Sesuiakan Stok</Dialog.Title>
                                        <form onSubmit={handleAdjust} className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Produk</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={currentItem?.product?.name || ''}
                                                    className="border border-gray-200 p-2 rounded w-full bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Lokasi</label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={currentItem?.location?.name || ''}
                                                    className="border border-gray-200 p-2 rounded w-full bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Jenis Penyesuaian</label>
                                                <select
                                                    value={adjustForm.data.type}
                                                    onChange={(e) => adjustForm.setData('type', e.target.value as any)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="in">masuk</option>
                                                    <option value="out">keluar</option>
                                                    <option value="adjustment">Sesuaikan</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Jumlah</label>
                                                <input
                                                    type="number"
                                                    placeholder="Quantity"
                                                    value={adjustForm.data.quantity}
                                                    onChange={(e) => adjustForm.setData('quantity', parseInt(e.target.value))}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">No Referensi (opsional)</label>
                                                <input
                                                    placeholder="No Referensi"
                                                    value={adjustForm.data.reference_number}
                                                    onChange={(e) => adjustForm.setData('reference_number', e.target.value)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Catatan (opsional)</label>
                                                <input
                                                    placeholder="Catatan"
                                                    value={adjustForm.data.notes}
                                                    onChange={(e) => adjustForm.setData('notes', e.target.value)}
                                                    className="border border-gray-300 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="mt-4 flex justify-end space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={closeAdjust}
                                                    className="btn btn-secondary"
                                                    disabled={adjustForm.processing}
                                                >
                                                    Batal
                                                </button>
                                                <button type="submit" className="btn btn-primary" disabled={adjustForm.processing}>
                                                    Kirim
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
                            <div className="fixed inset-0 bg-black/60 bg-opacity-40" />
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
                                <Dialog.Panel className="w-full max-w-lg bg-white rounded-lg shadow-xl p-6">
                                    <Dialog.Title className="text-lg font-semibold mb-4">
                                        Detail Stock
                                    </Dialog.Title>
                                    {viewItem && (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="text-xs text-gray-500">Nama Produk</div>
                                                <div className="font-medium">{viewItem.product.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">SKU</div>
                                                <div className="font-medium">{viewItem.product.sku}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Gudang</div>
                                                <div className="font-medium">{viewItem.location.warehouse?.name}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Lokasi</div>
                                                <div className="font-medium">{viewItem.location.name}</div>
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
                                                <div className="font-medium">{viewItem.product.unit}</div>
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
                                                <div className="font-medium">{formatDate(viewItem.expiry_date)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500">Status</div>
                                                <div>
                                                    {viewItem.is_expired ? (
                                                        <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">Kadaluarsa</span>
                                                    ) : viewItem.is_near_expiry ? (
                                                        <span className="px-2 py-1 rounded bg-yellow-500 text-white text-xs">Hampir Kadaluarsa</span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">OK</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={closeView}
                                            className="btn bg-gray-200 px-4 py-2 rounded"
                                        >
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
