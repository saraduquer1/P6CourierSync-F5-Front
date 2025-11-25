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
export interface ShipmentDTO {
  id: number;
  trackingNumber: string;
  clientName: string;
  originAddress: string;
  destinationAddress: string;
  totalWeight: number; // Cambiado de weight a totalWeight
  totalVolume: number; // Cambiado de volume a totalVolume
  status: string; // PENDING, IN_TRANSIT, DELIVERED, CANCELLED
  createdAt: string;
  updatedAt: string;
}

// Servicio de envíos
export const shipmentService = {
  // Listar todos los envíos
  getAll: async (): Promise<ShipmentDTO[]> => {
    const response = await apiService.get<ApiResponse<ShipmentDTO[]>>(
      API_CONFIG.ENDPOINTS.SHIPMENTS.BASE
    );
    return response.data;
  },

  // Obtener envíos sin vincular a facturas
  getUnlinked: async (): Promise<ShipmentDTO[]> => {
    const response = await apiService.get<ApiResponse<ShipmentDTO[]>>(
      API_CONFIG.ENDPOINTS.SHIPMENTS.UNLINKED
    );
    return response.data;
  },

  // Filtrar por estado
  getByStatus: async (status: string): Promise<ShipmentDTO[]> => {
    const response = await apiService.get<ApiResponse<ShipmentDTO[]>>(
      API_CONFIG.ENDPOINTS.SHIPMENTS.BY_STATUS(status)
    );
    return response.data;
  },
};