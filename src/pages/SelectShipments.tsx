import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/layout/Header';
import { toast } from '@/hooks/use-toast';
import { shipmentService, ShipmentDTO } from '@/services/shipmentService.ts';

export default function SelectShipments() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<ShipmentDTO[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar envíos sin vincular desde el backend
  useEffect(() => {
    loadUnlinkedShipments();
  }, []);

  const loadUnlinkedShipments = async () => {
    setIsLoading(true);
    try {
      const data = await shipmentService.getUnlinked();
      setShipments(data);
    } catch (error) {
      console.error('Error loading shipments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los envíos disponibles',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipmentToggle = (shipmentId: number) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId)
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === shipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(shipments.map(s => s.id));
    }
  };

  const handleContinue = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: 'Selección requerida',
        description: 'Debes seleccionar al menos un envío para continuar',
        variant: 'destructive',
      });
      return;
    }

    // Guardar los IDs de envíos seleccionados en sessionStorage
    const selectedShipmentData = shipments.filter(s => selectedShipments.includes(s.id));
    sessionStorage.setItem('selectedShipments', JSON.stringify(selectedShipmentData));
    
    navigate('/facturas/nueva');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      'PENDING': 'Pendiente',
      'IN_TRANSIT': 'En tránsito',
      'DELIVERED': 'Entregado',
      'CANCELLED': 'Cancelado',
    };
    return labels[status] || status;
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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/panel')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Seleccionar Envíos</h1>
            <p className="text-muted-foreground mt-1">Elige los envíos que deseas incluir en la factura</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Envíos Disponibles para Facturar
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadUnlinkedShipments}
                  className="ml-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay envíos disponibles</h3>
                  <p className="text-muted-foreground mb-4">
                    Todos los envíos están facturados o no hay envíos registrados
                  </p>
                  <Button variant="outline" onClick={() => navigate('/panel')}>
                    Volver al Panel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedShipments.length === shipments.length}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Seleccionar todos ({shipments.length} envíos)
                      </label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedShipments.length} seleccionado(s)
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Origen</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Peso (kg)</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => (
                        <TableRow 
                          key={shipment.id}
                          className={selectedShipments.includes(shipment.id) ? 'bg-accent' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedShipments.includes(shipment.id)}
                              onCheckedChange={() => handleShipmentToggle(shipment.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                          <TableCell>{shipment.clientName}</TableCell>
                          <TableCell>{shipment.originAddress}</TableCell>
                          <TableCell>{shipment.destinationAddress}</TableCell>
                          <TableCell>{shipment.totalWeight}</TableCell>
                          <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      Has seleccionado <span className="font-semibold">{selectedShipments.length}</span> envío(s)
                    </p>
                    <Button
                      onClick={handleContinue}
                      disabled={selectedShipments.length === 0}
                      className="gap-2"
                      size="lg"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}