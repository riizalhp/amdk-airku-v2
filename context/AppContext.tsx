

import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { 
    Role, 
    User, 
    Store, 
    Product, 
    Vehicle, 
    Order, 
    OrderStatus, 
    VehicleStatus, 
    RoutePlan,
    SurveyResponse,
    Visit,
    VisitStatus,
    RouteStop,
    AppContextType,
    OrderItem,
    SalesVisitRoutePlan,
    SalesVisitStop
} from '../types';
import { calculateSavingsMatrixRoutes, RouteNode } from '../services/routingService';


export const AppContext = createContext<AppContextType | undefined>(undefined);

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);
const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];


const mockUsers: User[] = [
    { id: 'u1', name: 'Budi Hartono', role: Role.ADMIN, email: 'admin@kuairku.com', password: 'password123' },
    { id: 'u2', name: 'Siti Aminah', role: Role.SALES, email: 'siti.s@kuairku.com', password: 'password123' },
    { id: 'u3', name: 'Eko Prasetyo', role: Role.DRIVER, email: 'eko.d@kuairku.com', password: 'password123' },
    { id: 'u4', name: 'Joko Susilo', role: Role.DRIVER, email: 'joko.d@kuairku.com', password: 'password123' },
    // Deletable user for testing
    { id: 'u5', name: 'Pengguna Tes (Bisa Dihapus)', role: Role.SALES, email: 'tes@kuairku.com', password: 'password123' },
];

const mockStores: Store[] = [
    { id: 's1', name: 'Toko Maju Wates', address: 'Jl. Wates Km. 1, Wates', location: { lat: -7.859, lng: 110.158 }, region: 'Timur', owner: 'Pak Budi', phone: '081234567890', subscribedSince: '2023-01-15', lastOrder: '2024-07-10', isPartner: false },
    { id: 's2', name: 'Warung Bu Rini Sentolo', address: 'Jl. Raya Sentolo, Sentolo', location: { lat: -7.82, lng: 110.22 }, region: 'Timur', owner: 'Ibu Rini', phone: '081234567891', subscribedSince: '2022-11-20', lastOrder: '2024-07-11', isPartner: true, partnerCode: 'WRB01' },
    { id: 's3', name: 'Minimarket Temon Jaya', address: 'Jl. Daendels, Temon', location: { lat: -7.88, lng: 110.06 }, region: 'Barat', owner: 'Mas Agung', phone: '081234567892', subscribedSince: '2023-05-01', lastOrder: '2024-07-09', isPartner: false },
    { id: 's4', name: 'Kios Rejeki Kokap', address: 'Waduk Sermo, Kokap', location: { lat: -7.81, lng: 110.10 }, region: 'Barat', owner: 'Mbak Dewi', phone: '081234567893', subscribedSince: '2024-02-10', lastOrder: '2024-07-12', isPartner: false },
    { id: 's5', name: 'Toko Uji Coba (Bisa Dihapus)', address: 'Jl. Uji Coba No. 123, Pengasih', location: { lat: -7.85, lng: 110.14 }, region: 'Barat', owner: 'Bapak Uji', phone: '081200000000', subscribedSince: '2024-01-01', lastOrder: 'N/A', isPartner: false },
    // New stores for multi-trip testing
    { id: 's10', name: 'Toko Berkah Sentolo', address: 'Jl. Gajah Mada, Sentolo', location: { lat: -7.825, lng: 110.215 }, region: 'Timur', owner: 'Ibu Berkah', phone: '081111111110', subscribedSince: '2024-03-01', lastOrder: 'N/A', isPartner: false },
    { id: 's11', name: 'Warung Ijo Pengasih', address: 'Jl. Mandung, Pengasih', location: { lat: -7.860, lng: 110.165 }, region: 'Timur', owner: 'Pak Ijo', phone: '081111111111', subscribedSince: '2024-03-02', lastOrder: 'N/A', isPartner: false },
    { id: 's12', name: 'Minimarket Nanggulan', address: 'Kapanewon Nanggulan, Kulon Progo', location: { lat: -7.790, lng: 110.200 }, region: 'Timur', owner: 'Mas Nanggul', phone: '081111111112', subscribedSince: '2024-03-03', lastOrder: 'N/A', isPartner: true, partnerCode: 'MNG01' },
    { id: 's13', name: 'Kios Barokah Lendah', address: 'Jl. Brosot - Nagung, Lendah', location: { lat: -7.920, lng: 110.200 }, region: 'Timur', owner: 'Mbak Barokah', phone: '081111111113', subscribedSince: '2024-03-04', lastOrder: 'N/A', isPartner: false },
    { id: 's14', name: 'Depot Air Galur', address: 'Galur, Kulon Progo', location: { lat: -7.950, lng: 110.180 }, region: 'Timur', owner: 'Bapak Galur', phone: '081111111114', subscribedSince: '2024-03-05', lastOrder: 'N/A', isPartner: false },
    { id: 's15', name: 'Toko Panjatan', address: 'Panjatan, Kulon Progo', location: { lat: -7.89, lng: 110.12 }, region: 'Barat', owner: 'Ibu Panjatan', phone: '081111111115', subscribedSince: '2024-03-06', lastOrder: 'N/A', isPartner: false },
    { id: 's16', name: 'Angkringan Girimulyo', address: 'Girimulyo, Kulon Progo', location: { lat: -7.75, lng: 110.13 }, region: 'Barat', owner: 'Mas Giri', phone: '081111111116', subscribedSince: '2024-03-07', lastOrder: 'N/A', isPartner: false },
    { id: 's17', name: 'Toko Rahmat Temon', address: 'Jl. Wates-Purworejo, Temon', location: { lat: -7.90, lng: 110.08 }, region: 'Barat', owner: 'Pak Rahmat', phone: '081111111117', subscribedSince: '2024-03-08', lastOrder: 'N/A', isPartner: false },
    { id: 's18', name: 'Kios Pak Slamet Kokap', address: 'Jl. Sermo-Girimulyo, Kokap', location: { lat: -7.83, lng: 110.11 }, region: 'Barat', owner: 'Bapak Slamet', phone: '081111111118', subscribedSince: '2024-03-09', lastOrder: 'N/A', isPartner: true, partnerCode: 'KPS01' },
];

const mockProducts: Product[] = [
    { id: 'p1', sku: 'AMDK-GLN-19L', name: 'KU AIRKU Galon 19L', price: 18000, stock: 1000, reservedStock: 10, capacityUnit: 1 },
    { id: 'p2', sku: 'AMDK-BTL-600ML', name: 'KU AIRKU Botol 600ml (Karton)', price: 45000, stock: 2000, reservedStock: 25, capacityUnit: 1 },
    { id: 'p3', sku: 'AMDK-CUP-240ML', name: 'KU AIRKU Gelas 240ml (Karton)', price: 25000, stock: 5000, reservedStock: 0, capacityUnit: 0.5 },
    // Deletable product for testing
    { id: 'p4', sku: 'TEST-SKU-DEL', name: 'Produk Tes (Bisa Dihapus)', price: 5000, stock: 10, reservedStock: 0, capacityUnit: 1 },
];

const mockVehicles: Vehicle[] = [
    { id: 'v1', plateNumber: 'AB 1111 KP', model: 'Mitsubishi L300', capacity: 80, status: VehicleStatus.IDLE, region: 'Timur' },
    { id: 'v2', plateNumber: 'AB 2222 KP', model: 'Suzuki Carry', capacity: 60, status: VehicleStatus.IDLE, region: 'Barat' },
    // Deletable vehicle for testing
    { id: 'v3', plateNumber: 'DE 1373 ME', model: 'Test L300 (Bisa Dihapus)', capacity: 50, status: VehicleStatus.IDLE, region: 'Timur' },
];

const mockOrders: Order[] = [
    // Existing orders, modified for multi-trip test date
    { id: 'o1', storeId: 's1', storeName: 'Toko Maju Wates', items: [{ productId: 'p1', quantity: 10, originalPrice: 18000 }], totalAmount: 180000, status: OrderStatus.PENDING, orderDate: yesterdayStr, desiredDeliveryDate: todayStr, location: { lat: -7.859, lng: 110.158 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o2', storeId: 's3', storeName: 'Minimarket Temon Jaya', items: [{ productId: 'p1', quantity: 20, originalPrice: 18000 }, { productId: 'p2', quantity: 5, originalPrice: 45000 }], totalAmount: 585000, status: OrderStatus.PENDING, orderDate: yesterdayStr, desiredDeliveryDate: todayStr, location: { lat: -7.88, lng: 110.06 }, assignedVehicleId: null, orderedBy: { id: 's3', name: 'Minimarket Temon Jaya', role: 'Mitra' } },
    { id: 'o3', storeId: 's2', storeName: 'Warung Bu Rini Sentolo', items: [{ productId: 'p2', quantity: 5, specialPrice: 44000, originalPrice: 45000 }], totalAmount: 220000, status: OrderStatus.PENDING, orderDate: yesterdayStr, desiredDeliveryDate: todayStr, location: { lat: -7.82, lng: 110.22 }, assignedVehicleId: null, orderedBy: { id: 'u1', name: 'Budi Hartono', role: 'Admin' } },
    { id: 'o5', storeId: 's1', storeName: 'Toko Maju Wates', items: [{ productId: 'p1', quantity: 50, originalPrice: 18000 }], totalAmount: 900000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.859, lng: 110.158 }, assignedVehicleId: null, orderedBy: { id: 'u1', name: 'Budi Hartono', role: 'Admin' } },
    
    // An old completed order
    { id: 'o4', storeId: 's4', storeName: 'Kios Rejeki Kokap', items: [{ productId: 'p2', quantity: 15, originalPrice: 45000 }], totalAmount: 675000, status: OrderStatus.DELIVERED, orderDate: twoDaysAgoStr, desiredDeliveryDate: yesterdayStr, location: { lat: -7.81, lng: 110.10 }, assignedVehicleId: 'v2', orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    
    // New orders for multi-trip testing, all for today
    { id: 'o10', storeId: 's10', storeName: 'Toko Berkah Sentolo', items: [{ productId: 'p1', quantity: 40, originalPrice: 18000 }], totalAmount: 720000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.825, lng: 110.215 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o11', storeId: 's11', storeName: 'Warung Ijo Pengasih', items: [{ productId: 'p1', quantity: 50, originalPrice: 18000 }], totalAmount: 900000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.860, lng: 110.165 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o12', storeId: 's12', storeName: 'Minimarket Nanggulan', items: [{ productId: 'p1', quantity: 30, originalPrice: 18000 }], totalAmount: 540000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.790, lng: 110.200 }, assignedVehicleId: null, orderedBy: { id: 's12', name: 'Minimarket Nanggulan', role: 'Mitra' } },
    { id: 'o13', storeId: 's13', storeName: 'Kios Barokah Lendah', items: [{ productId: 'p1', quantity: 60, originalPrice: 18000 }], totalAmount: 1080000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.920, lng: 110.200 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o14', storeId: 's14', storeName: 'Depot Air Galur', items: [{ productId: 'p1', quantity: 25, originalPrice: 18000 }], totalAmount: 450000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.950, lng: 110.180 }, assignedVehicleId: null, orderedBy: { id: 'u1', name: 'Budi Hartono', role: 'Admin' } },
    { id: 'o15', storeId: 's15', storeName: 'Toko Panjatan', items: [{ productId: 'p1', quantity: 30, originalPrice: 18000 }], totalAmount: 540000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.89, lng: 110.12 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o16', storeId: 's16', storeName: 'Angkringan Girimulyo', items: [{ productId: 'p1', quantity: 20, originalPrice: 18000 }], totalAmount: 360000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.75, lng: 110.13 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o17', storeId: 's17', storeName: 'Toko Rahmat Temon', items: [{ productId: 'p1', quantity: 45, originalPrice: 18000 }], totalAmount: 810000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.90, lng: 110.08 }, assignedVehicleId: null, orderedBy: { id: 'u1', name: 'Budi Hartono', role: 'Admin' } },
    { id: 'o18', storeId: 's18', storeName: 'Kios Pak Slamet Kokap', items: [{ productId: 'p1', quantity: 35, originalPrice: 18000 }], totalAmount: 630000, status: OrderStatus.PENDING, orderDate: todayStr, desiredDeliveryDate: todayStr, location: { lat: -7.83, lng: 110.11 }, assignedVehicleId: null, orderedBy: { id: 's18', name: 'Kios Pak Slamet Kokap', role: 'Mitra' } },
];

const mockSurveyResponses: SurveyResponse[] = [
    {
        id: 'sr1',
        salesPersonId: 'u2',
        surveyDate: yesterdayStr,
        storeName: 'Toko Segar Jaya',
        storeAddress: 'Jl. Gejayan No. 1, Yogyakarta',
        storePhone: '081298765432',
        mostSoughtProducts: [
            { brand: 'Le Minerale', variant: '600ml' },
            { brand: 'Aqua', variant: '1.5L' },
            { brand: 'AIRKU', variant: 'Galon 19L' }
        ],
        popularAirkuVariants: ['Galon 19L', 'Botol 600ml'],
        competitorPrices: [
            { brand: 'Le Minerale', variant: '600ml', price: 3000 },
            { brand: 'Aqua', variant: '1.5L', price: 6000 }
        ],
        competitorVolumes: [
            { brand: 'Le Minerale', variant: '600ml', volume: '10 karton/minggu' },
            { brand: 'Aqua', variant: '1.5L', volume: '5 karton/minggu' }
        ],
        feedback: 'Pelanggan sering menanyakan kemasan botol yang lebih kecil dari AIRKU.',
        proofOfSurveyImage: 'https://i.pravatar.cc/400?img=2'
    }
];

const mockVisits: Visit[] = [
    { id: 'v1', storeId: 's1', salesPersonId: 'u2', visitDate: todayStr, purpose: 'Repeat Order & Cek Stok', status: VisitStatus.UPCOMING, notes: 'Fokus pada penawaran galon.'},
    { id: 'v2', storeId: 's3', salesPersonId: 'u2', visitDate: todayStr, purpose: 'Follow-up', status: VisitStatus.UPCOMING, notes: 'Sudah 2 bulan tidak order.'},
    { id: 'v3', storeId: 's4', salesPersonId: 'u2', visitDate: tomorrowStr, purpose: 'Penagihan', status: VisitStatus.UPCOMING, notes: 'Tagihan invoice #INV123 jatuh tempo.'},
    { id: 'v4', storeId: 's2', salesPersonId: 'u2', visitDate: yesterdayStr, purpose: 'Repeat Order & Cek Stok', status: VisitStatus.COMPLETED, proofOfVisitImage: 'https://i.pravatar.cc/400?img=1'},
    // Deletable visit for testing
    { id: 'visit-del', storeId: 's1', salesPersonId: 'u2', visitDate: '2025-01-01', purpose: 'Kunjungan Tes (Bisa Dihapus)', status: VisitStatus.UPCOMING },
];


export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [stores, setStores] = useState<Store[]>(mockStores);
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [routes, setRoutes] = useState<RoutePlan[]>([]);
    const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>(mockSurveyResponses);
    const [visits, setVisits] = useState<Visit[]>(mockVisits);
    const [salesVisitRoutes, setSalesVisitRoutes] = useState<SalesVisitRoutePlan[]>([]);

    
    // Auth Actions
    const login = useCallback((email: string, password: string): boolean => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    const getOrderCapacity = useCallback((orderItems: OrderItem[]): number => {
        return orderItems.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product?.capacityUnit || 0) * item.quantity;
        }, 0);
    }, [products]);

    // Order Actions
    const addOrder = useCallback((order: Omit<Order, 'id' | 'totalAmount' | 'orderDate' | 'status' | 'storeName' | 'location' | 'assignedVehicleId' | 'items'> & { items: Omit<OrderItem, 'originalPrice'>[] }): { success: boolean; message: string; } => {
        const itemsWithOriginalPrice: OrderItem[] = order.items.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            return {
                ...item,
                originalPrice: product.price,
            };
        });

        // --- VALIDATION ---
        for (const item of itemsWithOriginalPrice) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                return { success: false, message: `Produk dengan ID ${item.productId} tidak ditemukan.` };
            }
            const availableStock = product.stock - product.reservedStock;
            if (item.quantity > availableStock) {
                return { success: false, message: `Stok untuk ${product.name} tidak mencukupi. Tersedia: ${availableStock}, Diminta: ${item.quantity}.` };
            }
        }
        
        const store = stores.find(s => s.id === order.storeId);
        if (!store) {
            return { success: false, message: `Toko dengan id ${order.storeId} tidak ditemukan` };
        }
        
        // --- Reserve stock ---
        setProducts(currentProducts => {
            return currentProducts.map(p => {
                const orderedItem = itemsWithOriginalPrice.find(item => item.productId === p.id);
                if (orderedItem) {
                    return { ...p, reservedStock: p.reservedStock + orderedItem.quantity };
                }
                return p;
            });
        });
        
        // --- Create a single, unassigned order ---
        const newOrder: Order = {
            ...order,
            id: `o${Date.now()}-${Math.random().toString(16).slice(2)}`,
            items: itemsWithOriginalPrice,
            status: OrderStatus.PENDING,
            orderDate: new Date().toISOString().split('T')[0],
            totalAmount: itemsWithOriginalPrice.reduce((acc, item) => {
                const price = item.specialPrice ?? item.originalPrice;
                return acc + (price * item.quantity);
            }, 0),
            location: store.location,
            storeName: store.name,
            assignedVehicleId: null, // Always start as unassigned
        };
        
        setOrders(currentOrders => [...currentOrders, newOrder]);
        
        return { success: true, message: "Pesanan berhasil dibuat dan menunggu untuk dijadwalkan." };

    }, [products, stores]);

    const updateOrder = useCallback((orderId: string, updates: { items: Omit<OrderItem, 'originalPrice'>[]; assignedVehicleId: string | null; desiredDeliveryDate?: string; }): { success: boolean; message: string; warning?: string } => {
        const originalOrder = orders.find(o => o.id === orderId);
        if (!originalOrder) {
            return { success: false, message: 'Pesanan tidak ditemukan.' };
        }

        let warningMessage: string | undefined = undefined;

        const itemsWithOriginalPrice: OrderItem[] = updates.items.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            return {
                ...item,
                originalPrice: product.price,
            };
        });

        const updatedItems = itemsWithOriginalPrice;
        const updatedCapacity = getOrderCapacity(updatedItems);

        // Soft check vehicle capacity, do not block
        if (updates.assignedVehicleId) {
            const vehicle = vehicles.find(v => v.id === updates.assignedVehicleId);
            if (!vehicle) {
                return { success: false, message: 'Armada tidak ditemukan.' };
            }
            const otherOrdersLoad = orders
                .filter(o => o.assignedVehicleId === updates.assignedVehicleId && o.id !== orderId)
                .reduce((load, o) => load + getOrderCapacity(o.items), 0);

            if (vehicle.capacity < otherOrdersLoad + updatedCapacity) {
                warningMessage = `Kapasitas armada ${vehicle.plateNumber} terlampaui. Rute tambahan akan dibuat saat perencanaan.`;
            }
        }

        const stockChanges: { [productId: string]: number } = {};
        originalOrder.items.forEach(item => {
            stockChanges[item.productId] = (stockChanges[item.productId] || 0) - item.quantity;
        });
        updatedItems.forEach(item => {
            stockChanges[item.productId] = (stockChanges[item.productId] || 0) + item.quantity;
        });

        for (const productId in stockChanges) {
            const delta = stockChanges[productId];
            if (delta > 0) {
                const product = products.find(p => p.id === productId);
                if (!product) continue;
                const availableStock = product.stock - product.reservedStock;
                if (delta > availableStock) {
                    return { success: false, message: `Stok untuk ${product.name} tidak mencukupi. Tersedia: ${availableStock}.` };
                }
            }
        }

        setProducts(currentProducts => {
            const newProducts = JSON.parse(JSON.stringify(currentProducts));
            for (const productId in stockChanges) {
                const productIndex = newProducts.findIndex((p: Product) => p.id === productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].reservedStock += stockChanges[productId];
                }
            }
            return newProducts;
        });

        setOrders(currentOrders => {
            return currentOrders.map(o => {
                if (o.id === orderId) {
                    const newTotalAmount = updatedItems.reduce((acc, item) => {
                        const price = item.specialPrice ?? item.originalPrice;
                        return acc + price * item.quantity;
                    }, 0);

                    return {
                        ...o,
                        items: updatedItems,
                        assignedVehicleId: updates.assignedVehicleId,
                        totalAmount: newTotalAmount,
                        desiredDeliveryDate: updates.desiredDeliveryDate
                    };
                }
                return o;
            });
        });

        return { success: true, message: 'Pesanan berhasil diperbarui.', warning: warningMessage };
    }, [orders, products, vehicles, getOrderCapacity]);

    const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (status === OrderStatus.DELIVERED) {
            setProducts(currentProducts => currentProducts.map(p => {
                const orderedItem = order.items.find(item => item.productId === p.id);
                if (orderedItem) {
                    return {
                        ...p,
                        stock: p.stock - orderedItem.quantity,
                        reservedStock: p.reservedStock - orderedItem.quantity,
                    };
                }
                return p;
            }));
        } else if (status === OrderStatus.FAILED && order.status !== OrderStatus.FAILED) {
             setProducts(currentProducts => currentProducts.map(p => {
                const orderedItem = order.items.find(item => item.productId === p.id);
                if (orderedItem) {
                    return {
                        ...p,
                        reservedStock: p.reservedStock - orderedItem.quantity,
                    };
                }
                return p;
            }));
        }

        setOrders(prev => prev.map(o => o.id === orderId ? {...o, status} : o));
    }, [orders]);

    const deleteOrder = useCallback((orderId: string) => {
        const orderToDelete = orders.find(o => o.id === orderId);
        if (!orderToDelete) {
            alert('Pesanan tidak ditemukan.');
            return;
        }

        if (orderToDelete.status !== OrderStatus.PENDING) {
            alert('Hanya pesanan dengan status "Pending" yang dapat dihapus.');
            return;
        }

        // Return reserved stock
        setProducts(currentProducts => {
            const newProducts = JSON.parse(JSON.stringify(currentProducts));
            orderToDelete.items.forEach(item => {
                const productIndex = newProducts.findIndex((p: Product) => p.id === item.productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].reservedStock -= item.quantity;
                }
            });
            return newProducts;
        });

        // Remove order
        setOrders(currentOrders => currentOrders.filter(o => o.id !== orderId));
    }, [orders]);


    const updateRoute = useCallback((updatedRoute: RoutePlan) => {
        setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    }, []);

    const reassignOrder = useCallback((orderId: string, newVehicleId: string | null): { success: boolean; warning?: string; } => {
        const orderToMove = orders.find(o => o.id === orderId);
        if (!orderToMove) return { success: false };

        let warningMessage: string | undefined = undefined;
        const orderCapacity = getOrderCapacity(orderToMove.items);

        if (newVehicleId) {
             const newVehicle = vehicles.find(v => v.id === newVehicleId);
             if (!newVehicle) return { success: false };

             const currentLoad = orders.filter(o => o.assignedVehicleId === newVehicleId)
                 .reduce((load, o) => load + getOrderCapacity(o.items), 0);

             if (newVehicle.capacity < currentLoad + orderCapacity) {
                 warningMessage = `Kapasitas kendaraan ${newVehicle.plateNumber} terlampaui. Rute tambahan akan dibuat saat perencanaan.`;
             }
        }
       
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, assignedVehicleId: newVehicleId } : o));
        return { success: true, warning: warningMessage };
    }, [orders, vehicles, products, getOrderCapacity]);
    
    const createRoutePlan = useCallback(async (deliveryDate: string, vehicleId: string, driverId: string): Promise<{ success: boolean; message: string; }> => {
        // 1. Get resources
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const driver = users.find(u => u.id === driverId);

        if (!vehicle || !driver) {
            return { success: false, message: "Armada atau pengemudi tidak valid." };
        }

        // 2. Filter orders for the selected assignment
        const ordersToRoute = orders.filter(order => {
            const store = stores.find(s => s.id === order.storeId);
            const isAssignedToThisVehicle = order.assignedVehicleId === vehicleId;
            const isUnassignedInRegion = order.assignedVehicleId === null && store?.region === vehicle.region;

            return (
                order.status === OrderStatus.PENDING &&
                order.desiredDeliveryDate === deliveryDate &&
                (isAssignedToThisVehicle || isUnassignedInRegion)
            );
        });

        if (ordersToRoute.length === 0) {
            return { success: false, message: "Tidak ada pesanan 'Pending' untuk tanggal dan armada/wilayah yang dipilih." };
        }

        // 3. Prepare nodes for the algorithm
        const nodes: RouteNode[] = ordersToRoute.map(order => ({
            id: order.id,
            location: order.location,
            demand: getOrderCapacity(order.items),
        })).filter(node => node.demand <= vehicle.capacity);

        const unroutableLargeOrders = ordersToRoute.length - nodes.length;
        const depotLocation = { lat: -7.8664161, lng: 110.1486773 };

        // 4. Calculate routes using Savings Matrix algorithm
        const calculatedTrips = calculateSavingsMatrixRoutes(nodes, depotLocation, vehicle.capacity);

        if (calculatedTrips.length === 0 && nodes.length > 0) {
             return { success: false, message: "Gagal menghasilkan rute. Pastikan ada pesanan yang valid." };
        }

        const newRoutes: RoutePlan[] = [];
        const routedOrderIds = new Set<string>();

        calculatedTrips.forEach(tripOrderIds => {
            const stops: RouteStop[] = tripOrderIds.map(orderId => {
                const order = ordersToRoute.find(o => o.id === orderId)!;
                const store = stores.find(s => s.id === order.storeId)!;
                routedOrderIds.add(orderId);
                return {
                    orderId: order.id,
                    storeId: order.storeId,
                    storeName: order.storeName,
                    address: store.address,
                    status: 'Pending'
                };
            });

            if (stops.length > 0) {
                 const newRoutePlan: RoutePlan = {
                    id: `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    driverId: driver.id,
                    vehicleId: vehicle.id,
                    date: deliveryDate,
                    stops: stops,
                    region: vehicle.region,
                };
                newRoutes.push(newRoutePlan);
            }
        });

        // 5. Final state updates
        if (newRoutes.length > 0) {
            setOrders(currentOrders =>
                currentOrders.map(o =>
                    routedOrderIds.has(o.id) ? { ...o, status: OrderStatus.ROUTED, assignedVehicleId: vehicle.id } : o
                )
            );
            setRoutes(currentRoutes => [...currentRoutes, ...newRoutes]);
        }
        
        let message = `Berhasil membuat ${newRoutes.length} perjalanan baru untuk ${driver.name}, menjadwalkan ${routedOrderIds.size} pesanan.`;
        if (unroutableLargeOrders > 0) {
             message += ` ${unroutableLargeOrders} pesanan diabaikan karena melebihi kapasitas armada.`;
        }
        const unroutedCount = nodes.length - routedOrderIds.size;
        if (unroutedCount > 0) {
            message += ` ${unroutedCount} pesanan tidak dapat dirutekan.`;
        }

        return { success: true, message };
    }, [orders, stores, vehicles, users, getOrderCapacity]);

    const createSalesVisitRoutePlan = useCallback(async (salesPersonId: string, visitDate: string) => {
        const visitsForDay = visits.filter(v => v.salesPersonId === salesPersonId && v.visitDate === visitDate && v.status === VisitStatus.UPCOMING);

        if (visitsForDay.length === 0) {
            alert("Tidak ada kunjungan yang dijadwalkan untuk sales ini pada tanggal tersebut.");
            return;
        }
        
        const nodes: RouteNode[] = visitsForDay.map(visit => {
            const store = stores.find(s => s.id === visit.storeId);
            return {
                id: visit.id,
                location: store!.location,
                demand: 0,
            }
        });

        const depotLocation = { lat: -7.8664161, lng: 110.1486773 };
        const calculatedTrips = calculateSavingsMatrixRoutes(nodes, depotLocation, Infinity);

        if (calculatedTrips.length === 0 || calculatedTrips[0].length === 0) {
            alert("Gagal membuat rencana rute kunjungan. Silakan coba lagi.");
            return;
        }

        const sequence = calculatedTrips[0];

        const sequencedStops: SalesVisitStop[] = sequence.map((id: string) => {
            const visit = visitsForDay.find(v => v.id === id)!;
            const store = stores.find(s => s.id === visit.storeId)!;
            return {
                visitId: visit.id,
                storeId: visit.storeId,
                storeName: store.name,
                address: store.address,
                purpose: visit.purpose,
            };
        });

        const newRoutePlan: SalesVisitRoutePlan = {
            id: `svr-${Date.now()}`,
            salesPersonId,
            date: visitDate,
            stops: sequencedStops
        };

        setSalesVisitRoutes(prev => [...prev, newRoutePlan]);
        
    }, [visits, stores]);

    const dispatchVehicle = useCallback((vehicleId: string) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: VehicleStatus.DELIVERING } : v
        ));
        
        setOrders(prev => prev.map(o => 
            o.assignedVehicleId === vehicleId && o.status === OrderStatus.ROUTED ? { ...o, status: OrderStatus.DELIVERING } : o
        ));
    }, []);

    const completeVehicleRoute = useCallback((vehicleId: string) => {
        setVehicles(prev => prev.map(v => 
            v.id === vehicleId ? { ...v, status: VehicleStatus.IDLE } : v
        ));
    }, []);

    // Store Actions
    const addStore = useCallback((store: Omit<Store, 'id'>) => {
      setStores(prev => [...prev, { ...store, id: `s${Date.now()}` }]);
    }, []);
    const updateStore = useCallback((updatedStore: Store) => {
      setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
    }, []);
    const deleteStore = useCallback((storeId: string) => {
      const storeHasOrders = orders.some(order => order.storeId === storeId);
      const storeHasVisits = visits.some(visit => visit.storeId === storeId);

      if (storeHasOrders || storeHasVisits) {
          alert('Tidak dapat menghapus toko ini karena masih memiliki pesanan atau jadwal kunjungan yang terkait. Harap selesaikan atau hapus data terkait terlebih dahulu.');
          return;
      }
      setStores(prev => prev.filter(s => s.id !== storeId));
    }, [orders, visits]);

    // User Actions
    const addUser = useCallback((user: Omit<User, 'id'>) => {
      setUsers(prev => [...prev, { ...user, id: `u${Date.now()}` }]);
    }, []);
    const updateUser = useCallback((updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);
    const deleteUser = useCallback((userId: string) => {
      if (currentUser?.id === userId) {
          alert('Anda tidak dapat menghapus akun Anda sendiri.');
          return;
      }
      
      const user = users.find(u => u.id === userId);
      if (!user) return;

      if (user.role === Role.DRIVER) {
          const isAssignedToRoute = routes.some(route => route.driverId === userId);
          if (isAssignedToRoute) {
              alert('Tidak dapat menghapus pengemudi ini karena masih memiliki rute yang ditugaskan. Selesaikan atau batalkan rute terlebih dahulu.');
              return;
          }
      }

      if (user.role === Role.SALES) {
          const hasVisits = visits.some(visit => visit.salesPersonId === userId);
          const hasSurveys = surveyResponses.some(survey => survey.salesPersonId === userId);
          const hasSalesRoutes = salesVisitRoutes.some(route => route.salesPersonId === userId);
          if (hasVisits || hasSurveys || hasSalesRoutes) {
              alert('Tidak dapat menghapus sales ini karena masih memiliki jadwal kunjungan, rute kunjungan, atau laporan survei yang terkait.');
              return;
          }
      }
      
      const hasMadeOrder = orders.some(o => o.orderedBy.id === userId);
      if (hasMadeOrder) {
        alert('Tidak dapat menghapus pengguna ini karena mereka tercatat telah membuat pesanan. Pertimbangkan untuk menonaktifkan akun mereka sebagai gantinya.');
        return;
      }

      setUsers(prev => prev.filter(u => u.id !== userId));
    }, [currentUser, users, routes, visits, surveyResponses, salesVisitRoutes, orders]);

    // Product Actions
    const addProduct = useCallback((product: Omit<Product, 'id' | 'reservedStock'>) => {
      setProducts(prev => [...prev, { ...product, id: `p${Date.now()}`, reservedStock: 0 }]);
    }, []);
    const updateProduct = useCallback((updatedProduct: Product) => {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, []);
    const deleteProduct = useCallback((productId: string) => {
        const isProductInOrders = orders.some(order => 
            order.items.some(item => item.productId === productId)
        );

        if (isProductInOrders) {
            alert('Tidak dapat menghapus produk ini karena sudah menjadi bagian dari pesanan yang ada. Untuk menonaktifkan, pertimbangkan untuk mengubah statusnya atau set stok menjadi 0.');
            return;
        }
      setProducts(prev => prev.filter(p => p.id !== productId));
    }, [orders]);

    // Vehicle Actions
    const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id'>) => {
      setVehicles(prev => [...prev, { ...vehicle, id: `v${Date.now()}` }]);
    }, []);
    const updateVehicle = useCallback((updatedVehicle: Vehicle) => {
      setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    }, []);
    const deleteVehicle = useCallback((vehicleId: string) => {
        const isVehicleInOrders = orders.some(order => order.assignedVehicleId === vehicleId);
        const isVehicleInRoutes = routes.some(route => route.vehicleId === vehicleId);

        if (isVehicleInOrders || isVehicleInRoutes) {
            alert('Tidak dapat menghapus armada ini karena masih memiliki pesanan atau rute yang ditugaskan. Harap pindahkan pesanan atau selesaikan rute terlebih dahulu.');
            return;
        }
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }, [orders, routes]);

    // Survey Actions
    const addSurveyResponse = useCallback((response: Omit<SurveyResponse, 'id'>) => {
        setSurveyResponses(prev => [
            ...prev,
            { ...response, id: `sr${prev.length + 1}` }
        ]);
    }, []);
    
    // Visit Actions
    const addVisit = useCallback((visit: Omit<Visit, 'id'>) => {
      setVisits(prev => [...prev, { ...visit, id: `v${Date.now()}` }]);
    }, []);
    const updateVisitStatus = useCallback((visitId: string, status: VisitStatus, proofImage?: string) => {
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status, proofOfVisitImage: proofImage } : v));
    }, []);
    const deleteVisit = useCallback((visitId: string) => {
      const isVisitInRoute = salesVisitRoutes.some(route => 
            route.stops.some(stop => stop.visitId === visitId)
        );
      if (isVisitInRoute) {
          alert('Tidak dapat menghapus jadwal kunjungan ini karena sudah menjadi bagian dari Rencana Rute Kunjungan. Harap hapus rencananya terlebih dahulu.');
          return;
      }
      setVisits(prev => prev.filter(v => v.id !== visitId));
    }, [salesVisitRoutes]);


    const value: AppContextType = { 
        currentUser, login, logout,
        users, stores, products, vehicles, orders, routes, surveyResponses, visits, salesVisitRoutes,
        addOrder, updateOrder, updateOrderStatus, deleteOrder, createRoutePlan, dispatchVehicle, updateRoute, reassignOrder, completeVehicleRoute,
        addStore, updateStore, deleteStore,
        addUser, updateUser, deleteUser,
        addProduct, updateProduct, deleteProduct,
        addVehicle, updateVehicle, deleteVehicle,
        addSurveyResponse,
        addVisit, updateVisitStatus, deleteVisit,
        createSalesVisitRoutePlan,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};