import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState } from 'react';
import { toast } from 'sonner';
import Barcode from "react-barcode";

interface ProductsIndexProps extends PageProps {
    products: {
        data: Product[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    categories: string[];
    filters: { search?: string; category?: string; low_stock?: boolean };
}

export default function ProductsIndex({ products, categories, filters }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [lowStock, setLowStock] = useState(!!filters.low_stock);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [current, setCurrent] = useState<Product | null>(null);
    const editForm = useForm<{
        name: string;
        description: string;
        sku: string;
        price: number;
        unit: string;
        category: string;
        min_stock: number;
        is_active: boolean;
        image: File | null;
    }>({ name: '', description: '', sku: '', price: 0, unit: '', category: '', min_stock: 0, is_active: true, image: null });

    // Create Modal state and form
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [typed, setTyped] = useState('');
    const createForm = useForm<{
        name: string;
        description: string;
        sku: string;
        price: number;
        unit: string;
        category: string;
        min_stock: number;
        image: File | null;
    }>({
        name: '',
        description: '',
        sku: '',
        price: 0,
        unit: '',
        category: '',
        min_stock: 0,
        image: null,
    });

    const openCreate = () => setIsCreateOpen(true);
    const closeCreate = () => {
        createForm.reset();
        setIsCreateOpen(false);
    };

    const openEdit = (product: Product) => {
        setCurrent(product);
        editForm.setData({
            name: product.name,
            description: product.description || '',
            sku: product.sku,
            price: product.price,
            unit: product.unit,
            category: product.category || '',
            min_stock: product.min_stock,
            is_active: product.is_active,
            image: null,
        });
        setIsEditOpen(true);
        toast.success('Edit form opened for ' + product.name);
    };

    const closeEdit = () => {
        editForm.reset();
        setIsEditOpen(false);
        setCurrent(null);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();

        createForm.post('/products', {
            onSuccess: () => {
                setIsNew(false);
                setTyped('');
                createForm.reset();
                closeCreate();
            },
            onError: (errors) => {
                if (errors.image) {
                    toast.error('Image upload failed: ' + errors.image);
                }
                if (errors.sku) {
                    toast.error('SKU already exists');
                }
                if (errors.category) {
                    toast.error('Category already exists');
                }
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!current) return;
        editForm.put(`/products/${current.id}`, {
        onSuccess: closeEdit,
        onError: (errors) => {
            if (errors.image) {
                toast.error('Image upload failed: ' + errors.image);
            }
            if (errors.sku) {
                toast.error('SKU already exists');
            }
        }
        });
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (lowStock) params.append('low_stock', '1');
        window.location.href = `/products?${params.toString()}`;
    };

    // Modal View
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewItem, setViewItem] = useState<Product | null>(null);

    const openView = (item: Product) => {
        setViewItem(item);
        setIsViewOpen(true);
        toast.success('Viewing details for ' + item.name);
    };
    const closeView = () => {
        setViewItem(null);
        setIsViewOpen(false);
    };

    const handleDelete = (product: Product) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        router.delete(`/products/${product.id}`, { preserveScroll: true });
        toast.success('Product deleted successfully');
    };

    const [isViewBarcodeOpen, setIsViewBarcodeOpen] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState("");

    const totalStock = (product: Product) => product.stock_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="rounded-lg bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 text-2xl leading-tight font-bold text-cyan-700 shadow-lg">
                    Product Management
                </h2>
            }
        >
            <Head title="Products" />

            {/* Soft pastel gradient background */}
            <div>
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="mb-4 flex flex-col items-center justify-between border border-blue-100 bg-white/90 px-4 py-4 shadow-lg sm:rounded-xl md:flex-row">
                        <form onSubmit={handleFilter} className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2 w-full min-w-0">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border border-gray-300 px-4 py-2 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full md:w-auto min-w-0 max-w-full rounded-md border bg-white border-gray-300 px-4 py-2 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>

                            <label className="flex items-center space-x-1 rounded-md bg-blue-50 px-3 py-2 w-full md:w-auto">
                                <input
                                    type="checkbox"
                                    checked={lowStock}
                                    onChange={(e) => setLowStock(e.target.checked)}
                                    className="form-checkbox accent-blue-500"
                                />
                                <span className="text-sm text-blue-700">Low Stock</span>
                            </label>

                            <button
                                type="submit"
                                className="rounded-md bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 px-4 py-2 font-semibold text-white shadow-md transition hover:brightness-110 md:mt-0"
                            >
                                Search
                            </button>
                        </form>

                        <button
                            onClick={openCreate}
                            className="mt-2 w-full md:w-auto min-w-0 rounded-md bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:brightness-110 md:mt-0"
                        >
                            Create Product
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-blue-50 bg-white/95 shadow-xl sm:rounded-lg">
                        <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                                <tr>
                                    {['Gambar','Name', 'SKU', 'Barcode', 'Category', 'Price', 'Stock', 'Min Stock', 'Status', 'Actions'].map((label) => (
                                        <th key={label} className="px-6 py-3 text-left text-xs font-bold tracking-wider text-blue-700 uppercase">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 bg-white/80">
                                {products.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className={totalStock(product) <= product.min_stock ? 'bg-red-50/80' : 'transition hover:bg-blue-50/60'}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <img
                                            src={product.image ? `/storage/${product.image}` : `/storage/fallback.webp`}
                                            alt={product.name}
                                            className="max-w-[50px] max-h-[50px] object-contain rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium whitespace-nowrap text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{product.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            {/* Wrapping barcode text dengan span yang bisa di‐click */}
                                            <span
                                            className="cursor-pointer text-blue-600 hover:underline"
                                            onClick={() => {
                                                setSelectedBarcode(product.barcode);
                                                setIsViewBarcodeOpen(true);
                                            }}
                                            >
                                            {product.barcode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{product.category}</td>
                                        <td className="px-6 py-4 font-semibold whitespace-nowrap text-green-700">{product.price.toLocaleString()}</td>
                                        <td className="px-6 py-4 font-semibold whitespace-nowrap text-blue-700">{totalStock(product)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-500">{product.min_stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold shadow ${totalStock(product) <= product.min_stock ? 'border border-red-200 bg-red-100 text-red-700' : 'border border-green-200 bg-green-100 text-green-700'}`}
                                            >
                                                {totalStock(product) <= product.min_stock ? 'Low' : 'OK'}
                                            </span>
                                        </td>
                                        <td className="space-x-2 px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => openView(product)}
                                                className="btn btn-sm rounded-md bg-indigo-100 px-2 py-1 text-indigo-700 transition hover:bg-indigo-200"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => openEdit(product)}
                                                className="btn btn-sm rounded-md bg-amber-100 px-2 py-1 text-amber-700 transition hover:bg-amber-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="btn btn-sm rounded-md bg-red-500 px-2 py-1 text-white transition hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex justify-center space-x-1">
                        {products.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded border px-3 py-1 ${link.active ? 'bg-blue-100 font-bold text-blue-700' : 'bg-white text-gray-700'} transition hover:bg-blue-50`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>

                    {/* Create Modal */}
                    <Transition appear show={isCreateOpen} as={Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={closeCreate}>
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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-blue-100 bg-white/95 p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title className="text-lg leading-6 font-bold text-blue-700">Create Product</Dialog.Title>
                                            <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Name"
                                                    value={createForm.data.name}
                                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {createForm.errors.name && <div className="text-sm text-red-600">{createForm.errors.name}</div>}

                                                <textarea
                                                    placeholder="Description"
                                                    value={createForm.data.description}
                                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                                    className="form-textarea w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />

                                                <input
                                                    placeholder="SKU"
                                                    value={createForm.data.sku}
                                                    onChange={(e) => createForm.setData('sku', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {createForm.errors.sku && <div className="text-sm text-red-600">{createForm.errors.sku}</div>}

                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={createForm.data.price}
                                                    onChange={(e) => createForm.setData('price', parseFloat(e.target.value))}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {createForm.errors.price && <div className="text-sm text-red-600">{createForm.errors.price}</div>}

                                                <input
                                                    placeholder="Unit"
                                                    value={createForm.data.unit}
                                                    onChange={(e) => createForm.setData('unit', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />

                                                <div>
                                                <label className="block mb-1 font-medium">Category</label>
                                                <select
                                                value={isNew ? '__new__' : createForm.data.category}
                                                onChange={(e) => {
                                                    if (e.target.value === '__new__') {
                                                    setIsNew(true);
                                                    // clear both local and form state
                                                    setTyped('');
                                                    createForm.setData('category', '');
                                                    } else {
                                                    setIsNew(false);
                                                    createForm.setData('category', e.target.value);
                                                    }
                                                }}
                                                className="form-select w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                >
                                                <option value="">— Select Category —</option>
                                                {categories.map((cat) => (
                                                    <option key={cat} value={cat}>
                                                    {cat}
                                                    </option>
                                                ))}
                                                <option value="__new__">— Create New Category —</option>
                                                </select>
                                            </div>

                                            {/* 2) The “new” text input */}
                                            {isNew && (
                                                <div>
                                                <label className="block mb-1 font-medium">New Category</label>
                                                <input
                                                    type="text"
                                                    value={typed}
                                                    onChange={(e) => {
                                                    setTyped(e.target.value);
                                                    createForm.setData('category', e.target.value);
                                                    }}
                                                    placeholder="Enter new category name"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                </div>
                                            )}

                                                <input
                                                    type="number"
                                                    placeholder="Min Stock"
                                                    value={createForm.data.min_stock}
                                                    onChange={(e) => createForm.setData('min_stock', parseInt(e.target.value))}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />

                                                <input
                                                    type="file"
                                                    onChange={(e) => createForm.setData('image', e.target.files?.[0] || null)}
                                                    className="form-input w-full"
                                                />

                                                <div className="mt-4 flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={closeCreate}
                                                        className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
                                                        disabled={createForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600"
                                                        disabled={createForm.processing}
                                                    >
                                                        Create
                                                    </button>
                                                </div>
                                            </form>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    {/* Edit Modal */}
                    <Transition appear show={isEditOpen} as={Fragment}>
                        <Dialog as="div" className="relative z-10" onClose={closeEdit}>
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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-blue-100 bg-white/95 p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title className="text-lg leading-6 font-bold text-blue-700">Edit Product</Dialog.Title>
                                            <form onSubmit={handleEdit} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Name"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {editForm.errors.name && <div className="text-sm text-red-600">{editForm.errors.name}</div>}

                                                <textarea
                                                    placeholder="Description"
                                                    value={editForm.data.description}
                                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                                    className="form-textarea w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />

                                                <input
                                                    placeholder="SKU"
                                                    value={editForm.data.sku}
                                                    onChange={(e) => editForm.setData('sku', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {editForm.errors.sku && <div className="text-sm text-red-600">{editForm.errors.sku}</div>}

                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    value={editForm.data.price}
                                                    onChange={(e) => editForm.setData('price', parseFloat(e.target.value))}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />
                                                {editForm.errors.price && <div className="text-sm text-red-600">{editForm.errors.price}</div>}

                                                <input
                                                    placeholder="Unit"
                                                    value={editForm.data.unit}
                                                    onChange={(e) => editForm.setData('unit', e.target.value)}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />

                                                <select
                                                    value={editForm.data.category}
                                                    onChange={(e) => editForm.setData('category', e.target.value)}
                                                    className="form-select w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat} value={cat}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="number"
                                                    placeholder="Min Stock"
                                                    value={editForm.data.min_stock}
                                                    onChange={(e) => editForm.setData('min_stock', parseInt(e.target.value))}
                                                    className="form-input w-full rounded-md border border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                    required
                                                />

                                                <input
                                                    type="file"
                                                    onChange={(e) => editForm.setData('image', e.target.files?.[0] || null)}
                                                    className="form-input w-full"
                                                />

                                                <div className="mt-4 flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={closeEdit}
                                                        className="rounded-md bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
                                                        disabled={editForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="rounded-md bg-blue-500 px-4 py-2 font-semibold text-white transition hover:bg-blue-600"
                                                        disabled={editForm.processing}
                                                    >
                                                        Update
                                                    </button>
                                                </div>
                                            </form>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

                    {/* MODAL VIEW DETAIL PRODUCT */}
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
                                    <div className="space-y-6">
                                    {/* Bagian gambar, di atas dan terpusat */}
                                    <div className="flex justify-center">
                                        <img
                                        src={viewItem.image ? `/storage/${viewItem.image}` : `/storage/fallback.webp`}
                                        alt={viewItem.name}
                                        className="max-w-[100px] max-h-[100px] object-contain rounded"
                                        />
                                    </div>

                                    {/* Grid dua kolom untuk detail field */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        {/* Nama Produk */}
                                        <div>
                                        <div className="text-xs text-gray-500">Nama Produk</div>
                                        <div className="font-medium">{viewItem.name}</div>
                                        </div>

                                        {/* SKU */}
                                        <div>
                                        <div className="text-xs text-gray-500">SKU</div>
                                        <div className="font-medium">{viewItem.sku}</div>
                                        </div>

                                        {/* Barcode */}
                                        <div>
                                        <div className="text-xs text-gray-500">Barcode</div>
                                        <div className="font-medium">{viewItem.barcode}</div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                        <div className="text-xs text-gray-500">Description</div>
                                        <div className="font-medium">{viewItem.description}</div>
                                        </div>

                                        {/* Price */}
                                        <div>
                                        <div className="text-xs text-gray-500">Price</div>
                                        <div className="font-medium">{viewItem.price ?? '-'}</div>
                                        </div>

                                        {/* Category */}
                                        <div>
                                        <div className="text-xs text-gray-500">Category</div>
                                        <div className="font-medium">{viewItem.category}</div>
                                        </div>

                                        {/* Unit */}
                                        <div>
                                        <div className="text-xs text-gray-500">Unit</div>
                                        <div className="font-medium">{viewItem.unit}</div>
                                        </div>

                                        {/* Total Stock */}
                                        <div>
                                        <div className="text-xs text-gray-500">Total Stock</div>
                                        <div className="font-medium">
                                            {viewItem.total_stock !== null ? totalStock(viewItem) : '-'}
                                        </div>
                                        </div>

                                        {/* Min Stock */}
                                        <div>
                                        <div className="text-xs text-gray-500">Min Stock</div>
                                        <div className="font-medium">{viewItem.min_stock}</div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                        <div className="text-xs text-gray-500">Status</div>
                                        <div>
                                            {totalStock(viewItem) <= viewItem.min_stock ? (
                                            <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">Low</span>
                                            ) : (
                                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">OK</span>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end">
                                    <button onClick={closeView} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    Tutup
                                    </button>
                                </div>
                                </Dialog.Panel>
                            </Transition.Child>
                            </div>
                        </Dialog>
                    </Transition>

                    {/* ========================= */}
                    <Transition appear show={isViewBarcodeOpen} as={Fragment}>
                        <Dialog
                            as="div"
                            className="relative z-50"
                            onClose={() => setIsViewBarcodeOpen(false)}
                        >
                        {/* Backdrop */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/60" />
                        </Transition.Child>

                        {/* Panel */}
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
                            <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                                <Dialog.Title className="mb-4 text-lg font-semibold">
                                Detail Barcode Produk:{" "}
                                <span className="text-indigo-600">{selectedBarcode}</span>
                                </Dialog.Title>

                                {/* Gambar Barcode dengan react-barcode */}
                                <div className="flex flex-col items-center">
                                <Barcode
                                    value={selectedBarcode || ""}
                                    format="CODE128"
                                    width={2}
                                    height={80}
                                    displayValue={true}
                                    textAlign="center"
                                    margin={10}
                                />
                                </div>

                                <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onClick={() => setIsViewBarcodeOpen(false)}
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
            </div>
        </AuthenticatedLayout>
    );
}
