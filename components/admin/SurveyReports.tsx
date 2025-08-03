
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { SurveyResponse } from '../../types';

const DetailSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h4 className="font-semibold text-brand-dark border-b pb-1 mb-2">{title}</h4>
        <div className="text-sm text-gray-700">{children}</div>
    </div>
);


export const SurveyReports: React.FC = () => {
    const { surveyResponses, users } = useAppContext();
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyResponse | null>(null);

    const getSalesName = (salesId: string) => users.find(u => u.id === salesId)?.name || 'Sales tidak dikenal';

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-brand-dark">Laporan Survei Pasar</h1>
            </div>

            <Card className="!p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                            <tr>
                                <th scope="col" className="px-6 py-3">Tanggal Survei</th>
                                <th scope="col" className="px-6 py-3">Nama Toko</th>
                                <th scope="col" className="px-6 py-3">Dilakukan Oleh</th>
                                <th scope="col" className="px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveyResponses.map((survey: SurveyResponse) => (
                                <tr key={survey.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{survey.surveyDate}</td>
                                    <td className="px-6 py-4">{survey.storeName}</td>
                                    <td className="px-6 py-4">{getSalesName(survey.salesPersonId)}</td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => setSelectedSurvey(survey)}
                                            className="font-medium text-brand-primary hover:underline"
                                        >
                                            Lihat Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {surveyResponses.length === 0 && <p className="p-4 text-center text-gray-500">Belum ada laporan survei yang masuk.</p>}
                </div>
            </Card>

            {selectedSurvey && (
                 <Modal title={`Detail Survei - ${selectedSurvey.storeName}`} isOpen={!!selectedSurvey} onClose={() => setSelectedSurvey(null)}>
                    <div className="space-y-6">
                         <DetailSection title="Informasi Toko">
                            <p><strong>Alamat:</strong> {selectedSurvey.storeAddress}</p>
                            <p><strong>No. Telp:</strong> {selectedSurvey.storePhone}</p>
                        </DetailSection>

                        <DetailSection title="Produk Paling Dicari (berdasarkan urutan)">
                            <ol className="list-decimal list-inside space-y-1">
                                {selectedSurvey.mostSoughtProducts.map((p, i) => <li key={i}>{p.brand} - {p.variant}</li>)}
                            </ol>
                        </DetailSection>
                        
                        <DetailSection title="Varian AIRKU Paling Dicari (berdasarkan urutan)">
                            <ol className="list-decimal list-inside space-y-1">
                                {selectedSurvey.popularAirkuVariants.map((v, i) => <li key={i}>{v}</li>)}
                            </ol>
                        </DetailSection>

                        <DetailSection title="Harga Jual Kompetitor">
                             <ul className="list-disc list-inside space-y-1">
                                {selectedSurvey.competitorPrices.map((p, i) => <li key={i}>{p.brand} ({p.variant}): Rp {p.price.toLocaleString('id-ID')}</li>)}
                            </ul>
                        </DetailSection>

                         <DetailSection title="Volume Penjualan Kompetitor">
                             <ul className="list-disc list-inside space-y-1">
                                {selectedSurvey.competitorVolumes.map((p, i) => <li key={i}>{p.brand} ({p.variant}): {p.volume}</li>)}
                            </ul>
                        </DetailSection>

                        <DetailSection title="Masukan untuk AIRKU">
                           <p className="italic">"{selectedSurvey.feedback}"</p>
                        </DetailSection>

                        <div className="text-right pt-4">
                            <button onClick={() => setSelectedSurvey(null)} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-dark">Tutup</button>
                        </div>
                    </div>
                 </Modal>
            )}
        </div>
    );
};