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
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Product Management</h2>}>
            <Head title="Products" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between bg-white px-4 py-4 shadow sm:rounded-xl">
                    <form onSubmit={handleFilter} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500"
                        />

                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-select rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <label className="flex items-center space-x-1">
                            <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} className="form-checkbox" />
                            <span className="text-sm">Low Stock</span>
                        </label>

                        <button
                            type="submit"
                            className="btn btn-primary rounded-md bg-green-500 px-4 py-2 text-white shadow-sm transition-transform duration-200 hover:scale-105"
                        >
                            Filter
                        </button>
                    </form>

                    <button
                        onClick={openCreate}
                        className="btn btn-secondary rounded-md bg-blue-500 px-4 py-2 text-white shadow-sm transition-transform duration-200 hover:scale-105"
                    >
                        Create Product
                    </button>
                </div>

                <div className="overflow-scroll bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Name', 'SKU', 'Barcode', 'Category', 'Price', 'Stock', 'Min Stock', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {products.data.map((product) => (
                                <tr key={product.id} className={totalStock(product) <= product.min_stock ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.barcode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.price.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{totalStock(product)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.min_stock}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{totalStock(product) <= product.min_stock ? 'Low' : 'OK'}</td>
                                    <td className="space-x-2 px-6 py-4 whitespace-nowrap">
                                        <Link href={`/products/${product.id}`} className="btn btn-sm rounded-md bg-indigo-200 px-2 py-1">
                                            View
                                        </Link>
                                        <Link href={`/products/${product.id}/edit`} className="btn btn-sm rounded-md bg-amber-200 px-2 py-1">
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(product)}
                                            className="btn btn-sm rounded-md bg-red-500 px-2 py-1 text-white"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center space-x-1">
                    {products.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`rounded border px-3 py-1 ${link.active ? 'bg-gray-300' : ''}`}
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
                                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                        <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">Create Product</Dialog.Title>
                                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                            <input
                                                placeholder="Name"
                                                value={createForm.data.name}
                                                onChange={(e) => createForm.setData('name', e.target.value)}
                                                className="form-input w-full"
                                                required
                                            />
                                            {createForm.errors.name && <div className="text-sm text-red-600">{createForm.errors.name}</div>}

                                            <textarea
                                                placeholder="Description"
                                                value={createForm.data.description}
                                                onChange={(e) => createForm.setData('description', e.target.value)}
                                                className="form-textarea w-full"
                                            />

                                            <input
                                                placeholder="SKU"
                                                value={createForm.data.sku}
                                                onChange={(e) => createForm.setData('sku', e.target.value)}
                                                className="form-input w-full"
                                                required
                                            />
                                            {createForm.errors.sku && <div className="text-sm text-red-600">{createForm.errors.sku}</div>}

                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={createForm.data.price}
                                                onChange={(e) => createForm.setData('price', parseFloat(e.target.value))}
                                                className="form-input w-full"
                                                required
                                            />
                                            {createForm.errors.price && <div className="text-sm text-red-600">{createForm.errors.price}</div>}

                                            <input
                                                placeholder="Unit"
                                                value={createForm.data.unit}
                                                onChange={(e) => createForm.setData('unit', e.target.value)}
                                                className="form-input w-full"
                                                required
                                            />

                                            <select
                                                value={createForm.data.category}
                                                onChange={(e) => createForm.setData('category', e.target.value)}
                                                className="form-select w-full"
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
                                                className="form-input w-full"
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
                                                    className="btn btn-secondary"
                                                    disabled={createForm.processing}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary" disabled={createForm.processing}>
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
        </AuthenticatedLayout>
    );
}
