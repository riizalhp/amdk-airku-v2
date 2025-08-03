
import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { Dashboard } from './Dashboard';
import { RoutePlanning } from './RoutePlanning';
import { UserManagement } from './UserManagement';
import { StoreManagement } from './StoreManagement';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { FleetManagement } from './FleetManagement';
import { PartnerManagement } from './PartnerManagement';
import { SurveyReports } from './SurveyReports';
import { VisitSchedule } from './VisitSchedule';
import { ReportsView } from './ReportsView';
import { useAppContext } from '../../hooks/useAppContext';

type AdminPage = 'dashboard' | 'users' | 'partners' | 'stores' | 'products' | 'fleet' | 'orders' | 'routePlanning' | 'schedule' | 'surveys' | 'reports';

const navItems: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
    { id: 'reports', label: 'Laporan', icon: ICONS.fileText },
    { id: 'routePlanning', label: 'Perencanaan Rute', icon: ICONS.route },
    { id: 'orders', label: 'Manajemen Pesanan', icon: ICONS.orders },
    { id: 'schedule', label: 'Jadwal Kunjungan', icon: ICONS.calendar },
    { id: 'surveys', label: 'Laporan Survei', icon: ICONS.survey },
    { id: 'users', label: 'Manajemen Pengguna', icon: ICONS.users },
    { id: 'partners', label: 'Manajemen Mitra', icon: ICONS.handshake },
    { id: 'stores', label: 'Manajemen Toko', icon: ICONS.store },
    { id: 'products', label: 'Manajemen Produk', icon: ICONS.product },
    { id: 'fleet', label: 'Manajemen Armada', icon: ICONS.fleet },
];


export const AdminView: React.FC = () => {
    const { logout, currentUser } = useAppContext();
    const [activePage, setActivePage] = useState<AdminPage>('dashboard');

    const renderContent = () => {
        switch (activePage) {
            case 'dashboard':
                return <Dashboard />;
            case 'reports':
                return <ReportsView />;
            case 'routePlanning':
                return <RoutePlanning />;
            case 'users':
                return <UserManagement />;
            case 'partners':
                return <PartnerManagement />;
            case 'stores':
                 return <StoreManagement />;
            case 'products':
                return <ProductManagement />;
            case 'orders':
                return <OrderManagement />;
            case 'fleet':
                return <FleetManagement />;
            case 'schedule':
                return <VisitSchedule />;
            case 'surveys':
                return <SurveyReports />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-brand-background">
            <aside className="w-64 bg-brand-dark text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-blue-900">
                    KU AIRKU
                </div>
                <nav className="flex-1 mt-6 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition duration-200 ${
                                activePage === item.id 
                                ? 'bg-brand-primary' 
                                : 'hover:bg-brand-primary hover:bg-opacity-50'
                            }`}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-blue-900">
                    <div className="px-4 py-2 mb-2">
                      <p className="text-sm font-semibold">{currentUser?.name}</p>
                      <p className="text-xs text-blue-300">{currentUser?.role}</p>
                    </div>
                     <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-left transition duration-200 hover:bg-brand-primary hover:bg-opacity-50 rounded-md">
                        {ICONS.logout}
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};