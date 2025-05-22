import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

export default function Index() {

    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Stocks
                </h2>
            }
        >
            <Head title="Stocks" />

            
        </AuthenticatedLayout>
    );
}