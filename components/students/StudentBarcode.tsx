'use client';

import { useState } from 'react';
import Barcode from 'react-barcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode, Loader2 } from 'lucide-react';

interface StudentBarcodeProps {
    barcode: string;
    studentName: string;
    studentCode: string;
    showDownload?: boolean;
    showPrint?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const sizes = {
    small: { width: 1.2, height: 40, fontSize: 12 },
    medium: { width: 1.5, height: 50, fontSize: 14 },
    large: { width: 2, height: 70, fontSize: 16 },
};

export function StudentBarcode({
    barcode,
    studentName,
    studentCode,
    showDownload = true,
    showPrint = true,
    size = 'medium',
}: StudentBarcodeProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const sizeConfig = sizes[size];
    const barcodeId = `barcode-${studentCode}`;

    const handleDownload = async () => {
        if (isDownloading) return;

        const barcodeElement = document.getElementById(barcodeId);
        if (!barcodeElement) {
            console.error('Barcode element not found:', barcodeId);
            alert('Could not find barcode element. Please try again.');
            return;
        }

        setIsDownloading(true);

        try {
            // Dynamic imports to avoid SSR issues
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(barcodeElement, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
            });

            // Create PDF (landscape for barcode)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [90, 50]
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 5, 5, 80, 40);

            pdf.save(`${studentCode}-barcode.pdf`);
        } catch (error) {
            console.error('Error downloading barcode:', error);
            alert('Failed to download barcode. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        const barcodeElement = document.getElementById(barcodeId);
        if (!barcodeElement) {
            alert('Could not find barcode element.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print.');
            return;
        }

        const svg = barcodeElement.querySelector('svg');
        if (!svg) {
            alert('Could not find barcode SVG.');
            printWindow.close();
            return;
        }

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${studentCode}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            .container {
              text-align: center;
              padding: 20px;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
            }
            .name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
            .code { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
            @media print {
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="name">${studentName}</div>
            <div class="code">${studentCode}</div>
            ${svg.outerHTML}
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `);
        printWindow.document.close();
    };

    if (!barcode) {
        return (
            <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <QrCode className="h-8 w-8 text-muted-foreground mr-2" />
                <span className="text-muted-foreground">No barcode assigned</span>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Student Barcode
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center space-y-4">
                    <div id={barcodeId} className="bg-white p-4 rounded-lg">
                        <Barcode
                            value={barcode}
                            width={sizeConfig.width}
                            height={sizeConfig.height}
                            fontSize={sizeConfig.fontSize}
                            displayValue={true}
                            background="#ffffff"
                            lineColor="#000000"
                        />
                    </div>

                    {(showDownload || showPrint) && (
                        <div className="flex gap-2">
                            {showDownload && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4 mr-1" />
                                    )}
                                    {isDownloading ? 'Downloading...' : 'Download'}
                                </Button>
                            )}
                            {showPrint && (
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="h-4 w-4 mr-1" />
                                    Print
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
