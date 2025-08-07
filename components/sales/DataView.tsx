import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Store } from '../../types';

export const DataView: React.FC = () => {
    const { stores } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStores = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        if (!lowercasedFilter) {
            return stores.sort((a,b) => a.name.localeCompare(b.name));
        }
        return stores.filter(store =>
            store.name.toLowerCase().includes(lowercasedFilter) ||
            store.owner.toLowerCase().includes(lowercasedFilter) ||
            store.address.toLowerCase().includes(lowercasedFilter)
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [stores, searchTerm]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-dark">Database Toko & Mitra</h2>
            
            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Cari nama toko, pemilik, atau alamat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 border rounded-lg shadow-sm"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
            </div>

            {/* Store List */}
            {filteredStores.length > 0 ? (
                <div className="space-y-3">
                    {filteredStores.map(store => (
                        <Card key={store.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-bold text-brand-dark pr-2">{store.name}</h3>
                                {store.isPartner && (
                                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 font-mono">
                                        {React.cloneElement(ICONS.handshake, {width: 14, height: 14})}
                                        {store.partnerCode}
                                    </span>
                                )}
                            </div>
                            
                            <div className="mt-2 space-y-1 text-sm text-gray-700">
                                <p><strong>PIC:</strong> {store.owner}</p>
                                <p><strong>Alamat:</strong> {store.address}</p>
                                <p><strong>Telepon:</strong> {store.phone}</p>
                            </div>
                            
                            <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2">
                                <a 
                                    href={`tel:${store.phone}`}
                                    className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-3 rounded-lg text-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    Telepon
                                </a>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${store.location.lat},${store.location.lng}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-2 px-3 rounded-lg text-sm"
                                >
                                    {ICONS.navigation}
                                    Navigasi
                                </a>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Tidak ada toko yang ditemukan.</p>
                </Card>
            )}
        </div>
    );
};