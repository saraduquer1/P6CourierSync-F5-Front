import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Send, User, FileText, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/Header';
import { toast } from '@/hooks/use-toast';
import { invoiceService, CreateInvoiceDTO, InvoiceItemDTO } from '@/services/invoiceService.ts';
import { ShipmentDTO } from '@/services/shipmentService.ts';

const invoiceSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientNit: z.string().min(1, 'El NIT es requerido'),
  clientAddress: z.string().min(1, 'La dirección es requerida'),
  clientEmail: z.string().email('Email inválido'),
  issueDate: z.string().min(1, 'La fecha de emisión es requerida'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  observations: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceItemDisplay {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [selectedShipments, setSelectedShipments] = useState<ShipmentDTO[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientName: '',
      clientNit: '',
      clientAddress: '',
      clientEmail: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paymentMethod: 'Transferencia Bancaria',
      observations: '',
    },
  });

  useEffect(() => {
    // Cargar envíos seleccionados desde sessionStorage
    const savedShipments = sessionStorage.getItem('selectedShipments');
    if (savedShipments) {
      try {
        const shipments: ShipmentDTO[] = JSON.parse(savedShipments);
        setSelectedShipments(shipments);
        
        // Convertir envíos a items de factura
        const items: InvoiceItemDisplay[] = shipments.map(shipment => ({
          descripcion: `Transporte a ${shipment.destinationAddress}`,
          cantidad: 1,
          precioUnitario: shipment.totalWeight * 5000, // Precio de ejemplo: 5000 por kg
        }));
        
        setInvoiceItems(items);
      } catch (error) {
        console.error('Error loading selected shipments:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los envíos seleccionados',
          variant: 'destructive',
        });
        navigate('/facturas/nueva/seleccionar-envios');
      }
    } else {
      navigate('/facturas/nueva/seleccionar-envios');
    }
  }, [navigate]);

  // Cálculos automáticos
  const subtotal = invoiceItems.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
  const taxAmount = subtotal * 0.19;
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceFormData, shouldEmit: boolean = false) => {
    setIsLoading(true);
    
    try {
      // Preparar items para el backend
      const items: InvoiceItemDTO[] = invoiceItems.map((item, index) => ({
        description: item.descripcion,
        quantity: item.cantidad,
        unitPrice: item.precioUnitario,
        shipmentId: selectedShipments[index]?.id, // Vincular con el shipment
      }));

      // Preparar datos de la factura
      const invoiceData: CreateInvoiceDTO = {
        clientName: data.clientName,
        clientNit: data.clientNit,
        clientAddress: data.clientAddress,
        clientEmail: data.clientEmail,
        invoiceDate: data.issueDate,
        dueDate: data.dueDate,
        paymentMethod: data.paymentMethod,
        currency: 'COP',
        items: items,
        shipmentIds: selectedShipments.map(s => s.id),
        taxAmount: taxAmount,
        observations: data.observations,
      };

      // Crear factura en el backend
      const createdInvoice = await invoiceService.create(invoiceData);

      // Si se debe emitir, llamar al endpoint de emisión
      if (shouldEmit) {
        await invoiceService.issue(createdInvoice.id);
        toast({
          title: 'Factura emitida',
          description: `Factura ${createdInvoice.invoiceNumber} emitida correctamente`,
        });
      } else {
        toast({
          title: 'Borrador guardado',
          description: `Borrador ${createdInvoice.invoiceNumber} guardado correctamente`,
        });
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('selectedShipments');

      // Redirigir al panel
      navigate('/panel');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar la factura',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/facturas/nueva/seleccionar-envios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Selección
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Crear Nueva Factura</h1>
            <p className="text-muted-foreground mt-1">Completa los datos para generar la factura</p>
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Datos del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Datos del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre o Razón Social</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Comercializadora ABC S.A.S." {...field} />
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
                        <FormLabel>NIT</FormLabel>
                        <FormControl>
                          <Input placeholder="900123456-7" {...field} />
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
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle 50 #30-20" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="cliente@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Datos de la Factura */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos de la Factura
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Emisión</FormLabel>
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
                        <FormLabel>Fecha de Vencimiento</FormLabel>
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
                        <FormLabel>Método de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona el método de pago" />
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
                        <FormLabel>Observaciones (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Notas adicionales sobre la factura..."
                            className="min-h-[80px]"
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

            {/* Conceptos de la Factura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conceptos de la Factura
                </CardTitle>
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
                    {invoiceItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.descripcion}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>{formatCurrency(item.precioUnitario)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.cantidad * item.precioUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resumen de Totales */}
            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumen de Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (19%):</span>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar Borrador
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={isLoading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Emitir Factura
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
}