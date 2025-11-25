import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, User, Calendar, CreditCard, RefreshCw, Download, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Header } from '@/components/layout/Header';
import { toast } from '@/hooks/use-toast';
import { invoiceService, InvoiceResponseDTO } from '@/services/invoiceService.ts';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { PDFTemplateSelector } from '@/components/PDFTemplateSelector';
import { PDFPreviewDialog } from '@/components/PDFPreviewDialog';
import { defaultTemplates } from '@/data/mockData';
import type { Invoice } from '@/types';

export default function ViewInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { generatePDF, downloadPDF, isGenerating } = usePDFGenerator();
  const [selectedTemplate, setSelectedTemplate] = useState(
    defaultTemplates.find(t => t.segment === 'retail') || defaultTemplates[0]
  );
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await invoiceService.getById(Number(id));
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la factura',
        variant: 'destructive',
      });
      navigate('/panel');
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
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleGeneratePDF = async () => {
    if (!invoice) return;
    
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
    
    const blob = await generatePDF(invoiceForPDF, selectedTemplate, false);
    
    if (blob) {
      setPdfBlob(blob);
      setShowPDFPreview(true);
    }
  };

  const handleDownloadFromPreview = () => {
    if (!pdfBlob || !invoice) return;
    downloadPDF(pdfBlob, invoice.invoiceNumber);
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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Factura no encontrada</h3>
            <p className="text-muted-foreground mb-4">
              La factura que buscas no existe o fue eliminada
            </p>
            <Button onClick={() => navigate('/panel')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Button>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/panel')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel
            </Button>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-primary">Factura {invoice.invoiceNumber}</h1>
                <p className="text-muted-foreground mt-1">
                  Estado: {getStatusBadge(invoice.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Botón PDF solo para facturas emitidas */}
          {invoice.status === 'ISSUED' && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Vista Previa PDF
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Generar Vista Previa</DialogTitle>
                    <DialogDescription>
                      Selecciona la plantilla para previsualizar el PDF
                    </DialogDescription>
                  </DialogHeader>
                  
                  <PDFTemplateSelector
                    templates={defaultTemplates}
                    selectedSegment="retail"
                    onSelectTemplate={setSelectedTemplate}
                  />
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? 'Generando...' : 'Ver Previsualización'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <PDFPreviewDialog
                open={showPDFPreview}
                onOpenChange={setShowPDFPreview}
                pdfBlob={pdfBlob}
                invoiceId={invoice.invoiceNumber}
                onDownload={handleDownloadFromPreview}
              />
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm">{invoice.clientName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">NIT</label>
                <p className="text-sm">{invoice.clientNit || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dirección</label>
                <p className="text-sm">{invoice.clientAddress || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{invoice.clientEmail || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Factura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalles de Facturación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Emisión
                </label>
                <p className="text-sm ml-6">{formatDate(invoice.invoiceDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha de Vencimiento
                </label>
                <p className="text-sm ml-6">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Método de Pago
                </label>
                <p className="text-sm ml-6">{invoice.paymentMethod || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                <p className="text-sm">{invoice.currency}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observaciones */}
        {invoice.observations && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{invoice.observations}</p>
            </CardContent>
          </Card>
        )}

        {/* Conceptos/Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Conceptos de la Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Unitario</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(Number(item.unitPrice))}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totales */}
        <Card className="mt-6 bg-accent/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span>IVA (19%):</span>
                <span className="font-medium">{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(Number(invoice.totalAmount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}