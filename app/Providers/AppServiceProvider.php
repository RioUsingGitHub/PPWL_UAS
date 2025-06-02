<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Handle HTTPS for ngrok
        if (request()->header('x-forwarded-proto') === 'https') {
            URL::forceScheme('https');
        }
        
        // Special handling for ngrok
        if (str_contains(request()->getHost(), 'ngrok-free.app')) {
            // Override asset URL if specified in environment
            if ($assetUrl = env('ASSET_URL')) {
                // This is crucial for making Vite work with ngrok
                Vite::useHotFile(public_path('hot'));
                Vite::useBuildDirectory('build');
                
                // Configure Vite to use the ngrok URL for assets
                Vite::useScriptTagAttributes([
                    'crossorigin' => 'anonymous',
                ]);
                
                // Force the asset URL
                Vite::useDevServerUrl($assetUrl);
            }
        }
    }
}
