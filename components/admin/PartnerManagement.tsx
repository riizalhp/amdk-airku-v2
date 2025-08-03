
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Partner, PartnerType } from '../../types';
import { Modal } from '../ui/Modal';

export const PartnerManagement: React.FC = () => {
    const { partners, addPartner, updatePartner, deletePartner } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormState: Omit<Partner, 'id' | 'joinDate'> = { 
        name: '', 
        type: PartnerType.SUPPLIER, 
        contactPerson: '', 
        email: '', 
        phone: '' 
    };
    const [currentPartner, setCurrentPartner] = useState<Omit<Partner, 'id' | 'joinDate'> | Partner>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    const openModalForAdd = () => {
        setIsEditing(false);
        setCurrentPartner(initialFormState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (partner: Partner) => {
        setIsEditing(true);
        setCurrentPartner(partner);
        setIsModalOpen(true);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentPartner(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentPartner.name && currentPartner.contactPerson && currentPartner.email) {
            if (isEditing) {
                updatePartner(currentPartner as Partner);
            } else {
                addPartner({
                    ...(currentPartner as Omit<Partner, 'id' | 'joinDate'>),
                    joinDate: new Date().toISOString().split('T')[0]
                });
            }
            setIsModalOpen(false);
        }
    };

    const handleDelete = (partnerId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus mitra ini?')) {
            deletePartner(partnerId);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Manajemen Mitra</h1>
                <button
                    onClick={openModalForAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Tambah Mitra
                </button>
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nama Mitra</th>
                                <th scope="col" className="px-6 py-3">Tipe</th>
                                <th scope="col" className="px-6 py-3">Narahubung</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Telepon</th>
                                <th scope="col" className="px-6 py-3">Tanggal Bergabung</th>
                                <th scope="col" className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partners.map((partner: Partner) => (
                                <tr key={partner.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{partner.name}</td>
                                    <td className="px-6 py-4">{partner.type}</td>
                                    <td className="px-6 py-4">{partner.contactPerson}</td>
                                    <td className="px-6 py-4">{partner.email}</td>
                                    <td className="px-6 py-4">{partner.phone}</td>
                                    <td className="px-6 py-4">{partner.joinDate}</td>
                                    <td className="px-6 py-4 flex space-x-2">
                                        <button onClick={() => openModalForEdit(partner)} className="text-blue-600 hover:text-blue-800">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                                        <button onClick={() => handleDelete(partner.id)} className="text-red-600 hover:text-red-800">{React.cloneElement(ICONS.trash, {width: 20, height: 20})}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal title={isEditing ? "Edit Mitra" : "Tambah Mitra Baru"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Mitra</label>
                        <input type="text" name="name" id="name" value={currentPartner.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                     <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Mitra</label>
                        <select name="type" id="type" value={currentPartner.type} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                            {Object.values(PartnerType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Narahubung</label>
                        <input type="text" name="contactPerson" id="contactPerson" value={currentPartner.contactPerson} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" name="email" id="email" value={currentPartner.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telepon</label>
                        <input type="text" name="phone" id="phone" value={currentPartner.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">{isEditing ? "Simpan Perubahan" : "Tambah Mitra"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
