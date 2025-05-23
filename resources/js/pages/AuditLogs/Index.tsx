import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { MovementHistory, PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import React, { useState } from 'react';

interface MovementHistoryIndexProps extends PageProps {
    movements: {
        data: MovementHistory[];
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string };
}

export default function MovementHistoryIndex({ movements, filters }: MovementHistoryIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        window.location.href = `/audit-logs?${params.toString()}`;
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        router.delete(`/audit-logs/${id}`, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-gray-800">Movement History</h2>}>
            <Head title="Movement History" />
            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="mb-4 flex items-center justify-between bg-white p-4 shadow sm:rounded-xl">
                    <form onSubmit={handleFilter} className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="Search by product or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="form-input rounded-md border px-4 py-2"
                        />
                        <button type="submit" className="btn btn-primary rounded-md bg-green-500 px-4 py-2 text-white">
                            Search
                        </button>
                    </form>
                </div>

                <div className="overflow-scroll bg-white shadow sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Date', 'Product', 'Location', 'User', 'Type', 'Qty', 'Prev Qty', 'New Qty', 'Ref', 'Notes', 'Actions'].map(
                                    (col) => (
                                        <th key={col} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                            {col}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {movements.data.map((entry) => (
                                <tr key={entry.id}>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                        {entry.product?.sku} - {entry.product?.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                                        {entry.location?.warehouse.name} / {entry.location?.name}
                                    </td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.user?.name}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap capitalize">{entry.type}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.quantity}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.previous_quantity}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.new_quantity}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.reference_number || '-'}</td>
                                    <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.notes || '-'}</td>
                                    <td className="space-x-2 px-4 py-2 text-sm whitespace-nowrap">
                                        <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:text-red-800">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex justify-center space-x-1">
                    {movements.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url || '#'}
                            className={`rounded border px-3 py-1 ${link.active ? 'bg-gray-300' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
