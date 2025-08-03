
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { ICONS } from '../../constants';
import { OrderStatus } from '../../types';

const kpiData = [
  { title: "Total Sales (All Time)", icon: <span className="text-green-500">{ICONS.orders}</span> },
  { title: "Pending Orders", icon: <span className="text-yellow-500">{ICONS.orders}</span> },
  { title: "Active Drivers", icon: <span className="text-blue-500">{ICONS.fleet}</span> },
  { title: "Total Stores", icon: <span className="text-purple-500">{ICONS.store}</span> },
];

export const Dashboard: React.FC = () => {
    const { orders, stores, users } = useAppContext();
    
    const kpiValues = useMemo(() => ({
        totalSales: orders.filter(o => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.totalAmount, 0),
        pendingOrders: orders.filter(o => o.status === OrderStatus.PENDING).length,
        activeDrivers: users.filter(u => u.role === 'Driver').length,
        totalStores: stores.length
    }), [orders, stores, users]);

    const weeklySalesData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        const salesByDay = last7Days.map(date => {
            const dayStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            const total = orders
                .filter(o => o.status === OrderStatus.DELIVERED && o.orderDate === dayStr)
                .reduce((sum, o) => sum + o.totalAmount, 0);

            return { name: dayName, sales: total };
        });

        return salesByDay;
    }, [orders]);

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold text-brand-dark">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">{kpiData[0].icon}</div>
                    <div>
                        <p className="text-sm text-gray-500">{kpiData[0].title}</p>
                        <p className="text-2xl font-bold text-brand-dark">Rp {kpiValues.totalSales.toLocaleString('id-ID')}</p>
                    </div>
                </Card>
                 <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 rounded-full">{kpiData[1].icon}</div>
                    <div>
                        <p className="text-sm text-gray-500">{kpiData[1].title}</p>
                        <p className="text-2xl font-bold text-brand-dark">{kpiValues.pendingOrders}</p>
                    </div>
                </Card>
                 <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">{kpiData[2].icon}</div>
                    <div>
                        <p className="text-sm text-gray-500">Total Drivers</p>
                        <p className="text-2xl font-bold text-brand-dark">{kpiValues.activeDrivers}</p>
                    </div>
                </Card>
                 <Card className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">{kpiData[3].icon}</div>
                    <div>
                        <p className="text-sm text-gray-500">{kpiData[3].title}</p>
                        <p className="text-2xl font-bold text-brand-dark">{kpiValues.totalStores}</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-semibold text-brand-dark mb-4">Weekly Sales Performance</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklySalesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `Rp ${(Number(value)/1000)}k`} />
                            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                            <Legend />
                            <Line type="monotone" dataKey="sales" stroke="#0077B6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card>
                    <h2 className="text-xl font-semibold text-brand-dark mb-4">Order Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={Object.values(OrderStatus).map(status => ({ name: status, count: orders.filter(o => o.status === status).length }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#00B4D8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
};
