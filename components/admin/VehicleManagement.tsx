

import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Vehicle, VehicleStatus } from '../../types';
import { Modal } from '../ui/Modal';

export const VehicleManagement: React.FC = () => {
    const { vehicles, addVehicle, updateVehicle, deleteVehicle, orders, routes } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormState: Omit<Vehicle, 'id'> = { plateNumber: '', model: '', capacity: 0, status: VehicleStatus.IDLE, region: 'Timur' };
    const [currentVehicle, setCurrentVehicle] = useState<Omit<Vehicle, 'id'> | Vehicle>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    const openModalForAdd = () => {
        setIsEditing(false);
        setCurrentVehicle(initialFormState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (vehicle: Vehicle) => {
        setIsEditing(true);
        setCurrentVehicle(vehicle);
        setIsModalOpen(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentVehicle(prev => ({ ...prev, [name]: (name === 'capacity') ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentVehicle.plateNumber && currentVehicle.model && currentVehicle.capacity > 0) {
            if (isEditing) {
                updateVehicle(currentVehicle as Vehicle);
            } else {
                addVehicle(currentVehicle as Omit<Vehicle, 'id'>);
            }
            setIsModalOpen(false);
        }
    };

    const handleDelete = (vehicleId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus armada ini? Aksi ini tidak dapat dibatalkan.')) {
            deleteVehicle(vehicleId);
        }
    };
    
    const getStatusClass = (status: VehicleStatus) => {
        switch (status) {
            case VehicleStatus.IDLE: return 'bg-green-100 text-green-800';
            case VehicleStatus.DELIVERING: return 'bg-blue-100 text-blue-800';
            case VehicleStatus.REPAIR: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Armada</h1>
                <button
                    onClick={openModalForAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Tambah Armada
                </button>
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">No. Polisi</th>
                                <th scope="col" className="px-6 py-3">Model</th>
                                <th scope="col" className="px-6 py-3">Kapasitas (Unit)</th>
                                <th scope="col" className="px-6 py-3">Wilayah</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.map((vehicle: Vehicle) => {
                                const hasDependencies = orders.some(o => o.assignedVehicleId === vehicle.id) || routes.some(r => r.vehicleId === vehicle.id);
                                return (
                                <tr key={vehicle.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">{vehicle.plateNumber}</td>
                                    <td className="px-6 py-4">{vehicle.model}</td>
                                    <td className="px-6 py-4">{vehicle.capacity}</td>
                                    <td className="px-6 py-4">{vehicle.region}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(vehicle.status)}`}>
                                            {vehicle.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => openModalForEdit(vehicle)} className="text-blue-600 hover:text-blue-800 p-1">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                                        <div className="relative group">
                                            <button
                                                onClick={() => handleDelete(vehicle.id)}
                                                disabled={hasDependencies}
                                                className="text-red-600 hover:text-red-800 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                {React.cloneElement(ICONS.trash, { width: 20, height: 20 })}
                                            </button>
                                            {hasDependencies && (
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Tidak dapat dihapus karena ditugaskan pada pesanan/rute.
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

            <Modal title={isEditing ? "Edit Armada" : "Tambah Armada Baru"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700">Nomor Polisi</label>
                        <input type="text" name="plateNumber" id="plateNumber" value={currentVehicle.plateNumber} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700">Model Kendaraan</label>
                        <input type="text" name="model" id="model" value={currentVehicle.model} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Wilayah Operasi</label>
                         <select name="region" id="region" value={currentVehicle.region} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                            <option value="Timur">Timur</option>
                            <option value="Barat">Barat</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Kapasitas (dalam unit produk)</label>
                        <input type="number" name="capacity" id="capacity" value={currentVehicle.capacity} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={currentVehicle.status} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm">
                            {Object.values(VehicleStatus).map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">{isEditing ? "Simpan Perubahan" : "Tambah Armada"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};