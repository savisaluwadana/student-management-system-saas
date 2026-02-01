'use client';

import { useRef, useState } from 'react';
import Barcode from 'react-barcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer, GraduationCap, Loader2 } from 'lucide-react';

interface SmartCardProps {
  student: {
    id: string;
    student_code: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    barcode?: string | null;
    photo_url?: string | null;
    school?: string | null;
  };
  instituteName?: string;
  instituteCode?: string;
}

export function SmartCard({ student, instituteName, instituteCode }: SmartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current || isDownloading) return;

    setIsDownloading(true);

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // Higher quality
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      // Create PDF with credit card dimensions (85.6mm x 53.98mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      });

      // Add the image to PDF, fitting to the page
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);

      // Download the PDF
      pdf.save(`${student.student_code}-id-card.pdf`);
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download card. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  const handlePrint = () => {
    if (!cardRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Smart Card - ${student.student_code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              font-family: system-ui, sans-serif;
              background: #f3f4f6;
            }
            .card {
              width: 340px;
              height: 215px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 16px;
              padding: 20px;
              color: white;
              position: relative;
              overflow: hidden;
            }
            .card::before {
              content: '';
              position: absolute;
              top: -50%;
              right: -50%;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 16px;
              position: relative;
              z-index: 1;
            }
            .logo {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .institute-code {
              font-size: 11px;
              opacity: 0.8;
            }
            .content {
              display: flex;
              gap: 16px;
              position: relative;
              z-index: 1;
            }
            .photo {
              width: 70px;
              height: 85px;
              background: white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #667eea;
              font-size: 28px;
              font-weight: 600;
            }
            .info {
              flex: 1;
            }
            .name {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .code {
              font-size: 12px;
              opacity: 0.9;
              font-family: monospace;
              margin-bottom: 8px;
            }
            .school {
              font-size: 11px;
              opacity: 0.8;
            }
            .barcode-container {
              position: absolute;
              bottom: 12px;
              right: 16px;
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .barcode-container svg {
              display: block;
            }
            @media print {
              body { background: white; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <div class="logo">${instituteName || 'Academix'}</div>
                <div class="institute-code">${instituteCode || 'Student ID Card'}</div>
              </div>
            </div>
            <div class="content">
              <div class="photo">${student.full_name.charAt(0)}</div>
              <div class="info">
                <div class="name">${student.full_name}</div>
                <div class="code">${student.student_code}</div>
                ${student.school ? `<div class="school">${student.school}</div>` : ''}
              </div>
            </div>
            ${student.barcode ? `
              <div class="barcode-container">
                <svg width="100" height="30">
                  <text x="50" y="20" text-anchor="middle" font-size="8" font-family="monospace">${student.barcode}</text>
                </svg>
              </div>
            ` : ''}
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

  return (
    <Card className="overflow-hidden">
      <div
        ref={cardRef}
        className="relative w-full aspect-[1.586/1] max-w-[340px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-5 text-white"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start mb-4">
          <div>
            <div className="text-sm font-bold uppercase tracking-widest">
              {instituteName || 'Academix'}
            </div>
            <div className="text-xs opacity-80">{instituteCode || 'Student ID Card'}</div>
          </div>
          <GraduationCap className="h-6 w-6 opacity-80" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex gap-4">
          {/* Photo placeholder */}
          <div className="w-16 h-20 bg-white rounded-lg flex items-center justify-center text-2xl font-bold text-indigo-500 shadow-lg">
            {student.full_name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="font-semibold text-lg leading-tight">{student.full_name}</div>
            <div className="text-sm opacity-90 font-mono mt-1">{student.student_code}</div>
            {student.school && (
              <div className="text-xs opacity-80 mt-2">{student.school}</div>
            )}
          </div>
        </div>

        {/* Barcode at bottom */}
        {student.barcode && (
          <div className="absolute bottom-3 right-3 bg-white rounded px-2 py-1">
            <Barcode
              value={student.barcode}
              width={0.8}
              height={25}
              fontSize={8}
              displayValue={true}
              background="#ffffff"
              lineColor="#000000"
              margin={0}
            />
          </div>
        )}
      </div>

      <CardContent className="pt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-1" />
            Print Card
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
