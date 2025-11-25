import { apiService } from './apiService';
import { API_CONFIG } from './apiConfig';

// Tipos para las respuestas del backend
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: number;
}

// Tipos que coinciden con el backend
export interface InvoiceItemDTO {
  description: string;
  quantity: number;
  unitPrice: number;
  shipmentId?: number;
}

export interface CreateInvoiceDTO {
  clientName: string;
  clientNit: string;
  clientAddress: string;
  clientEmail: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentMethod: string;
  currency: string;
  items: InvoiceItemDTO[];
  shipmentIds?: number[];
  taxAmount: number;
  observations?: string;
}

export interface UpdateInvoiceDTO {
  clientName: string;
  clientNit: string;
  clientAddress: string;
  clientEmail: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentMethod: string;
  currency: string;
  items: InvoiceItemDTO[];
  shipmentIds?: number[];
  taxAmount: number;
  observations?: string;
  version: number; // Para control de concurrencia optimista
}

export interface InvoiceResponseDTO {
  id: number;
  invoiceNumber: string;
  status: string; // DRAFT, ISSUED, PAID
  clientName: string;
  clientNit: string;
  clientAddress: string;
  clientEmail: string;
  invoiceDate: string;
  dueDate: string;
  paymentMethod: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number; // Campo correcto del backend
  observations?: string;
  items: InvoiceItemDTO[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// Servicio de facturas
export const invoiceService = {
  // Listar todas las facturas
  getAll: async (): Promise<InvoiceResponseDTO[]> => {
    const response = await apiService.get<ApiResponse<InvoiceResponseDTO[]>>(
      API_CONFIG.ENDPOINTS.INVOICES.BASE
    );
    return response.data;
  },

  // Obtener una factura por ID
  getById: async (id: number): Promise<InvoiceResponseDTO> => {
    const response = await apiService.get<ApiResponse<InvoiceResponseDTO>>(
      API_CONFIG.ENDPOINTS.INVOICES.BY_ID(id.toString())
    );
    return response.data;
  },

  // Crear factura borrador
  create: async (invoice: CreateInvoiceDTO): Promise<InvoiceResponseDTO> => {
    const response = await apiService.post<ApiResponse<InvoiceResponseDTO>>(
      API_CONFIG.ENDPOINTS.INVOICES.BASE,
      invoice
    );
    return response.data;
  },

  // Actualizar factura borrador
  update: async (id: number, invoice: UpdateInvoiceDTO): Promise<InvoiceResponseDTO> => {
    const response = await apiService.put<ApiResponse<InvoiceResponseDTO>>(
      API_CONFIG.ENDPOINTS.INVOICES.BY_ID(id.toString()),
      invoice
    );
    return response.data;
  },

  // Emitir factura (cambiar de DRAFT a ISSUED)
  issue: async (id: number): Promise<InvoiceResponseDTO> => {
    const response = await apiService.post<ApiResponse<InvoiceResponseDTO>>(
      API_CONFIG.ENDPOINTS.INVOICES.ISSUE(id.toString())
    );
    return response.data;
  },

  // Generar PDF
  generatePdf: async (id: number): Promise<{ pdfUrl: string }> => {
    const response = await apiService.post<ApiResponse<{ pdfUrl: string }>>(
      API_CONFIG.ENDPOINTS.INVOICES.PDF(id.toString())
    );
    return response.data;
  },

  // Filtrar por estado
  getByStatus: async (status: string): Promise<InvoiceResponseDTO[]> => {
    const response = await apiService.get<ApiResponse<InvoiceResponseDTO[]>>(
      API_CONFIG.ENDPOINTS.INVOICES.BY_STATUS(status)
    );
    return response.data;
  },

  // Obtener historial de una factura
  getHistory: async (id: number): Promise<unknown[]> => {
    const response = await apiService.get<ApiResponse<unknown[]>>(
      API_CONFIG.ENDPOINTS.INVOICES.HISTORY(id.toString())
    );
    return response.data;
  },
};