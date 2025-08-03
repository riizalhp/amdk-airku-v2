
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';
import { OrderStatus } from '../../../types';

export const RegionSalesReport: React.FC = () => {
    const { orders, stores } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Penjualan per Wilayah', 'laporan_penjualan_wilayah');

    const salesData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        const data: { [region: string]: { orderCount: number, totalRevenue: number } } = {};

        deliveredOrders.forEach(order => {
            const store = stores.find(s => s.id === order.storeId);
            if (!store) return;
            const region = store.region;

            if (!data[region]) {
                data[region] = { orderCount: 0, totalRevenue: 0 };
            }

            data[region].orderCount += 1;
            data[region].totalRevenue += order.totalAmount;
        });

        return Object.entries(data).map(([region, values]) => ({ region, ...values }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [orders, stores]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Penjualan per Wilayah</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {salesData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.region}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.orderCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Rp {item.totalRevenue.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
