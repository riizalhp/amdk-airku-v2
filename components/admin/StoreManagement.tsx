
import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Store, Coordinate } from '../../types';
import { Modal } from '../ui/Modal';


const parseCoordinatesFromURL = (url: string): Coordinate | null => {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match && match[1] && match[2]) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
};

export const StoreManagement: React.FC = () => {
    const { stores, addStore, updateStore, deleteStore, orders, visits } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormState: Omit<Store, 'id'> = {
        name: '',
        address: '',
        location: { lat: 0, lng: 0 },
        region: '',
        owner: '',
        phone: '',
        subscribedSince: new Date().toISOString().split('T')[0],
        lastOrder: 'N/A',
        isPartner: false,
        partnerCode: '',
    };
    const [currentStore, setCurrentStore] = useState<Omit<Store, 'id'> | Store>(initialFormState);
    const [googleMapsLink, setGoogleMapsLink] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [formError, setFormError] = useState('');
    const [isClassifying, setIsClassifying] = useState(false);
    const [detectedRegion, setDetectedRegion] = useState('');


    const openModalForAdd = () => {
        setIsEditing(false);
        setCurrentStore(initialFormState);
        setGoogleMapsLink('');
        setFormError('');
        setDetectedRegion('');
        setIsClassifying(false);
        setIsModalOpen(true);
    };

    const openModalForEdit = (store: Store) => {
        setIsEditing(true);
        setCurrentStore(store);
        setGoogleMapsLink('');
        setFormError('');
        setDetectedRegion(store.region);
        setIsClassifying(false);
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentStore(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setCurrentStore(prev => {
            const newStore = { ...prev, [name]: checked };
            if (!checked) {
                // Clear partner code if unchecked
                (newStore as Partial<Store>).partnerCode = '';
            }
            return newStore;
        });
    };

    const handleDetectRegion = async () => {
        setFormError('');
        setDetectedRegion('');
        const coords = parseCoordinatesFromURL(googleMapsLink);
        if (!coords) {
            setFormError("Link Google Maps tidak valid. Pastikan formatnya benar.");
            return;
        }

        setIsClassifying(true);
        try {
            const { lat, lng } = coords;
            let region: 'Timur' | 'Barat' | 'Bukan di Kulon Progo' = 'Bukan di Kulon Progo';

            // Bounding box for Kulon Progo
            const minLat = -8.00;
            const maxLat = -7.67;
            const minLng = 110.00;
            const maxLng = 110.30;
            const pdamKulonProgoLongitude = 110.1486773;

            if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
                if (lng > pdamKulonProgoLongitude) {
                    region = 'Timur';
                } else {
                    region = 'Barat';
                }
            }

            setDetectedRegion(region);
            if (region === 'Bukan di Kulon Progo') {
                setFormError('Lokasi toko berada di luar wilayah layanan Kulon Progo.');
            }
        } catch (error) {
            console.error(error);
            setFormError('Terjadi kesalahan saat mendeteksi wilayah.');
        } finally {
            setIsClassifying(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (currentStore.isPartner && !currentStore.partnerCode) {
            setFormError('Kode Mitra wajib diisi jika toko adalah mitra.');
            return;
        }

        if (!detectedRegion) {
            setFormError('Harap deteksi wilayah terlebih dahulu.');
            return;
        }

        if (detectedRegion === 'Bukan di Kulon Progo') {
            setFormError('Lokasi toko berada di luar wilayah layanan Kulon Progo dan tidak dapat ditambahkan.');
            return;
        }

        let coordinates = 'location' in currentStore ? currentStore.location : null;

        if (googleMapsLink) {
            const parsedCoords = parseCoordinatesFromURL(googleMapsLink);
            if (parsedCoords) {
                coordinates = parsedCoords;
            } else {
                setFormError('Link Google Maps tidak valid. Mohon periksa kembali.');
                return;
            }
        } else if (!isEditing) {
            setFormError('Link Google Maps wajib diisi untuk toko baru.');
            return;
        }
        
        if (!coordinates) {
            setFormError('Lokasi tidak dapat ditentukan.');
            return;
        }

        let storeData = { ...currentStore, location: coordinates, region: detectedRegion };

        if (!storeData.isPartner) {
            storeData.partnerCode = '';
        }

        if(currentStore.name && currentStore.owner && currentStore.phone) {
            if(isEditing) {
                updateStore(storeData as Store);
            } else {
                addStore(storeData as Omit<Store, 'id'>);
            }
            setIsModalOpen(false);
        }
    };

    const handleDelete = (storeId: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus toko ini?')) {
            deleteStore(storeId);
        }
    };
    
    const canSubmit = currentStore.name && currentStore.owner && currentStore.phone && detectedRegion && detectedRegion !== 'Bukan di Kulon Progo' && !isClassifying;

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Toko</h1>
                <button
                    onClick={openModalForAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Tambah Toko
                </button>
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Toko</th>
                                <th scope="col" className="px-6 py-3">Pemilik</th>
                                <th scope="col" className="px-6 py-3">Wilayah</th>
                                <th scope="col" className="px-6 py-3">Status Mitra</th>
                                <th scope="col" className="px-6 py-3">Telepon</th>
                                <th scope="col" className="px-6 py-3">Tanggal Bergabung</th>
                                <th scope="col" className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((store: Store) => {
                                const hasDependencies = orders.some(o => o.storeId === store.id) || visits.some(v => v.storeId === store.id);
                                return (
                                <tr key={store.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{store.name}</td>
                                    <td className="px-6 py-4">{store.owner}</td>
                                    <td className="px-6 py-4">{store.region}</td>
                                    <td className="px-6 py-4">
                                        {store.isPartner ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 font-mono">
                                                {store.partnerCode}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{store.phone}</td>
                                    <td className="px-6 py-4">{store.subscribedSince}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => openModalForEdit(store)} className="text-blue-600 hover:text-blue-800 p-1">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                                        <div className="relative group">
                                            <button
                                                onClick={() => handleDelete(store.id)}
                                                disabled={hasDependencies}
                                                className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {React.cloneElement(ICONS.trash, { width: 20, height: 20 })}
                                            </button>
                                            {hasDependencies && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Tidak dapat dihapus karena memiliki pesanan/kunjungan terkait.
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </Card>

             <Modal title={isEditing ? "Edit Toko" : "Tambah Toko Baru"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" placeholder="Nama Toko" value={currentStore.name} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                    <input type="text" name="owner" placeholder="Nama Pemilik" value={currentStore.owner} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                    <input type="text" name="phone" placeholder="Nomor Telepon" value={currentStore.phone} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                    <input type="text" name="address" placeholder="Alamat" value={currentStore.address} onChange={handleInputChange} className="w-full p-2 border rounded" required />
                    
                    <div>
                        <label htmlFor="gmaps" className="block text-sm font-medium text-gray-700">Link Google Maps</label>
                        <input type="url" name="gmaps" id="gmaps" placeholder="Tempel link Google Maps di sini" value={googleMapsLink} onChange={(e) => setGoogleMapsLink(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required={!isEditing} />
                        {isEditing && 'location' in currentStore && (
                            <p className="text-xs text-gray-500 mt-1">
                                Koordinat saat ini: {currentStore.location.lat.toFixed(5)}, {currentStore.location.lng.toFixed(5)}. <br/>
                                Isi kolom di atas untuk memperbarui lokasi.
                            </p>
                        )}
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Wilayah (Otomatis)</label>
                        <div className="flex items-center gap-4">
                             <button type="button" onClick={handleDetectRegion} disabled={isClassifying || !googleMapsLink} className="flex-shrink-0 bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg disabled:bg-gray-400">
                                {isClassifying ? 'Mendeteksi...' : 'Deteksi Wilayah'}
                            </button>
                             {detectedRegion && (
                                <p className={`font-bold ${detectedRegion === 'Bukan di Kulon Progo' ? 'text-red-600' : 'text-brand-dark'}`}>
                                    Wilayah Terdeteksi: <span className="text-lg">{detectedRegion}</span>
                                </p>
                             )}
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <div className="flex items-center space-x-3">
                            <input 
                                type="checkbox" 
                                id="isPartner" 
                                name="isPartner"
                                checked={currentStore.isPartner}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <label htmlFor="isPartner" className="text-sm font-medium text-gray-800">Jadikan sebagai Mitra</label>
                        </div>
                        {currentStore.isPartner && (
                            <div className="mt-4">
                                <label htmlFor="partnerCode" className="block text-sm font-medium text-gray-700">Kode Mitra</label>
                                <input 
                                    type="text" 
                                    name="partnerCode" 
                                    id="partnerCode"
                                    value={currentStore.partnerCode || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required={currentStore.isPartner} 
                                />
                            </div>
                        )}
                    </div>


                    {formError && <p className="text-sm text-red-600">{formError}</p>}
                    
                     <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" disabled={!canSubmit} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark disabled:bg-gray-400">{isEditing ? "Simpan Perubahan" : "Tambah Toko"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};