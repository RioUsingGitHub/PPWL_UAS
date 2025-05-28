import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    is_active: boolean;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
    roles: Role[];
    permissions: string[];
    [key: string]: unknown; // This allows for additional properties...
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    barcode: string;
    name: string;
    description?: string;
    sku: string;
    price: number;
    unit: string;
    category?: string;
    image?: string;
    min_stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    stock_items?: StockItem[];
    total_stock?: number;
    is_low_stock?: boolean;
}

export interface Warehouse {
    id: number;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    locations?: Location[];
    locations_count?: number;
}

export interface Location {
    id: number;
    warehouse_id: number;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    warehouse?: Warehouse;
    stock_items?: StockItem[];
    stock_items_count?: number;
}

export interface StockItem {
    id: number;
    product_id: number;
    location_id: number;
    quantity: number;
    unit_cost: number;
    expiry_date?: string;
    batch_number?: string;
    created_at: string;
    updated_at: string;
    product?: Product;
    location?: Location;
    is_expired?: boolean;
    is_near_expiry?: boolean;
}

export interface MovementHistory {
    id: number;
    product_id: number;
    location_id: number;
    user_id: number;
    type: 'in' | 'out' | 'adjustment' | 'transfer';
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    notes?: string;
    reference_number?: string;
    created_at: string;
    updated_at: string;
    product?: Product;
    location?: Location;
    user?: User;
    type_color?: string;
}

export interface PageProps<T extends Record<string, unknown> = Record<string, unknown>> {
    auth: {
        user: User | null;
    };
    ziggy: {
        location: string;
        [key: string]: any;
    };
    flash: {
        message?: string;
        error?: string;
    };
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface DashboardStats {
    total_products: number;
    total_users: number;
    total_warehouses: number;
    low_stock_products: number;
}

export interface StockByWarehouse {
    name: string;
    total_items: number;
    total_value: number;
}

export interface ScanResult {
    success: boolean;
    product?: Product;
    message?: string;
}

export interface BulkScanItem {
    barcode: string;
    location_id: number;
    type: 'in' | 'out';
    quantity: number;
    notes?: string;
}

export interface BulkScanResult {
    barcode: string;
    product_name?: string;
    success: boolean;
    message: string;
}

export interface BulkScanResponse {
    success: boolean;
    results: BulkScanResult[];
    summary: {
        total: number;
        success: number;
        errors: number;
    };
}
