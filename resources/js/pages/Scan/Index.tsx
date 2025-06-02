import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { CameraIcon, QrCodeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, useForm } from '@inertiajs/react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PageProps, Product } from '@/types';

export default function ScanIndex({ locations }) {
    const [scanning, setScanning] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const videoRef = useRef(null);
    const codeReader = new BrowserMultiFormatReader();

    const [scanResult, setScanResult] = useState<{
        success: boolean;
        message?: string;
        product?: any;
    } | null>(null);

    // State untuk menandakan modal terbuka atau tidak
    const [modalOpen, setModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        barcode: '',
        location_id: '',
        type: 'in',
        quantity: 1,
        notes: '',
        product_id: 0,
    });

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.barcode) return;

        setScanning(true);
        setScanResult(null);
        setModalOpen(false);

        try {
            const response = await fetch('/scan/product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ barcode: data.barcode }),
            });

            if (!response.ok) {
                // Kalau status 404 atau error lain, ambil pesan dari JSON
                const err = await response.json();
                setScanResult({
                    success: false,
                    message: err.message || 'Terjadi kesalahan saat memindai',
                });
            } else {
                const result = await response.json();
                setScanResult(result);
            }
        } catch (error) {
            setScanResult({
                success: false,
                message: 'Gagal terhubung ke server',
            });
        } finally {
            setScanning(false);
            setModalOpen(true);
        }
    };

    const handleBarcodeSubmitViaScanner = async (barcode) => {
        setScanning(true);
        try {
            const response = await fetch('/scan/product', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ barcode }),
            });
            const result = await response.json();
            setScanResult(result);
            if (result.success) setSelectedProduct(result.product ?? null);
        } catch {
            setScanResult({ success: false, message: 'Failed to scan' });
        } finally {
            setScanning(false);
        }
    };

    const startCamera = async () => {
        try {
            setScanning(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (!videoRef.current) return;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            codeReader.decodeFromVideoDevice(null, videoRef.current, (result) => {
                if (result) {
                    const text = result.getText();
                    setScanning(false);
                    codeReader.reset();
                    stream.getTracks().forEach((t) => t.stop());
                    setData('barcode', text);
                    handleBarcodeSubmitViaScanner(text);
                }
            });
        } catch {}
    };

    useEffect(() => {
        return () => {
            codeReader.reset();
            videoRef.current?.srcObject && videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const totalStock = (product: Product) => product.stock_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return (
        <AuthenticatedLayout
            header={
                // BARCODE SCANNER BAR: Tetap seperti gambar, tidak diubah
                <h2 className="rounded-lg bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 text-2xl leading-tight font-bold text-cyan-700 shadow-lg">
                    Barcode Scanner
                </h2>
            }
        >
            <Head title="Scan" />

            {/* SOFT GRADIENT BACKGROUND */}
            <div>
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    {/* CARD CONTAINER */}
                    <div className="overflow-hidden border border-blue-100 bg-white/90 shadow-xl sm:rounded-2xl">
                        <div className="p-8">
                            {/* MANUAL BARCODE INPUT */}
                            <div className="mb-10">
                                <h3 className="mb-5 text-lg font-bold text-blue-700">Enter Barcode Manually</h3>
                                <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="barcode" className="mb-1 block text-sm font-medium text-gray-700">
                                            Barcode
                                        </label>
                                        <div className="mt-1 flex rounded-lg bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100 shadow-sm">
                                            <input
                                                type="text"
                                                id="barcode"
                                                className="flex-1 rounded-l-lg border-none bg-transparent px-4 py-2 text-gray-800 placeholder-gray-400 focus:ring-0"
                                                placeholder="Enter or scan barcode"
                                                value={data.barcode}
                                                onChange={(e) => setData('barcode', e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={scanning || !data.barcode}
                                                className="flex items-center gap-1 rounded-r-lg bg-gradient-to-r from-cyan-400 to-blue-400 px-4 py-2 font-semibold text-white transition hover:brightness-110"
                                            >
                                                <QrCodeIcon className="h-5 w-5" />
                                                {scanning ? 'Scanning...' : 'Scan'}
                                            </button>
                                        </div>
                                        {errors.barcode && <div className="mt-1 text-sm text-red-600">{errors.barcode}</div>}
                                    </div>
                                </form>
                            </div>

                            {/* CAMERA SCANNER */}
                            <div className="mb-10">
                                <h3 className="mb-5 text-lg font-bold text-blue-700">Camera Scanner</h3>
                                <div className="mb-4 flex space-x-4">
                                    <button
                                        onClick={startCamera}
                                        className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-green-300 to-cyan-300 px-4 py-2 font-semibold text-gray-800 shadow transition hover:brightness-110"
                                    >
                                        <CameraIcon className="h-5 w-5" />
                                        Start Camera
                                    </button>
                                    <button
                                        onClick={() => {
                                            codeReader.reset();
                                            setScanning(false);
                                        }}
                                        className="rounded-lg bg-gradient-to-r from-red-200 to-orange-200 px-4 py-2 font-semibold text-gray-800 shadow transition hover:brightness-110"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                                {scanning && (
                                    <video
                                        ref={videoRef}
                                        className="w-full max-w-md rounded-xl border-2 border-cyan-200 shadow-lg"
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                )}
                            </div>

                            {/* ---------- MODAL UNTUK MENAMPILKAN HASIL SCAN ---------- */}
                            {modalOpen && scanResult && (
                                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                                    <div className="mx-4 w-full max-w-lg rounded-lg bg-white shadow-lg">
                                        <div className="flex items-center justify-between border-b px-4 py-2">
                                            <h2 className="text-xl font-semibold">
                                                {scanResult.success ? 'Produk Ditemukan' : 'Produk Tidak Ditemukan'}
                                            </h2>
                                            <button
                                                onClick={() => {
                                                    setModalOpen(false);
                                                    setScanResult(null);
                                                }}
                                                className="text-gray-500 hover:text-gray-800"
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            {!scanResult.success ? (
                                                <p className="text-red-600">{scanResult.message}</p>
                                            ) : (
                                                <>
                                                    <div className="mb-4 space-y-1 text-gray-700">
                                                        <p>
                                                            <strong>Nama Produk:</strong> {scanResult.product.name}
                                                        </p>
                                                        <p>
                                                            <strong>Kode Barcode:</strong> {scanResult.product.barcode}
                                                        </p>
                                                        <p>
                                                            <strong>SKU:</strong> {scanResult.product.sku}
                                                        </p>
                                                        <p>
                                                            <strong>Harga:</strong> Rp {scanResult.product.price}
                                                        </p>
                                                        <p>
                                                            <strong>Kategori:</strong> {scanResult.product.category}
                                                        </p>
                                                        <p>
                                                            <strong>Deskripsi:</strong> {scanResult.product.description}
                                                        </p>
                                                        <p>
                                                            <strong>Satuan:</strong> {scanResult.product.unit}
                                                        </p>
                                                        <p>
                                                            <strong>Stok Saat Ini:</strong> {totalStock(scanResult.product || 0)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <h3 className="mb-2 font-semibold">Detail Stok di Lokasi:</h3>
                                                        {scanResult.product.stock_items.length ? (
                                                            <ul className="max-h-48 space-y-2 overflow-y-auto">
                                                                {scanResult.product.stock_items.map((si: any) => (
                                                                    <li key={si.id} className="rounded-md border bg-gray-50 p-2">
                                                                        <p>
                                                                            <strong>Lokasi:</strong> {si.location.name} ({si.location.code})
                                                                        </p>
                                                                        <p>
                                                                            <strong>Gudang:</strong> {si.location.warehouse.name}
                                                                        </p>
                                                                        <p>
                                                                            <strong>Jumlah:</strong> {si.quantity}
                                                                        </p>
                                                                        <p>
                                                                            <strong>Harga Modal:</strong> Rp {si.unit_cost}
                                                                        </p>
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
                                        <div className="flex justify-end border-t px-4 py-2">
                                            <button
                                                onClick={() => setModalOpen(false)}
                                                className="rounded-md bg-gray-200 px-4 py-2 transition hover:bg-gray-300"
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QUICK TRANSACTION */}
                            {selectedProduct && (
                                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 shadow">
                                    <h3 className="mb-4 text-lg font-bold text-blue-700">Quick Transaction</h3>
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            setData('product_id', selectedProduct.id);
                                            post('/scan/transaction', {
                                                onSuccess: () => {
                                                    reset();
                                                    setSelectedProduct(null);
                                                    setScanResult(null);
                                                },
                                            });
                                        }}
                                        className="space-y-4"
                                    >
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div>
                                                <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                                                    Location
                                                </label>
                                                <select
                                                    id="location_id"
                                                    className="form-select mt-1 w-full rounded-md border-blue-200"
                                                    value={data.location_id}
                                                    onChange={(e) => setData('location_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Location</option>
                                                    {locations.map((location) => (
                                                        <option key={location.id} value={location.id}>
                                                            {location.warehouse?.name} - {location.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.location_id && <div className="mt-1 text-sm text-red-600">{errors.location_id}</div>}
                                            </div>
                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                                    Transaction Type
                                                </label>
                                                <select
                                                    id="type"
                                                    className="form-select mt-1 w-full rounded-md border-blue-200"
                                                    value={data.type}
                                                    onChange={(e) => setData('type', e.target.value)}
                                                >
                                                    <option value="in">Stock In</option>
                                                    <option value="out">Stock Out</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    id="quantity"
                                                    min="1"
                                                    className="form-input mt-1 w-full rounded-md border-blue-200"
                                                    value={data.quantity}
                                                    onChange={(e) => setData('quantity', parseInt(e.target.value))}
                                                    required
                                                />
                                                {errors.quantity && <div className="mt-1 text-sm text-red-600">{errors.quantity}</div>}
                                            </div>
                                            <div>
                                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                                    Notes (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="notes"
                                                    className="form-input mt-1 w-full rounded-md border-blue-200"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 flex space-x-4">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 font-semibold text-white shadow transition hover:brightness-110"
                                            >
                                                {processing ? 'Processing...' : 'Submit Transaction'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    reset();
                                                    setSelectedProduct(null);
                                                    setScanResult(null);
                                                }}
                                                className="rounded-md bg-gradient-to-r from-gray-200 to-gray-100 px-4 py-2 font-semibold text-gray-700 shadow transition hover:bg-gray-300"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
