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
    Partner,
    PartnerType,
    SurveyResponse,
    Visit,
    VisitStatus,
    RouteStop,
    AppContextType,
    OrderItem,
    SalesVisitRoutePlan,
    SalesVisitStop
} from '../types';
import { optimizeAndSequenceRoute, optimizeSalesVisitRoute } from '../services/geminiService';


export const AppContext = createContext<AppContextType | undefined>(undefined);

const mockUsers: User[] = [
    { id: 'u1', name: 'Budi Hartono', role: Role.ADMIN, email: 'admin@kuairku.com', password: 'password123' },
    { id: 'u2', name: 'Siti Aminah', role: Role.SALES, email: 'siti.s@kuairku.com', password: 'password123' },
    { id: 'u3', name: 'Eko Prasetyo', role: Role.DRIVER, email: 'eko.d@kuairku.com', password: 'password123' },
    { id: 'u4', name: 'Joko Susilo', role: Role.DRIVER, email: 'joko.d@kuairku.com', password: 'password123' },
];

const mockStores: Store[] = [
    { id: 's1', name: 'Toko Segar', address: 'Jl. Wonosari Km. 5, Yogyakarta', location: { lat: -7.82, lng: 110.42 }, region: 'Tengah', owner: 'Pak Budi', phone: '081234567890', subscribedSince: '2023-01-15', lastOrder: '2024-07-10' },
    { id: 's2', name: 'Warung Barokah', address: 'Jl. Kaliurang Km. 10, Yogyakarta', location: { lat: -7.75, lng: 110.40 }, region: 'Utara', owner: 'Ibu Rini', phone: '081234567891', subscribedSince: '2022-11-20', lastOrder: '2024-07-11' },
    { id: 's3', name: 'Minimarket Jaya', address: 'Jl. Parangtritis Km. 15, Bantul', location: { lat: -7.96, lng: 110.33 }, region: 'Selatan', owner: 'Mas Agung', phone: '081234567892', subscribedSince: '2023-05-01', lastOrder: '2024-07-09' },
    { id: 's4', name: 'Kios Rejeki', address: 'Jl. Godean Km. 8, Sleman', location: { lat: -7.78, lng: 110.30 }, region: 'Tengah', owner: 'Mbak Dewi', phone: '081234567893', subscribedSince: '2024-02-10', lastOrder: '2024-07-12' },
];

const mockProducts: Product[] = [
    { id: 'p1', sku: 'AMDK-GLN-19L', name: 'KU AIRKU Galon 19L', price: 18000, stock: 100, reservedStock: 10, capacityUnit: 1 },
    { id: 'p2', sku: 'AMDK-BTL-600ML', name: 'KU AIRKU Botol 600ml (Karton)', price: 45000, stock: 200, reservedStock: 25, capacityUnit: 1 },
    { id: 'p3', sku: 'AMDK-CUP-240ML', name: 'KU AIRKU Gelas 240ml (Karton)', price: 25000, stock: 500, reservedStock: 0, capacityUnit: 0.5 },
];

const mockVehicles: Vehicle[] = [
    { id: 'v1', plateNumber: 'AB 1234 CD', model: 'Mitsubishi L300', capacity: 80, status: VehicleStatus.IDLE },
    { id: 'v2', plateNumber: 'AB 5678 EF', model: 'Suzuki Carry', capacity: 60, status: VehicleStatus.IDLE },
];

const mockPartners: Partner[] = [
    { id: 'm1', name: 'Sumber Air Sejahtera', type: PartnerType.SUPPLIER, contactPerson: 'Bapak Subagio', email: 'kontak@sumberair.com', phone: '0274-555-123', joinDate: '2021-03-10' },
    { id: 'm2', name: 'Distribusi Cepat Utama', type: PartnerType.DISTRIBUTOR, contactPerson: 'Ibu Wati', email: 'info@distribusicepat.co.id', phone: '0899-111-222', joinDate: '2022-08-25' },
];

const mockOrders: Order[] = [
    { id: 'o1', storeId: 's1', storeName: 'Toko Segar', items: [{ productId: 'p1', quantity: 10 }], totalAmount: 180000, status: OrderStatus.PENDING, orderDate: '2024-07-15', location: { lat: -7.82, lng: 110.42 }, assignedVehicleId: null, orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
    { id: 'o2', storeId: 's3', storeName: 'Minimarket Jaya', items: [{ productId: 'p1', quantity: 20 }, { productId: 'p2', quantity: 5 }], totalAmount: 585000, status: OrderStatus.PENDING, orderDate: '2024-07-15', location: { lat: -7.96, lng: 110.33 }, assignedVehicleId: null, orderedBy: { id: 'm2', name: 'Distribusi Cepat Utama', role: 'Mitra' } },
    { id: 'o3', storeId: 's2', storeName: 'Warung Barokah', items: [{ productId: 'p2', quantity: 5, specialPrice: 44000 }], totalAmount: 220000, status: OrderStatus.PENDING, orderDate: '2024-07-16', location: { lat: -7.75, lng: 110.40 }, assignedVehicleId: null, orderedBy: { id: 'u1', name: 'Budi Hartono', role: 'Admin' } },
    { id: 'o4', storeId: 's4', storeName: 'Kios Rejeki', items: [{ productId: 'p2', quantity: 15 }], totalAmount: 675000, status: OrderStatus.DELIVERED, orderDate: '2024-07-12', location: { lat: -7.78, lng: 110.30 }, assignedVehicleId: 'v1', orderedBy: { id: 'u2', name: 'Siti Aminah', role: 'Sales' } },
];

const mockSurveyResponses: SurveyResponse[] = [
    {
        id: 'sr1',
        salesPersonId: 'u2',
        surveyDate: '2024-07-20',
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
        feedback: 'Pelanggan sering menanyakan kemasan botol yang lebih kecil dari AIRKU.'
    }
];

const mockVisits: Visit[] = [
    { id: 'v1', storeId: 's1', salesPersonId: 'u2', visitDate: '2024-07-25', purpose: 'Repeat Order & Cek Stok', status: VisitStatus.UPCOMING, notes: 'Fokus pada penawaran galon.'},
    { id: 'v2', storeId: 's3', salesPersonId: 'u2', visitDate: '2024-07-25', purpose: 'Follow-up', status: VisitStatus.UPCOMING, notes: 'Sudah 2 bulan tidak order.'},
    { id: 'v3', storeId: 's4', salesPersonId: 'u2', visitDate: '2024-07-26', purpose: 'Penagihan', status: VisitStatus.UPCOMING, notes: 'Tagihan invoice #INV123 jatuh tempo.'},
    { id: 'v4', storeId: 's2', salesPersonId: 'u2', visitDate: '2024-07-24', purpose: 'Repeat Order & Cek Stok', status: VisitStatus.COMPLETED, proofOfVisitImage: 'https://i.pravatar.cc/400?img=1'},
]

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [stores, setStores] = useState<Store[]>(mockStores);
    const [products, setProducts] = useState<Product[]>(mockProducts);
    const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [partners, setPartners] = useState<Partner[]>(mockPartners);
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

    // Order Actions
     const addOrder = useCallback((order: Omit<Order, 'id' | 'totalAmount' | 'orderDate' | 'status' | 'storeName' | 'location' | 'assignedVehicleId'>): { success: boolean; message: string; } => {
        // Helper function
        const getItemsCapacity = (items: { productId: string, quantity: number }[]): number => {
            return items.reduce((acc, item) => {
                const product = products.find(p => p.id === item.productId);
                return acc + (product?.capacityUnit || 0) * item.quantity;
            }, 0);
        };

        // --- VALIDATION ---
        for (const item of order.items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                return { success: false, message: `Produk dengan ID ${item.productId} tidak ditemukan.` };
            }
            const availableStock = product.stock - product.reservedStock;
            if (item.quantity > availableStock) {
                return { success: false, message: `Stok untuk ${product.name} tidak mencukupi. Tersedia: ${availableStock}, Diminta: ${item.quantity}.` };
            }
        }

        const maxVehicleCapacity = Math.max(0, ...vehicles.map(v => v.capacity));
        if (maxVehicleCapacity === 0) {
            return { success: false, message: "Tidak ada armada yang tersedia." };
        }

        for (const item of order.items) {
            const product = products.find(p => p.id === item.productId)!;
            if (product.capacityUnit > maxVehicleCapacity) {
                return { success: false, message: `Produk tunggal "${product.name}" (${product.capacityUnit} unit) melebihi kapasitas armada terbesar (${maxVehicleCapacity} unit) dan tidak dapat diangkut.` };
            }
        }
        
        const store = stores.find(s => s.id === order.storeId);
        if (!store) {
            return { success: false, message: `Toko dengan id ${order.storeId} tidak ditemukan` };
        }
        
        const totalOrderCapacity = getItemsCapacity(order.items);

        // --- ORDER SPLITTING LOGIC ---
        if (totalOrderCapacity > maxVehicleCapacity) {
            let remainingItems = JSON.parse(JSON.stringify(order.items)); 
            const subOrdersItems: { productId: string; quantity: number; specialPrice?: number }[][] = [];

            while(remainingItems.some((item: {quantity: number}) => item.quantity > 0)) {
                let currentSubOrderItems: { productId: string; quantity: number; specialPrice?: number }[] = [];
                let currentSubOrderCapacity = 0;
                
                for(let i = 0; i < remainingItems.length; i++) {
                    const item = remainingItems[i];
                    if (item.quantity === 0) continue;

                    const product = products.find(p => p.id === item.productId)!;
                    const availableSpace = maxVehicleCapacity - currentSubOrderCapacity;
                    const canFitQuantity = Math.floor(availableSpace / product.capacityUnit);

                    if (canFitQuantity > 0) {
                        const quantityToAdd = Math.min(item.quantity, canFitQuantity);
                        
                        const existingSubOrderItem = currentSubOrderItems.find(soi => soi.productId === item.productId);
                        if (existingSubOrderItem) {
                            existingSubOrderItem.quantity += quantityToAdd;
                        } else {
                            currentSubOrderItems.push({ 
                                productId: item.productId, 
                                quantity: quantityToAdd,
                                specialPrice: item.specialPrice
                            });
                        }
                        
                        item.quantity -= quantityToAdd;
                        currentSubOrderCapacity += quantityToAdd * product.capacityUnit;
                    }
                }
                if(currentSubOrderItems.length > 0){
                    subOrdersItems.push(currentSubOrderItems);
                } else {
                    return { success: false, message: "Terjadi kesalahan saat memecah pesanan. Periksa kapasitas produk." };
                }
            }
            
            // --- Reserve stock and create orders from sub-orders ---
            setProducts(currentProducts => {
                let tempProducts = [...currentProducts];
                order.items.forEach(item => {
                    const productIndex = tempProducts.findIndex(p => p.id === item.productId);
                    if (productIndex !== -1) {
                        tempProducts[productIndex] = {
                            ...tempProducts[productIndex],
                            reservedStock: tempProducts[productIndex].reservedStock + item.quantity
                        };
                    }
                });
                return tempProducts;
            });

            let newOrders: Order[] = [];
            subOrdersItems.forEach(subItems => {
                 const newOrder: Order = {
                    ...order,
                    id: `o${Date.now()}-${Math.random().toString(16).slice(2)}`,
                    items: subItems,
                    status: OrderStatus.PENDING,
                    orderDate: new Date().toISOString().split('T')[0],
                    totalAmount: subItems.reduce((acc, item) => {
                        const product = products.find(p => p.id === item.productId);
                        const price = item.specialPrice ?? product?.price ?? 0;
                        return acc + (price * item.quantity);
                    }, 0),
                    location: store.location,
                    storeName: store.name,
                    assignedVehicleId: null,
                };
                newOrders.push(newOrder);
            });
            
            setOrders(currentOrders => {
                let tempOrders = [...currentOrders, ...newOrders];
                let idleVehicles = [...vehicles.filter(v => v.status === VehicleStatus.IDLE)];

                for(let i=0; i<newOrders.length; i++) {
                    const splitOrder = newOrders[i];
                    const splitOrderCapacity = getItemsCapacity(splitOrder.items);
                    
                    for(let j=0; j<idleVehicles.length; j++) {
                        const vehicle = idleVehicles[j];
                        const currentLoad = tempOrders
                            .filter(o => o.assignedVehicleId === vehicle.id)
                            .reduce((load, o) => load + getItemsCapacity(o.items), 0);
                        
                        if (vehicle.capacity >= currentLoad + splitOrderCapacity) {
                            splitOrder.assignedVehicleId = vehicle.id;
                            break;
                        }
                    }
                }
                return tempOrders
            });

            return { success: true, message: `Pesanan terlalu besar dan telah dipecah menjadi ${subOrdersItems.length} pengiriman.` };

        } else { // Normal order processing (fits in one vehicle)
            setProducts(currentProducts => {
                return currentProducts.map(p => {
                    const orderedItem = order.items.find(item => item.productId === p.id);
                    if (orderedItem) {
                        return { ...p, reservedStock: p.reservedStock + orderedItem.quantity };
                    }
                    return p;
                });
            });
            
            let assignedVehicleId: string | null = null;
            
            setOrders(currentOrders => {
                for (const vehicle of vehicles.filter(v => v.status === VehicleStatus.IDLE)) {
                     const currentLoad = currentOrders
                        .filter(o => o.assignedVehicleId === vehicle.id)
                        .reduce((load, o) => load + getItemsCapacity(o.items), 0);
                     if (vehicle.capacity >= currentLoad + totalOrderCapacity) {
                        assignedVehicleId = vehicle.id;
                        break;
                    }
                }
                
                const newOrder: Order = {
                    ...order,
                    id: `o${Date.now()}`,
                    status: OrderStatus.PENDING,
                    orderDate: new Date().toISOString().split('T')[0],
                    totalAmount: order.items.reduce((acc, item) => {
                        const product = products.find(p => p.id === item.productId);
                        const price = item.specialPrice ?? product?.price ?? 0;
                        return acc + (price * item.quantity);
                    }, 0),
                    location: store.location,
                    storeName: store.name,
                    assignedVehicleId,
                };
                
                return [...currentOrders, newOrder];
            });
            
            return { success: true, message: "Pesanan berhasil dibuat." };
        }
    }, [products, stores, vehicles]);

    const updateOrder = useCallback((orderId: string, updates: { items: OrderItem[]; assignedVehicleId: string | null; }): { success: boolean; message: string; } => {
        const originalOrder = orders.find(o => o.id === orderId);
        if (!originalOrder) {
            return { success: false, message: 'Pesanan tidak ditemukan.' };
        }

        const getItemsCapacity = (items: OrderItem[]): number => {
            return items.reduce((acc, item) => {
                const product = products.find(p => p.id === item.productId);
                return acc + (product?.capacityUnit || 0) * item.quantity;
            }, 0);
        };

        const updatedItems = updates.items;
        const updatedCapacity = getItemsCapacity(updatedItems);

        if (updates.assignedVehicleId) {
            const vehicle = vehicles.find(v => v.id === updates.assignedVehicleId);
            if (!vehicle) {
                return { success: false, message: 'Armada tidak ditemukan.' };
            }
            const otherOrdersLoad = orders
                .filter(o => o.assignedVehicleId === updates.assignedVehicleId && o.id !== orderId)
                .reduce((load, o) => load + getItemsCapacity(o.items), 0);

            if (vehicle.capacity < otherOrdersLoad + updatedCapacity) {
                return { success: false, message: `Kapasitas armada ${vehicle.plateNumber} tidak mencukupi.` };
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
                        const product = products.find(p => p.id === item.productId);
                        const price = item.specialPrice ?? product?.price ?? 0;
                        return acc + price * item.quantity;
                    }, 0);

                    return {
                        ...o,
                        items: updatedItems,
                        assignedVehicleId: updates.assignedVehicleId,
                        totalAmount: newTotalAmount,
                    };
                }
                return o;
            });
        });

        return { success: true, message: 'Pesanan berhasil diperbarui.' };
    }, [orders, products, vehicles]);

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

    const updateRoute = useCallback((updatedRoute: RoutePlan) => {
        setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
    }, []);

    const reassignOrder = useCallback((orderId: string, newVehicleId: string | null): boolean => {
        const orderToMove = orders.find(o => o.id === orderId);
        if (!orderToMove) return false;

        const orderCapacity = orderToMove.items.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product?.capacityUnit || 0) * item.quantity;
        }, 0);

        if (newVehicleId) {
             const newVehicle = vehicles.find(v => v.id === newVehicleId);
             if (!newVehicle) return false;

             const currentLoad = orders.filter(o => o.assignedVehicleId === newVehicle.id)
                 .reduce((load, o) => {
                     const oCapacity = o.items.reduce((acc, item) => {
                          const product = products.find(p => p.id === item.productId);
                          return acc + (product?.capacityUnit || 0) * item.quantity;
                     }, 0);
                     return load + oCapacity;
                 }, 0);

             if (newVehicle.capacity < currentLoad + orderCapacity) {
                 alert(`Kapasitas kendaraan ${newVehicle.plateNumber} tidak mencukupi.`);
                 return false;
             }
        }
       
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, assignedVehicleId: newVehicleId } : o));
        return true;
    }, [orders, vehicles, products]);
    
    const createRoutePlan = useCallback(async (driverId: string, vehicleId: string) => {
        const ordersToRoute = orders.filter(o => o.assignedVehicleId === vehicleId && o.status === OrderStatus.PENDING);
        if (ordersToRoute.length === 0) {
            alert("Tidak ada pesanan yang ditugaskan ke armada ini untuk dibuatkan rute.");
            return;
        };

        const depotLocation = { lat: -7.80, lng: 110.36 }; 
        const { sequence } = await optimizeAndSequenceRoute(ordersToRoute, depotLocation);
        
        const sequencedStops: RouteStop[] = sequence.map((id: string) => {
            const order = ordersToRoute.find(o => o.id === id)!;
            const store = stores.find(s => s.id === order.storeId)!;
            return {
                orderId: order.id,
                storeId: order.storeId,
                storeName: order.storeName,
                address: store.address,
                status: 'Pending'
            };
        });

        const newRoutePlan: RoutePlan = {
            id: `r-${Date.now()}`,
            driverId,
            vehicleId,
            date: new Date().toISOString().split('T')[0],
            stops: sequencedStops
        };

        const orderIdsToRoute = ordersToRoute.map(o => o.id);
        setOrders(prevOrders => prevOrders.map(o => 
            orderIdsToRoute.includes(o.id) ? { ...o, status: OrderStatus.ROUTED } : o
        ));

        setRoutes(prevRoutes => [...prevRoutes, newRoutePlan]);
    }, [orders, stores]);

    const createSalesVisitRoutePlan = useCallback(async (salesPersonId: string, visitDate: string) => {
        const visitsForDay = visits.filter(v => v.salesPersonId === salesPersonId && v.visitDate === visitDate && v.status === VisitStatus.UPCOMING);

        if (visitsForDay.length === 0) {
            alert("Tidak ada kunjungan yang dijadwalkan untuk sales ini pada tanggal tersebut.");
            return;
        }

        try {
            const { sequence } = await optimizeSalesVisitRoute(visitsForDay, stores);

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

        } catch (error) {
            console.error("Failed to create sales visit route plan:", error);
            alert("Gagal membuat rencana rute kunjungan. Silakan coba lagi.");
            throw error;
        }
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
      setStores(prev => prev.filter(s => s.id !== storeId));
    }, []);

    // User Actions
    const addUser = useCallback((user: Omit<User, 'id'>) => {
      setUsers(prev => [...prev, { ...user, id: `u${Date.now()}` }]);
    }, []);
    const updateUser = useCallback((updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);
    const deleteUser = useCallback((userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }, []);

    // Product Actions
    const addProduct = useCallback((product: Omit<Product, 'id' | 'reservedStock'>) => {
      setProducts(prev => [...prev, { ...product, id: `p${Date.now()}`, reservedStock: 0 }]);
    }, []);
    const updateProduct = useCallback((updatedProduct: Product) => {
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, []);
    const deleteProduct = useCallback((productId: string) => {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }, []);

    // Vehicle Actions
    const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id'>) => {
      setVehicles(prev => [...prev, { ...vehicle, id: `v${Date.now()}` }]);
    }, []);
    const updateVehicle = useCallback((updatedVehicle: Vehicle) => {
      setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    }, []);
    const deleteVehicle = useCallback((vehicleId: string) => {
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    }, []);

    // Partner Actions
    const addPartner = useCallback((partner: Omit<Partner, 'id'>) => {
      setPartners(prev => [...prev, { ...partner, id: `m${Date.now()}` }]);
    }, []);
    const updatePartner = useCallback((updatedPartner: Partner) => {
      setPartners(prev => prev.map(p => p.id === updatedPartner.id ? updatedPartner : p));
    }, []);
    const deletePartner = useCallback((partnerId: string) => {
      setPartners(prev => prev.filter(p => p.id !== partnerId));
    }, []);

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
      setVisits(prev => prev.filter(v => v.id !== visitId));
    }, []);


    const value: AppContextType = { 
        currentUser, login, logout,
        users, stores, products, vehicles, orders, routes, partners, surveyResponses, visits, salesVisitRoutes,
        addOrder, updateOrder, updateOrderStatus, createRoutePlan, dispatchVehicle, updateRoute, reassignOrder, completeVehicleRoute,
        addStore, updateStore, deleteStore,
        addUser, updateUser, deleteUser,
        addProduct, updateProduct, deleteProduct,
        addVehicle, updateVehicle, deleteVehicle,
        addPartner, updatePartner, deletePartner,
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