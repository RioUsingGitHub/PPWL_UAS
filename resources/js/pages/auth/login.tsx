import { Head, useForm } from '@inertiajs/react';
import { Settings, Shield, Sparkles, User, X } from 'lucide-react';
import { FormEventHandler, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

const Iridescence = ({ color = [0, 1, 1], mouseReact = false, amplitude = 0.1, speed = 1.0 }) => {
    const [time, setTime] = useState(0);
    const [mousePos, setMousePos] = useState({ x: Math.random(), y: Math.random() });
    const rafRef = useRef<number | undefined>(undefined);
    const lastTimeRef = useRef(0);

    // move handleMouseMove out of useEffect
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (mouseReact) {
                setMousePos({
                    x: e.clientX / window.innerWidth,
                    y: e.clientY / window.innerHeight,
                });
            }
        },
        [mouseReact],
    );

    useEffect(() => {
        // animation loop
        const animate = (currentTime: number) => {
            const deltaTime = currentTime - lastTimeRef.current;

            // update ~60fps
            if (deltaTime >= 16) {
                setTime((prev) => prev + (deltaTime / 1000) * speed);
                lastTimeRef.current = currentTime;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        // only add listener if mouseReact is true
        if (mouseReact) {
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
        }

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            if (mouseReact) {
                window.removeEventListener('mousemove', handleMouseMove);
            }
        };
    }, [speed, mouseReact, handleMouseMove]);

    const iridescenceStyle: React.CSSProperties = useMemo(
        () => ({
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
        radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%,
          hsla(${(color[0] * 360 + time * 50) % 360}, ${color[1] * 100}%, ${color[2] * 50}%, ${amplitude}) 0%,
          hsla(${(color[0] * 360 + time * 30 + 120) % 360}, ${color[1] * 100}%, ${color[2] * 50}%, ${amplitude * 0.7}) 25%,
          hsla(${(color[0] * 360 + time * 40 + 240) % 360}, ${color[1] * 100}%, ${color[2] * 50}%, ${amplitude * 0.5}) 50%,
          transparent 70%
        ),
        linear-gradient(45deg,
          hsla(${(time * 20) % 360}, 70%, 60%, ${amplitude * 0.3}),
          hsla(${(time * 25 + 120) % 360}, 70%, 60%, ${amplitude * 0.2}),
          hsla(${(time * 30 + 240) % 360}, 70%, 60%, ${amplitude * 0.1})
        )
      `,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
            borderRadius: '0.75rem',
        }),
        [mousePos.x, mousePos.y, color, time, amplitude],
    );

    return <div style={iridescenceStyle} />;
};

// Demo accounts data (static array; not recreated on every render)
const demoAccounts = [
    {
        role: 'Admin',
        email: 'admin@example.com',
        password: 'password',
        icon: Shield,
        description: 'Full system access with all permissions',
        color: 'from-red-500 to-pink-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200 hover:border-red-300',
    },
    {
        role: 'Manager',
        email: 'manager@example.com',
        password: 'password',
        icon: Settings,
        description: 'Department and inventory management',
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200 hover:border-blue-300',
    },
    {
        role: 'User',
        email: 'user@example.com',
        password: 'password',
        icon: User,
        description: 'Basic inventory viewing access',
        color: 'from-green-500 to-emerald-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200 hover:border-green-300',
    },
];

// Separate DemoAccountItem into its own memoized component
const DemoAccountItem = ({
    account,
    index,
    onSelect,
}: {
    account: (typeof demoAccounts)[number];
    index: number;
    onSelect: (account: (typeof demoAccounts)[number]) => void;
}) => {
    const IconComponent = account.icon;

    const handleClick = useCallback(() => {
        onSelect(account);
    }, [account, onSelect]);

    return (
        <button
            onClick={handleClick}
            className={`relative border-2 text-left ${account.borderColor} ${account.bgColor} group transform rounded-xl px-4 py-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 rounded-lg bg-gradient-to-r p-2 ${account.color} shadow-lg`}>
                    <IconComponent className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900">{account.role}</h4>
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 transition-colors group-hover:bg-indigo-200">
                            Click
                        </span>
                    </div>
                    <p className="mb-2 text-xs leading-snug text-gray-600">{account.description}</p>

                    <div className="space-y-1">
                        <div className="flex items-center text-xs">
                            <span className="w-14 font-medium text-gray-700">Email:</span>
                            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">{account.email}</code>
                        </div>
                        <div className="flex items-center text-xs">
                            <span className="w-14 font-medium text-gray-700">Password:</span>
                            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-800">{account.password}</code>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    <svg className="h-4 w-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            </div>
        </button>
    );
};

const MemoizedDemoAccountItem = memo(DemoAccountItem);

export default function Login({ status, canResetPassword = true }: { status?: string; canResetPassword: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();
            setIsSubmitting(true);
            post(route('login'), {
                onFinish: () => {
                    setIsSubmitting(false);
                },
            });
        },
        [post],
    );

    const fillDemoAccount = useCallback(
        (account: (typeof demoAccounts)[number]) => {
            setData('email', account.email);
            setData('password', account.password);
            setShowModal(false);
            const button = document.querySelector('.demo-trigger');
            if (button) {
                button.classList.add('animate-pulse');
                setTimeout(() => button.classList.remove('animate-pulse'), 1000);
            }
        },
        [setData],
    );

    const handleModalToggle = useCallback(() => {
        setShowModal((prev) => !prev);
    }, []);

    const handleModalClose = useCallback(() => {
        setShowModal(false);
    }, []);

    const handleEmailChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('email', e.target.value);
        },
        [setData],
    );
    const handlePasswordChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('password', e.target.value);
        },
        [setData],
    );
    const handleRememberChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData('remember', e.target.checked);
        },
        [setData],
    );

    const statusComponent = useMemo(() => {
        if (!status) return null;
        return (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">{status}</p>
                    </div>
                </div>
            </div>
        );
    }, [status]);

    const demoAccountItems = useMemo(() => {
        return demoAccounts.map((account, index) => (
            <MemoizedDemoAccountItem key={account.role} account={account} index={index} onSelect={fillDemoAccount} />
        ));
    }, [fillDemoAccount]);

    return (
        <div className="login-bg flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Head title="Log in" />

            {/* Loading overlay */}
            {isSubmitting && (
                <div className="login-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="login-loader h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-white"></div>
                        <p className="text-sm font-medium text-white">Signing you in...</p>
                    </div>
                </div>
            )}

            <div className="login-card relative w-full max-w-md space-y-8 overflow-hidden rounded-xl bg-white p-8 shadow-lg">
                <Iridescence color={[0.6, 0.8, 0.9]} mouseReact={true} amplitude={0.12} speed={0.6} />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="login-banner mb-2 bg-gradient-to-r from-indigo-600 via-pink-500 to-yellow-400 bg-clip-text text-center text-3xl font-extrabold text-transparent">
                            Inventory Management System
                        </h2>
                        <p className="text-sm font-medium text-gray-600">Welcome back! Please sign in to continue</p>
                    </div>

                    {/* Status Message */}
                    {statusComponent}

                    {/* Login Form */}
                    <form className="space-y-5" onSubmit={submit}>
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                                    Email address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        placeholder="Enter your email address"
                                        className="login-input block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                        value={data.email}
                                        onChange={handleEmailChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                                {errors.email && (
                                    <div className="mt-2 flex items-center text-sm text-red-600">
                                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        placeholder="Enter your password"
                                        className="login-input block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                        value={data.password}
                                        onChange={handlePasswordChange}
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                {errors.password && (
                                    <div className="mt-2 flex items-center text-sm text-red-600">
                                        <svg className="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Remember Me + Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={data.remember}
                                    onChange={handleRememberChange}
                                />
                                <label htmlFor="remember-me" className="ml-3 block text-sm font-medium text-gray-700">
                                    Keep me signed in
                                </label>
                            </div>
                        </div>

                        {/* Sign In Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="login-button group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
                            >
                                <span className="flex items-center justify-center">
                                    {processing ? (
                                        <>
                                            <svg
                                                className="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <svg
                                                className="-mr-1 ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>

                        {/* Demo Accounts Trigger */}
                        <div className="border-t border-gray-200 pt-4 text-center">
                            <button
                                type="button"
                                onClick={handleModalToggle}
                                className="demo-trigger inline-flex items-center rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2.5 text-sm font-medium text-indigo-700 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:from-indigo-100 hover:to-purple-100 hover:shadow-md"
                            >
                                <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
                                Try Demo Accounts
                                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">Quick Start</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ---------- Demo Accounts Modal ---------- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleModalClose} />

                    {/* Modal */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 relative w-full max-w-lg transform rounded-2xl bg-white shadow-2xl transition-all duration-300">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-6">
                            <div>
                                <h3 className="flex items-center text-xl font-bold text-gray-900">
                                    <Sparkles className="mr-2 h-5 w-5 text-indigo-500" />
                                    Demo Accounts
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">Choose an account to get started instantly</p>
                            </div>
                            <button onClick={handleModalClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body: scrollable list with max height */}
                        <div className="p-6">
                            <div className="py-1 px-2  grid max-h-64 overflow-y-scroll gap-4 pr-2">{demoAccountItems}</div>
                        </div>

                        {/* Footer */}
                        <div className="rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>💡 Click any account above to auto-fill the login form</span>
                                <span className="font-medium">No registration required</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
