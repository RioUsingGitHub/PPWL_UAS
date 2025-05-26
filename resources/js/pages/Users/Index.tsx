import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Role, User } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState } from 'react';

export default function UsersIndex({ users, roles, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        roles: [],
    });

    const editForm = useForm({
        id: 0,
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        is_active: true,
        roles: [],
    });

    const openCreate = () => setIsCreateOpen(true);
    const closeCreate = () => {
        createForm.reset();
        setIsCreateOpen(false);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        editForm.setData({
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            phone: user.phone || '',
            is_active: user.is_active,
            roles: user.roles.map((r) => r.name),
        });
        setIsEditOpen(true);
    };

    const closeEdit = () => {
        editForm.reset();
        setIsEditOpen(false);
        setEditingUser(null);
    };

    const handleCreate = (e) => {
        e.preventDefault();
        createForm.post('/users', { onSuccess: closeCreate });
    };

    const handleEdit = (e) => {
        e.preventDefault();
        editForm.put(`/users/${editForm.data.id}`, { onSuccess: closeEdit });
    };

    const handleDelete = (user) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        router.delete(`/users/${user.id}`, { preserveScroll: true });
    };

    const handleFilter = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (roleFilter) params.append('role', roleFilter);
        window.location.href = `/users?${params.toString()}`;
    };

    return (
        <AuthenticatedLayout
            header={
                // BAR USER MANAGEMENT: Tidak diubah, tetap seperti gambar
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    User Management
                </h2>
            }
        >
            <Head title="Users" />

            {/* SOFT PASTEL GRADIENT BACKGROUND */}
            <div            >
                <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">

                    {/* FILTER BAR */}
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
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                            >
                                <option value="">All Roles</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
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
                            Create User
                        </button>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto bg-white/95 shadow-xl sm:rounded-lg border border-blue-50">
                        <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                                <tr>
                                    {['Name', 'Email', 'Roles', 'Status', 'Actions'].map((label) => (
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
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className={user.is_active ? 'hover:bg-blue-50/60 transition' : 'opacity-60 bg-gray-50'}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{user.roles.map((r) => r.name).join(', ')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${user.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="space-x-2 px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="rounded-md bg-yellow-200 text-gray-800 px-3 py-1 font-semibold shadow hover:bg-yellow-300 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="rounded-md bg-red-500 text-white px-3 py-1 font-semibold shadow hover:bg-red-600 transition"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    <div className="mt-4 flex justify-center space-x-1">
                        {users.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded border px-3 py-1 ${link.active ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-white text-gray-700'} hover:bg-blue-50 transition`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>

                    {/* CREATE MODAL */}
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
                                            <Dialog.Title className="text-lg leading-6 font-bold text-blue-700">Create User</Dialog.Title>
                                            <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Name"
                                                    value={createForm.data.name}
                                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    placeholder="Email"
                                                    value={createForm.data.email}
                                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Password"
                                                    value={createForm.data.password}
                                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Confirm Password"
                                                    value={createForm.data.password_confirmation}
                                                    onChange={(e) => createForm.setData('password_confirmation', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    placeholder="Phone"
                                                    value={createForm.data.phone}
                                                    onChange={(e) => createForm.setData('phone', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <select
                                                    multiple
                                                    value={createForm.data.roles}
                                                    onChange={(e) =>
                                                        createForm.setData(
                                                            'roles',
                                                            Array.from(e.target.selectedOptions).map((opt) => opt.value),
                                                        )
                                                    }
                                                    className="form-select w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="mt-4 flex justify-end space-x-2">
                                                    <button type="button" onClick={closeCreate} className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-300 transition">
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600 transition" disabled={createForm.processing}>
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

                    {/* EDIT MODAL */}
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
                                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 p-6 text-left align-middle shadow-xl transition-all border border-blue-100">
                                            <Dialog.Title className="text-lg leading-6 font-bold text-blue-700">Edit User</Dialog.Title>
                                            <form onSubmit={handleEdit} className="mt-4 space-y-4">
                                                <input
                                                    placeholder="Name"
                                                    value={editForm.data.name}
                                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Email"
                                                    value={editForm.data.email}
                                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="New Password (leave blank to keep current)"
                                                    value={editForm.data.password}
                                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    type="password"
                                                    placeholder="Confirm Password"
                                                    value={editForm.data.password_confirmation}
                                                    onChange={(e) => editForm.setData('password_confirmation', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <input
                                                    placeholder="Phone"
                                                    value={editForm.data.phone}
                                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                                    className="form-input w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                                <label className="flex items-center space-x-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.data.is_active}
                                                        onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                                    />
                                                    <span>Active</span>
                                                </label>
                                                <select
                                                    multiple
                                                    value={editForm.data.roles}
                                                    onChange={(e) =>
                                                        editForm.setData(
                                                            'roles',
                                                            Array.from(e.target.selectedOptions).map((opt) => opt.value),
                                                        )
                                                    }
                                                    className="form-select w-full rounded-md border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="mt-4 flex justify-end space-x-2">
                                                    <button type="button" onClick={closeEdit} className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 font-semibold hover:bg-gray-300 transition">
                                                        Cancel
                                                    </button>
                                                    <button type="submit" className="rounded-md bg-blue-500 px-4 py-2 text-white font-semibold hover:bg-blue-600 transition" disabled={editForm.processing}>
                                                        Save
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
