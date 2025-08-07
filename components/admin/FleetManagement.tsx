
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { Vehicle, VehicleStatus, Order, OrderStatus } from '../../types';
import { Modal } from '../ui/Modal';

const MoveOrderModal: React.FC<{
    orderToMove: Order;
    orderRegion: string | null;
    vehicles: Vehicle[];
    currentVehicleId: string;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (orderId: string, newVehicleId: string) => void;
    getOrderCapacity: (order: Order) => number;
    getVehicleLoad: (vehicleId: string) => number;
}> = ({ isOpen, onClose, orderToMove, orderRegion, vehicles, currentVehicleId, onConfirm, getOrderCapacity, getVehicleLoad }) => {
    
    const orderCapacity = getOrderCapacity(orderToMove);

    const availableVehicles = vehicles.filter(v => v.id !== currentVehicleId && v.status === VehicleStatus.IDLE && v.region === orderRegion);

    return (
        <Modal title={`Pindahkan Pesanan #${orderToMove.id.slice(-6)}`} isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <p>Pilih armada tujuan untuk pesanan toko <strong>{orderToMove.storeName}</strong> (Kapasitas: {orderCapacity.toFixed(1)} unit).</p>
                <p className="text-sm bg-blue-50 text-blue-800 p-2 rounded-lg">Hanya menampilkan armada yang beroperasi di wilayah <strong>{orderRegion}</strong>.</p>

                {availableVehicles.length > 0 ? (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {availableVehicles.map(v => {
                            const currentLoad = getVehicleLoad(v.id);
                            const newLoad = currentLoad + orderCapacity;
                            const isOverCapacity = newLoad > v.capacity;
                            return (
                                <li key={v.id}>
                                    <button 
                                        onClick={() => onConfirm(orderToMove.id, v.id)}
                                        className="w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <p className="font-semibold">{v.plateNumber} - {v.model}</p>
                                        <p className="text-sm text-gray-600">Muatan Saat Ini: {currentLoad.toFixed(1)} / {v.capacity}</p>
                                        <p className={`text-sm font-semibold ${isOverCapacity ? 'text-red-500' : 'text-green-600'}`}>
                                            Muatan Baru: {newLoad.toFixed(1)} / {v.capacity}
                                            {isOverCapacity && ' (Kapasitas Terlampaui!)'}
                                        </p>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">Tidak ada armada lain yang tersedia di wilayah ini.</p>
                )}
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                </div>
            </div>
        </Modal>
    );
};

export const FleetManagement: React.FC = () => {
    const { vehicles, orders, products, routes, reassignOrder, dispatchVehicle, stores } = useAppContext();
    const [moveModalState, setMoveModalState] = useState<{isOpen: boolean, order: Order | null, currentVehicleId: string | null, orderRegion: string | null}>({isOpen: false, order: null, currentVehicleId: null, orderRegion: null});

    const getOrderCapacity = (order: Order): number => {
        return order.items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product?.capacityUnit || 0) * item.quantity;
        }, 0);
    };

    const getVehicleLoad = (vehicleId: string): number => {
        return orders
            .filter(o => o.assignedVehicleId === vehicleId)
            .reduce((totalLoad, order) => totalLoad + getOrderCapacity(order), 0);
    };
    
    const handleOpenMoveModal = (order: Order, currentVehicleId: string) => {
        const store = stores.find(s => s.id === order.storeId);
        setMoveModalState({ isOpen: true, order, currentVehicleId, orderRegion: store?.region || null });
    };

    const handleCloseMoveModal = () => {
        setMoveModalState({ isOpen: false, order: null, currentVehicleId: null, orderRegion: null });
    };

    const handleConfirmMove = (orderId: string, newVehicleId: string) => {
        const result = reassignOrder(orderId, newVehicleId);
        if (result.success && result.warning) {
            alert(`Pesanan berhasil dipindahkan.\n\nPERINGATAN: ${result.warning}`);
        }
        handleCloseMoveModal();
    };
    
    const getStatusClass = (status: VehicleStatus) => {
        switch (status) {
            case VehicleStatus.IDLE: return 'bg-green-100 text-green-800';
            case VehicleStatus.DELIVERING: return 'bg-blue-100 text-blue-800';
            case VehicleStatus.REPAIR: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const ManifestStatus: React.FC<{ order: Order }> = ({ order }) => {
        const routeForOrder = routes.find(r => r.stops.some(s => s.orderId === order.id));
        let statusText: string = order.status;
        let statusClass = 'bg-gray-100 text-gray-800';

        if (order.status === OrderStatus.DELIVERED) {
            statusText = 'Terkirim (Rute Aktif)';
            statusClass = 'bg-teal-100 text-teal-800';
            if (routeForOrder) {
                const isTripFinished = routeForOrder.stops.every(s => s.status !== 'Pending');
                if (isTripFinished) {
                    statusText = 'Selesai';
                    statusClass = 'bg-green-100 text-green-800';
                }
            }
        } else if (order.status === OrderStatus.ROUTED) {
            statusText = 'Siap Kirim';
            statusClass = 'bg-cyan-100 text-cyan-800';
        } else if (order.status === OrderStatus.DELIVERING) {
            statusText = 'Diantar';
            statusClass = 'bg-indigo-100 text-indigo-800';
        } else if (order.status === OrderStatus.PENDING) {
            statusText = 'Pending';
            statusClass = 'bg-yellow-100 text-yellow-800';
        } else if (order.status === OrderStatus.FAILED) {
            statusText = 'Gagal';
            statusClass = 'bg-red-100 text-red-800';
        }

        return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusClass}`}>
                {statusText}
            </span>
        )
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Muatan & Armada</h1>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {vehicles.map(vehicle => {
                    const assignedOrders = orders.filter(o => o.assignedVehicleId === vehicle.id);
                    const currentLoad = getVehicleLoad(vehicle.id);
                    const capacityPercent = vehicle.capacity > 0 ? (currentLoad / vehicle.capacity) * 100 : 0;
                    
                    const activeRoute = vehicle.status === VehicleStatus.DELIVERING 
                        ? routes.find(r => r.vehicleId === vehicle.id && r.stops.some(s => s.status === 'Pending')) 
                        : null;

                    return (
                        <Card key={vehicle.id} className="flex flex-col">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-brand-dark">{vehicle.plateNumber}</h2>
                                        <p className="text-sm text-gray-500">{vehicle.model} - <span className="font-semibold">Wilayah: {vehicle.region}</span></p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(vehicle.status)}`}>
                                        {vehicle.status}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
                                        <span>Muatan</span>
                                        <span>{currentLoad.toFixed(1)} / {vehicle.capacity} unit</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4">
                                        <div 
                                            className={`h-4 rounded-full ${capacityPercent > 100 ? 'bg-red-500' : 'bg-brand-secondary'}`} 
                                            style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                                        ></div>
                                    </div>
                                    {capacityPercent > 100 && (
                                        <p className="text-xs text-red-600 font-semibold text-right mt-1">Kapasitas terlampaui!</p>
                                    )}
                                </div>

                                {activeRoute && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-sm font-semibold text-gray-600 mb-1">
                                            <span>Status Pengantaran</span>
                                            <span>{activeRoute.stops.filter(s => s.status !== 'Pending').length} / {activeRoute.stops.length} Selesai</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4">
                                            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${(activeRoute.stops.filter(s => s.status !== 'Pending').length / activeRoute.stops.length) * 100}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mt-6 flex-grow">
                                    <h3 className="font-semibold text-brand-dark mb-2">Daftar Muatan (Manifest)</h3>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                        {assignedOrders.length > 0 ? assignedOrders.map(order => (
                                            <div key={order.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{order.storeName}</p>
                                                    <p className="text-xs text-gray-500">ID: {order.id.slice(-6)} | Unit: {getOrderCapacity(order).toFixed(1)}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <ManifestStatus order={order} />
                                                    <button 
                                                        onClick={() => handleOpenMoveModal(order, vehicle.id)}
                                                        className="text-sm font-semibold text-brand-primary hover:underline disabled:text-gray-400 disabled:no-underline"
                                                        disabled={vehicle.status !== VehicleStatus.IDLE}
                                                    >
                                                        Pindahkan
                                                    </button>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-center text-gray-500 py-4">Belum ada pesanan yang ditugaskan.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-4">
                                {vehicle.status === VehicleStatus.IDLE && assignedOrders.some(o => o.status === 'Routed') && (
                                    <button 
                                        onClick={() => dispatchVehicle(vehicle.id)}
                                        className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                                    >
                                        Berangkatkan Armada (Dispatch)
                                    </button>
                                )}
                                 {vehicle.status === VehicleStatus.DELIVERING && (
                                    <p className="text-center text-sm font-semibold text-blue-600 p-2 bg-blue-50 rounded-lg">Sedang dalam pengiriman...</p>
                                )}
                            </div>
                        </Card>
                    )
                })}
            </div>
            
            {moveModalState.isOpen && moveModalState.order && moveModalState.currentVehicleId && (
                <MoveOrderModal 
                    isOpen={moveModalState.isOpen}
                    onClose={handleCloseMoveModal}
                    orderToMove={moveModalState.order}
                    orderRegion={moveModalState.orderRegion}
                    currentVehicleId={moveModalState.currentVehicleId}
                    vehicles={vehicles}
                    onConfirm={handleConfirmMove}
                    getOrderCapacity={getOrderCapacity}
                    getVehicleLoad={getVehicleLoad}
                />
            )}
        </div>
    );
};