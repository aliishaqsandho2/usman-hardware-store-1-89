
import axios from "axios";

// WordPress REST API Base URL
const API_BASE_URL = 'https://zaidawn.site/wp-json/ims/v1';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple error logging interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

// Helper function to transform responses
const transformResponse = (response: any) => ({
  success: true,
  data: response.data,
  message: 'Success'
});

// Helper function to handle errors
const handleError = (error: any) => {
  const errorResponse = {
    success: false,
    data: null,
    message: error.response?.data?.message || error.message || 'An error occurred'
  };
  return Promise.reject(errorResponse);
};

export const productsApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/products', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/products/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (productData: any) => {
    try {
      const response = await instance.post('/products', productData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create product:", error);
      return handleError(error);
    }
  },

  update: async (id: number, productData: any) => {
    try {
      const response = await instance.put(`/products/${id}`, productData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update product with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/products/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete product with ID ${id}:`, error);
      return handleError(error);
    }
  },

  adjustStock: async (id: number, adjustment: any) => {
    try {
      const response = await instance.post(`/products/${id}/adjust-stock`, adjustment);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to adjust stock for product with ID ${id}:`, error);
      return handleError(error);
    }
  },
};

export const customersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/customers', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/customers/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch customer with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (customerData: any) => {
    try {
      const response = await instance.post('/customers', customerData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create customer:", error);
      return handleError(error);
    }
  },

  update: async (id: number, customerData: any) => {
    try {
      const response = await instance.put(`/customers/${id}`, customerData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update customer with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/customers/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete customer with ID ${id}:`, error);
      return handleError(error);
    }
  },
};

export const salesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/sales', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/sales/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch sale with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (saleData: any) => {
    try {
      const response = await instance.post('/sales', saleData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create sale:", error);
      return handleError(error);
    }
  },

  update: async (id: any, updateData: any) => {
    try {
      console.log('Updating sale with ID:', id, 'Data:', updateData);
      
      const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      console.log('Update response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Update result:', result);
      return transformResponse({ data: result });
    } catch (error) {
      console.error('Sales update error:', error);
      return handleError(error);
    }
  },

  updateStatus: async (id: number, data: { status: string }) => {
    try {
      const response = await instance.put(`/sales/${id}`, data);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update sale status with ID ${id}:`, error);
      return handleError(error);
    }
  },

  adjustOrder: async (id: number, adjustmentData: any) => {
    try {
      const response = await instance.post(`/sales/${id}/adjust`, adjustmentData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to adjust order with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/sales/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete sale with ID ${id}:`, error);
      return handleError(error);
    }
  },
};

export const suppliersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/suppliers', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/suppliers/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch supplier with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (supplierData: any) => {
    try {
      const response = await instance.post('/suppliers', supplierData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create supplier:", error);
      return handleError(error);
    }
  },

  update: async (id: number, supplierData: any) => {
    try {
      const response = await instance.put(`/suppliers/${id}`, supplierData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update supplier with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/suppliers/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete supplier with ID ${id}:`, error);
      return handleError(error);
    }
  },
};

export const purchaseOrdersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/purchase-orders', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/purchase-orders/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch purchase order with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (poData: any) => {
    try {
      const response = await instance.post('/purchase-orders', poData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      return handleError(error);
    }
  },

   update: async (id: number, poData: any) => {
    try {
      const response = await instance.put(`/purchase-orders/${id}`, poData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update purchase order with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/purchase-orders/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete purchase order with ID ${id}:`, error);
      return handleError(error);
    }
  },
};

export const notificationsApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/notifications', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return handleError(error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      const response = await instance.put(`/notifications/${id}/mark-read`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
      return handleError(error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await instance.put('/notifications/mark-all-read');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      return handleError(error);
    }
  },
};

export const dashboardApi = {
  getStats: async () => {
    try {
      const response = await instance.get('/dashboard/stats');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      return handleError(error);
    }
  },

  getEnhancedStats: async () => {
    try {
      const response = await instance.get('/dashboard/enhanced-stats');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch enhanced stats:", error);
      return handleError(error);
    }
  },

  getCategoryPerformance: async () => {
    try {
      const response = await instance.get('/dashboard/category-performance');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch category performance:", error);
      return handleError(error);
    }
  },

  getDailySales: async () => {
    try {
      const response = await instance.get('/dashboard/daily-sales');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch daily sales:", error);
      return handleError(error);
    }
  },

  getInventoryStatus: async () => {
    try {
      const response = await instance.get('/dashboard/inventory-status');
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch inventory status:", error);
      return handleError(error);
    }
  },
};

export const inventoryApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/inventory', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
      return handleError(error);
    }
  },

  getMovements: async (params = {}) => {
    try {
      const response = await instance.get('/inventory/movements', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch inventory movements:", error);
      return handleError(error);
    }
  },
};

export const categoriesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/categories', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      return handleError(error);
    }
  },

  create: async (categoryData: any) => {
    try {
      const response = await instance.post('/categories', categoryData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create category:", error);
      return handleError(error);
    }
  },
};

export const unitsApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/units', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch units:", error);
      return handleError(error);
    }
  },
};

export const quotationsApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/quotations', { params });
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
      return handleError(error);
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/quotations/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to fetch quotation with ID ${id}:`, error);
      return handleError(error);
    }
  },

  create: async (quotationData: any) => {
    try {
      const response = await instance.post('/quotations', quotationData);
      return transformResponse(response);
    } catch (error) {
      console.error("Failed to create quotation:", error);
      return handleError(error);
    }
  },

  update: async (id: number, quotationData: any) => {
    try {
      const response = await instance.put(`/quotations/${id}`, quotationData);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to update quotation with ID ${id}:`, error);
      return handleError(error);
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/quotations/${id}`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to delete quotation with ID ${id}:`, error);
      return handleError(error);
    }
  },

  convertToSale: async (id: number) => {
    try {
      const response = await instance.post(`/quotations/${id}/convert-to-sale`);
      return transformResponse(response);
    } catch (error) {
      console.error(`Failed to convert quotation ${id} to sale:`, error);
      return handleError(error);
    }
  },
};
