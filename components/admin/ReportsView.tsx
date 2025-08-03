
import React, { useState } from 'react';
import { ProductSalesReport } from './reports/ProductSalesReport';
import { RegionSalesReport } from './reports/RegionSalesReport';
import { FleetPerformanceReport } from './reports/FleetPerformanceReport';
import { DriverPerformanceReport } from './reports/DriverPerformanceReport';
import { TopCustomersReport } from './reports/TopCustomersReport';
import { OrderFrequencyReport } from './reports/OrderFrequencyReport';
import { TripDetailReport } from './reports/TripDetailReport';

type ReportType = 
    | 'productSales' 
    | 'regionSales' 
    | 'fleetPerformance' 
    | 'driverPerformance' 
    | 'topCustomers' 
    | 'orderFrequency'
    | 'tripDetails';

const reportTabs: { id: ReportType, label: string }[] = [
    { id: 'productSales', label: 'Penjualan per Produk' },
    { id: 'regionSales', label: 'Penjualan per Wilayah' },
    { id: 'fleetPerformance', label: 'Kinerja Armada' },
    { id: 'driverPerformance', label: 'Kinerja Pengemudi' },
    { id: 'topCustomers', label: 'Pelanggan Teratas' },
    { id: 'orderFrequency', label: 'Frekuensi Pesanan' },
    { id: 'tripDetails', label: 'Detail Perjalanan' },
];

export const ReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportType>('productSales');

    const renderReport = () => {
        switch (activeTab) {
            case 'productSales': return <ProductSalesReport />;
            case 'regionSales': return <RegionSalesReport />;
            case 'fleetPerformance': return <FleetPerformanceReport />;
            case 'driverPerformance': return <DriverPerformanceReport />;
            case 'topCustomers': return <TopCustomersReport />;
            case 'orderFrequency': return <OrderFrequencyReport />;
            case 'tripDetails': return <TripDetailReport />;
            default: return <ProductSalesReport />;
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-3xl font-bold text-brand-dark">Pusat Laporan</h1>
            
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {reportTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id 
                                    ? 'border-brand-primary text-brand-primary' 
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {renderReport()}
            </div>
        </div>
    );
};
