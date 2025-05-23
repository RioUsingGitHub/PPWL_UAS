import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Role, User } from '@/types';
import { Dialog, Transition } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import React, { Fragment, useState } from 'react';

interface UsersIndexProps extends PageProps {
    users: {
        data: User[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    roles: Role[];
    filters: { search?: string; role?: string };
}

export default function UsersIndex({ users, roles, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const createForm = useForm<{ name: string; email: string; password: string; password_confirmation: string; phone: string; roles: string[] }>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        phone: '',
        roles: [],
    });

    const editForm = useForm<{
        id: number;
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        phone: string;
        is_active: boolean;
        roles: string[];
    }>({ id: 0, name: '', email: '', password: '', password_confirmation: '', phone: '', is_active: true, roles: [] });

    const openCreate = () => setIsCreateOpen(true);
    const closeCreate = () => {
        createForm.reset();
        setIsCreateOpen(false);
    };

    const openEdit = (user: User) => {
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

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/users', { onSuccess: closeCreate });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Use editForm.put() instead of router.post()
        editForm.put(`/users/${editForm.data.id}`, { 
            onSuccess: () => {
                closeEdit();
                // Optional: Add success message
            },
            onError: (errors) => {
                console.log('Edit errors:', errors);
                // Errors will be automatically set on editForm.errors
            }
        });
    };

    const handleDelete = (user: User) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        router.delete(`/users/${user.id}`, { preserveScroll: true });
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (roleFilter) params.append('role', roleFilter);
        window.location.href = `/users?${params.toString()}`;
    };

    const debugFormData = () => {
        console.log('Edit form data:', editForm.data);
        console.log('Form errors:', editForm.errors);
        console.log('Form processing:', editForm.processing);
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">User Management</h2>}>
            <Head title="Users" />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between px-4 py-4 bg-white shadow sm:rounded-xl">
                    <form onSubmit={handleFilter} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input px-4 py-2 border-gray-300 rounded-md shadow-sm focus:border-blue-500 border-1 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-select appearance-none bg-white border-1 border-gray-300 text-black px-4 py-2 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
                            <option value="">All Roles</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.name}>
                                    {r.name}
                                </option>
                            ))}
                        </select>
                        <button type="submit" className="btn btn-primary bg-green-500 text-white px-4 py-2 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:scale-105 transition-transform duration-200">
                            Filter
                        </button>
                    </form>
                    <button onClick={openCreate} className="btn btn-secondary bg-blue-500 text-white px-4 py-2 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:scale-105 transition-transform duration-200">
                        Create User
                    </button>
                </div>

                <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Name', 'Email', 'Roles', 'Status', 'Actions'].map((label) => (
                                    <th key={label} className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {users.data.map((user) => (
                                <tr key={user.id} className={user.is_active ? '' : 'opacity-50'}>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.roles.map((r) => r.name).join(', ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{user.is_active ? 'Active' : 'Inactive'}</td>
                                    <td className="space-x-2 px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => openEdit(user)} className="btn btn-sm btn-secondary px-2 py-1  bg-amber-200 text-gray-800 border-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:scale-105 transition-transform duration-200">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(user)} className="btn btn-sm btn-danger px-2 py-1 bg-red-500 text-white border-1 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 hover:scale-105 transition-transform duration-200">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center space-x-1">
                    {users.links.map((link, i) => (
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
                                        <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">Create User</Dialog.Title>
                                        <form onSubmit={handleCreate} className="mt-4 space-y-4">
                                            <input
                                                placeholder="Name"
                                                value={createForm.data.name}
                                                onChange={(e) => createForm.setData('name', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            {createForm.errors.name && <div className="text-red-600">{createForm.errors.name}</div>}
                                            <input
                                                placeholder="Email"
                                                value={createForm.data.email}
                                                onChange={(e) => createForm.setData('email', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            {createForm.errors.email && <div className="text-red-600">{createForm.errors.email}</div>}
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                value={createForm.data.password}
                                                onChange={(e) => createForm.setData('password', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            {createForm.errors.password && <div className="text-red-600">{createForm.errors.password}</div>}
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={createForm.data.password_confirmation}
                                                onChange={(e) => createForm.setData('password_confirmation', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            <input
                                                placeholder="Phone"
                                                value={createForm.data.phone}
                                                onChange={(e) => createForm.setData('phone', e.target.value)}
                                                className="form-input w-full"
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
                                                className="form-select w-full"
                                            >
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.name}>
                                                        {r.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="mt-4 flex justify-end space-x-2">
                                                <button type="button" onClick={closeCreate} className="btn btn-secondary">
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

                {/* Edit Modal (similar to Create) */}
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
                                        <Dialog.Title className="text-lg leading-6 font-medium text-gray-900">Edit User</Dialog.Title>
                                        <form onSubmit={handleEdit} className="mt-4 space-y-4">
                                            {/* Add a debug button (remove in production) */}
                                            <button type="button" onClick={debugFormData} className="btn btn-sm btn-info">
                                                Debug Form
                                            </button>
                                            
                                            {/* Show general errors */}
                                            {Object.keys(editForm.errors).length > 0 && (
                                                <div className="bg-red-50 border border-red-200 rounded p-3">
                                                    <h4 className="text-red-800 font-medium">Please fix the following errors:</h4>
                                                    <ul className="text-red-600 text-sm mt-1">
                                                        {Object.entries(editForm.errors).map(([field, message]) => (
                                                            <li key={field}>• {field}: {message}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            <input
                                                placeholder="Name"
                                                value={editForm.data.name}
                                                onChange={(e) => editForm.setData('name', e.target.value)}
                                                className={`form-input w-full ${editForm.errors.name ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            {editForm.errors.name && <div className="text-red-600 text-sm">{editForm.errors.name}</div>}
                                            
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={editForm.data.email}
                                                onChange={(e) => editForm.setData('email', e.target.value)}
                                                className={`form-input w-full ${editForm.errors.email ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            {editForm.errors.email && <div className="text-red-600 text-sm">{editForm.errors.email}</div>}
                                            
                                            <input
                                                type="password"
                                                placeholder="New Password (leave blank to keep current)"
                                                value={editForm.data.password}
                                                onChange={(e) => editForm.setData('password', e.target.value)}
                                                className={`form-input w-full ${editForm.errors.password ? 'border-red-500' : ''}`}
                                            />
                                            {editForm.errors.password && <div className="text-red-600 text-sm">{editForm.errors.password}</div>}
                                            
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                value={editForm.data.password_confirmation}
                                                onChange={(e) => editForm.setData('password_confirmation', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            
                                            <input
                                                placeholder="Phone"
                                                value={editForm.data.phone}
                                                onChange={(e) => editForm.setData('phone', e.target.value)}
                                                className="form-input w-full"
                                            />
                                            
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.data.is_active}
                                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                                />
                                                <span>Active</span>
                                            </label>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles:</label>
                                                <select
                                                    multiple
                                                    value={editForm.data.roles}
                                                    onChange={(e) =>
                                                        editForm.setData(
                                                            'roles',
                                                            Array.from(e.target.selectedOptions).map((opt) => opt.value),
                                                        )
                                                    }
                                                    className="form-select w-full h-32"
                                                    size={roles.length}
                                                >
                                                    {roles.map((r) => (
                                                        <option key={r.id} value={r.name}>
                                                            {r.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple roles</p>
                                            </div>
                                            
                                            <div className="mt-4 flex justify-end space-x-2">
                                                <button 
                                                    type="button" 
                                                    onClick={closeEdit} 
                                                    className="btn btn-secondary"
                                                    disabled={editForm.processing}
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-primary" 
                                                    disabled={editForm.processing}
                                                >
                                                    {editForm.processing ? 'Saving...' : 'Save'}
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
