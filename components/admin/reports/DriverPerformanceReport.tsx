
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';
import { Role } from '../../../types';

export const DriverPerformanceReport: React.FC = () => {
    const { users, routes } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Kinerja Pengemudi', 'laporan_kinerja_pengemudi');

    const driverUsers = useMemo(() => users.filter(u => u.role === Role.DRIVER), [users]);

    const performanceData = useMemo(() => {
        return driverUsers.map(driver => {
            const driverRoutes = routes.filter(r => r.driverId === driver.id);
            const totalStops = driverRoutes.reduce((acc, r) => acc + r.stops.length, 0);
            const successfulStops = driverRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'Completed').length, 0);
            const failedStops = driverRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'Failed').length, 0);

            return {
                id: driver.id,
                name: driver.name,
                totalRoutes: driverRoutes.length,
                totalStops,
                successfulStops,
                failedStops,
                successRate: totalStops > 0 ? (successfulStops / totalStops) * 100 : 0,
            };
        }).sort((a,b) => b.successRate - a.successRate);
    }, [driverUsers, routes]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Kinerja Pengemudi (Driver)</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Pengemudi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rute</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengiriman Sukses</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengiriman Gagal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tingkat Sukses</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {performanceData.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
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
