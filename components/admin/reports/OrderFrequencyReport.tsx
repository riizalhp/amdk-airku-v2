
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';

export const OrderFrequencyReport: React.FC = () => {
    const { orders, stores } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Frekuensi Pesanan', 'laporan_frekuensi_pesanan');

    const frequencyData = useMemo(() => {
        const data: { [storeId: string]: { name: string, orderCount: number, firstOrder: Date, lastOrder: Date } } = {};

        orders.forEach(order => {
            const store = stores.find(s => s.id === order.storeId);
            if (!store) return;
            const orderDate = new Date(order.orderDate);

            if (!data[order.storeId]) {
                data[order.storeId] = { 
                    name: store.name, 
                    orderCount: 0, 
                    firstOrder: orderDate, 
                    lastOrder: orderDate 
                };
            }

            data[order.storeId].orderCount += 1;
            if (orderDate < data[order.storeId].firstOrder) {
                data[order.storeId].firstOrder = orderDate;
            }
            if (orderDate > data[order.storeId].lastOrder) {
                data[order.storeId].lastOrder = orderDate;
            }
        });

        return Object.values(data).sort((a, b) => b.orderCount - a.orderCount);
    }, [orders, stores]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Frekuensi Pesanan Pelanggan</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef}>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pesanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan Pertama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pesanan Terakhir</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {frequencyData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.orderCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.firstOrder.toLocaleDateString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.lastOrder.toLocaleDateString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
