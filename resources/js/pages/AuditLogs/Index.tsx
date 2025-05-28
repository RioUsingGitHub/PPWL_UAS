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
        if (!confirm('Apakah Anda yakin ingin menghapus Daftar Audit?')) return;
        router.delete(`/audit-logs/${id}`, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                // BAR TIDAK DIUBAH, TETAP SEPERTI GAMBAR
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Daftar Audit
                </h2>
            }
        >
            <Head title="Daftar Audit" />

            {/* SOFT PASTEL GRADIENT BACKGROUND */}
            <div>
                <div className="mx-auto max-w-7xl px-4 py-2">

                    {/* SEARCH BAR */}
                    <div className="mb-4 flex items-center justify-between bg-white/90 p-4 shadow-lg sm:rounded-xl border border-blue-100">
                        <form onSubmit={handleFilter} className="flex w-full max-w-xl space-x-2">
                            <input
                                type="text"
                                placeholder="Cara berdasarkan produk atau pengguna..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 rounded-l-xl border border-gray-200 px-4 py-2 bg-blue-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
                            />
                            <button
                                type="submit"
                                className="rounded-r-xl bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 px-6 py-2 text-white font-bold shadow hover:brightness-110 transition"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto bg-white/95 shadow-xl sm:rounded-lg border border-blue-50">
                        <table className="min-w-full divide-y divide-blue-100">
                            <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                                <tr>
                                    {['Tanggal', 'Produk', 'Lokasi', 'Pengguna', 'Tipe', 'Jumlah', 'Jumlah Sebelumnya', 'Jumlah Baru', 'Referensi', 'Catatan', 'Aksi'].map(
                                        (col) => (
                                            <th
                                                key={col}
                                                className="px-4 py-2 text-left text-xs font-bold text-blue-700 uppercase tracking-wider"
                                            >
                                                {col}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-50 bg-white/80">
                                {movements.data.map((entry, idx) => (
                                    <tr
                                        key={entry.id}
                                        className={idx % 2 === 0 ? 'bg-blue-50/40 hover:bg-cyan-50/80 transition' : 'hover:bg-cyan-50/80 transition'}
                                    >
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">
                                            {entry.product?.sku} - {entry.product?.name}
                                        </td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">
                                            {entry.location
                                                ? entry.location.warehouse
                                                    ? entry.location.warehouse.name
                                                    : 'No warehouse'
                                                : 'No location'}
                                                / {entry.location?.name}
                                        </td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.user?.name}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap capitalize">
                                            <span className={
                                                entry.type === 'in'
                                                    ? 'bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200'
                                                    : entry.type === 'out'
                                                    ? 'bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-200'
                                                    : 'bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-semibold border border-cyan-200'
                                            }>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap font-semibold text-blue-700">{entry.quantity}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.previous_quantity}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.new_quantity}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.reference_number || '-'}</td>
                                        <td className="px-4 py-2 text-sm whitespace-nowrap">{entry.notes || '-'}</td>
                                        <td className="space-x-2 px-4 py-2 text-sm whitespace-nowrap">
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br rounded-lg px-3 py-1 font-semibold shadow transition"
                                            >
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
                        {movements.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded border px-3 py-1 ${link.active ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-white text-gray-700'} hover:bg-blue-50 transition`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
