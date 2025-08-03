
import { useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const usePDFExport = (reportTitle: string, fileName: string) => {
    const tableRef = useRef<HTMLTableElement>(null);

    const exportPDF = () => {
        const doc = new jsPDF();
        
        doc.text(reportTitle, 14, 20);
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

        if (tableRef.current) {
            autoTable(doc, {
                html: tableRef.current,
                startY: 35,
                theme: 'grid',
                headStyles: {
                    fillColor: [3, 4, 94] // brand-dark
                },
            });
        }
        
        doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return { tableRef, exportPDF };
};
