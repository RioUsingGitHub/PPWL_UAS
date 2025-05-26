import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

export default function Index() {

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Stocks
                </h2>
            }
        >
            <Head title="Stocks" />

            
        </AuthenticatedLayout>
    );
}