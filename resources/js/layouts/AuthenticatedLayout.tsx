import { useState, PropsWithChildren, ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { User, SharedData  } from '@/types';
import { 
    HomeIcon, 
    CubeIcon,
    BuildingStorefrontIcon,
    UserGroupIcon,
    QrCodeIcon,
    ClipboardDocumentListIcon,
    Bars3Icon,
    XMarkIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Toaster } from "@/components/ui/sonner"

interface Props extends PropsWithChildren {
    header?: ReactNode;
}

export default function AuthenticatedLayout({ header, children }: Props) {
    const { auth } = usePage<SharedData >().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission) || false;
    };

    // unused
    {/* unused
    const hasRole = (roleName: string) => {
        return auth.user?.roles?.some(r => r.name === roleName) ?? false;
    };
    */}

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: HomeIcon,
            show: true,
        },
        {
            name: 'Products',
            href: '/products',
            icon: CubeIcon,
            show: hasPermission('manage-products'),
        },
        {
            name: 'Stock',
            href: '/stock',
            icon: ClipboardDocumentListIcon,
            show: hasPermission('manage-stock'),
        },
        {
            name: 'Warehouses',
            href: '/warehouses',
            icon: BuildingStorefrontIcon,
            show: hasPermission('manage-warehouses'),
        },
        {
            name: 'Scan',
            href: '/scan',
            icon: QrCodeIcon,
            show: hasPermission('scan-barcode'),
        },
        {
            name: 'Users',
            href: '/users',
            icon: UserGroupIcon,
            show: hasPermission('manage-users'),
        },
        {
            name: 'Audit Logs',
            href: '/audit-logs',
            icon: ClipboardDocumentListIcon,
            show: hasPermission('view-audit-logs'),
        },
    ].filter(item => item.show);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar */}
            <div
                className={`fixed inset-0 z-40 md:hidden ${
                    sidebarOpen ? 'block' : 'hidden'
                }`}
            >
                <div className="fixed inset-0 bg-gray-600/40 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                <div className="relative flex w-full max-w-xs h-full flex-1 flex-col bg-white">
                    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
                        </div>
                        <nav className="mt-5 flex-1 space-y-1 px-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <item.icon className="mr-4 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <div className="flex flex-1 flex-col overflow-y-auto bg-white border-r border-gray-200">
                    <div className="flex flex-1 flex-col pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>
                        </div>
                        <nav className="mt-5 flex-1 space-y-1 px-2">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                >
                                    <item.icon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="md:pl-64 flex flex-1 flex-col">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-1 pt-1 sm:pl-3 sm:pt-3 md:hidden">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>
                </div>

                {/* Top bar */}
                <div className="flex h-16 flex-shrink-0 border-b border-gray-200 bg-white">
                    <div className="flex flex-1 justify-between px-4">
                        <div className="flex flex-1">
                            {/* Search can be added here */}
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">
                            {/* Profile dropdown */}
                            <div className="relative ml-3">
                                <div>
                                    <button
                                        type="button"
                                        className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={() => setProfileOpen(!profileOpen)}
                                    >
                                        <span className="sr-only">Open user menu</span>
                                        <div className="flex items-center space-x-2">
                                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-700">
                                                    {auth.user?.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="hidden md:block text-sm font-medium text-gray-700">
                                                {auth.user?.name}
                                            </span>
                                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </button>
                                </div>
                                {profileOpen && (
                                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                            <div className="font-medium">{auth.user?.name}</div>
                                            <div className="text-gray-500">{auth.user?.email}</div>
                                        </div>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Sign out
                                        </Link>
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