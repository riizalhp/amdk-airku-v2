import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { Visit, VisitStatus, Role } from '../../types';
import { Modal } from '../ui/Modal';

const getStatusClass = (status: VisitStatus) => {
    switch (status) {
        case VisitStatus.UPCOMING: return 'bg-blue-100 text-blue-800';
        case VisitStatus.COMPLETED: return 'bg-green-100 text-green-800';
        case VisitStatus.SKIPPED: return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const VisitCard: React.FC<{ visit: Visit, onEdit: () => void, onDelete: () => void, onViewProof: () => void }> = ({ visit, onEdit, onDelete, onViewProof }) => {
    const { stores, users } = useAppContext();
    const store = stores.find(s => s.id === visit.storeId);
    const sales = users.find(u => u.id === visit.salesPersonId);

    if (!store || !sales) return null;

    return (
        <Card className="flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-brand-dark">{store.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(visit.status)}`}>
                        {visit.status}
                    </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold">Tujuan Kunjungan:</p>
                    <p className="text-sm text-gray-700">{visit.purpose}</p>
                </div>
                 {visit.notes && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold">Catatan:</p>
                        <p className="text-sm text-gray-700 italic">{visit.notes}</p>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">Sales: <span className="font-semibold">{sales.name}</span></p>
                <div className="flex space-x-2">
                     {visit.proofOfVisitImage && (
                        <button onClick={onViewProof} className="text-brand-primary hover:text-brand-dark p-1">
                            {React.cloneElement(ICONS.camera, {width: 20, height: 20})}
                        </button>
                     )}
                    <button onClick={onEdit} className="text-blue-600 hover:text-blue-800 p-1">{React.cloneElement(ICONS.edit, {width: 20, height: 20})}</button>
                    <button onClick={onDelete} className="text-red-600 hover:text-red-800 p-1">{React.cloneElement(ICONS.trash, {width: 20, height: 20})}</button>
                </div>
            </div>
        </Card>
    );
}

export const VisitSchedule: React.FC = () => {
    const { visits, stores, users, addVisit, updateVisitStatus, deleteVisit } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormState: Omit<Visit, 'id' | 'proofOfVisitImage'> = {
        storeId: '',
        salesPersonId: '',
        visitDate: new Date().toISOString().split('T')[0],
        purpose: 'Repeat Order & Cek Stok',
        status: VisitStatus.UPCOMING,
        notes: '',
    };
    const [currentVisit, setCurrentVisit] = useState<Omit<Visit, 'id'> | Visit>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [filterSalesId, setFilterSalesId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<VisitStatus | 'all'>('all');
    const [viewingProof, setViewingProof] = useState<string | null>(null);
    
    const salesUsers = useMemo(() => users.filter(u => u.role === Role.SALES), [users]);
    
    const sortedAndFilteredVisits = useMemo(() => {
        return visits
            .filter(visit => {
                const salesMatch = filterSalesId === 'all' || visit.salesPersonId === filterSalesId;
                const statusMatch = filterStatus === 'all' || visit.status === filterStatus;
                return salesMatch && statusMatch;
            })
            .sort((a,b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
    }, [visits, filterSalesId, filterStatus]);


    const openModalForAdd = () => {
        setIsEditing(false);
        setCurrentVisit(initialFormState);
        setIsModalOpen(true);
    };

    const openModalForEdit = (visit: Visit) => {
        setIsEditing(true);
        setCurrentVisit(visit);
        setIsModalOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentVisit(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentVisit.storeId && currentVisit.salesPersonId) {
            if (isEditing) {
                updateVisitStatus((currentVisit as Visit).id, (currentVisit as Visit).status);
            } else {
                addVisit(currentVisit as Omit<Visit, 'id'>);
            }
            setIsModalOpen(false);
        }
    };
    
    const handleDelete = (visitId: string) => {
        if(window.confirm('Apakah Anda yakin ingin menghapus jadwal kunjungan ini?')) {
            deleteVisit(visitId);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Jadwal Kunjungan Sales</h1>
                <button
                    onClick={openModalForAdd}
                    className="flex items-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-brand-dark transition duration-300"
                >
                    {ICONS.plus}
                    Buat Jadwal Baru
                </button>
            </div>
            
            <Card>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label htmlFor="salesFilter" className="block text-sm font-medium text-gray-700">Filter Sales</label>
                        <select id="salesFilter" value={filterSalesId} onChange={e => setFilterSalesId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                            <option value="all">Semua Sales</option>
                            {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                     <div className="flex-1 w-full">
                        <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter Status</label>
                        <select id="statusFilter" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                            <option value="all">Semua Status</option>
                            {Object.values(VisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredVisits.map(visit => (
                    <VisitCard 
                        key={visit.id} 
                        visit={visit} 
                        onEdit={() => openModalForEdit(visit)}
                        onDelete={() => handleDelete(visit.id)}
                        onViewProof={() => setViewingProof(visit.proofOfVisitImage || null)}
                    />
                ))}
                 {sortedAndFilteredVisits.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">Tidak ada jadwal kunjungan yang cocok dengan filter.</p>}
            </div>

            <Modal title={isEditing ? "Edit Jadwal Kunjungan" : "Buat Jadwal Kunjungan Baru"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="storeId" className="block text-sm font-medium text-gray-700">Toko</label>
                        <select name="storeId" id="storeId" value={currentVisit.storeId} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required>
                             <option value="" disabled>-- Pilih Toko --</option>
                             {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="salesPersonId" className="block text-sm font-medium text-gray-700">Sales Person</label>
                        <select name="salesPersonId" id="salesPersonId" value={currentVisit.salesPersonId} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" required>
                             <option value="" disabled>-- Pilih Sales --</option>
                             {salesUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="visitDate" className="block text-sm font-medium text-gray-700">Tanggal Kunjungan</label>
                        <input type="date" name="visitDate" id="visitDate" value={currentVisit.visitDate} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Tujuan Kunjungan</label>
                        <input type="text" name="purpose" id="purpose" value={currentVisit.purpose} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Catatan (Opsional)</label>
                        <textarea name="notes" id="notes" value={currentVisit.notes || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select name="status" id="status" value={currentVisit.status} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
                            {Object.values(VisitStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg mr-2 hover:bg-gray-300">Batal</button>
                        <button type="submit" className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">{isEditing ? "Simpan Perubahan" : "Buat Jadwal"}</button>
                    </div>
                </form>
            </Modal>
            
            <Modal title="Bukti Kunjungan" isOpen={!!viewingProof} onClose={() => setViewingProof(null)}>
                <div className="space-y-4">
                    {viewingProof && <img src={viewingProof} alt="Proof of visit" className="w-full h-auto rounded-lg" />}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setViewingProof(null)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">Tutup</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};