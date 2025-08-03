
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { ICONS } from '../../../constants';

export const TripDetailReport: React.FC = () => {
    const { routes, users, vehicles } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Detail Perjalanan', 'laporan_detail_perjalanan');
    const [viewingProof, setViewingProof] = useState<string | null>(null);


    const tripData = useMemo(() => {
        return routes.map(route => {
            const driver = users.find(u => u.id === route.driverId);
            const vehicle = vehicles.find(v => v.id === route.vehicleId);
            const successfulStops = route.stops.filter(s => s.status === 'Completed').length;
            const failedStops = route.stops.filter(s => s.status === 'Failed').length;
            const isCompleted = route.stops.every(s => s.status !== 'Pending');

            return {
                ...route,
                driverName: driver?.name ?? 'N/A',
                vehiclePlate: vehicle?.plateNumber ?? 'N/A',
                successfulStops,
                failedStops,
                isCompleted
            }
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [routes, users, vehicles]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Laporan Perjalanan Distribusi</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengemudi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Armada</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemberhentian (Selesai/Gagal/Total)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tripData.map((trip) => (
                            <React.Fragment key={trip.id}>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.driverName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{trip.vehiclePlate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-green-600 font-semibold">{trip.successfulStops}</span> / 
                                        <span className="text-red-600 font-semibold"> {trip.failedStops}</span> / 
                                        <span> {trip.stops.length}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${trip.isCompleted ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {trip.isCompleted ? 'Selesai' : 'Dalam Perjalanan'}
                                        </span>
                                    </td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td colSpan={5} className="px-8 py-2">
                                        <details>
                                            <summary className="text-xs font-semibold cursor-pointer text-brand-primary">Lihat Detail Pemberhentian</summary>
                                            <table className="min-w-full text-xs my-2">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="py-1 text-left">Toko</th>
                                                        <th className="py-1 text-left">Status</th>
                                                        <th className="py-1 text-left">Bukti</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                {trip.stops.map(stop => (
                                                    <tr key={stop.orderId}>
                                                        <td className="py-1">{stop.storeName}</td>
                                                        <td className="py-1">{stop.status}</td>
                                                        <td className="py-1">
                                                            {stop.proofOfDeliveryImage ? (
                                                                <button onClick={() => setViewingProof(stop.proofOfDeliveryImage!)} className="text-brand-primary">
                                                                     {React.cloneElement(ICONS.camera, {width: 16, height: 16})}
                                                                </button>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </details>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal title="Bukti Pengantaran" isOpen={!!viewingProof} onClose={() => setViewingProof(null)}>
                <div className="space-y-4">
                    {viewingProof && <img src={viewingProof} alt="Proof of delivery" className="w-full h-auto rounded-lg" />}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => setViewingProof(null)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">Tutup</button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};
