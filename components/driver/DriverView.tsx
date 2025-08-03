import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { ICONS } from '../../constants';
import { Card } from '../ui/Card';
import { RoutePlan, RouteStop, OrderStatus } from '../../types';
import { Modal } from '../ui/Modal';

export const DriverView: React.FC = () => {
    const { routes, currentUser, updateRoute, logout, updateOrderStatus, completeVehicleRoute } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const todayRoute = useMemo(() => {
        if (!currentUser) return undefined;
        const today = new Date().toISOString().split('T')[0];
        return routes.find(r => r.driverId === currentUser.id && r.date === today);
    }, [routes, currentUser]);

    const [currentRoute, setCurrentRoute] = useState<RoutePlan | undefined>(todayRoute);
    const [isStarted, setIsStarted] = useState(false);
    
    // State for photo capture flow
    const [showProofModal, setShowProofModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stopBeingConfirmed, setStopBeingConfirmed] = useState<RouteStop | null>(null);


    useEffect(() => {
        setCurrentRoute(todayRoute);
    }, [todayRoute]);
    
    const handleFailDelivery = (stop: RouteStop) => {
        if (!currentRoute) return;

        updateOrderStatus(stop.orderId, OrderStatus.FAILED);
        const updatedStops = currentRoute.stops.map(s => 
            s.orderId === stop.orderId ? { ...s, status: 'Failed' as const } : s
        );

        const allStopsFinished = updatedStops.every(s => s.status !== 'Pending');
        if (allStopsFinished) {
            completeVehicleRoute(currentRoute.vehicleId);
        }
        
        const updatedRoute = { ...currentRoute, stops: updatedStops };
        setCurrentRoute(updatedRoute);
        updateRoute(updatedRoute);
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
        if (!currentRoute || !stopBeingConfirmed || !capturedImage) return;

        updateOrderStatus(stopBeingConfirmed.orderId, OrderStatus.DELIVERED);

        const updatedStops = currentRoute.stops.map(s => 
            s.orderId === stopBeingConfirmed.orderId ? { ...s, status: 'Completed' as const, proofOfDeliveryImage: capturedImage } : s
        );

        const allStopsFinished = updatedStops.every(s => s.status !== 'Pending');
        if (allStopsFinished) {
            completeVehicleRoute(currentRoute.vehicleId);
        }
        
        const updatedRoute = { ...currentRoute, stops: updatedStops };
        setCurrentRoute(updatedRoute);
        updateRoute(updatedRoute);

        setShowProofModal(false);
        setCapturedImage(null);
        setStopBeingConfirmed(null);
    };


    const allTasksCompleted = useMemo(() => {
      return currentRoute && currentRoute.stops.every(s => s.status !== 'Pending');
    }, [currentRoute]);

    if (!currentUser) {
        return <p>Loading...</p>;
    }
    
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

    if (!currentRoute) {
        return (
            <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                <Header title="Portal Driver" subtitle={currentUser.name} />
                <div className="flex-1 flex justify-center items-center p-4 text-center">
                    <p className="text-gray-600">Tidak ada rute yang ditugaskan untuk Anda hari ini.</p>
                </div>
            </div>
        )
    }

    if (allTasksCompleted) {
        return (
             <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                 <Header title="Ringkasan Akhir Hari" />
                <div className="p-4 flex-1">
                    <Card className="h-full flex flex-col justify-center items-center">
                        <span className="text-green-500 inline-block">{React.cloneElement(ICONS.checkCircle, {width: 64, height: 64})}</span>
                        <h2 className="text-2xl font-bold text-brand-dark mt-4">Semua Pengiriman Selesai!</h2>
                        <p className="text-gray-600 mt-2">Kerja bagus, {currentUser.name}!</p>
                        <div className="mt-6 text-left space-y-2 bg-gray-50 p-4 rounded-lg w-full">
                             <p><strong>Berhasil:</strong> {currentRoute.stops.filter(s => s.status === 'Completed').length} pemberhentian</p>
                             <p><strong>Gagal:</strong> {currentRoute.stops.filter(s => s.status === 'Failed').length} pemberhentian</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }
    
    if (!isStarted) {
        return (
            <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
                 <Header title="Portal Driver" subtitle={currentUser.name} />
                <div className="p-4 flex-1">
                    <Card className="h-full flex flex-col justify-center">
                         <h2 className="text-xl font-bold text-brand-dark mb-4 text-center">Ringkasan Tugas Hari Ini</h2>
                         <div className="space-y-4">
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Total Pemberhentian:</span>
                                <span className="font-bold">{currentRoute.stops.length}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Estimasi Durasi:</span>
                                <span className="font-bold">~ {Math.round(currentRoute.stops.length * 0.4)} jam</span>
                            </div>
                         </div>
                          <button 
                            onClick={() => setIsStarted(true)}
                            className="w-full mt-8 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                          >
                             {ICONS.navigation} Mulai Rute Saya
                          </button>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handlePhotoCapture} />
             <Header title="Rute Pengiriman" subtitle={`${currentRoute.stops.filter(s => s.status !== 'Pending').length} / ${currentRoute.stops.length} selesai`} />
            <main className="flex-1 p-2 overflow-y-auto bg-brand-background">
                <ol className="space-y-3">
                    {currentRoute.stops.map((stop, index) => (
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
        </div>
    );
};