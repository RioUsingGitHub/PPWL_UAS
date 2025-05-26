import { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function ScanIndex({ locations }) {
    const [scanResult, setScanResult] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const videoRef = useRef(null);
    const codeReader = new BrowserMultiFormatReader();

    const { data, setData, post, processing, errors, reset } = useForm({
        barcode: '',
        location_id: '',
        type: 'in',
        quantity: 1,
        notes: '',
        product_id: 0,
    });

    const handleBarcodeSubmit = (e) => {
        e.preventDefault();
        if (!data.barcode) return;
        setScanning(true);
        post('/scan/product', {
            data: { barcode: data.barcode },
            onSuccess: (result) => {
                setScanResult(result);
                setSelectedProduct(result.product ?? null);
            },
            onError: () => {},
            onFinish: () => setScanning(false),
        });
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
                    stream.getTracks().forEach(t => t.stop());
                    setData('barcode', text);
                    handleBarcodeSubmitViaScanner(text);
                }
            });
        } catch {}
    };

    useEffect(() => {
        return () => {
            codeReader.reset();
            videoRef.current?.srcObject &&
                (videoRef.current.srcObject).getTracks().forEach((t) => t.stop());
        };
    }, []);

    return (
        <AuthenticatedLayout
            header={
                // BARCODE SCANNER BAR: Tetap seperti gambar, tidak diubah
                <h2 className="font-bold text-2xl text-cyan-700 leading-tight bg-gradient-to-r from-slate-300 via-cyan-200 to-blue-300 px-6 py-3 rounded-lg shadow-lg">
                    Barcode Scanner
                </h2>
            }
        >
            <Head title="Scan" />

            {/* SOFT GRADIENT BACKGROUND */}
            <div
                className="py-12 min-h-screen"
                style={{
                    background: 'linear-gradient(135deg, #f3f8fe 0%, #e0f7fa 60%, #f8f8fc 100%)'
                }}
            >
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* CARD CONTAINER */}
                    <div className="bg-white/90 overflow-hidden shadow-xl sm:rounded-2xl border border-blue-100">
                        <div className="p-8">

                            {/* MANUAL BARCODE INPUT */}
                            <div className="mb-10">
                                <h3 className="text-lg font-bold text-blue-700 mb-5">
                                    Enter Barcode Manually
                                </h3>
                                <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                                            Barcode
                                        </label>
                                        <div className="mt-1 flex rounded-lg shadow-sm bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-100">
                                            <input
                                                type="text"
                                                id="barcode"
                                                className="flex-1 rounded-l-lg border-none bg-transparent focus:ring-0 px-4 py-2 text-gray-800 placeholder-gray-400"
                                                placeholder="Enter or scan barcode"
                                                value={data.barcode}
                                                onChange={(e) => setData('barcode', e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={scanning || !data.barcode}
                                                className="flex items-center gap-1 px-4 py-2 rounded-r-lg bg-gradient-to-r from-cyan-400 to-blue-400 text-white font-semibold hover:brightness-110 transition"
                                            >
                                                <QrCodeIcon className="w-5 h-5" />
                                                {scanning ? 'Scanning...' : 'Scan'}
                                            </button>
                                        </div>
                                        {errors.barcode && (
                                            <div className="text-red-600 text-sm mt-1">{errors.barcode}</div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* CAMERA SCANNER */}
                            <div className="mb-10">
                                <h3 className="text-lg font-bold text-blue-700 mb-5">
                                    Camera Scanner
                                </h3>
                                <div className="flex space-x-4 mb-4">
                                    <button
                                        onClick={startCamera}
                                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-300 to-cyan-300 text-gray-800 font-semibold shadow hover:brightness-110 transition"
                                    >
                                        <CameraIcon className="w-5 h-5" />
                                        Start Camera
                                    </button>
                                    <button
                                        onClick={() => { codeReader.reset(); setScanning(false); }}
                                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-200 to-orange-200 text-gray-800 font-semibold shadow hover:brightness-110 transition"
                                    >
                                        Stop Camera
                                    </button>
                                </div>
                                {scanning && (
                                    <video
                                        ref={videoRef}
                                        className="w-full max-w-md border-2 border-cyan-200 rounded-xl shadow-lg"
                                        playsInline
                                        muted
                                        autoPlay
                                    />
                                )}
                            </div>

                            {/* SCAN RESULT */}
                            {scanResult && (
                                <div className="mb-10">
                                    {scanResult.success ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow">
                                            <h4 className="text-lg font-bold text-green-800 mb-2">
                                                Product Found
                                            </h4>
                                            {selectedProduct && (
                                                <div className="space-y-1 text-gray-700">
                                                    <p><strong>Name:</strong> {selectedProduct.name}</p>
                                                    <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                                                    <p><strong>Unit:</strong> {selectedProduct.unit}</p>
                                                    <p><strong>Current Stock:</strong> {selectedProduct.total_stock || 0}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow">
                                            <h4 className="text-lg font-bold text-red-800 mb-2">
                                                Product Not Found
                                            </h4>
                                            <p className="text-red-700">{scanResult.message}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* QUICK TRANSACTION */}
                            {selectedProduct && (
                                <div className="bg-blue-50/60 rounded-xl p-6 shadow border border-blue-100">
                                    <h3 className="text-lg font-bold text-blue-700 mb-4">
                                        Quick Transaction
                                    </h3>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        setData('product_id', selectedProduct.id);
                                        post('/scan/transaction', {
                                            onSuccess: () => {
                                                reset();
                                                setSelectedProduct(null);
                                                setScanResult(null);
                                            },
                                        });
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                                                    Location
                                                </label>
                                                <select
                                                    id="location_id"
                                                    className="mt-1 form-select w-full rounded-md border-blue-200"
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
                                                {errors.location_id && (
                                                    <div className="text-red-600 text-sm mt-1">{errors.location_id}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                                                    Transaction Type
                                                </label>
                                                <select
                                                    id="type"
                                                    className="mt-1 form-select w-full rounded-md border-blue-200"
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
                                                    className="mt-1 form-input w-full rounded-md border-blue-200"
                                                    value={data.quantity}
                                                    onChange={(e) => setData('quantity', parseInt(e.target.value))}
                                                    required
                                                />
                                                {errors.quantity && (
                                                    <div className="text-red-600 text-sm mt-1">{errors.quantity}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                                    Notes (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="notes"
                                                    className="mt-1 form-input w-full rounded-md border-blue-200"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 mt-2">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-white font-semibold shadow hover:brightness-110 transition"
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
                                                className="rounded-md bg-gradient-to-r from-gray-200 to-gray-100 px-4 py-2 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
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
