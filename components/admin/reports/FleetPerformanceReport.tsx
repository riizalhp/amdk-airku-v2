
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';

export const FleetPerformanceReport: React.FC = () => {
    const { vehicles, routes } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Kinerja Armada', 'laporan_kinerja_armada');

    const performanceData = useMemo(() => {
        return vehicles.map(vehicle => {
            const vehicleRoutes = routes.filter(r => r.vehicleId === vehicle.id);
            const totalStops = vehicleRoutes.reduce((acc, r) => acc + r.stops.length, 0);
            const successfulStops = vehicleRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'Completed').length, 0);
            const failedStops = vehicleRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'Failed').length, 0);

            return {
                id: vehicle.id,
                plate: vehicle.plateNumber,
                model: vehicle.model,
                totalRoutes: vehicleRoutes.length,
                totalStops,
                successfulStops,
                failedStops,
                successRate: totalStops > 0 ? (successfulStops / totalStops) * 100 : 0,
            };
        }).sort((a,b) => b.successRate - a.successRate);
    }, [vehicles, routes]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Kinerja Armada (Kendaraan)</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nomor Polisi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rute</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengiriman Sukses</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengiriman Gagal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat Sukses</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {performanceData.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.plate}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.model}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.totalRoutes}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.successfulStops}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.failedStops}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.successRate.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
