

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { Order, OrderStatus, Store, Product, Vehicle, OrderItem, VehicleStatus } from '../../types';
import { ICONS } from '../../constants';
import { Modal } from '../ui/Modal';

const EnhancedStatusBadge: React.FC<{ order: Order }> = ({ order }) => {
    const { routes } = useAppContext();

    const statusInfo = useMemo(() => {
        switch (order.status) {
            case OrderStatus.PENDING:
                return { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
            case OrderStatus.ROUTED:
                return { text: 'Routed', className: 'bg-cyan-100 text-cyan-800' };
            case OrderStatus.DELIVERING:
                return { text: 'Delivering', className: 'bg-indigo-100 text-indigo-800' };
            case OrderStatus.FAILED:
                return { text: 'Failed', className: 'bg-red-100 text-red-800' };
            case OrderStatus.DELIVERED:
                const routeForOrder = routes.find(r => r.stops.some(s => s.orderId === order.id));
                if (routeForOrder) {
                    const isTripFinished = routeForOrder.stops.every(s => s.status === 'Completed' || s.status === 'Failed');
                    if (isTripFinished) {
                        return { text: 'Completed', className: 'bg-green-100 text-green-800' };
                    } else {
                        return { text: 'Delivered (Trip Active)', className: 'bg-teal-100 text-teal-800' };
                    }
                }
                return { text: 'Completed', className: 'bg-green-100 text-green-800' }; // Fallback
            default:
                return { text: order.status, className: 'bg-gray-100 text-gray-800' };
        }
    }, [order, routes]);

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
            {statusInfo.text}
        </span>
    );
};

type AddEditModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderToEdit: Order | null;
}

type CartItem = {
    productId: string;
    quantity: number;
    specialPrice?: number;
};

const AddEditOrderModal: React.FC<AddEditModalProps> = ({ isOpen, onClose, orderToEdit }) => {
    const { stores, products, vehicles, addOrder, updateOrder, currentUser } = useAppContext();
    const [storeId, setStoreId] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [assignedVehicleId, setAssignedVehicleId] = useState<string | null>(null);
    const [desiredDeliveryDate, setDesiredDeliveryDate] = useState('');
    const [error, setError] = useState('');

    const availableVehiclesForAssignment = useMemo(() => {
        if (!storeId) return [];
        const store = stores.find(s => s.id === storeId);
        if (!store) return [];
        
        return vehicles.filter(v => 
            v.status === VehicleStatus.IDLE && v.region === store.region
        );
    }, [storeId, vehicles, stores]);

    useEffect(() => {
        if (orderToEdit) {
            setStoreId(orderToEdit.storeId);
            setCart(orderToEdit.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                specialPrice: item.specialPrice
            })));
            setAssignedVehicleId(orderToEdit.assignedVehicleId);
            setDesiredDeliveryDate(orderToEdit.desiredDeliveryDate || '');
        } else {
            setStoreId('');
            setCart([]);
            setAssignedVehicleId(null);
            setDesiredDeliveryDate('');
        }
        setError('');
    }, [orderToEdit, isOpen]);

    useEffect(() => {
        // When store changes, if the currently assigned vehicle is not in the new valid region, unassign it.
        if(orderToEdit && assignedVehicleId){
            const store = stores.find(s => s.id === storeId);
            if(!store) return;
            const vehicle = vehicles.find(v => v.id === assignedVehicleId);
            if(vehicle && vehicle.region !== store.region){
                setAssignedVehicleId(null);
            }
        }
    }, [storeId, orderToEdit, assignedVehicleId, stores, vehicles]);


    const handleAddProduct = (product: Product) => {
        const availableStock = product.stock - product.reservedStock;
        if (availableStock <= 0) return;

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.productId === product.id && item.quantity < availableStock
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { productId: product.id, quantity: 1 }];
        });
    };

    const handleUpdateCart = (productId: string, field: 'quantity' | 'specialPrice', value: number) => {
        const product = products.find(p => p.id === productId)!;
        let availableStock = product.stock - product.reservedStock;
        if(orderToEdit) {
            const originalItem = orderToEdit.items.find(i => i.productId === productId);
            if (originalItem) {
                availableStock += originalItem.quantity;
            }
        }
        
        if (field === 'quantity') {
            if (value > availableStock) {
                setError(`Stok untuk ${product.name} tidak cukup. Maks: ${availableStock}.`);
                value = availableStock;
            } else {
                setError('');
            }

            if (value <= 0) {
                setCart(prev => prev.filter(item => item.productId !== productId));
            } else {
                setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity: value } : item));
            }
        } else if (field === 'specialPrice') {
            setCart(prev => prev.map(item => {
                if (item.productId === productId) {
                    return (value <= 0 || value === product.price)
                        ? { ...item, specialPrice: undefined }
                        : { ...item, specialPrice: value };
                }
                return item;
            }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!storeId || cart.length === 0 || !currentUser) {
            setError('Harap pilih toko dan tambahkan setidaknya satu produk.');
            return;
        }

        const orderData = {
            items: cart,
            desiredDeliveryDate: desiredDeliveryDate || undefined,
        };

        if (orderToEdit) {
            const result = updateOrder(orderToEdit.id, { ...orderData, assignedVehicleId });
             if (result.success) {
                let alertMessage = result.message;
                if (result.warning) {
                    alertMessage += `\n\nPERINGATAN: ${result.warning}`;
                }
                alert(alertMessage);
                onClose();
            } else {
                setError(result.message);
            }
        } else {
             const orderedBy = { id: currentUser.id, name: currentUser.name, role: currentUser.role };
             const result = addOrder({ storeId, ...orderData, orderedBy });
             if (result.success) {
                alert(result.message);
                onClose();
            } else {
                setError(result.message);
            }
        }
    };
    
    const { totalAmount, totalNormalPrice } = useMemo(() => {
        let sellingPriceTotal = 0;
        let normalPriceTotal = 0;
        for (const item of cart) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                const price = item.specialPrice ?? product.price;
                sellingPriceTotal += price * item.quantity;
                normalPriceTotal += product.price * item.quantity;
            }
        }
        return { totalAmount: sellingPriceTotal, totalNormalPrice: normalPriceTotal };
    }, [cart, products]);

    return (
        <Modal title={orderToEdit ? 'Edit Pesanan' : 'Tambah Pesanan Baru'} isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm" role="alert">{error}</div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pilih Toko</label>
                        <select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                            <option value="" disabled>-- Pilih Toko --</option>
                            {stores.map(store => <option key={store.id} value={store.id}>{store.name} - {store.owner}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tanggal Pengiriman Diinginkan</label>
                        <input type="date" value={desiredDeliveryDate} onChange={e => setDesiredDeliveryDate(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Produk Tersedia</label>
                    <div className="space-y-2 mt-1 max-h-32 overflow-y-auto p-2 bg-gray-50 border rounded-md">
                        {products.map(product => {
                            const availableStock = product.stock - product.reservedStock;
                            return (
                                <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                                    <div>
                                        <span>{product.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">(Stok: {availableStock})</span>
                                    </div>
                                    <button type="button" onClick={() => handleAddProduct(product)} className="bg-brand-secondary text-white px-2 py-1 rounded text-sm disabled:bg-gray-300" disabled={availableStock <= 0}>
                                        {availableStock > 0 ? 'Tambah' : 'Habis'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {cart.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Keranjang</label>
                        <div className="space-y-2 mt-1 border p-3 rounded-lg max-h-48 overflow-y-auto">
                            {cart.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                if (!product) return null;

                                const profit = item.specialPrice ? item.specialPrice - product.price : 0;
                                
                                return (
                                    <div key={item.productId} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-start py-2 border-b">
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-semibold">{product.name}</p>
                                            <p className="text-xs text-gray-400">Normal: {product.price.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Jumlah</label>
                                            <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateCart(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-full p-1 border rounded text-center"/>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500">Harga Jual</label>
                                            <input type="number" min="0" placeholder={product.price.toString()} value={item.specialPrice ?? product.price} onChange={e => handleUpdateCart(item.productId, 'specialPrice', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                             {item.specialPrice !== undefined && item.specialPrice !== product.price && (
                                                <p className={`text-xs text-center ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {profit > 0 ? 'Untung' : 'Rugi'} Rp {Math.abs(profit).toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                         <div className="text-right font-bold mt-2 pt-2 border-t">
                            {totalAmount !== totalNormalPrice && (
                                <p className="text-sm font-normal text-gray-500 mb-1">
                                    Total Harga Normal: Rp {totalNormalPrice.toLocaleString('id-ID')}
                                </p>
                            )}
                            <p className="text-lg">Total Harga Jual: Rp {totalAmount.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                )}
                 {orderToEdit && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tugaskan ke Armada</label>
                        <select value={assignedVehicleId || ''} onChange={e => setAssignedVehicleId(e.target.value || null)} className="w-full p-2 border rounded mt-1 bg-white" disabled={!storeId}>
                            <option value="">-- Tidak Ditugaskan --</option>
                            {availableVehiclesForAssignment.map(v => <option key={v.id} value={v.id}>{v.plateNumber} ({v.model})</option>)}
                        </select>
                        {!storeId && <p className="text-xs text-red-500 mt-1">Pilih toko terlebih dahulu untuk melihat armada yang tersedia.</p>}
                        {storeId && availableVehiclesForAssignment.length === 0 && <p className="text-xs text-yellow-600 mt-1">Tidak ada armada yang tersedia untuk wilayah ini.</p>}
                    </div>
                )}
                <div className="flex justify-end pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                    <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">{orderToEdit ? 'Simpan Perubahan' : 'Buat Pesanan'}</button>
                </div>
            </form>
        </Modal>
    );
};

export const OrderManagement: React.FC = () => {
    const { orders, deleteOrder, products, vehicles, stores } = useAppContext();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const statusMatch = filterStatus === 'all' || order.status === filterStatus;
                const searchMatch = searchTerm === '' ||
                    order.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.id.toLowerCase().includes(searchTerm.toLowerCase());
                return statusMatch && searchMatch;
            })
            .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [orders, filterStatus, searchTerm]);

    const handleOpenAddModal = () => {
        setOrderToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (order: Order) => {
        setOrderToEdit(order);
        setIsModalOpen(true);
    };
    
    const handleDeleteOrder = (orderId: string) => {
        if (window.confirm('Anda yakin ingin menghapus pesanan ini? Aksi ini tidak dapat dibatalkan.')) {
            deleteOrder(orderId);
        }
    }

    const ExpandedRow: React.FC<{ order: Order }> = ({ order }) => (
        <tr className="bg-gray-50">
            <td colSpan={9} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <h4 className="font-bold mb-2">Detail Item</h4>
                        <ul className="list-disc list-inside">
                            {order.items.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                return (
                                    <li key={item.productId}>{item.quantity}x {product?.name} @ Rp {(item.specialPrice ?? item.originalPrice).toLocaleString('id-ID')}</li>
                                )
                            })}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Informasi Pengiriman</h4>
                        <p><strong>Toko:</strong> {order.storeName}</p>
                        <p><strong>Armada:</strong> {vehicles.find(v => v.id === order.assignedVehicleId)?.plateNumber || 'N/A'}</p>
                        <p><strong>Tgl. Dipesan:</strong> {order.orderDate}</p>
                        {order.desiredDeliveryDate && <p><strong>Tgl. Diinginkan:</strong> {order.desiredDeliveryDate}</p>}
                    </div>
                    <div>
                        <h4 className="font-bold mb-2">Informasi Pemesan</h4>
                        <p><strong>Dipesan oleh:</strong> {order.orderedBy.name}</p>
                        <p><strong>Peran:</strong> {order.orderedBy.role}</p>
                    </div>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Pesanan</h1>
                <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300">
                    {ICONS.plus} Tambah Pesanan
                </button>
            </div>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <input
                        type="text"
                        placeholder="Cari nama toko atau ID pesanan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded-md"
                    />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="w-full p-2 border rounded-md bg-white">
                        <option value="all">Semua Status</option>
                        {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
            </Card>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th className="px-1 py-3 w-4"></th>
                                <th className="px-6 py-3">ID Pesanan</th>
                                <th className="px-6 py-3">Toko</th>
                                <th className="px-6 py-3">Tgl. Pesan</th>
                                <th className="px-6 py-3">Tgl. Diinginkan</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Armada</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => {
                                const vehicle = vehicles.find(v => v.id === order.assignedVehicleId);
                                return (
                                <React.Fragment key={order.id}>
                                    <tr className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-1 py-4">
                                            <button onClick={() => setExpandedRow(expandedRow === order.id ? null : order.id)} className="p-1 rounded-full hover:bg-gray-200">
                                                <div className={`transition-transform duration-200 ${expandedRow === order.id ? 'rotate-180' : ''}`}>
                                                    {ICONS.chevronDown}
                                                </div>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.slice(-6).toUpperCase()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{order.storeName}</td>
                                        <td className="px-6 py-4">{order.orderDate}</td>
                                        <td className="px-6 py-4">{order.desiredDeliveryDate || '-'}</td>
                                        <td className="px-6 py-4">Rp {order.totalAmount.toLocaleString('id-ID')}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{vehicle?.plateNumber || '-'}</td>
                                        <td className="px-6 py-4"><EnhancedStatusBadge order={order} /></td>
                                        <td className="px-6 py-4 flex space-x-2">
                                            {order.status === OrderStatus.PENDING && (
                                                <>
                                                <button onClick={() => handleOpenEditModal(order)} className="text-blue-600 hover:text-blue-800 p-1">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                                                <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-800 p-1">{React.cloneElement(ICONS.trash, {width: 20, height: 20})}</button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRow === order.id && <ExpandedRow order={order} />}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                     {filteredOrders.length === 0 && <p className="text-center text-gray-500 py-6">Tidak ada pesanan ditemukan.</p>}
                </div>
            </Card>
            
            <AddEditOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} orderToEdit={orderToEdit} />

        </div>
    );
};