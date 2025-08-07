
import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '../ui/Card';
import { useAppContext } from '../../hooks/useAppContext';
import { Role, RoutePlan, VehicleStatus } from '../../types';
import { ICONS } from '../../constants';
import { Modal } from '../ui/Modal';
import { RouteMap } from '../ui/RouteMap';

type PlanningTab = 'delivery' | 'salesVisit';

export const RoutePlanning: React.FC = () => {
    const { 
        users, vehicles, routes, createRoutePlan, dispatchVehicle,
        visits, salesVisitRoutes, createSalesVisitRoutePlan 
    } = useAppContext();
    
    const [activeTab, setActiveTab] = useState<PlanningTab>('delivery');

    // Common State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mapViewRoute, setMapViewRoute] = useState<RoutePlan | null>(null);
    const depotLocation = { lat: -7.8664161, lng: 110.1486773 };

    // Delivery Planning State
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState('');

    // Sales Visit Planning State
    const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
    const [selectedSalesPerson, setSelectedSalesPerson] = useState('');
    const [selectedVisitDate, setSelectedVisitDate] = useState(new Date().toISOString().split('T')[0]);

    // Memos for Sales
    const availableSales = useMemo(() => users.filter(u => u.role === Role.SALES), [users]);
    
    const relevantSalesVisitRoutes = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return salesVisitRoutes.filter(r => r.date >= today);
    }, [salesVisitRoutes]);

    const routesByDateAndDriver = useMemo(() => {
        const grouped: Record<string, Record<string, RoutePlan[]>> = {};
        
        routes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(route => {
            const date = route.date;
            const driverId = route.driverId;
            if (!grouped[date]) {
                grouped[date] = {};
            }
            if (!grouped[date][driverId]) {
                grouped[date][driverId] = [];
            }
            grouped[date][driverId].push(route);
        });
        return grouped;
    }, [routes]);
    
    // Memos for Delivery Planning
    const availableVehicles = useMemo(() => {
        return vehicles.filter(v => v.status === VehicleStatus.IDLE);
    }, [vehicles]);

    const availableDrivers = useMemo(() => {
        const driversWithRoutesOnDate = routes
            .filter(r => r.date === selectedDeliveryDate)
            .map(r => r.driverId);
        
        return users.filter(u => u.role === Role.DRIVER && !driversWithRoutesOnDate.includes(u.id));
    }, [users, routes, selectedDeliveryDate]);


    // Handlers for Delivery
    const openCreateDeliveryModal = () => {
        setSelectedDeliveryDate(new Date().toISOString().split('T')[0]);
        setSelectedVehicleId('');
        setSelectedDriverId('');
        setError(null);
        setSuccessMessage(null);
        setIsDeliveryModalOpen(true);
    }
    
    const handleCreateDeliveryPlan = async () => {
        if (!selectedDeliveryDate || !selectedVehicleId || !selectedDriverId) {
            setError("Harap pilih tanggal, armada, dan pengemudi.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await createRoutePlan(selectedDeliveryDate, selectedVehicleId, selectedDriverId);
            if (result.success) {
                setSuccessMessage(result.message);
                setIsDeliveryModalOpen(false);
            } else {
                setError(result.message);
            }
        } catch (e) {
            console.error(e);
            setError("Gagal membuat rencana rute. Terjadi kesalahan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDispatchVehicle = (vehicleId: string) => {
        if(window.confirm('Anda yakin ingin memberangkatkan armada ini? Status pesanan terkait akan berubah menjadi "Delivering".')) {
            dispatchVehicle(vehicleId);
            setSuccessMessage(`Armada telah diberangkatkan!`);
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    }
    
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

            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">{successMessage}</div>}
             
             {Object.keys(routesByDateAndDriver).length > 0 ? (
                <div className="space-y-8">
                    {Object.entries(routesByDateAndDriver).map(([date, driverRoutes]) => (
                        <div key={date}>
                             <h3 className="text-xl font-bold text-brand-dark pb-2 mb-4 border-b border-gray-300">
                                Rencana untuk Tanggal: {date}
                            </h3>
                            <div className="space-y-6">
                            {Object.entries(driverRoutes).map(([driverId, routeList]) => {
                                const driver = users.find(d => d.id === driverId);
                                const vehicle = vehicles.find(v => v.id === routeList[0]?.vehicleId);
                                if (!driver || !vehicle) return null;

                                const vehicleIsIdle = vehicle.status === VehicleStatus.IDLE;
                                const canDispatch = vehicleIsIdle && routeList.some(r => r.stops.length > 0);
                                
                                return (
                                <Card key={driverId}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-brand-primary">Pengemudi: {driver.name}</h4>
                                            <p className="text-sm text-gray-500">Armada: {vehicle.plateNumber} ({vehicle.model})</p>
                                        </div>
                                        {canDispatch && (
                                            <button
                                                onClick={() => handleDispatchVehicle(vehicle.id)}
                                                className="flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300 text-sm"
                                            >
                                                {ICONS.navigation}
                                                Berangkatkan
                                            </button>
                                        )}
                                        {!vehicleIsIdle && (
                                            <span className="text-sm font-semibold text-blue-600 p-2 bg-blue-50 rounded-lg">Sedang Mengirim</span>
                                        )}
                                    </div>
                                    
                                    {routeList.map((route, index) => (
                                        <div key={route.id} className="mt-4 border-t pt-4">
                                            <div className="flex justify-between items-center">
                                                <h5 className="font-semibold text-gray-800">Perjalanan {index + 1}: Wilayah {route.region} ({route.stops.length} pemberhentian)</h5>
                                                <button onClick={() => setMapViewRoute(route)} className="text-sm text-brand-primary hover:underline">
                                                    Lihat Peta
                                                </button>
                                            </div>
                                            <ol className="list-decimal list-inside space-y-2 mt-2 pl-2">
                                            {route.stops.map((stop) => (
                                                <li key={`${route.id}-${stop.orderId}`} className="p-2 bg-gray-50 rounded-md text-sm">
                                                    <span className="font-semibold">{stop.storeName}</span> - {stop.address}
                                                </li>
                                            ))}
                                            </ol>
                                        </div>
                                    ))}

                                </Card>
                            )})}
                            </div>
                        </div>
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
                    
                    <p className="text-sm text-gray-600">Pilih tanggal, armada, dan pengemudi. Sistem akan mencari pesanan yang belum terjadwal di wilayah armada tersebut dan membuatkan rute yang efisien.</p>

                    <div>
                        <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">Pilih Tanggal Pengiriman</label>
                        <input
                            type="date"
                            id="deliveryDate"
                            value={selectedDeliveryDate}
                            onChange={e => setSelectedDeliveryDate(e.target.value)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700">Pilih Armada</label>
                        <select
                            id="vehicleId"
                            value={selectedVehicleId}
                            onChange={e => setSelectedVehicleId(e.target.value)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                            required
                        >
                            <option value="" disabled>-- Pilih Armada --</option>
                            {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.model} - {v.region})</option>)}
                        </select>
                         {availableVehicles.length === 0 && <p className="text-xs text-yellow-600 mt-1">Tidak ada armada yang sedang 'Idle'.</p>}
                    </div>

                     <div>
                        <label htmlFor="driverId" className="block text-sm font-medium text-gray-700">Pilih Pengemudi</label>
                        <select
                            id="driverId"
                            value={selectedDriverId}
                            onChange={e => setSelectedDriverId(e.target.value)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                            required
                        >
                            <option value="" disabled>-- Pilih Pengemudi --</option>
                            {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        {availableDrivers.length === 0 && <p className="text-xs text-yellow-600 mt-1">Tidak ada pengemudi yang tersedia pada tanggal ini.</p>}
                    </div>
                   
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsDeliveryModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button onClick={handleCreateDeliveryPlan} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark disabled:bg-gray-400" disabled={isLoading}>
                            {isLoading ? 'Membuat Rute...' : 'Hasilkan Rute'}
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

            <Modal 
                title={`Peta Rute untuk ${users.find(u => u.id === mapViewRoute?.driverId)?.name || 'Driver'}`} 
                isOpen={!!mapViewRoute} 
                onClose={() => setMapViewRoute(null)}
            >
                {mapViewRoute && <RouteMap stops={mapViewRoute.stops} depot={depotLocation} />}
            </Modal>
        </div>
    );
};
