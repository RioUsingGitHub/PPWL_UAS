// resources/js/Pages/ScanResultComponent.tsx

import React from 'react';
import { Head } from '@inertiajs/react';

type Warehouse = {
    name: string;
    code: string;
    address: string;
    phone: string;
};

type Location = {
    name: string;
    code: string;
    description: string;
    warehouse: Warehouse;
};

type StockItem = {
    id: number;
    quantity: number;
    unit_cost: string;
    location: Location;
};

type Product = {
    id: number;
    barcode: string;
    name: string;
    description: string;
    sku: string;
    price: string;
    unit: string;
    category: string;
    stock_items: StockItem[];
};

type ScanResultComponentProps = {
    success: boolean;
    message?: string;
    product?: Product;
};

export default function ScanResultComponent({ success, message, product }: ScanResultComponentProps) {
    return (
        <>
        <Head title="Scan Result" />

        <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded-lg mt-10">
            <h1 className="text-2xl font-semibold mb-4">Hasil Scan Produk</h1>

            {!success ? (
            <div className="text-red-600 font-semibold">
                {message ?? 'Produk tidak ditemukan.'}
            </div>
            ) : (
            <>
                <div className="mb-4">
                <p><strong>Nama Produk:</strong> {product?.name}</p>
                <p><strong>Kode Barcode:</strong> {product?.barcode}</p>
                <p><strong>SKU:</strong> {product?.sku}</p>
                <p><strong>Harga:</strong> Rp {product?.price}</p>
                <p><strong>Kategori:</strong> {product?.category}</p>
                <p><strong>Deskripsi:</strong> {product?.description}</p>
                <p><strong>Satuan:</strong> {product?.unit}</p>
                </div>

                <div>
                <h2 className="text-xl font-semibold mb-2">Stok Tersedia:</h2>
                {product?.stock_items?.length ? (
                    <ul className="space-y-3">
                    {product.stock_items.map((stock) => (
                        <li
                        key={stock.id}
                        className="border p-3 rounded-md bg-gray-50"
                        >
                        <p><strong>Lokasi:</strong> {stock.location.name} ({stock.location.code})</p>
                        <p><strong>Gudang:</strong> {stock.location.warehouse.name}</p>
                        <p><strong>Jumlah:</strong> {stock.quantity}</p>
                        <p><strong>Harga Modal:</strong> Rp {stock.unit_cost}</p>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-600">Tidak ada data stok untuk produk ini.</p>
                )}
                </div>
            </>
            )}
        </div>
        </>
    );
}
