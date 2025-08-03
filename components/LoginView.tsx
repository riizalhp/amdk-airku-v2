import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ICONS } from '../constants';

const WaterWave: React.FC = () => (
    <div className="absolute bottom-0 left-0 w-full h-32" style={{ zIndex: 1 }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
            <defs>
                <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
            </defs>
            <g className="parallax">
                <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(0,180,216,0.7)" />
                <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(0,180,216,0.5)" />
                <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(0,180,216,0.3)" />
                <use xlinkHref="#gentle-wave" x="48" y="7" fill="#00B4D8" />
            </g>
        </svg>
    </div>
);

export const LoginView: React.FC = () => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        // Simulate network delay
        setTimeout(() => {
            const success = login(email, password);
            if (!success) {
                setError('Email atau password salah. Silakan coba lagi.');
            }
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-brand-background to-blue-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <div className="relative z-10 w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-brand-dark">KU AIRKU</h1>
                    <p className="text-brand-dark opacity-80">Platform Manajemen Distribusi</p>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-center text-brand-dark mb-6">Masuk ke Akun Anda</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="anda@email.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="••••••••"
                            />
                        </div>
                        
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition duration-300 disabled:bg-gray-400"
                            >
                                {isLoading ? 'Memproses...' : 'Masuk'}
                            </button>
                        </div>
                    </form>
                     <div className="text-center mt-4">
                        <p className="text-xs text-gray-500">
                           Gunakan: admin@kuairku.com | pass: password123
                        </p>
                    </div>
                </div>
            </div>
            <WaterWave />
        </div>
    );
};