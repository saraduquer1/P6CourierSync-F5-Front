import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Send, User, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { toast } from '@/hooks/use-toast';
import { invoiceService, InvoiceResponseDTO, UpdateInvoiceDTO } from '@/services/invoiceService.ts';

const invoiceSchema = z.object({
  clientName: z.string().min(2, 'El nombre del cliente es requerido'),
  clientNit: z.string().min(1, 'El NIT es requerido'),
  clientAddress: z.string().min(5, 'La dirección es requerida'),
  clientEmail: z.string().email('Email inválido'),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  observations: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function EditInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState<InvoiceResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEmitting, setIsEmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientNit: '',
      clientAddress: '',
      clientEmail: '',
      issueDate: '',
      dueDate: '',
      paymentMethod: '',
      observations: '',
    },
  });

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
      
      // Verificar que sea borrador
      if (data.status !== 'DRAFT') {
        toast({
          title: 'Error',
          description: 'Solo se pueden editar facturas en estado Borrador',
          variant: 'destructive',
        });
        navigate('/panel');
        return;
      }
      
      setInvoice(data);
      
      // Poblar el formulario
      form.reset({
        clientName: data.clientName,
        clientNit: data.clientNit || '',
        clientAddress: data.clientAddress || '',
        clientEmail: data.clientEmail || '',
        issueDate: data.invoiceDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod || '',
        observations: data.observations || '',
      });
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

  const onSubmit = async (data: InvoiceFormData) => {
    if (!invoice) return;
    
    setIsSaving(true);
    try {
      const updateData: UpdateInvoiceDTO = {
        clientName: data.clientName,
        clientNit: data.clientNit,
        clientAddress: data.clientAddress,
        clientEmail: data.clientEmail,
        invoiceDate: data.issueDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        items: invoice.items.map(item => ({
          shipmentId: item.shipmentId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice)
        })),
        shipmentIds: Array.from(new Set(invoice.items.map(item => item.shipmentId).filter((id): id is number => id !== null))),
        taxAmount: Number(invoice.taxAmount),
        currency: invoice.currency,
        observations: data.observations,
        version: invoice.version
      };

      await invoiceService.update(invoice.id, updateData);
      
      toast({
        title: 'Factura actualizada',
        description: 'Los cambios se guardaron exitosamente',
      });
      
      navigate('/panel');
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la factura',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmit = async () => {
    if (!invoice) return;
    
    setIsEmitting(true);
    try {
      await invoiceService.issue(invoice.id);
      
      toast({
        title: 'Factura emitida',
        description: 'La factura ha sido emitida exitosamente',
      });
      
      navigate('/panel');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
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
            <div>
              <h1 className="text-3xl font-bold text-primary">Editar Factura {invoice.invoiceNumber}</h1>
              <p className="text-muted-foreground mt-1">
                Modifica los datos de la factura en borrador
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Cliente *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientNit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NIT *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: 900123456-7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Calle 50 #30-20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Emisión *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona método de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                            <SelectItem value="Efectivo">Efectivo</SelectItem>
                            <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                            <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observaciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionales sobre la factura..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Resumen de Totales */}
            <Card className="bg-accent/50">
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
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(Number(invoice.totalAmount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/panel')}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleEmit}
                disabled={isEmitting}
                className="gap-2"
              >
                {isEmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Emitiendo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Guardar y Emitir
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}