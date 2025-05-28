import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Product } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState } from 'react';

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

    // Create Modal state and form
    const [isCreateOpen, setIsCreateOpen] = useState(false);
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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/products', {
            onSuccess: closeCreate,
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

    const handleDelete = (product: Product) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        router.delete(`/products/${product.id}`, { preserveScroll: true });
    };

    const totalStock = (product: Product) => product.stock_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Product Management
                </h2>
            }
        >
            <Head title="Products" />

            {/* Soft pastel gradient background */}
            <div>
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    {/* Filter Bar */}
                    <div className="mb-4 flex flex-col md:flex-row items-center justify-between bg-white/90 px-4 py-4 shadow-lg sm:rounded-xl border border-blue-100">
                        <form onSubmit={handleFilter} className="flex flex-wrap gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                            />

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>

                            <label className="flex items-center space-x-1 bg-blue-50 px-3 py-2 rounded-md">
                                <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="form-checkbox accent-blue-500" />
                                <span className="text-sm text-blue-700">Low Stock</span>
                            </label>

                            <button
                                type="submit"
                                className="rounded-md bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 px-4 py-2 text-white font-semibold shadow-md hover:brightness-110 transition"
                            >
                                Filter
                            </button>
                        </form>

                        <button
                            onClick={openCreate}
                            className="mt-2 md:mt-0 rounded-md bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 px-4 py-2 text-white font-semibold shadow-md hover:brightness-110 transition"
                        >
                            Create Product
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto bg-white/95 shadow-xl sm:rounded-lg border border-blue-50">
                        <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                                <tr>
                                    {['Name', 'SKU', 'Barcode', 'Category', 'Price', 'Stock', 'Min Stock', 'Status', 'Actions'].map((label) => (
                                        <th
                                            key={label}
                                            className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 bg-white/80">
                                {products.data.map((product) => (
                                    <tr
                                        key={product.id}
                                        className={totalStock(product) <= product.min_stock ? 'bg-red-50/80' : 'hover:bg-blue-50/60 transition'}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{product.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{product.sku}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{product.barcode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{product.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-green-700 font-semibold"> Rp {product.price.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-700 font-semibold">{totalStock(product)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-blue-500">{product.min_stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${totalStock(product) <= product.min_stock ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                                {totalStock(product) <= product.min_stock ? 'Low' : 'OK'}
                                            </span>
                                        </td>
                                        <td className="space-x-2 px-6 py-4 whitespace-nowrap">
                                            <Link href={`/products/${product.id}`} className="btn btn-sm rounded-md bg-indigo-100 text-indigo-700 px-2 py-1 hover:bg-indigo-200 transition">
                                                View
                                            </Link>
                                            <Link href={`/products/${product.id}/edit`} className="btn btn-sm rounded-md bg-amber-100 text-amber-700 px-2 py-1 hover:bg-amber-200 transition">
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="btn btn-sm rounded-md bg-red-500 text-white px-2 py-1 hover:bg-red-600 transition"
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
                                className={`rounded border px-3 py-1 ${link.active ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-white text-gray-700'} hover:bg-blue-50 transition`}
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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 p-6 text-left align-middle shadow-xl transition-all border border-blue-100">
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

                                                <select
                                                    value={createForm.data.category}
                                                    onChange={(e) => createForm.setData('category', e.target.value)}
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
                                                        className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-300 transition"
                                                        disabled={createForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600 transition"
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
