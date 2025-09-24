// CourierSync - Tipos de datos principales

// Estado del envío
export type ShippingStatus = 'No facturado' | 'Facturado';

// Modelo para un envío individual
export interface Shipment {
  id: string; // ej. "ENV-001"
  direccion: string;
  pesoKg: number;
  tarifa: number;
  estado: ShippingStatus;
}

// Modelo para los conceptos/ítems dentro de una factura
export interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

// Estado de la factura
export type InvoiceStatus = 'Borrador' | 'Emitida' | 'Pagada';

// Modelo principal de la Factura
export interface Invoice {
  id: string; // ej. "Draft-2025-001" o "F-2025-001"
  status: InvoiceStatus;
  
  // Datos del Cliente
  clientName: string;
  clientNit: string;
  clientAddress: string;
  clientEmail: string;

  // Datos de la Factura
  issueDate: string; // Formato YYYY-MM-DD
  dueDate: string;   // Formato YYYY-MM-DD
  paymentMethod: string; // ej. "Transferencia Bancaria"
  currency: 'Peso Colombiano';

  // Conceptos y Totales
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number; // Monto del IVA (19%)
  total: number;
  observations?: string;
}

// Usuario simulado
export interface User {
  id: string;
  email: string;
  name: string;
}

// Claves para localStorage
export const STORAGE_KEYS = {
  USER: 'couriersync:user',
  SHIPMENTS: 'couriersync:shipments',
  INVOICES: 'couriersync:invoices',
} as const;