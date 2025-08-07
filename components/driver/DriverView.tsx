
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { ICONS } from '../../constants';
import { Card } from '../ui/Card';
import { RoutePlan, RouteStop, OrderStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { RouteMap } from '../ui/RouteMap';

export const DriverView: React.FC = () => {
    const { routes, currentUser, updateRoute, logout, updateOrderStatus, completeVehicleRoute } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -- State and Memos for multi-trip handling --
    const [isStarted, setIsStarted] = useState(false);
    
    const todayRoutes = useMemo(() => {
        if (!currentUser) return [];
        const today = new Date().toISOString().split('T')[0];
        return routes
            .filter(r => r.driverId === currentUser.id && r.date === today)
            .sort((a,b) => a.id.localeCompare(b.id)); // Ensure consistent trip order
    }, [routes, currentUser]);

    const activeRoute = useMemo(() => {
        // The active route is the first one that still has pending stops
        return todayRoutes.find(r => r.stops.some(s => s.status === 'Pending'));
    }, [todayRoutes]);
    
    const activeTripIndex = useMemo(() => {
        if (!activeRoute) return -1;
        return todayRoutes.findIndex(r => r.id === activeRoute.id);
    }, [todayRoutes, activeRoute]);

    const allTasksCompleted = useMemo(() => {
        // All tasks are completed if there are routes for today, but no active ones are left.
        return todayRoutes.length > 0 && !activeRoute;
    }, [todayRoutes, activeRoute]);

    // Overall progress tracking
    const totalStopsForDay = useMemo(() => todayRoutes.reduce((sum, r) => sum + r.stops.length, 0), [todayRoutes]);
    const completedStopsForDay = useMemo(() => {
         return todayRoutes.reduce((sum, r) => sum + r.stops.filter(s => s.status !== 'Pending').length, 0);
    }, [todayRoutes]);
    
    // -- Modal and Photo State --
    const [showProofModal, setShowProofModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stopBeingConfirmed, setStopBeingConfirmed] = useState<RouteStop | null>(null);
    const [mapViewRoute, setMapViewRoute] = useState<RoutePlan | null>(null);
    const depotLocation = { lat: -7.8664161, lng: 110.1486773 };

    // -- Event Handlers --

    const handleStopUpdate = (stop: RouteStop, newStatus: 'Completed' | 'Failed', proofImage?: string) => {
        if (!activeRoute) return;

        // 1. Update order status in global context
        updateOrderStatus(stop.orderId, newStatus === 'Completed' ? OrderStatus.DELIVERED : OrderStatus.FAILED);

        // 2. Create the updated version of the current route
        const updatedStops = activeRoute.stops.map(s =>
            s.orderId === stop.orderId ? { ...s, status: newStatus, proofOfDeliveryImage: proofImage } : s
        );
        const updatedRoute = { ...activeRoute, stops: updatedStops };
        
        // 3. Update the route in the global context
        updateRoute(updatedRoute);

        // 4. Check if the entire day's work is done to free up the vehicle
        const isCurrentTripNowFinished = updatedStops.every(s => s.status !== 'Pending');
        const hasMorePendingTrips = todayRoutes.some(r => r.id !== activeRoute.id && r.stops.some(s => s.status === 'Pending'));
        
        if (isCurrentTripNowFinished && !hasMorePendingTrips) {
            completeVehicleRoute(activeRoute.vehicleId);
        }
    };
    
    const handleAttemptSuccess = (stop: RouteStop) => {
        setStopBeingConfirmed(stop);
        fileInputRef.current?.click();
    };

    const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target?.result as string);
                setShowProofModal(true);
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const handleConfirmDelivery = () => {
        if (!stopBeingConfirmed || !capturedImage) return;
        handleStopUpdate(stopBeingConfirmed, 'Completed', capturedImage);
        setShowProofModal(false);
        setCapturedImage(null);
        setStopBeingConfirmed(null);
    };

    const handleFailDelivery = (stop: RouteStop) => {
        if (!activeRoute) return;
        handleStopUpdate(stop, 'Failed');
    };

    // -- Render Logic --

    const Header: React.FC<{title: string; subtitle?: string}> = ({title, subtitle}) => (
         <header className="bg-brand-primary text-white p-4 flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold">{title}</h1>
                {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
            </div>
            <button onClick={logout} className="p-2 rounded-full hover:bg-white/20" aria-label="Keluar">
                {ICONS.logout}
            </button>
        </header>
    );

    if (!currentUser) return <p>Loading...</p>;

    // Case 1: No routes for today at all
    if (todayRoutes.length === 0) {
        return (
            <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                <Header title="Portal Driver" subtitle={currentUser.name} />
                <div className="flex-1 flex justify-center items-center p-4 text-center">
                    <p className="text-gray-600">Tidak ada rute yang ditugaskan untuk Anda hari ini.</p>
                </div>
            </div>
        );
    }

    // Case 2: All routes for today are completed
    if (allTasksCompleted) {
        const successfulStops = todayRoutes.reduce((sum, r) => sum + r.stops.filter(s => s.status === 'Completed').length, 0);
        const failedStops = todayRoutes.reduce((sum, r) => sum + r.stops.filter(s => s.status === 'Failed').length, 0);
        return (
             <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                 <Header title="Ringkasan Akhir Hari" />
                <div className="p-4 flex-1">
                    <Card className="h-full flex flex-col justify-center items-center">
                        <span className="text-green-500 inline-block">{React.cloneElement(ICONS.checkCircle, {width: 64, height: 64})}</span>
                        <h2 className="text-2xl font-bold text-brand-dark mt-4">Semua Pengiriman Selesai!</h2>
                        <p className="text-gray-600 mt-2">Kerja bagus, {currentUser.name}!</p>
                        <div className="mt-6 text-left space-y-2 bg-gray-50 p-4 rounded-lg w-full">
                             <p><strong>Total Perjalanan:</strong> {todayRoutes.length}</p>
                             <p><strong>Berhasil:</strong> {successfulStops} pemberhentian</p>
                             <p><strong>Gagal:</strong> {failedStops} pemberhentian</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
    
    // Case 3: Routes exist, but driver hasn't started the day
    if (!isStarted) {
        return (
            <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                 <Header title="Portal Driver" subtitle={currentUser.name} />
                <div className="p-4 flex-1">
                    <Card className="h-full flex flex-col justify-center">
                         <h2 className="text-xl font-bold text-brand-dark mb-4 text-center">Ringkasan Tugas Hari Ini</h2>
                         <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Total Perjalanan:</span>
                                <span className="font-bold">{todayRoutes.length}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Total Pemberhentian:</span>
                                <span className="font-bold">{totalStopsForDay}</span>
                            </div>
                         </div>
                          <button 
                            onClick={() => setIsStarted(true)}
                            className="w-full mt-8 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                             {ICONS.navigation} Mulai Rute Saya
                          </button>
                          <button
                            onClick={() => setMapViewRoute(todayRoutes[0])}
                            className="w-full mt-4 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                             Lihat Peta Rute
                          </button>
                    </Card>
                </div>
                <Modal title="Peta Rute Perjalanan" isOpen={!!mapViewRoute} onClose={() => setMapViewRoute(null)}>
                    {mapViewRoute && <RouteMap stops={mapViewRoute.stops} depot={depotLocation} />}
                </Modal>
            </div>
        )
    }

    // Case 4: Driver has started the day and there's an active route
    if (activeRoute) {
        return (
            <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handlePhotoCapture} />
                <Header title={`Perjalanan ${activeTripIndex + 1} dari ${todayRoutes.length}`} subtitle={`${completedStopsForDay} / ${totalStopsForDay} pemberhentian selesai`} />
                 <div className="p-2 bg-white">
                    <button
                        onClick={() => setMapViewRoute(activeRoute)}
                        className="w-full bg-white text-brand-primary border border-brand-primary font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-brand-light"
                    >
                        Lihat Peta Perjalanan Ini
                    </button>
                </div>
                <main className="flex-1 p-2 overflow-y-auto bg-brand-background">
                    <ol className="space-y-3">
                        {activeRoute.stops.map((stop, index) => (
                            <li key={stop.orderId}>
                                <Card className={`p-4 transition-all ${stop.status !== 'Pending' ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4">
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${stop.status === 'Completed' ? 'bg-green-500' : stop.status === 'Failed' ? 'bg-red-500' : 'bg-brand-primary'}`}>
                                                {stop.status === 'Completed' ? React.cloneElement(ICONS.checkCircle, {width: 16, height: 16}) : stop.status === 'Failed' ? React.cloneElement(ICONS.xCircle, {width: 16, height: 16}) : index + 1}
                                            </span>
                                            <div>
                                                <p className="font-bold text-brand-dark">{stop.storeName}</p>
                                                <p className="text-sm text-gray-600">{stop.address}</p>
                                            </div>
                                        </div>
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`} target="_blank" rel="noopener noreferrer" className="p-2 text-brand-primary hover:bg-brand-light rounded-full">
                                            {ICONS.navigation}
                                        </a>
                                    </div>
                                    {stop.status === 'Pending' && (
                                         <div className="mt-4 grid grid-cols-2 gap-2">
                                             <button onClick={() => handleAttemptSuccess(stop)} className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-3 rounded-lg">
                                                {ICONS.checkCircle} Berhasil
                                             </button>
                                             <button onClick={() => handleFailDelivery(stop)} className="flex items-center justify-center gap-2 bg-red-500 text-white font-semibold py-2 px-3 rounded-lg">
                                                {ICONS.xCircle} Gagal
                                             </button>
                                         </div>
                                    )}
                                </Card>
                            </li>
                        ))}
                    </ol>
                </main>
                 <Modal title="Konfirmasi Bukti Pengantaran" isOpen={showProofModal} onClose={() => setShowProofModal(false)}>
                    <div className="space-y-4">
                        <p>Harap konfirmasi foto ini sebagai bukti pengantaran untuk toko <strong>{stopBeingConfirmed?.storeName}</strong>.</p>
                        {capturedImage && (
                            <img src={capturedImage} alt="Bukti pengantaran" className="w-full h-auto rounded-lg border" />
                        )}
                        <div className="flex justify-end gap-2 pt-4">
                            <button type="button" onClick={() => setShowProofModal(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Ambil Ulang</button>
                            <button onClick={handleConfirmDelivery} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">
                                Konfirmasi Pengiriman
                            </button>
                        </div>
                    </div>
                </Modal>
                <Modal title="Peta Rute Perjalanan" isOpen={!!mapViewRoute} onClose={() => setMapViewRoute(null)}>
                    {mapViewRoute && <RouteMap stops={mapViewRoute.stops} depot={depotLocation} />}
                </Modal>
            </div>
        );
    }
    
    // Fallback if there's no active route but not all are completed (should not be reached with current logic)
    return (
        <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
            <Header title="Portal Driver" subtitle={currentUser.name} />
            <div className="flex-1 flex justify-center items-center p-4 text-center">
                <p className="text-gray-600">Menunggu perjalanan berikutnya...</p>
            </div>
        </div>
    );
};
