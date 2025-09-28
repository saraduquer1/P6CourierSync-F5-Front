import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Invoice, STORAGE_KEYS } from '@/types';
import { initialInvoices } from '@/data/mockData';

export default function Panel() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    // Cargar facturas del localStorage o usar datos iniciales
    const savedInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (error) {
        console.error('Error loading invoices:', error);
        setInvoices(initialInvoices);
        localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
      }
    } else {
      setInvoices(initialInvoices);
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvoices));
    }
  }, []);

  const getStatusBadge = (status: Invoice['status']) => {
    const variants = {
      'Borrador': 'secondary',
      'Emitida': 'default',
      'Pagada': 'success',
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
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
                    <TableHead>ID Factura</TableHead>
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
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'Borrador' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/facturas/${invoice.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/facturas/${invoice.id}/ver`)}
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
    </div>
  );
}