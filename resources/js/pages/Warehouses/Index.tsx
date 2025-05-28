import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState, ChangeEvent } from 'react';
import { Warehouse, Location } from '@/types';

interface WarehouseIndexProps {
    warehouses: {
        data: Warehouse[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
    };
}

export default function WarehouseIndex({ warehouses, filters }: WarehouseIndexProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

    const createForm = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
    });

    const editForm = useForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        is_active: true as boolean,
    });

    const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        editForm.setData('is_active', e.target.checked);
    };

    const openCreate = () => setIsCreateOpen(true);
    const closeCreate = () => {
        createForm.reset();
        setIsCreateOpen(false);
    };

    const openEdit = (warehouse: Warehouse) => {
        setSelectedWarehouse(warehouse);
        editForm.setData({
            name: warehouse.name,
            code: warehouse.code,
            address: warehouse.address || '',
            phone: warehouse.phone || '',
            is_active: warehouse.is_active,
        });
        setIsEditOpen(true);
    };

    const closeEdit = () => {
        editForm.reset();
        setSelectedWarehouse(null);
        setIsEditOpen(false);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/warehouses', {
            onSuccess: closeCreate,
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWarehouse) {
            console.error('No warehouse selected');
            return;
        }
        editForm.put(`/warehouses/${selectedWarehouse.id}`, {
            onSuccess: closeEdit,
        });
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        window.location.href = `/warehouses?${params.toString()}`;
    };

    const handleDelete = (warehouse: Warehouse) => {
        if (confirm(`Apakah Anda yakin ingin menghapus warehouse "${warehouse.name}"?`)) {
            router.delete(`/warehouses/${warehouse.id}`);
        }
    };

    // Modal View untuk warehouse
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [viewWarehouse, setViewWarehouse] = useState<Warehouse | null>(null);

    const openView = (warehouse: Warehouse) => {
        setViewWarehouse(warehouse);
        setIsViewOpen(true);
    };
    const closeView = () => {
        setViewWarehouse(null);
        setIsViewOpen(false);
    };

    // Modal location//
    const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    // Fungsi untuk membuka modal edit location dan set data form
    const openEditLocation = (location: Location) => {
        setSelectedLocation(location);
        editLocationForm.setData({
            name: location.name,
            code: location.code,
            description: location.description || '',
            is_active: location.is_active,
        });
        setIsEditLocationOpen(true);
    };

    // Fungsi untuk menutup modal edit location
    const closeEditLocation = () => {
        setSelectedLocation(null);
        editLocationForm.reset();
        setIsEditLocationOpen(false);
    };

    const editLocationForm = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    const openLocationEdit = (location: Location) => {
        setSelectedLocation(location);
        editForm.setData({
            name: location.name,
            code: location.code,
            description: location.description || '',
            is_active: location.is_active,
        });
        setIsEditOpen(true);
    };

    const closeLocationEdit = () => {
        setSelectedLocation(null);
        editForm.reset();
        setIsEditOpen(false);
    };

    const handleLocationCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        editForm.setData('is_active', e.target.checked);
    };

    const handleLocationEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;
        editForm.put(
            `/warehouses/${selectedLocation.warehouse_id}/locations/${selectedLocation.id}`,
            { onSuccess: closeEdit }
        );

        return (
            <AuthenticatedLayout
                header={
                    <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                        Warehouses
                    </h2>
                }
            >
                <Head title="Warehouses" />

                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                    <div className="mb-4 flex items-center justify-between bg-white px-4 py-4 shadow sm:rounded-xl">
                        <form onSubmit={handleFilter} className="flex space-x-2">
                            <input
                                type="text"
                                placeholder="Cari warehouse/kode..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="form-input rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500"
                            />

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Filter
                            </button>
                        </form>

                        <div className="flex space-x-3">
                            <button
                                onClick={openCreate}
                                className="inline-flex items-center justify-center min-w-[140px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Add Warehouse
                            </button>
                            <Link
                                href="/warehouses/locations"
                                className="inline-flex items-center justify-center min-w-[140px] h-[40px] px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium text-sm rounded-md shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                Manage Locations
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-scroll bg-white shadow sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Name', 'Code', 'Address', 'Phone', 'Locations', 'Status', 'Actions'].map((label) => (
                                        <th key={label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {warehouses?.data?.map((warehouse) => (
                                    <tr key={warehouse.id} className={!warehouse.is_active ? 'bg-gray-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold">{warehouse.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono bg-gray-100 rounded">{warehouse.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{warehouse.address || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{warehouse.phone || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                {warehouse.locations_count || 0} locations
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {warehouse.is_active ? (
                                                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Active</span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => openView(warehouse)}
                                                    className="inline-flex items-center justify-center min-w-[60px] h-[32px] px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => openEdit(warehouse)}
                                                    className="inline-flex items-center justify-center min-w-[60px] h-[32px] px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openEditLocation(warehouse)}
                                                    className="inline-flex items-center justify-center min-w-[70px] h-[32px] px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                                                >
                                                    Locations
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(warehouse)}
                                                    className="inline-flex items-center justify-center min-w-[60px] h-[32px] px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex justify-center space-x-1">
                        {warehouses?.links?.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`inline-flex items-center justify-center min-w-[40px] h-[40px] px-3 py-2 text-sm font-medium rounded border transition-colors duration-200 ${link.active
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>

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
                                            <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">
                                                Add New Warehouse
                                            </Dialog.Title>
                                            <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                                <label>Nama Gudang</label>
                                                <input
                                                    placeholder="Warehouse Name"
                                                    value={createForm.data.name}
                                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                                    className="border border-gray-300 p-1   rounded w-full focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-sm"
                                                    required
                                                />
                                                {createForm.errors.name && (
                                                    <div className="text-sm text-red-600">{createForm.errors.name}</div>
                                                )}

                                                <label>Kode Gudang</label>
                                                <input
                                                    placeholder="Warehouse Code"
                                                    value={createForm.data.code}
                                                    onChange={(e) => createForm.setData('code', e.target.value)}
                                                    className="border border-gray-300 p-1 rounded w-full focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-sm"
                                                    required
                                                />
                                                {createForm.errors.code && (
                                                    <div className="text-sm text-red-600">{createForm.errors.code}</div>
                                                )}

                                                <label>Alamat</label>
                                                <textarea
                                                    placeholder="Address"
                                                    value={createForm.data.address}
                                                    onChange={(e) => createForm.setData('address', e.target.value)}
                                                    className="border border-gray-300 p-1 form-textarea w-full rounded-md border-gray-300 placeholder:text-sm"
                                                    rows={3}
                                                />

                                                <label>No Hp</label>
                                                <input
                                                    placeholder="Phone Number"
                                                    value={createForm.data.phone}
                                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                                    className="border border-gray-300 p-1 form-input w-full rounded-md border-gray-300 placeholder:text-sm"
                                                />

                                                <div className="mt-6 flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={closeCreate}
                                                        className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={createForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center justify-center min-w-[120px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={createForm.processing}
                                                    >
                                                        {createForm.processing ? 'Creating...' : 'Create Warehouse'}
                                                    </button>
                                                </div>
                                            </form>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </div>
                        </Dialog>
                    </Transition>

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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">
                                                Edit Warehouse
                                            </Dialog.Title>
                                            <form onSubmit={handleEdit} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Warehouse Name"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border-gray-300"
                                                    required
                                                />
                                                {editForm.errors.name && (
                                                    <div className="text-sm text-red-600">{editForm.errors.name}</div>
                                                )}

                                                <input
                                                    placeholder="Warehouse Code"
                                                    value={editForm.data.code}
                                                    onChange={(e) => editForm.setData('code', e.target.value)}
                                                    className="form-input w-full rounded-md border-gray-300"
                                                    required
                                                />
                                                {editForm.errors.code && (
                                                    <div className="text-sm text-red-600">{editForm.errors.code}</div>
                                                )}

                                                <textarea
                                                    placeholder="Address"
                                                    value={editForm.data.address}
                                                    onChange={(e) => editForm.setData('address', e.target.value)}
                                                    className="form-textarea w-full rounded-md border-gray-300"
                                                    rows={3}
                                                />

                                                <input
                                                    placeholder="Phone Number"
                                                    value={editForm.data.phone}
                                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                                    className="form-input w-full rounded-md border-gray-300"
                                                />

                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.data.is_active}
                                                        onChange={handleCheckboxChange}
                                                        className="form-checkbox"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>

                                                <div className="mt-6 flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={closeEdit}
                                                        className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={editForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center justify-center min-w-[120px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={editForm.processing}
                                                    >
                                                        {editForm.processing ? 'Updating...' : 'Update Warehouse'}
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
                                            Detail Warehouse
                                        </Dialog.Title>
                                        {viewWarehouse && (
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-xs text-gray-500">Nama Produk</div>
                                                    <div className="font-medium">{viewWarehouse.name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Kode Gudang</div>
                                                    <div className="font-medium">{viewWarehouse.code}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Alamat</div>
                                                    <div className="font-medium">{viewWarehouse.address}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">No Hp</div>
                                                    <div className="font-medium">{viewWarehouse.phone}</div>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500">Status</div>
                                                    <div>
                                                        {viewWarehouse.is_active ? (
                                                            <span className="px-2 py-1 rounded bg-red-500 text-white text-xs">Expired</span>
                                                        ) : viewWarehouse.is_active ? (
                                                            <span className="px-2 py-1 rounded bg-yellow-500 text-white text-xs">Near Expiry</span>
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

                    <Transition appear show={isEditLocationOpen} as={Fragment}>
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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                            <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">
                                                Edit Location
                                            </Dialog.Title>
                                            <form onSubmit={handleLocationEdit} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Location Name"
                                                    value={editLocationForm.data.name}
                                                    onChange={(e) => editLocationForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border-gray-300"
                                                    required
                                                />
                                                {editLocationForm.errors.name && (
                                                    <div className="text-sm text-red-600">{editLocationForm.errors.name}</div>
                                                )}

                                                <input
                                                    placeholder="Location Code"
                                                    value={editLocationForm.data.code}
                                                    onChange={(e) => editLocationForm.setData('code', e.target.value)}
                                                    className="form-input w-full rounded-md border-gray-300"
                                                    required
                                                />
                                                {editLocationForm.errors.code && (
                                                    <div className="text-sm text-red-600">{editLocationForm.errors.code}</div>
                                                )}

                                                <textarea
                                                    placeholder="Description"
                                                    value={editLocationForm.data.description}
                                                    onChange={(e) => editLocationForm.setData('description', e.target.value)}
                                                    className="form-textarea w-full rounded-md border-gray-300"
                                                    rows={3}
                                                />

                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editLocationForm.data.is_active}
                                                        onChange={handleCheckboxChange}
                                                        className="form-checkbox"
                                                    />
                                                    <span className="text-sm">Active</span>
                                                </label>

                                                <div className="mt-6 flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={closeEdit}
                                                        className="inline-flex items-center justify-center min-w-[80px] h-[40px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={editLocationForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="inline-flex items-center justify-center min-w-[120px] h-[40px] px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-md transition-colors duration-200"
                                                        disabled={editLocationForm.processing}
                                                    >
                                                        {editLocationForm.processing ? 'Updating...' : 'Update Location'}
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
}
