import { useState, useRef, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { PageProps, Location, Product, ScanResult } from '@/types';
import { QrCodeIcon, CameraIcon } from '@heroicons/react/24/outline';
import { BrowserMultiFormatReader } from '@zxing/library';

interface ScanPageProps extends PageProps {
    locations: Location[];
}

export default function ScanIndex({ locations }: ScanPageProps) {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [scanning, setScanning] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const codeReader = new BrowserMultiFormatReader();

    const { data, setData, post, processing, errors, reset } = useForm<{
        barcode: string;
        location_id: string;
        type: 'in' | 'out';
        quantity: number;
        notes: string;
        product_id: number;       // ← new
        }>({
        barcode: '',
        location_id: '',
        type: 'in',
        quantity: 1,
        notes: '',
        product_id: 0,            // ← initial default
    });

    const handleBarcodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.barcode) return;

        setScanning(true);
        try {
            post('/scan/product', {
                data: { barcode: data.barcode },
                onSuccess: (result: ScanResult) => {
                    setScanResult(result);
                    setSelectedProduct(result.product ?? null);
                },
                onError: (errors: Record<string, string>) => {
                    console.error(errors);
                },
            });

        } catch (error) {
            console.error('Scan error:', error);
            setScanResult({
                success: false,
                message: 'Failed to scan product',
            });
        } finally {
            setScanning(false);
        }
    };

    const handleTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !data.location_id) return;

        setData('product_id', selectedProduct.id);
        setData('location_id', data.location_id);
        setData('type', data.type);
        setData('quantity', data.quantity);
        setData('notes', data.notes);

        post('/scan/transaction', {
            onSuccess: () => {
            reset();          // clears all fields back to initial
            setSelectedProduct(null);
            setScanResult(null);
            },
        });
    };

    const handleBarcodeSubmitViaScanner = async (barcode: string) => {
        setScanning(true);

        try {
        const response = await fetch('/scan/product', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN':
                document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') || '',
            },
            body: JSON.stringify({ barcode }),
        });

        const result = await response.json() as ScanResult;
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
            const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            });
            if (!videoRef.current) return;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            // continuously scan, until you call codeReader.reset()
            codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
            if (result) {
                const text = result.getText();
                setScanning(false);
                codeReader.reset();           // stop decoding loop
                stream.getTracks().forEach(t => t.stop());
                setData('barcode', text);
                handleBarcodeSubmitViaScanner(text);
            }
            // ignore errors (e.g. "no QR found in this frame")
            });
        } catch (error) {
            console.error('Camera error:', error);
        }
    };


    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0);
                
                // Here you would integrate with a barcode scanning library
                // For now, we'll just show a placeholder
                alert('Barcode scanning from camera would be implemented here using libraries like QuaggaJS or ZXing');
            }
        }
    };

    useEffect(() => {
        return () => {
            codeReader.reset();      // stop any ongoing decode loops
            videoRef.current?.srcObject &&
            (videoRef.current.srcObject as MediaStream)
                .getTracks()
                .forEach((t) => t.stop());
        };
    }, []);


    return (
        <AuthenticatedLayout
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Barcode Scanner
                </h2>
            }
        >
            <Head title="Scan" />

            <div className="py-12">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Manual Barcode Input */}
                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Enter Barcode Manually
                                </h3>
                                <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
                                            Barcode
                                        </label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <input
                                                type="text"
                                                id="barcode"
                                                className="flex-1 form-input"
                                                placeholder="Enter or scan barcode"
                                                value={data.barcode}
                                                onChange={(e) => setData('barcode', e.target.value)}
                                            />
                                            <button
                                                type="submit"
                                                disabled={scanning || !data.barcode}
                                                className="ml-3 btn btn-primary"
                                            >
                                                {scanning ? (
                                                    <div className="spinner mr-2" />
                                                ) : (
                                                    <QrCodeIcon className="w-4 h-4 mr-2" />
                                                )}
                                                {scanning ? 'Scanning...' : 'Scan'}
                                            </button>
                                        </div>
                                        {errors.barcode && (
                                            <div className="text-red-600 text-sm mt-1">{errors.barcode}</div>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Camera Scanner */}
                            <div className="mb-8">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Camera Scanner
                            </h3>
                            <div className="flex space-x-4 mb-4">
                                <button onClick={startCamera} className="btn btn-secondary text-black">
                                <CameraIcon className="w-4 h-4 mr-2 text-black" />
                                Start Camera
                                </button>
                                <button onClick={() => { codeReader.reset(); setScanning(false); }} className="btn btn-secondary text-black">
                                Stop Camera
                                </button>
                            </div>
                            {/* video now visible when `scanning` is true */}
                            {scanning && (
                                <video
                                ref={videoRef}
                                className="w-full max-w-md border rounded-lg"
                                playsInline
                                muted
                                autoPlay
                                />
                            )}
                            </div>

                            {/* Scan Result */}
                            {scanResult && (
                                <div className="mb-8">
                                    {scanResult.success ? (
                                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                            <h4 className="text-lg font-medium text-green-800 mb-2">
                                                Product Found
                                            </h4>
                                            {selectedProduct && (
                                                <div className="space-y-2">
                                                    <p><strong>Name:</strong> {selectedProduct.name}</p>
                                                    <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                                                    <p><strong>Unit:</strong> {selectedProduct.unit}</p>
                                                    <p><strong>Current Stock:</strong> {selectedProduct.total_stock || 0}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                            <h4 className="text-lg font-medium text-red-800 mb-2">
                                                Product Not Found
                                            </h4>
                                            <p className="text-red-700">{scanResult.message}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Quick Transaction */}
                            {selectedProduct && (
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Quick Transaction
                                    </h3>
                                    <form onSubmit={handleTransaction} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
                                                    Location
                                                </label>
                                                <select
                                                    id="location_id"
                                                    className="mt-1 form-select w-full"
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
                                                    className="mt-1 form-select w-full"
                                                    value={data.type}
                                                    onChange={(e) => setData('type', e.target.value as 'in' | 'out')}
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
                                                    className="mt-1 form-input w-full"
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
                                                    className="mt-1 form-input w-full"
                                                    value={data.notes}
                                                    onChange={(e) => setData('notes', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex space-x-4">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="btn btn-primary"
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
                                                className="btn btn-secondary"
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