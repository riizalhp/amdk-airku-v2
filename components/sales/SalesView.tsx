import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { ICONS } from '../../constants';
import { Card } from '../ui/Card';
import { classifyStoreRegion } from '../../services/geminiService';
import { Store, OrderStatus, Product, SoughtProduct, CompetitorPrice, CompetitorVolume, SurveyResponse, Visit, VisitStatus, Role, SalesVisitRoutePlan, SalesVisitStop } from '../../types';
import { Modal } from '../ui/Modal';
import { DataView } from './DataView';


const getStatusClass = (status: VisitStatus) => {
    switch (status) {
        case VisitStatus.UPCOMING: return 'bg-blue-100 text-blue-800';
        case VisitStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case VisitStatus.SKIPPED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const VisitSchedule: React.FC = () => {
    const { salesVisitRoutes, visits, currentUser, updateVisitStatus } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const todayRoute = useMemo(() => {
        if (!currentUser) return undefined;
        const today = new Date().toISOString().split('T')[0];
        return salesVisitRoutes.find(r => r.salesPersonId === currentUser.id && r.date === today);
    }, [salesVisitRoutes, currentUser]);

    const [currentRouteStops, setCurrentRouteStops] = useState(todayRoute?.stops || []);
    const [isStarted, setIsStarted] = useState(false);
    
    // Photo capture flow state
    const [showProofModal, setShowProofModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stopBeingConfirmed, setStopBeingConfirmed] = useState<SalesVisitStop | null>(null);

    const getVisitStatus = (visitId: string): VisitStatus => {
        return visits.find(v => v.id === visitId)?.status || VisitStatus.UPCOMING;
    }
    
    const handleSkipVisit = (stop: SalesVisitStop) => {
        updateVisitStatus(stop.visitId, VisitStatus.SKIPPED);
    };

    const handleAttemptSuccess = (stop: SalesVisitStop) => {
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
    
    const handleConfirmVisit = () => {
        if (!stopBeingConfirmed || !capturedImage) return;
        updateVisitStatus(stopBeingConfirmed.visitId, VisitStatus.COMPLETED, capturedImage);
        setShowProofModal(false);
        setCapturedImage(null);
        setStopBeingConfirmed(null);
    };

    const allTasksCompleted = useMemo(() => {
      if (!todayRoute) return false;
      return todayRoute.stops.every(stop => getVisitStatus(stop.visitId) !== VisitStatus.UPCOMING);
    }, [todayRoute, visits]);

    if (!currentUser) return <p>Loading...</p>;
    
    if (!todayRoute) {
        return (
            <Card>
                <h2 className="text-xl font-bold text-brand-dark mb-4">Jadwal Kunjungan</h2>
                <p className="text-center text-gray-500 py-4">Tidak ada rencana rute kunjungan untuk Anda hari ini.</p>
            </Card>
        );
    }
    
    if (allTasksCompleted) {
        const completedCount = todayRoute.stops.filter(s => getVisitStatus(s.visitId) === VisitStatus.COMPLETED).length;
        const skippedCount = todayRoute.stops.filter(s => getVisitStatus(s.visitId) === VisitStatus.SKIPPED).length;
        return (
            <Card className="h-full flex flex-col justify-center items-center">
                <span className="text-green-500 inline-block">{React.cloneElement(ICONS.checkCircle, {width: 64, height: 64})}</span>
                <h2 className="text-2xl font-bold text-brand-dark mt-4">Semua Kunjungan Selesai!</h2>
                <p className="text-gray-600 mt-2">Kerja bagus, {currentUser.name}!</p>
                <div className="mt-6 text-left space-y-2 bg-gray-50 p-4 rounded-lg w-full">
                     <p><strong>Selesai:</strong> {completedCount} kunjungan</p>
                     <p><strong>Dilewati:</strong> {skippedCount} kunjungan</p>
                </div>
            </Card>
        );
    }

    if (!isStarted) {
        return (
            <Card className="h-full flex flex-col justify-center">
                 <h2 className="text-xl font-bold text-brand-dark mb-4 text-center">Rencana Kunjungan Hari Ini</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Total Kunjungan:</span>
                        <span className="font-bold">{todayRoute.stops.length}</span>
                    </div>
                 </div>
                  <button 
                    onClick={() => setIsStarted(true)}
                    className="w-full mt-8 bg-brand-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
                  >
                     {ICONS.navigation} Mulai Rute Kunjungan
                  </button>
            </Card>
        );
    }

    const stopsWithStatus = todayRoute.stops.map(stop => ({...stop, status: getVisitStatus(stop.visitId)}));

    return (
        <div>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handlePhotoCapture} />
            <h2 className="text-xl font-bold text-brand-dark mb-4">Rute Kunjungan</h2>
            <ol className="space-y-3">
                {stopsWithStatus.map((stop, index) => (
                    <li key={stop.visitId}>
                        <Card className={`p-4 transition-all ${stop.status !== VisitStatus.UPCOMING ? 'opacity-60 bg-gray-50' : ''}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                     <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${stop.status === VisitStatus.COMPLETED ? 'bg-green-500' : stop.status === VisitStatus.SKIPPED ? 'bg-red-500' : 'bg-brand-primary'}`}>
                                        {stop.status === VisitStatus.COMPLETED ? React.cloneElement(ICONS.checkCircle, {width: 16, height: 16}) : stop.status === VisitStatus.SKIPPED ? React.cloneElement(ICONS.xCircle, {width: 16, height: 16}) : index + 1}
                                    </span>
                                    <div>
                                        <p className="font-bold text-brand-dark">{stop.storeName}</p>
                                        <p className="text-xs text-gray-500">{stop.address}</p>
                                        <p className="text-sm mt-1 text-blue-800 font-semibold bg-blue-50 px-2 py-1 rounded-md inline-block">Tujuan: {stop.purpose}</p>
                                    </div>
                                </div>
                                 <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address)}`} target="_blank" rel="noopener noreferrer" className="p-2 text-brand-primary hover:bg-brand-light rounded-full">
                                    {ICONS.navigation}
                                </a>
                            </div>
                            {stop.status === VisitStatus.UPCOMING && (
                                 <div className="mt-4 grid grid-cols-2 gap-2">
                                     <button onClick={() => handleAttemptSuccess(stop)} className="flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-2 px-3 rounded-lg">
                                        {ICONS.checkCircle} Selesai
                                     </button>
                                     <button onClick={() => handleSkipVisit(stop)} className="flex items-center justify-center gap-2 bg-yellow-500 text-white font-semibold py-2 px-3 rounded-lg">
                                        {ICONS.xCircle} Lewati
                                     </button>
                                 </div>
                            )}
                        </Card>
                    </li>
                ))}
            </ol>
             <Modal title="Konfirmasi Bukti Kunjungan" isOpen={showProofModal} onClose={() => setShowProofModal(false)}>
                <div className="space-y-4">
                    <p>Harap konfirmasi foto ini sebagai bukti kunjungan untuk toko <strong>{stopBeingConfirmed?.storeName}</strong>.</p>
                    {capturedImage && (
                        <img src={capturedImage} alt="Bukti kunjungan" className="w-full h-auto rounded-lg border" />
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setShowProofModal(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Ambil Ulang</button>
                        <button onClick={handleConfirmVisit} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">
                            Konfirmasi Kunjungan
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

const parseCoordinatesFromURL = (url: string): { lat: number; lng: number } | null => {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match && match[1] && match[2]) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
};

const AcquireStore: React.FC = () => {
    const { addStore } = useAppContext();
    const [storeName, setStoreName] = useState('');
    const [owner, setOwner] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [googleMapsLink, setGoogleMapsLink] = useState('');
    const [isClassifying, setIsClassifying] = useState(false);
    const [classifiedRegion, setClassifiedRegion] = useState('');
    const [error, setError] = useState('');
    
    const handleClassify = useCallback(async () => {
        setIsClassifying(true);
        setClassifiedRegion('');
        setError('');
        const coords = parseCoordinatesFromURL(googleMapsLink);
        if (!coords) {
            setError("Link Google Maps tidak valid. Pastikan formatnya benar.");
            setIsClassifying(false);
            return;
        }
        try {
            const result = await classifyStoreRegion(coords);
            setClassifiedRegion(result.region);
            if (result.region === 'Bukan di Kulon Progo') {
                setError('Lokasi ini berada di luar wilayah layanan Kulon Progo.');
            }
        } catch (error) {
            console.error("Failed to classify region", error);
            setError('Gagal mengklasifikasikan wilayah.');
        } finally {
            setIsClassifying(false);
        }
    }, [googleMapsLink]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const coords = parseCoordinatesFromURL(googleMapsLink);
        if (!coords) {
            setError("Link Google Maps tidak valid. Mohon periksa kembali.");
            return;
        }

        if (!classifiedRegion) {
            setError("Harap klasifikasikan wilayah terlebih dahulu.");
            return;
        }
        
        if (classifiedRegion === 'Bukan di Kulon Progo') {
            setError("Toko di luar wilayah layanan tidak dapat ditambahkan.");
            return;
        }

        const newStore: Omit<Store, 'id'> = {
            name: storeName,
            owner,
            phone,
            location: coords,
            region: classifiedRegion,
            address,
            subscribedSince: new Date().toISOString().split('T')[0],
            lastOrder: 'N/A',
            isPartner: false,
            partnerCode: '',
        };
        addStore(newStore);
        alert(`Toko "${storeName}" berhasil ditambahkan!`);
        // Reset form
        setStoreName(''); setOwner(''); setPhone(''); setClassifiedRegion(''); setGoogleMapsLink(''); setAddress('');
    };

    const canSubmit = storeName && owner && phone && address && classifiedRegion && classifiedRegion !== 'Bukan di Kulon Progo' && !isClassifying;

    return (
        <Card>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Akuisisi Toko Baru</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <input type="text" placeholder="Nama Toko" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-2 border rounded" required/>
                <input type="text" placeholder="Nama Pemilik" value={owner} onChange={e => setOwner(e.target.value)} className="w-full p-2 border rounded" required/>
                <input type="text" placeholder="Nomor Telepon" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border rounded" required/>
                <input type="text" placeholder="Alamat Lengkap" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border rounded" required/>
                <input type="url" placeholder="Link Google Maps" value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} className="w-full p-2 border rounded" required/>

                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Wilayah (Otomatis)</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={handleClassify} disabled={isClassifying || !googleMapsLink} className="flex-shrink-0 bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400">
                            {isClassifying ? 'Menganalisis...' : 'Deteksi Wilayah'}
                        </button>
                        {classifiedRegion && (
                            <p className={`font-bold ${classifiedRegion === 'Bukan di Kulon Progo' ? 'text-red-600' : 'text-brand-dark'}`}>
                                Wilayah: <span className="text-lg">{classifiedRegion}</span>
                            </p>
                        )}
                    </div>
                </div>
                 {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400" disabled={!canSubmit}>
                    Tambah Toko
                </button>
            </form>
        </Card>
    )
}

type CartItem = {
    productId: string;
    quantity: number;
    specialPrice?: number;
};

const RequestOrder: React.FC = () => {
    const { stores, products, currentUser, addOrder } = useAppContext();
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderedBySource, setOrderedBySource] = useState('self');

    const partnerStores = useMemo(() => stores.filter(s => s.isPartner), [stores]);
    
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
        if (field === 'quantity') {
            let finalValue = value;
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
            setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, quantity: finalValue } : item));
            return;
        }
        
        if (field === 'specialPrice') {
            const product = products.find(p => p.id === productId)!;
            // Unset specialPrice if it's the same as normal price or invalid (<=0)
            if (value === product.price || value <= 0) {
                setCart(prevCart => prevCart.map(item => {
                    if (item.productId === productId) {
                        const { specialPrice, ...rest } = item;
                        return rest;
                    }
                    return item;
                }));
            } else {
                setCart(prevCart => prevCart.map(item => item.productId === productId ? { ...item, specialPrice: value } : item));
            }
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore || cart.length === 0) {
            alert('Silakan pilih toko dan tambahkan produk.');
            return;
        }
        if (!currentUser) {
            alert("Sesi tidak valid.");
            return;
        }

        let orderedByData;
        if (orderedBySource === 'self') {
            orderedByData = { id: currentUser.id, name: currentUser.name, role: currentUser.role };
        } else {
            const partnerStore = stores.find((s: Store) => s.id === orderedBySource);
            if (!partnerStore) {
                alert("Mitra tidak ditemukan.");
                return;
            }
            orderedByData = { id: partnerStore.id, name: partnerStore.name, role: 'Mitra' };
        }

        const result = addOrder({ storeId: selectedStore, items: cart, orderedBy: orderedByData });
        alert(result.message);
        if(result.success) {
            setSelectedStore('');
            setCart([]);
            setOrderedBySource('self');
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
        <Card>
            <h2 className="text-xl font-bold text-brand-dark mb-4">Request Pesanan Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Pilih Toko</label>
                    <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="w-full p-2 border rounded mt-1" required>
                        <option value="" disabled>-- Pilih Toko --</option>
                        {stores.map(store => <option key={store.id} value={store.id}>{store.name} - {store.owner}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Dipesan Melalui</label>
                    <select value={orderedBySource} onChange={e => setOrderedBySource(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" required>
                        <option value="self">Diri Sendiri ({currentUser?.name})</option>
                        {partnerStores.map((store: Store) => <option key={store.id} value={store.id}>{store.name} [Mitra]</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Produk Tersedia</label>
                    <div className="space-y-2 mt-1 max-h-40 overflow-y-auto p-1">
                        {products.map(product => {
                            const availableStock = product.stock - product.reservedStock;
                            return (
                            <div key={product.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                    <span>{product.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">(Stok: {availableStock})</span>
                                </div>
                                <button type="button" onClick={() => handleAddProduct(product.id)} className="bg-brand-secondary text-white px-2 py-1 rounded text-sm" disabled={availableStock <= 0}>
                                    {availableStock > 0 ? 'Tambah' : 'Habis'}
                                </button>
                            </div>
                        )})}
                    </div>
                </div>
                {cart.length > 0 && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Keranjang</label>
                        <div className="space-y-2 mt-1 border p-2 rounded-lg">
                             <div className="grid grid-cols-5 gap-2 text-xs font-bold text-gray-600 px-1 pb-1 border-b">
                                <span className="col-span-2">Produk</span>
                                <span className="text-center">Jumlah</span>
                                <span className="col-span-2 text-center">Harga Jual (Rp)</span>
                            </div>
                            {cart.map(item => {
                                const product = products.find(p => p.id === item.productId);
                                if (!product) return null;

                                const displayPrice = item.specialPrice ?? product.price;
                                let profitText = null;

                                if (item.specialPrice !== undefined && item.specialPrice !== product.price) {
                                    const profit = item.specialPrice - product.price;
                                    const profitClass = profit > 0 ? "text-green-600" : "text-red-600";
                                    const profitLabel = profit > 0 ? "Untung" : "Rugi";
                                    profitText = (
                                        <p className={`text-xs ${profitClass} text-center`}>
                                            {profitLabel}: Rp {Math.abs(profit).toLocaleString('id-ID')}/item
                                        </p>
                                    );
                                }

                                return (
                                    <div key={item.productId} className="grid grid-cols-5 gap-2 items-center py-2">
                                        <div className="col-span-2">
                                            <span className="text-sm">{product.name}</span>
                                            <p className="text-xs text-gray-400">Normal: {product.price.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="flex justify-center">
                                            <input type="number" min="1" value={item.quantity} onChange={e => handleUpdateCart(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-full p-1 border rounded text-center"/>
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" min="0" placeholder={product.price.toString()} value={displayPrice} onChange={e => handleUpdateCart(item.productId, 'specialPrice', parseInt(e.target.value) || 0)} className="w-full p-1 border rounded text-center"/>
                                            {profitText}
                                        </div>
                                    </div>
                                )
                            })}
                             <div className="text-right font-bold mt-2 pt-2 border-t">
                                {totalAmount !== totalNormalPrice && (
                                    <p className="text-sm font-normal text-gray-500 mb-1">
                                        Total Harga Normal: Rp {totalNormalPrice.toLocaleString('id-ID')}
                                    </p>
                                )}
                                <p className="text-lg">Total Harga Jual: Rp {totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                )}
                 <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400" disabled={!selectedStore || cart.length === 0}>
                    Kirim Request Order
                </button>
            </form>
        </Card>
    );
};

const MarketSurvey: React.FC = () => {
    const { products, currentUser, addSurveyResponse } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialFormState = {
        storeName: '',
        storeAddress: '',
        storePhone: '',
        surveyDate: new Date().toISOString().split('T')[0],
        mostSoughtProducts: [] as SoughtProduct[],
        popularAirkuVariants: [] as string[],
        competitorPrices: [] as CompetitorPrice[],
        competitorVolumes: [] as CompetitorVolume[],
        feedback: '',
        proofOfSurveyImage: '',
    };

    const [form, setForm] = useState(initialFormState);
    const [proofImage, setProofImage] = useState<string | null>(null);
    const [newSoughtProduct, setNewSoughtProduct] = useState({ brand: '', variant: '' });
    const [newAirkuVariant, setNewAirkuVariant] = useState('');

    const handleReorder = (listName: 'mostSoughtProducts' | 'popularAirkuVariants', index: number, direction: 'up' | 'down') => {
        setForm(prevForm => {
            const list = [...prevForm[listName]];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= list.length) return prevForm;
            [list[index], list[newIndex]] = [list[newIndex], list[index]]; // Swap
            return { ...prevForm, [listName]: list };
        });
    };

    const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProofImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const competitors = useMemo(() => {
        const brands = form.mostSoughtProducts
            .map(p => p.brand)
            .filter(b => b.toLowerCase() !== 'airku');
        return [...new Set(brands)]; // Unique competitor brands
    }, [form.mostSoughtProducts]);
    
    const handleAddSoughtProduct = () => {
        if(newSoughtProduct.brand && newSoughtProduct.variant) {
            setForm(prev => ({ ...prev, mostSoughtProducts: [...prev.mostSoughtProducts, newSoughtProduct]}));
            setNewSoughtProduct({ brand: '', variant: '' });
        }
    };

    const handleAddAirkuVariant = () => {
        if (newAirkuVariant && !form.popularAirkuVariants.includes(newAirkuVariant)) {
            setForm(prev => ({ ...prev, popularAirkuVariants: [...prev.popularAirkuVariants, newAirkuVariant] }));
            setNewAirkuVariant('');
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!form.storeName || !currentUser) {
            alert("Harap isi nama toko terlebih dahulu.");
            return;
        }
        if (!proofImage) {
            alert("Harap ambil foto sebagai bukti survei.");
            return;
        }

        const surveyData: Omit<SurveyResponse, 'id'> = {
            ...form,
            salesPersonId: currentUser.id,
            proofOfSurveyImage: proofImage,
        }
        addSurveyResponse(surveyData);
        alert("Laporan survei berhasil dikirim!");
        setForm(initialFormState);
        setProofImage(null);
    };
    
    const airkuProductNames = products.map(p => p.name);
    const canSubmit = form.storeName && proofImage;

    return (
        <Card>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handlePhotoCapture} />
            <h2 className="text-xl font-bold text-brand-dark mb-4">Lakukan Survei Pasar</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bagian 1: Informasi Dasar */}
                <fieldset className="space-y-4 p-4 border rounded-lg">
                    <legend className="px-2 font-semibold text-brand-primary">Informasi Dasar & Bukti</legend>
                    <input type="text" placeholder="Nama Toko" value={form.storeName} onChange={e => setForm(f => ({...f, storeName: e.target.value}))} className="w-full p-2 border rounded" required/>
                    <input type="text" placeholder="Alamat Toko" value={form.storeAddress} onChange={e => setForm(f => ({...f, storeAddress: e.target.value}))} className="w-full p-2 border rounded" required/>
                    <input type="tel" placeholder="No. Telepon Toko" value={form.storePhone} onChange={e => setForm(f => ({...f, storePhone: e.target.value}))} className="w-full p-2 border rounded" required/>
                    <input type="date" value={form.surveyDate} onChange={e => setForm(f => ({...f, surveyDate: e.target.value}))} className="w-full p-2 border rounded" required/>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bukti Survei (Wajib)</label>
                        {proofImage ? (
                            <div className="relative">
                                <img src={proofImage} alt="Bukti survei" className="w-full h-auto rounded-lg border" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute top-2 right-2 bg-white/70 text-black p-2 rounded-full"
                                >
                                    Ambil Ulang
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()} 
                                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg text-gray-500 hover:bg-gray-50"
                            >
                                {ICONS.camera}
                                Ambil Foto Bukti Survei
                            </button>
                        )}
                    </div>
                </fieldset>

                {/* Bagian 2: Pertanyaan Survei */}
                <fieldset className="space-y-4 p-4 border rounded-lg">
                    <legend className="px-2 font-semibold text-brand-primary">Detail Survei</legend>
                    
                    {/* Q1 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Produk Air Mineral yang Paling Sering Dicari Konsumen?</label>
                        <div className="space-y-2">
                           {form.mostSoughtProducts.map((p, i) => (
                               <div key={i} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                                   <span className="font-bold">{i+1}.</span>
                                   <span className="flex-grow">{p.brand} - {p.variant}</span>
                                    <button type="button" onClick={() => handleReorder('mostSoughtProducts', i, 'up')} disabled={i === 0}>▲</button>
                                    <button type="button" onClick={() => handleReorder('mostSoughtProducts', i, 'down')} disabled={i === form.mostSoughtProducts.length - 1}>▼</button>
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                           <input type="text" placeholder="Merek" value={newSoughtProduct.brand} onChange={e => setNewSoughtProduct(p => ({...p, brand: e.target.value}))} className="w-full p-2 border rounded"/>
                           <input type="text" placeholder="Varian" value={newSoughtProduct.variant} onChange={e => setNewSoughtProduct(p => ({...p, variant: e.target.value}))} className="w-full p-2 border rounded"/>
                           <button type="button" onClick={handleAddSoughtProduct} className="bg-brand-secondary text-white px-3 rounded">+</button>
                        </div>
                    </div>

                    {/* Q2 */}
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2. Varian AIRKU yang Paling Banyak Dicari?</label>
                        <div className="space-y-2">
                           {form.popularAirkuVariants.map((v, i) => (
                               <div key={i} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                                   <span className="font-bold">{i+1}.</span>
                                   <span className="flex-grow">{v}</span>
                                    <button type="button" onClick={() => handleReorder('popularAirkuVariants', i, 'up')} disabled={i === 0}>▲</button>
                                    <button type="button" onClick={() => handleReorder('popularAirkuVariants', i, 'down')} disabled={i === form.popularAirkuVariants.length - 1}>▼</button>
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                           <select value={newAirkuVariant} onChange={e => setNewAirkuVariant(e.target.value)} className="w-full p-2 border rounded bg-white">
                                <option value="" disabled>-- Pilih Varian AIRKU --</option>
                                {airkuProductNames.map(name => <option key={name} value={name}>{name}</option>)}
                           </select>
                           <button type="button" onClick={handleAddAirkuVariant} className="bg-brand-secondary text-white px-3 rounded">+</button>
                        </div>
                    </div>
                    
                    {/* Q3 & Q4 - Competitors */}
                    {competitors.length > 0 && (
                        <>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">3. Rata-Rata Harga Jual Kompetitor?</label>
                            {competitors.map(brand => (
                                <div key={brand} className="mt-2 p-2 border-t">
                                  <p className="font-semibold">{brand}</p>
                                  <input type="number" placeholder="Harga Jual (Rp)" className="w-full p-2 border rounded mt-1"/>
                                </div>
                            ))}
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">4. Rata-Rata Order Toko per Bulan (Kompetitor)?</label>
                            {competitors.map(brand => (
                                <div key={brand} className="mt-2 p-2 border-t">
                                  <p className="font-semibold">{brand}</p>
                                  <input type="text" placeholder="Contoh: 50 dus/bulan" className="w-full p-2 border rounded mt-1"/>
                                </div>
                            ))}
                        </div>
                        </>
                    )}


                    {/* Q5 */}
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">5. Masukan untuk AIRKU?</label>
                        <textarea value={form.feedback} onChange={e => setForm(f => ({...f, feedback: e.target.value}))} rows={4} className="w-full p-2 border rounded" placeholder="Tuliskan saran, kritik, atau masukan dari pemilik toko..."></textarea>
                    </div>

                </fieldset>

                <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400" disabled={!canSubmit}>Kirim Laporan Survei</button>
            </form>
        </Card>
    );
}


export const SalesView: React.FC = () => {
    const { logout, currentUser } = useAppContext();
    const [activePage, setActivePage] = useState<SalesPage>('schedule');
    
    type SalesPage = 'schedule' | 'acquire' | 'order' | 'survey' | 'database';
    
    const renderContent = () => {
        switch (activePage) {
            case 'schedule': return <VisitSchedule />;
            case 'acquire': return <AcquireStore />;
            case 'order': return <RequestOrder />;
            case 'survey': return <MarketSurvey />;
            case 'database': return <DataView />;
            default: return <VisitSchedule />;
        }
    };
    
    const navItems = [
        { id: 'schedule', label: 'Kunjungan', icon: ICONS.calendar },
        { id: 'database', label: 'Data Toko', icon: ICONS.store },
        { id: 'order', label: 'Pesan', icon: ICONS.orders },
        { id: 'survey', label: 'Survei', icon: ICONS.survey },
        { id: 'acquire', label: 'Akuisisi', icon: ICONS.plus },
    ];

    return (
        <div className="w-full md:w-[420px] mx-auto bg-white flex flex-col h-screen shadow-2xl">
            <header className="bg-brand-primary text-white p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Portal Sales</h1>
                    <p className="text-sm opacity-90">{currentUser?.name}</p>
                </div>
                <button onClick={logout} className="p-2 rounded-full hover:bg-white/20" aria-label="Keluar">
                    {ICONS.logout}
                </button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto bg-brand-background">
                {renderContent()}
            </main>
            <nav className="grid grid-cols-5 gap-2 p-2 border-t bg-white">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActivePage(item.id as SalesPage)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                            activePage === item.id ? 'bg-brand-light text-brand-primary' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <span className="w-6 h-6">{item.icon}</span>
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};