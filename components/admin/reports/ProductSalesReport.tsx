
import React, { useMemo } from 'react';
import { useAppContext } from '../../../hooks/useAppContext';
import { usePDFExport } from '../../../hooks/usePDFExport';
import { Card } from '../../ui/Card';
import { OrderStatus } from '../../../types';

export const ProductSalesReport: React.FC = () => {
    const { orders, products } = useAppContext();
    const { tableRef, exportPDF } = usePDFExport('Laporan Penjualan per Produk', 'laporan_penjualan_produk');

    const salesData = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED);
        const data: { [productId: string]: { name: string, unitsSold: number, totalRevenue: number, unitsWithSpecialPrice: number } } = {};

        deliveredOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return;

                if (!data[item.productId]) {
                    data[item.productId] = { name: product.name, unitsSold: 0, totalRevenue: 0, unitsWithSpecialPrice: 0 };
                }

                const price = item.specialPrice ?? item.originalPrice;
                data[item.productId].unitsSold += item.quantity;
                data[item.productId].totalRevenue += item.quantity * price;
                if(item.specialPrice != null && item.specialPrice !== item.originalPrice) {
                    data[item.productId].unitsWithSpecialPrice += item.quantity;
                }
            });
        });

        return Object.values(data).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [orders, products]);

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-brand-dark">Penjualan per Produk</h2>
                <button onClick={exportPDF} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg">
                    Unduh PDF
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full" ref={tableRef} id="product-sales-table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Terjual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Hrg. Khusus</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {salesData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.unitsSold.toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.unitsWithSpecialPrice > 0 ? item.unitsWithSpecialPrice.toLocaleString('id-ID') : '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">Rp {item.totalRevenue.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};