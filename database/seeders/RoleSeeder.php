<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'manage-users',
            'manage-roles',
            'manage-products',
            'manage-warehouses',
            'manage-stock',
            'view-audit-logs',
            'scan-barcode',
            'adjust-stock',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        $admin = Role::create(['name' => 'admin']);
        $admin->givePermissionTo(Permission::all());

        $manager = Role::create(['name' => 'manager']);
        $manager->givePermissionTo([
            'manage-products',
            'manage-warehouses',
            'manage-stock',
            'scan-barcode',
            'adjust-stock',
        ]);

        $user = Role::create(['name' => 'user']);
        $user->givePermissionTo([
            'scan-barcode',
            'adjust-stock',
        ]);
    }
}
