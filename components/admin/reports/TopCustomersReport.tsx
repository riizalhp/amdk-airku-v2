
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';
import { OrderStatus } from '../../../types';

export const TopCustomersReport: React.FC = () => {
    const { orders, stores } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Pelanggan Teratas', 'laporan_pelanggan_teratas');

    const customerData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        const data: { [storeId: string]: { name: string, orderCount: number, totalSpending: number, ordersWithSpecialPrice: number } } = {};

        deliveredOrders.forEach(order => {
            const store = stores.find(s => s.id === order.storeId);
            if (!store) return;

            if (!data[order.storeId]) {
                data[order.storeId] = { name: store.name, orderCount: 0, totalSpending: 0, ordersWithSpecialPrice: 0 };
            }

            data[order.storeId].orderCount += 1;
            data[order.storeId].totalSpending += order.totalAmount;
            if (order.items.some(item => item.specialPrice != null && item.specialPrice !== item.originalPrice)) {
                data[order.storeId].ordersWithSpecialPrice += 1;
            }
        });

        return Object.values(data).sort((a, b) => b.totalSpending - a.totalSpending).slice(0, 10);
    }, [orders, stores]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Pelanggan Teratas (Top 10)</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan Hrg. Khusus</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pembelian</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customerData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.orderCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.ordersWithSpecialPrice > 0 ? item.ordersWithSpecialPrice : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Rp {item.totalSpending.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};