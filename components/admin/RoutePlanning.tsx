import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../ui/Card';
import { useAppContext } from '../../hooks/useAppContext';
import { OrderStatus, Role, VehicleStatus } from '../../types';
import { ICONS } from '../../constants';
import { Modal } from '../ui/Modal';

type PlanningTab = 'delivery' | 'salesVisit';

export const RoutePlanning: React.FC = () => {
    const { 
        orders, vehicles, users, routes, createRoutePlan,
        visits, salesVisitRoutes, createSalesVisitRoutePlan 
    } = useAppContext();
    
    const [activeTab, setActiveTab] = useState<PlanningTab>('delivery');

    // Common State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Delivery Planning State
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');

    // Sales Visit Planning State
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
    const [selectedSalesPerson, setSelectedSalesPerson] = useState('');
    const [selectedVisitDate, setSelectedVisitDate] = useState(new Date().toISOString().split('T')[0]);

    // Memos for Delivery
    const availableDrivers = useMemo(() => users.filter(u => u.role === Role.DRIVER), [users]);
    const availableVehicles = useMemo(() => {
        const vehicleIdsWithPendingOrders = new Set(
            orders
                .filter(o => o.status === OrderStatus.PENDING && o.assignedVehicleId)
                .map(o => o.assignedVehicleId)
        );
        return vehicles.filter(v => v.status === VehicleStatus.IDLE && vehicleIdsWithPendingOrders.has(v.id));
    }, [vehicles, orders]);

    // Memos for Sales
    const availableSales = useMemo(() => users.filter(u => u.role === Role.SALES), [users]);
    
    const relevantSalesVisitRoutes = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return salesVisitRoutes.filter(r => r.date >= today);
    }, [salesVisitRoutes]);

    // Handlers for Delivery
    const openCreateDeliveryModal = () => {
        setSelectedDriver('');
        setSelectedVehicle('');
        setError(null);
        setIsDeliveryModalOpen(true);
    }
    
    const handleCreateDeliveryPlan = async () => {
        if (!selectedDriver || !selectedVehicle) {
            setError("Harap pilih pengemudi dan armada.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await createRoutePlan(selectedDriver, selectedVehicle);
            setIsDeliveryModalOpen(false);
        } catch (e) {
            console.error(e);
            setError("Gagal membuat rencana rute. Pastikan armada memiliki pesanan yang ditugaskan.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handlers for Sales Visit
    const openCreateSalesModal = () => {
        setSelectedSalesPerson('');
        setSelectedVisitDate(new Date().toISOString().split('T')[0]);
        setError(null);
        setIsSalesModalOpen(true);
    };

    const handleCreateSalesPlan = async () => {
        if (!selectedSalesPerson || !selectedVisitDate) {
            setError("Harap pilih sales dan tanggal kunjungan.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            await createSalesVisitRoutePlan(selectedSalesPerson, selectedVisitDate);
            setIsSalesModalOpen(false);
        } catch (e) {
            console.error(e);
            setError("Gagal membuat rencana kunjungan. Pastikan ada jadwal untuk sales pada tanggal tersebut.");
        } finally {
            setIsLoading(false);
        }
    };


    const deliveryRouteContent = (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-brand-dark">Rute Pengiriman Armada</h2>
                <button
                    onClick={openCreateDeliveryModal}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Buat Rencana Pengiriman
                </button>
            </div>
             
             {routes.length > 0 ? (
                <div className="space-y-6">
                    {routes.map(route => (
                        <Card key={route.id}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-brand-primary">Rute untuk {users.find(d=>d.id === route.driverId)?.name}</h3>
                                    <p className="text-sm text-gray-500">Armada: {vehicles.find(v=>v.id === route.vehicleId)?.plateNumber} | Total Pemberhentian: {route.stops.length}</p>
                                </div>
                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Tanggal: {route.date}</span>
                            </div>
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold">Urutan Pengiriman:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                {route.stops.map((stop) => (
                                    <li key={`${route.id}-${stop.orderId}`} className="p-2 bg-gray-50 rounded-md text-sm">
                                        <span className="font-semibold">{stop.storeName}</span> - {stop.address}
                                    </li>
                                ))}
                                </ol>
                            </div>
                        </Card>
                    ))}
                </div>
             ) : (
                <Card>
                    <div className="text-center py-10">
                        <p className="text-gray-500">Belum ada rencana rute pengiriman yang dibuat.</p>
                    </div>
                </Card>
             )}
        </div>
    );

    const salesVisitRouteContent = (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-brand-dark">Rute Kunjungan Sales</h2>
                <button
                    onClick={openCreateSalesModal}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Buat Rencana Kunjungan
                </button>
            </div>
            
             {relevantSalesVisitRoutes.length > 0 ? (
                 <div className="space-y-6">
                    {relevantSalesVisitRoutes.map(route => (
                        <Card key={route.id}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-brand-primary">Rencana Kunjungan untuk {users.find(u=>u.id === route.salesPersonId)?.name}</h3>
                                    <p className="text-sm text-gray-500">Total Kunjungan: {route.stops.length}</p>
                                </div>
                                <span className="text-xs font-semibold bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Tanggal: {route.date}</span>
                            </div>
                            <div className="mt-4 space-y-2">
                                <p className="text-sm font-semibold">Urutan Kunjungan Optimal:</p>
                                <ol className="list-decimal list-inside space-y-2">
                                {route.stops.map((stop) => (
                                    <li key={`${route.id}-${stop.visitId}`} className="p-2 bg-gray-50 rounded-md text-sm">
                                        <span className="font-semibold">{stop.storeName}</span> ({stop.purpose})
                                        <p className="text-xs text-gray-500">{stop.address}</p>
                                    </li>
                                ))}
                                </ol>
                            </div>
                        </Card>
                    ))}
                </div>
             ) : (
                <Card>
                    <div className="text-center py-10">
                        <p className="text-gray-500">Belum ada rencana rute kunjungan yang dibuat.</p>
                    </div>
                </Card>
             )}
        </div>
    );


    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-brand-dark">Perencanaan Rute</h1>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('delivery')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'delivery' 
                                ? 'border-brand-primary text-brand-primary' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        Rute Pengiriman
                    </button>
                    <button
                        onClick={() => setActiveTab('salesVisit')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'salesVisit' 
                                ? 'border-brand-primary text-brand-primary' 
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
                        `}
                    >
                        Rute Kunjungan Sales
                    </button>
                </nav>
            </div>
            
            <div className="mt-6">
                {activeTab === 'delivery' ? deliveryRouteContent : salesVisitRouteContent}
            </div>
            

            {/* Delivery Route Modal */}
            <Modal title="Buat Rencana Rute Pengiriman" isOpen={isDeliveryModalOpen} onClose={() => setIsDeliveryModalOpen(false)}>
                <div className="space-y-4">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                    
                    <p className="text-sm text-gray-600">Pilih pengemudi dan armada yang sudah diisi muatan. Sistem akan secara otomatis membuatkan rute yang efisien untuk semua pesanan di dalam armada tersebut.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pilih Pengemudi</label>
                            <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                                <option value="" disabled>-- Pilih Pengemudi --</option>
                                {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pilih Armada</label>
                            <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                                <option value="" disabled>-- Pilih Armada Siap Jalan --</option>
                                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>)}
                            </select>
                        </div>
                    </div>
                   
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button onClick={handleCreateDeliveryPlan} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark disabled:bg-gray-400" disabled={isLoading}>
                            {isLoading ? 'Menghasilkan...' : 'Hasilkan & Tetapkan Rute'}
                        </button>
                    </div>
                </div>
            </Modal>
            
            {/* Sales Visit Route Modal */}
            <Modal title="Buat Rencana Kunjungan Sales" isOpen={isSalesModalOpen} onClose={() => setIsSalesModalOpen(false)}>
                <div className="space-y-4">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{error}</div>}
                    
                    <p className="text-sm text-gray-600">Pilih sales dan tanggal untuk membuatkan rute kunjungan yang efisien berdasarkan jadwal yang ada.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pilih Sales</label>
                            <select value={selectedSalesPerson} onChange={e => setSelectedSalesPerson(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                                <option value="" disabled>-- Pilih Sales --</option>
                                {availableSales.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Pilih Tanggal</label>
                            <input type="date" value={selectedVisitDate} onChange={e => setSelectedVisitDate(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required />
                        </div>
                    </div>
                   
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsSalesModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button onClick={handleCreateSalesPlan} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark disabled:bg-gray-400" disabled={isLoading}>
                            {isLoading ? 'Menghasilkan...' : 'Hasilkan Rute Kunjungan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};