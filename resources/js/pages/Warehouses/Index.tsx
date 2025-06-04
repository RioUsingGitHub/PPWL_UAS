import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Location, Warehouse } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { ChangeEvent, Fragment, useState } from 'react';
import { toast } from 'sonner';

interface WarehouseIndexProps {
    warehouses: {
        data: Warehouse[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    locations: {
        data: Location[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        search?: string;
    };
}

export default function WarehouseIndex({ warehouses, locations, filters }: WarehouseIndexProps) {
    const [search, setSearch] = useState(filters?.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
    const [createLocationOpen, setCreateLocationOpen] = useState(false);

    const warehouseList = warehouses.data || []
    const allLocations = warehouseList.flatMap(w => w.locations || [])

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

    // Modal row location Manager //
    const [isLocationManagementOpen, setIsLocationManagementOpen] = useState(false);
    const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const openLocationManagement = (warehouse: Warehouse) => {
        setSelectedWarehouse(warehouse);
        setIsLocationManagementOpen(true);
        setEditingLocationId(null);
        setSelectedLocation(null);
    };

    const startEditingLocation = (location: Location) => {
        setEditingLocationId(location.id);
        setSelectedLocation(location);
        editLocationForm.setData({
            name: location.name,
            code: location.code,
            description: location.description || '',
            is_active: location.is_active,
        });
    };

    const cancelEditingLocation = () => {
        setEditingLocationId(null);
        setSelectedLocation(null);
        editLocationForm.reset();
    };

    const closeLocationManagement = () => {
        setSelectedWarehouse(null);
        setIsLocationManagementOpen(false);
        setEditingLocationId(null);
        setSelectedLocation(null);
        editLocationForm.reset();
    };

    const editLocationForm = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    const handleLocationCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        editLocationForm.setData('is_active', e.target.checked);
    };

    const handleLocationEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLocation) return;
        
        editLocationForm.put(`/warehouses/${selectedLocation.warehouse_id}/locations/${selectedLocation.id}`, { 
            onSuccess: () => {
                cancelEditingLocation();
            }
        });
    };

    // Handle location Manager //
    const [showManage, setShowManage] = useState(false)
    const [selWh, setSelWh]       = useState<Warehouse | null>(null)
    const [assigned, setAssigned] = useState<Location[]>([])
    const [available, setAvailable] = useState<Location[]>([])
    const [toAdd, setToAdd]       = useState<number | null>(null)

    const createNewLocationForm = useForm({
        name: '',
        code: '',
        description: '',
    })

    const openManage = (wh: Warehouse) => {
        setSelWh(wh);

        const assignedLocs = wh.locations || []
        setAssigned(assignedLocs)

        const existingNames   = new Set(assignedLocs.map(l => l.name))
        const uniqueByName = new Map<string, Location>()

        for (const loc of allLocations) {
            if (loc.warehouse_id === wh.id) continue
            if (existingNames.has(loc.name)) continue
            if (!uniqueByName.has(loc.name)) {
            uniqueByName.set(loc.name, loc)
            }
        };

        setAvailable(Array.from(uniqueByName.values()));
        setToAdd(null);
        setShowManage(true);
    };

    const handleRemove = (loc: Location) => {
        if (!selWh) return
        router.delete(
        route('warehouses.locations.destroy', [selWh.id, loc.id]),
        {
            onSuccess: () => {
            setAssigned(a => a.filter(x => x.id !== loc.id))
            setAvailable(a => [...a, loc])
            },
        }
        )
    }

    // reassign existing location into this warehouse
    const handleAdd = () => {
        if (!selWh || toAdd === null) return
        const loc = available.find(x => x.id === toAdd)!
        const suffix = loc.code.split('-').pop()            // “A1”
        const newCode = `${selWh.code}-${suffix}`            // e.g. “WH001-A1”
        router.post(
        route('warehouses.locations.store', [selWh.id, toAdd]),
        {
            name:        loc.name,
            code:        newCode,
            description: loc.description ?? '',
            is_active:   true,
            warehouse_id: selWh.id,
        },
        {
            onSuccess: () => {
                setAssigned(a => [...a, { ...loc, code: newCode, warehouse_id: selWh.id }])
                setAvailable(a => a.filter(x => x.id !== loc.id))
                setToAdd(null)
            },
            onError: (errs: any) => {
                // errs might be { field: string[] } or { field: string }
                const messages = Object.values(errs)
                    .flatMap(v => Array.isArray(v) ? v : [v])
                toast.error(messages.join(' — '))
            },
        }
        )
    }

    const handleCreateNewLocation = (e: React.FormEvent) => {
        e.preventDefault()
        if (!selWh) return

        createNewLocationForm.post(
        route('warehouses.locations.store', selWh.id),
        {
            onSuccess: () => {
                setAssigned(a => [
                    ...a,
                    {
                        id: Date.now() * -1,
                        name: createNewLocationForm.data.name,
                        code: createNewLocationForm.data.code,
                        description: createNewLocationForm.data.description,
                        is_active: true,
                        warehouse_id: selWh.id,
                    } as Location,
                ])
                createNewLocationForm.reset()
            },
            onError: () => {
                toast.error('Failed to create new location. Please try again.');
            },
            preserveScroll: true,
        }
        )
    }

        return (
            <AuthenticatedLayout
                header={
                    <h2 className="rounded-lg bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 text-2xl leading-tight font-bold text-cyan-700 shadow-lg">
                        Warehouses
                    </h2>
                }
            >
                <Head title="Warehouses" />
                <div>
                    <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                        {/* Filter Bar */}
                        <div className="mb-4 flex flex-col items-center justify-between border border-blue-100 bg-white/90 px-4 py-4 shadow-lg sm:rounded-xl md:flex-row">
                            <form onSubmit={handleFilter} className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-2 w-full min-w-0">
                                <input
                                    type="text"
                                    placeholder="Cari warehouse/kode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="rounded-md border border-gray-300 px-4 py-2 shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                />

                                <button
                                    type="submit"
                                    className="rounded-md bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 px-4 py-2 font-semibold text-white shadow-md transition hover:brightness-110 md:mt-0"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex flex-row w-full items-stretch justify-end gap-2 md:flex-row">
                                <button
                                    onClick={openCreate}
                                    className="mt-2 w-full md:w-auto min-w-0 rounded-md bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-500 px-4 py-2 font-semibold text-white shadow-md transition hover:brightness-110 md:mt-0"
                                >
                                    Add Warehouse
                                </button>
                                <button
                                    key={warehouseList[0]?.id}
                                    onClick={() => openManage(warehouseList[0])}
                                    className="mt-2 w-full md:w-auto min-w-0 rounded-md bg-gradient-to-r from-purple-400 via-violet-400 to-purple-400 px-4 py-2 font-semibold text-white shadow-md transition hover:brightness-110 md:mt-0"
                                >
                                    Manage Locations
                                </button>
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
                                            <td className="px-6 py-4 font-semibold whitespace-nowrap">{warehouse.name}</td>
                                            <td className="rounded bg-gray-100 px-6 py-4 font-mono text-sm whitespace-nowrap">{warehouse.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{warehouse.address || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{warehouse.phone || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                                    {warehouse.locations_count ?? 0} locations
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {warehouse.is_active ? (
                                                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Active</span>
                                                ) : (
                                                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">Inactive</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => openView(warehouse)}
                                                        className="inline-flex h-[32px] min-w-[60px] items-center justify-center rounded-md bg-indigo-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => openEdit(warehouse)}
                                                        className="inline-flex h-[32px] min-w-[60px] items-center justify-center rounded-md bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-amber-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:outline-none"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => openLocationManagement(warehouse)} 
                                                        className="inline-flex h-[32px] min-w-[70px] items-center justify-center rounded-md bg-purple-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 focus:outline-none"
                                                    >
                                                        Locations
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(warehouse)}
                                                        className="inline-flex h-[32px] min-w-[60px] items-center justify-center rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white shadow-sm transition-colors duration-200 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
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
                                    className={`inline-flex h-[40px] min-w-[40px] items-center justify-center rounded border px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                                        link.active ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>

                        <Transition appear show={isCreateOpen} as={Fragment}>
                            <Dialog as="div" className="relative z-50" onClose={closeCreate}>
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
                                                <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">Add New Warehouse</Dialog.Title>
                                                <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                                    <label>Nama Gudang</label>
                                                    <input
                                                        placeholder="Warehouse Name"
                                                        value={createForm.data.name}
                                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                                        required
                                                    />
                                                    {createForm.errors.name && <div className="text-sm text-red-600">{createForm.errors.name}</div>}

                                                    <label>Kode Gudang</label>
                                                    <input
                                                        placeholder="Warehouse Code"
                                                        value={createForm.data.code}
                                                        onChange={(e) => createForm.setData('code', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                                        required
                                                    />
                                                    {createForm.errors.code && <div className="text-sm text-red-600">{createForm.errors.code}</div>}

                                                    <label>Alamat</label>
                                                    <textarea
                                                        placeholder="Address"
                                                        value={createForm.data.address}
                                                        onChange={(e) => createForm.setData('address', e.target.value)}
                                                        className="form-textarea w-full rounded-md border border-gray-300 p-1 placeholder:text-sm"
                                                        rows={3}
                                                    />

                                                    <label>No Hp</label>
                                                    <input
                                                        placeholder="Phone Number"
                                                        value={createForm.data.phone}
                                                        onChange={(e) => createForm.setData('phone', e.target.value)}
                                                        className="form-input w-full rounded-md border border-gray-300 p-1 placeholder:text-sm"
                                                    />

                                                    <div className="mt-6 flex justify-end space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={closeCreate}
                                                            className="inline-flex h-[40px] min-w-[80px] items-center justify-center rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-600"
                                                            disabled={createForm.processing}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="inline-flex h-[40px] min-w-[120px] items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-600"
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

                        {/* Modal Create new location*/}
                        <Transition appear show={createLocationOpen} as={Fragment}>
                            <Dialog as="div" className="relative z-50" onClose={() => setCreateLocationOpen(false)}>
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
                                        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                                            <Dialog.Title className="text-lg font-medium mb-4">Buat Lokasi Baru</Dialog.Title>
                                            <form
                                                onSubmit={handleCreateNewLocation}
                                                className="space-y-4"
                                            >
                                                <div>
                                                    <label className="block text-sm mb-1">Nama</label>
                                                    <input
                                                        type="text"
                                                        value={createNewLocationForm.data.name}
                                                        onChange={e => createNewLocationForm.setData('name', e.target.value)}
                                                        className="w-full border px-2 py-1 rounded"
                                                        required
                                                    />
                                                    {createNewLocationForm.errors.name && (
                                                        <div className="text-red-600 text-xs">{createNewLocationForm.errors.name}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm mb-1">Kode</label>
                                                    <input
                                                        type="text"
                                                        value={createNewLocationForm.data.code}
                                                        onChange={e => createNewLocationForm.setData('code', e.target.value)}
                                                        className="w-full border px-2 py-1 rounded"
                                                        required
                                                    />
                                                    {createNewLocationForm.errors.code && (
                                                        <div className="text-red-600 text-xs">{createNewLocationForm.errors.code}</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm mb-1">Deskripsi</label>
                                                    <textarea
                                                        value={createNewLocationForm.data.description}
                                                        onChange={e => createNewLocationForm.setData('description', e.target.value)}
                                                        className="w-full border px-2 py-1 rounded"
                                                        rows={2}
                                                    />
                                                    {createNewLocationForm.errors.description && (
                                                        <div className="text-red-600 text-xs">{createNewLocationForm.errors.description}</div>
                                                    )}
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setCreateLocationOpen(false)}
                                                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                        disabled={createNewLocationForm.processing}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                        disabled={createNewLocationForm.processing}
                                                    >
                                                        {createNewLocationForm.processing ? 'Creating…' : 'Create'}
                                                    </button>
                                                </div>
                                            </form>
                                        </Dialog.Panel>
                                    </Transition.Child>
                                </div>
                            </Dialog>
                        </Transition>

                        {/* MODAL EDIT WAREHOUSE */}
                        <Transition appear show={isEditOpen} as={Fragment}>
                            <Dialog as="div" className="relative z-50" onClose={closeEdit}>
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
                                                <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">Edit Warehouse</Dialog.Title>
                                                <form onSubmit={handleEdit} className="mt-4 space-y-4">
                                                    <label>Nama Gudang</label>
                                                    <input
                                                        placeholder="Warehouse Name"
                                                        value={editForm.data.name}
                                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                                        required
                                                    />
                                                    {editForm.errors.name && <div className="text-sm text-red-600">{editForm.errors.name}</div>}

                                                    <label>Kode Gudang</label>
                                                    <input
                                                        placeholder="Warehouse Code"
                                                        value={editForm.data.code}
                                                        onChange={(e) => editForm.setData('code', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                                        required
                                                    />
                                                    {editForm.errors.code && <div className="text-sm text-red-600">{editForm.errors.code}</div>}

                                                    <label>Alamat</label>
                                                    <textarea
                                                        placeholder="Address"
                                                        value={editForm.data.address}
                                                        onChange={(e) => editForm.setData('address', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                                                        rows={3}
                                                    />

                                                    <label>No Telepon</label>
                                                    <input
                                                        placeholder="Phone Number"
                                                        value={editForm.data.phone}
                                                        onChange={(e) => editForm.setData('phone', e.target.value)}
                                                        className="w-full rounded border border-gray-300 p-1 placeholder:text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
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
                                                            className="inline-flex h-[40px] min-w-[80px] items-center justify-center rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-600"
                                                            disabled={editForm.processing}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="inline-flex h-[40px] min-w-[120px] items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-600"
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
                                            <Dialog.Title className="mb-4 text-lg font-semibold">Detail Warehouse</Dialog.Title>
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
                                                                <span className="rounded bg-red-500 px-2 py-1 text-xs text-white">Expired</span>
                                                            ) : viewWarehouse.is_active ? (
                                                                <span className="rounded bg-yellow-500 px-2 py-1 text-xs text-white">Near Expiry</span>
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

                        {/* Manage Locations Modal */}
                        <Transition appear show={showManage} as={Fragment}>
                            <Dialog
                            as="div"
                            className="relative z-50"
                            onClose={() => setShowManage(false)}
                            >
                            {/* backdrop */}
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 bg-black/40" />
                            </Transition.Child>

                            {/* panel */}
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
                                    {/* Left: warehouse list */}
                                    <div className="w-1/2 border-r p-6 bg-gray-50 flex flex-col">
                                    <h3 className="text-lg font-semibold mb-3">
                                        Pilih Warehouse
                                    </h3>
                                    <ul className="space-y-2 overflow-y-auto">
                                        {warehouseList.map(w => (
                                        <li key={w.id}>
                                            <button
                                            onClick={() => openManage(w)}
                                            className={`w-full text-left px-3 py-2 rounded ${
                                                selWh?.id === w.id
                                                ? 'bg-indigo-200'
                                                : 'hover:bg-gray-100'
                                            }`}
                                            >
                                            {w.name}
                                            </button>
                                        </li>
                                        ))}
                                    </ul>
                                    </div>

                                    {/* Right: assigned & available */}
                                    <div className="w-1/2 p-6 flex flex-col">
                                    <h3 className="text-lg font-semibold mb-4">
                                        Locations for{' '}
                                        <span className="text-indigo-600">
                                        {selWh?.name ?? '-'}
                                        </span>
                                    </h3>

                                    {/* Assigned */}
                                    <div className="flex-1">
                                    <h4 className="font-medium mb-2">Assigned</h4>

                                    <div className="max-h-32 overflow-y-auto border rounded p-1">
                                        {assigned.length > 0 ? (
                                        <ul className="space-y-1">
                                            {assigned.map((loc, idx) => (
                                            <li
                                                key={loc.id}
                                                className="flex justify-between items-center px-2 py-1"
                                            >
                                                <span>#{idx + 1} — {loc.name}</span>
                                                <button
                                                onClick={() => handleRemove(loc)}
                                                className="text-red-600 text-sm hover:underline"
                                                >
                                                Remove
                                                </button>
                                            </li>
                                            ))}
                                        </ul>
                                        ) : (
                                        <p className="text-sm text-gray-500">No locations assigned.</p>
                                        )}
                                    </div>
                                    </div>

                                    {/* Add existing */}
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2">
                                        Add Existing Location
                                        </h4>
                                        <div className="flex space-x-2">
                                        <select
                                            value={toAdd ?? ''}
                                            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                            setToAdd(Number(e.target.value))
                                            }
                                            className="flex-1 border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="" disabled>
                                            -- select a location --
                                            </option>
                                            {available.map(loc => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name} (#{loc.code})
                                            </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleAdd}
                                            disabled={toAdd === null}
                                            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                        </div>
                                    </div>

                                    {/* Create New Location */}
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            onClick={() => setCreateLocationOpen(true)}
                                        >
                                            + Create New Location
                                        </button>
                                    </div>

                                    {/* Close */}
                                    <div className="mt-6 flex justify-end">
                                        <button
                                        onClick={() => setShowManage(false)}
                                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                        >
                                        Close
                                        </button>
                                    </div>
                                    </div>
                                </Dialog.Panel>
                                </Transition.Child>
                            </div>
                            </Dialog>
                        </Transition>

                        {/* MODAL MANAJEMEN LOKASI */}
                        <Transition appear show={isLocationManagementOpen} as={Fragment}>
                            <Dialog as="div" className="relative z-50" onClose={closeLocationManagement}>
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
                                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                                <Dialog.Title className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                                    Manage Locations - {selectedWarehouse?.name}
                                                </Dialog.Title>
                                                
                                                <div className="max-h-96 overflow-y-auto">
                                                    {selectedWarehouse?.locations && selectedWarehouse.locations.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {selectedWarehouse.locations.map((location, idx) => (
                                                                <div key={location.id} className="border rounded-lg p-4 bg-gray-50">
                                                                    {editingLocationId === location.id ? (
                                                                        // Edit form for this specific location
                                                                        <form onSubmit={handleLocationEdit} className="space-y-4">
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div>
                                                                                    <label className=''>Nama Lokasi</label>
                                                                                    <input
                                                                                        placeholder="Location Name"
                                                                                        value={editLocationForm.data.name}
                                                                                        onChange={(e) => editLocationForm.setData('name', e.target.value)}
                                                                                        className="border-1 px-2 py-2 form-input w-full rounded-md border-gray-300"
                                                                                        required
                                                                                    />
                                                                                    {editLocationForm.errors.name && (
                                                                                        <div className="text-sm text-red-600 mt-1">{editLocationForm.errors.name}</div>
                                                                                    )}
                                                                                </div>
                                                                                <div>
                                                                                    <label className=''>Kode Lokasi</label>
                                                                                    <input
                                                                                        placeholder="Location Code"
                                                                                        value={editLocationForm.data.code}
                                                                                        onChange={(e) => editLocationForm.setData('code', e.target.value)}
                                                                                        className="border-1 px-2 py-2 form-input w-full rounded-md border-gray-300"
                                                                                        required
                                                                                    />
                                                                                    {editLocationForm.errors.code && (
                                                                                        <div className="text-sm text-red-600 mt-1">{editLocationForm.errors.code}</div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <label className=''>Deskripsi</label>
                                                                            <textarea
                                                                                placeholder="Description"
                                                                                value={editLocationForm.data.description}
                                                                                onChange={(e) => editLocationForm.setData('description', e.target.value)}
                                                                                className="border-1 px-2 py-2 form-textarea w-full rounded-md border-gray-300"
                                                                                rows={2}
                                                                            />

                                                                            <label className="flex items-center space-x-2">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={editLocationForm.data.is_active}
                                                                                    onChange={handleLocationCheckboxChange}
                                                                                    className="form-checkbox"
                                                                                />
                                                                                <span className="text-sm">Active</span>
                                                                            </label>

                                                                            <div className="flex justify-end space-x-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={cancelEditingLocation}
                                                                                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                                                                                    disabled={editLocationForm.processing}
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                                <button
                                                                                    type="submit"
                                                                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                                                    disabled={editLocationForm.processing}
                                                                                >
                                                                                    {editLocationForm.processing ? 'Saving...' : 'Save'}
                                                                                </button>
                                                                            </div>
                                                                        </form>
                                                                    ) : (
                                                                        // Display mode for location
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <span className="text-sm text-gray-500 pr-2"># {idx + 1}</span>
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <h4 className="font-medium text-gray-900">{location.name}</h4>
                                                                                <p className="text-sm text-gray-600">Code: {location.code}</p>
                                                                                {location.description && (
                                                                                    <p className="text-sm text-gray-500 mt-1">{location.description}</p>
                                                                                )}
                                                                                <div className="mt-2">
                                                                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                                                                        location.is_active 
                                                                                            ? 'bg-green-100 text-green-800' 
                                                                                            : 'bg-red-100 text-red-800'
                                                                                    }`}>
                                                                                        {location.is_active ? 'Active' : 'Inactive'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex space-x-2">
                                                                                <button
                                                                                    onClick={() => startEditingLocation(location)}
                                                                                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                                                                    disabled={editingLocationId !== null}
                                                                                >
                                                                                    Edit
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8 text-gray-500">
                                                            No locations found for this warehouse.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-6 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={closeLocationManagement}
                                                        className="inline-flex h-[40px] min-w-[80px] items-center justify-center rounded-md bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-600"
                                                    >
                                                        Close
                                                    </button>
                                                </div>
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
    };
