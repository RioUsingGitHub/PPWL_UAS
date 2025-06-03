import { useState, PropsWithChildren, ReactNode, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { User, SharedData } from '@/types';
import {
    HomeIcon,
    CubeIcon,
    BuildingStorefrontIcon,
    UserGroupIcon,
    QrCodeIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon,
    BellIcon,
    MagnifyingGlassIcon,
    ArrowLeftEndOnRectangleIcon,
    ArrowLeftStartOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Toaster } from "@/components/ui/sonner"
import Swal from 'sweetalert2';

interface Props extends PropsWithChildren {
    header?: ReactNode;
}

export default function AuthenticatedLayout({ header, children }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isScrolled, setIsScrolled] = useState(false);

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission) || false;
    };

    // Handle scroll effect for header
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigation = [
        {
            name: 'Beranda',
            href: '/dashboard',
            icon: HomeIcon,
            show: true,
            gradient: 'from-blue-500 to-cyan-400'
        },
        {
            name: 'Produk',
            href: '/products',
            icon: CubeIcon,
            show: hasPermission('manage-products'),
            gradient: 'from-emerald-500 to-teal-400'
        },
        {
            name: 'Stok',
            href: '/stock',
            icon: ClipboardDocumentListIcon,
            show: hasPermission('manage-stock'),
            gradient: 'from-purple-500 to-indigo-400'
        },
        {
            name: 'Gudang',
            href: '/warehouses',
            icon: BuildingStorefrontIcon,
            show: hasPermission('manage-warehouses'),
            gradient: 'from-orange-500 to-red-400'
        },
        {
            name: 'Pindai',
            href: '/scan',
            icon: QrCodeIcon,
            show: hasPermission('scan-barcode'),
            gradient: 'from-pink-500 to-rose-400'
        },
        {
            name: 'Pengguna',
            href: '/users',
            icon: UserGroupIcon,
            show: hasPermission('manage-users'),
            gradient: 'from-green-500 to-lime-400'
        },
        {
            name: 'Daftar Audit',
            href: '/audit-logs',
            icon: ClipboardDocumentListIcon,
            show: hasPermission('view-audit-logs'),
            gradient: 'from-slate-500 to-gray-400'
        },
    ].filter(item => item.show);

    const logout = () => {
        Swal.fire({
            title: 'Apakah Anda yakin ingin keluar?',
            text: 'Anda akan keluar dari akun Anda.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, keluar',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post('/logout', {}, { preserveScroll: true });
            }
        });
    };

    const SidebarContent = ({ mobile = false, auth }) => (
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            {/* Header */}
            <div className="flex flex-shrink-0 items-center px-4 mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <CubeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1
                            className={`font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent ${mobile ? 'text-lg' : 'text-xl'
                                }`}
                        >
                            Inventory
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Management System</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 space-y-2 px-3">
                {navigation.map((item) => {
                    const isActive = window.location.pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 ease-out transform hover:scale-105 ${isActive
                                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-blue-200/50`
                                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-md'
                                }`}
                        >
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300 ${isActive
                                        ? 'bg-white/20'
                                        : 'bg-gray-100 group-hover:bg-blue-100 group-hover:scale-110'
                                    }`}
                            >
                                <item.icon
                                    className={`w-5 h-5 transition-colors duration-300 ${isActive
                                            ? 'text-white'
                                            : 'text-gray-500 group-hover:text-blue-600'
                                        }`}
                                />
                            </div>
                            <span className="transition-all duration-300">{item.name}</span>
                            {isActive && (
                                <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Sidebar Footer */}
            <div className="px-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                            {auth?.user?.name?.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            {auth?.user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">Online</p>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
            {/* Mobile sidebar overlay */}
            <div
                className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            >
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
                <div className={`relative flex w-full max-w-xs h-full flex-1 flex-col bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}>
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    <SidebarContent mobile={true} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-72 md:flex-col z-40">
                <div className="flex flex-1 flex-col overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl">
                    <SidebarContent />
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-72 flex flex-1 flex-col">
                {/* Mobile header */}
                <div className={`sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b transition-all duration-300 md:hidden ${isScrolled ? 'border-gray-200 shadow-sm' : 'border-transparent'
                    }`}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-3">
                            <button className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                                <BellIcon className="w-5 h-5" />
                            </button>
                            {/* Logout Quick Access */}
                            <button
                                onClick={logout}
                                className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                                <ArrowLeftStartOnRectangleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop top bar */}
                <div className={`z-2 sticky top-0 hidden md:flex h-16 flex-shrink-0 bg-white/80 backdrop-blur-xl border-b transition-all duration-300 ${isScrolled ? 'border-gray-200 shadow-sm' : 'border-transparent'
                    }`}>
                    <div className="flex flex-1 justify-between px-6">
                        <div className="flex flex-1 items-center max-w-lg">
                            {/* Enhanced Search */}
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search products, users, warehouses..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80"
                                />
                            </div>
                        </div>

                        <div className="ml-4 flex items-center space-x-4">
                            <button className="relative p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                                <BellIcon className="w-5 h-5" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            </button>

                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center space-x-3 rounded-xl bg-white/60 hover:bg-white/80 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
                                    onClick={() => setProfileOpen(!profileOpen)}
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-bold text-white">
                                            {auth.user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="hidden lg:block text-left">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {auth.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">Administrator</p>
                                    </div>
                                    <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''
                                        }`} />
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-white/95 backdrop-blur-xl shadow-xl ring-1 ring-black/5 border border-white/20 transition-all duration-200 animate-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-gray-200/50">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">
                                                        {auth.user?.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{auth.user?.name}</p>
                                                    <p className="text-sm text-gray-500">{auth.user?.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <Link
                                                href="/profile"
                                                className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                            >
                                                Profile Settings
                                            </Link>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                                            >
                                                Sign out
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page header */}
                {header && (
                    <header className="bg-transparent">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                {/* Main content */}
                <main className="flex-1">
                    <div className="py-6">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {children}
                        </div>
                    </div>
                </main>
                <Toaster />
            </div>
        </div>
    );
}
