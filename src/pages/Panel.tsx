import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText, Trash2, Download, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { invoiceService, InvoiceResponseDTO } from '@/services/invoiceService.ts';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { PDFPreviewDialog } from '@/components/PDFPreviewDialog';
import { defaultTemplates } from '@/data/mockData';
import type { Invoice } from '@/types';

export default function Panel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmitting, setIsEmitting] = useState(false);
  const { generatePDF, downloadPDF, isGenerating } = usePDFGenerator();
  const [selectedTemplate, setSelectedTemplate] = useState(
    defaultTemplates.find(t => t.segment === 'retail') || defaultTemplates[0]
  );
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceResponseDTO | null>(null);

  // Cargar facturas del backend
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'secondary' | 'default' | 'success'> = {
      'DRAFT': 'secondary',
      'ISSUED': 'default',
      'PAID': 'success',
    };

    const labels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'ISSUED': 'Emitida',
      'PAID': 'Pagada',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const handleEmitInvoice = async (invoiceId: number) => {
    setIsEmitting(true);
    try {
      await invoiceService.issue(invoiceId);
      toast({
        title: 'Factura emitida',
        description: 'La factura ha sido emitida exitosamente',
      });
      // Recargar facturas
      loadInvoices();
    } catch (error) {
      console.error('Error emitting invoice:', error);
      toast({
        title: 'Error',
        description: 'No se pudo emitir la factura',
        variant: 'destructive',
      });
    } finally {
      setIsEmitting(false);
    }
  };

  const handleDownloadPDF = async (invoice: InvoiceResponseDTO) => {
    setCurrentInvoice(invoice);
    
    // Convertir InvoiceResponseDTO a Invoice para el PDF
    const invoiceForPDF: Invoice = {
      id: invoice.invoiceNumber,
      status: invoice.status === 'DRAFT' ? 'Borrador' : invoice.status === 'ISSUED' ? 'Emitida' : 'Pagada',
      clientName: invoice.clientName,
      clientNit: invoice.clientNit || '',
      clientAddress: invoice.clientAddress || '',
      clientEmail: invoice.clientEmail || '',
      clientSegment: 'retail',
      issueDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      paymentMethod: invoice.paymentMethod || 'Transferencia Bancaria',
      currency: invoice.currency as 'COP' | 'USD',
      items: invoice.items.map(item => ({
        descripcion: item.description,
        cantidad: item.quantity,
        precioUnitario: Number(item.unitPrice)
      })),
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.totalAmount),
      observations: invoice.observations || ''
    };

    const template = defaultTemplates.find(t => t.segment === 'retail') || defaultTemplates[0];
    const blob = await generatePDF(invoiceForPDF, template, false); // false = NO auto-download
    
    if (blob) {
      setPdfBlob(blob);
      setShowPDFPreview(true);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!pdfBlob || !currentInvoice) return;
    downloadPDF(pdfBlob, currentInvoice.invoiceNumber);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Facturas</h1>
            <p className="text-muted-foreground mt-1">Gestiona todas las facturas de envíos</p>
          </div>
          
          <Button
            onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
            className="gap-2"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Crear Nueva Factura
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturas Registradas
              <Button
                variant="ghost"
                size="sm"
                onClick={loadInvoices}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay facturas registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Comienza creando tu primera factura
                </p>
                <Button
                  onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Primera Factura
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>{formatCurrency(Number(invoice.totalAmount))}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'DRAFT' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmitInvoice(invoice.id)}
                                disabled={isEmitting}
                                title="Emitir factura"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/facturas/${invoice.id}/editar`)}
                                title="Editar factura"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/facturas/${invoice.id}/ver`)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Vista Previa PDF */}
      <PDFPreviewDialog
        open={showPDFPreview}
        onOpenChange={setShowPDFPreview}
        pdfBlob={pdfBlob}
        invoiceId={currentInvoice?.invoiceNumber || ''}
        onDownload={handleDownloadFromPreview}
      />
    </div>
  );
}