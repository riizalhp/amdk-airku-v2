import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { Order, OrderStatus, Partner, Product, Vehicle, OrderItem, VehicleStatus } from '../../types';
import { ICONS } from '../../constants';
import { Modal } from '../ui/Modal';

const getStatusClass = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
        case OrderStatus.ROUTED: return 'bg-blue-100 text-blue-800';
        case OrderStatus.DELIVERING: return 'bg-indigo-100 text-indigo-800';
        case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
        case OrderStatus.FAILED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(status)}`}>
        {status}
    </span>
);

const EditOrderModal: React.FC<{
    order: Order;
    isOpen: boolean;
    onClose: () => void;
}> = ({ order, isOpen, onClose }) => {
    const { products, vehicles, updateOrder, orders } = useAppContext();
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [assignedVehicleId, setAssignedVehicleId] = useState<string | null>(null);

    useEffect(() => {
        if (order) {
            setCart(JSON.parse(JSON.stringify(order.items)));
            setAssignedVehicleId(order.assignedVehicleId);
        }
    }, [order]);

    const getItemsCapacity = (items: OrderItem[]): number => {
        return items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product?.capacityUnit || 0) * item.quantity;
        }, 0);
    };

    const handleAddProduct = (productId: string) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === productId);
            if (existingItem) {
                return prevCart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { productId, quantity: 1 }];
        });
    };

    const handleUpdateCart = (productId: string, field: 'quantity' | 'specialPrice', value: number) => {
        let finalValue = value;
        if (field === 'quantity') {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const originalItem = order.items.find(i => i.productId === productId);
            const originalQuantity = originalItem?.quantity || 0;
            const quantityDelta = value - originalQuantity;
            const availableStock = product.stock - product.reservedStock;

            if (quantityDelta > availableStock) {
                alert(`Stok untuk ${product.name} tidak mencukupi. Hanya bisa menambah ${availableStock} unit lagi.`);
                finalValue = originalQuantity + availableStock;
            }

            if (finalValue <= 0) {
                setCart(prevCart => prevCart.filter(item => item.productId !== productId));
                return;
            }
        }
        setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, [field]: finalValue } : item));
    };

    const handleSave = () => {
        const result = updateOrder(order.id, { items: cart, assignedVehicleId });
        alert(result.message);
        if (result.success) {
            onClose();
        }
    };
    
    const totalAmount = useMemo(() => cart.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = item.specialPrice && item.specialPrice > 0 ? item.specialPrice : product?.price || 0;
        return acc + (price * item.quantity);
    }, 0), [cart, products]);

    const currentCapacity = useMemo(() => getItemsCapacity(cart), [cart, products]);
    const vehicleForSelection = vehicles.filter(v => v.status === VehicleStatus.IDLE || v.id === order.assignedVehicleId);

    return (
        <Modal title={`Edit Pesanan #${order.id.slice(-6)}`} isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                {/* Cart Editor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Item Pesanan</label>
                    <div className="space-y-2 mt-1 border p-4 rounded-lg">
                        {cart.map(item => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={item.productId} className="grid grid-cols-4 gap-2 items-center">
                                    <span className="text-sm col-span-2">{product?.name}</span>
                                    <input type="number" min="0" value={item.quantity} onChange={e => handleUpdateCart(item.productId, 'quantity', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                    <input type="number" min="0" placeholder="Kosongi" value={item.specialPrice || ''} onChange={e => handleUpdateCart(item.productId, 'specialPrice', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                </div>
                            )
                        })}
                        <div className="text-right font-bold mt-2 pt-2 border-t">
                            Total: Rp {totalAmount.toLocaleString('id-ID')}
                        </div>
                    </div>
                </div>
                {/* Vehicle Assignment */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tugaskan ke Armada</label>
                    <select value={assignedVehicleId || ''} onChange={e => setAssignedVehicleId(e.target.value || null)} className="w-full p-2 border rounded mt-1 bg-white">
                        <option value="">Belum Ditugaskan</option>
                        {vehicleForSelection.map(v => {
                             const currentLoad = orders.filter(o => o.assignedVehicleId === v.id && o.id !== order.id).reduce((load, o) => load + getItemsCapacity(o.items), 0);
                             const remainingCapacity = v.capacity - currentLoad;
                             const canFit = remainingCapacity >= currentCapacity;
                            return <option key={v.id} value={v.id} disabled={!canFit}>{v.plateNumber} (Sisa: {remainingCapacity.toFixed(1)}) {canFit ? "" : "- Penuh"}</option>
                        })}
                    </select>
                     <p className="text-xs text-gray-500 mt-1">Total kapasitas pesanan ini: {currentCapacity.toFixed(1)} unit.</p>
                </div>
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                    <button onClick={handleSave} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">Simpan Perubahan</button>
                </div>
            </div>
        </Modal>
    );
};


export const OrderManagement: React.FC = () => {
    const { orders, stores, products, vehicles, addOrder, routes, currentUser, partners } = useAppContext();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const [selectedStore, setSelectedStore] = useState<string>('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [viewingProof, setViewingProof] = useState<string | null>(null);
    const [orderedBySource, setOrderedBySource] = useState('self');

    const filteredOrders = useMemo(() => {
        if (filterStatus === 'all') {
            return orders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        }
        return orders.filter(order => order.status === filterStatus).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders, filterStatus]);
    
    const handleAddProduct = (productId: string) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === productId);
            if (existingItem) {
                return prevCart.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prevCart, { productId, quantity: 1 }];
        });
    };

    const handleUpdateCart = (productId: string, field: 'quantity' | 'specialPrice', value: number) => {
        let finalValue = value;
        if (field === 'quantity') {
            const product = products.find(p => p.id === productId);
            const availableStock = product ? product.stock - product.reservedStock : 0;

            if (value > availableStock) {
                alert(`Stok untuk ${product?.name} tidak mencukupi. Stok tersedia: ${availableStock}.`);
                finalValue = availableStock;
            }

            if (finalValue <= 0) {
                setCart(prevCart => prevCart.filter(item => item.productId !== productId));
                return;
            }
        }
        
        setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, [field]: finalValue } : item));
    };

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore || cart.length === 0) {
            alert('Silakan pilih toko dan tambahkan setidaknya satu produk.');
            return;
        }

        let orderedByData;
        if (orderedBySource === 'self') {
            if (!currentUser) {
                alert("Sesi tidak valid.");
                return;
            }
            orderedByData = { id: currentUser.id, name: currentUser.name, role: currentUser.role };
        } else {
            const partner = partners.find((p: Partner) => p.id === orderedBySource);
            if (!partner) {
                alert("Mitra tidak ditemukan.");
                return;
            }
            orderedByData = { id: partner.id, name: partner.name, role: 'Mitra' };
        }

        const result = addOrder({ storeId: selectedStore, items: cart, orderedBy: orderedByData });
        alert(result.message);
        if (result.success) {
            setIsAddModalOpen(false);
        }
    };
    
    const totalAmount = useMemo(() => cart.reduce((acc, item) => {
        const product = products.find(p => p.id === item.productId);
        const price = item.specialPrice && item.specialPrice > 0 ? item.specialPrice : product?.price || 0;
        return acc + (price * item.quantity);
    }, 0), [cart, products]);

    const openAddOrderModal = () => {
        setSelectedStore('');
        setCart([]);
        setOrderedBySource('self');
        setIsAddModalOpen(true);
    };
    
    const openEditModal = (order: Order) => {
        setEditingOrder(order);
        setIsEditModalOpen(true);
    };

    const toggleExpandOrder = (orderId: string) => {
        setExpandedOrderId(prev => (prev === orderId ? null : orderId));
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Pesanan</h1>
                <button onClick={openAddOrderModal} className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300">
                    {ICONS.plus} Tambah Pesanan
                </button>
            </div>
            
            <div className="flex space-x-2">
                <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${filterStatus === 'all' ? 'bg-brand-primary text-white' : 'bg-white text-gray-700'}`}>All</button>
                {Object.values(OrderStatus).map(status => (
                     <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${filterStatus === status ? 'bg-brand-primary text-white' : 'bg-white text-gray-700'}`}>{status}</button>
                ))}
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-1 py-3 w-8"></th>
                                <th scope="col" className="px-6 py-3">Order ID</th>
                                <th scope="col" className="px-6 py-3">Nama Toko</th>
                                <th scope="col" className="px-6 py-3">Dipesan Oleh</th>
                                <th scope="col" className="px-6 py-3">Tanggal</th>
                                <th scope="col" className="px-6 py-3">Total</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Armada</th>
                                <th scope="col" className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order: Order) => {
                                const assignedVehicle = vehicles.find(v => v.id === order.assignedVehicleId);
                                const isExpanded = expandedOrderId === order.id;

                                let proofImage: string | undefined = undefined;
                                if (order.status === OrderStatus.DELIVERED) {
                                    for (const route of routes) {
                                        const stop = route.stops.find(s => s.orderId === order.id);
                                        if (stop?.proofOfDeliveryImage) {
                                            proofImage = stop.proofOfDeliveryImage;
                                            break;
                                        }
                                    }
                                }
                                
                                return (
                                <React.Fragment key={order.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-1 py-4 text-center">
                                            <button onClick={() => toggleExpandOrder(order.id)} className={`p-1 rounded-full hover:bg-gray-200 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                {ICONS.chevronDown}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.id.slice(-6).toUpperCase()}</td>
                                        <td className="px-6 py-4">{order.storeName}</td>
                                        <td className="px-6 py-4 text-xs">
                                            <p className="font-semibold">{order.orderedBy.name}</p>
                                            <p className="text-gray-500">[{order.orderedBy.role}]</p>
                                        </td>
                                        <td className="px-6 py-4">{order.orderDate}</td>
                                        <td className="px-6 py-4">Rp {order.totalAmount.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                                        <td className="px-6 py-4 font-mono text-xs">{assignedVehicle ? assignedVehicle.plateNumber : 'Belum Ditugaskan'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center space-x-2">
                                                {proofImage ? (
                                                    <button onClick={() => setViewingProof(proofImage)} className="text-brand-primary hover:text-brand-dark p-1 rounded-full hover:bg-brand-light">
                                                        {React.cloneElement(ICONS.camera, {width: 20, height: 20})}
                                                    </button>
                                                ) : <span className="w-[28px]">-</span>}
                                                {(order.status === OrderStatus.PENDING || order.status === OrderStatus.ROUTED) && (
                                                    <button onClick={() => openEditModal(order)} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-100">
                                                        {React.cloneElement(ICONS.edit, {width: 20, height: 20})}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={9} className="p-4">
                                                <div className="p-4 bg-white rounded-md shadow-inner">
                                                    <h4 className="font-semibold text-sm mb-2 text-brand-dark">Detail Item Pesanan</h4>
                                                    <ul className="text-xs space-y-1">
                                                        {order.items.map(item => {
                                                            const product = products.find(p => p.id === item.productId);
                                                            const price = item.specialPrice ?? product?.price ?? 0;
                                                            return (
                                                                <li key={item.productId} className="flex justify-between items-center border-b last:border-b-0 py-1">
                                                                    <span>{product?.name}</span>
                                                                    <span>{item.quantity} x Rp {price.toLocaleString('id-ID')}</span>
                                                                    <span className="font-semibold">Rp {(item.quantity * price).toLocaleString('id-ID')}</span>
                                                                </li>
                                                            )
                                                        })}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>
            
            <Modal title="Tambah Pesanan Baru" isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Toko</label>
                        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                            <option value="" disabled>-- Pilih Toko --</option>
                            {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dipesan Melalui</label>
                        <select value={orderedBySource} onChange={e => setOrderedBySource(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                            <option value="self">Diri Sendiri ({currentUser?.name})</option>
                            {partners.map((partner: Partner) => <option key={partner.id} value={partner.id}>{partner.name} [Mitra]</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Produk Tersedia</label>
                        <div className="space-y-2 mt-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                            {products.map(product => {
                                const availableStock = product.stock - product.reservedStock;
                                return (
                                <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span>{product.name} <span className="text-xs text-gray-500">(Stok: {availableStock})</span></span>
                                    <button type="button" onClick={() => handleAddProduct(product.id)} className="bg-brand-secondary text-white px-2 py-1 rounded text-sm font-semibold" disabled={availableStock <= 0}>
                                        {availableStock > 0 ? 'Tambah' : 'Habis'}
                                    </button>
                                </div>
                            )})}
                        </div>
                    </div>
                    {cart.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Keranjang</label>
                            <div className="space-y-2 mt-1 border p-4 rounded-lg">
                                <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-600">
                                    <span className="col-span-2">Produk</span>
                                    <span className="text-center">Jumlah</span>
                                    <span className="text-center">Hrg. Khusus (Rp)</span>
                                </div>
                                {cart.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    return (
                                        <div key={item.productId} className="grid grid-cols-4 gap-2 items-center">
                                            <span className="text-sm col-span-2">{product?.name} <p className="text-xs text-gray-400">Normal: {product?.price.toLocaleString('id-ID')}</p></span>
                                            <input type="number" min="0" value={item.quantity} onChange={e => handleUpdateCart(item.productId, 'quantity', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                            <input type="number" min="0" placeholder="Kosongi" value={item.specialPrice || ''} onChange={e => handleUpdateCart(item.productId, 'specialPrice', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                        </div>
                                    )
                                })}
                                <div className="text-right font-bold mt-2 pt-2 border-t">
                                    Total: Rp {totalAmount.toLocaleString('id-ID')}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark disabled:bg-gray-400" disabled={!selectedStore || cart.length === 0}>
                            Buat Pesanan
                        </button>
                    </div>
                </form>
            </Modal>
            
            {editingOrder && <EditOrderModal order={editingOrder} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />}
            
            <Modal title="Bukti Pengantaran" isOpen={!!viewingProof} onClose={() => setViewingProof(null)}>
                <div className="space-y-4">
                    {viewingProof && <img src={viewingProof} alt="Proof of delivery" className="w-full h-auto rounded-lg" />}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setViewingProof(null)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">Tutup</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};