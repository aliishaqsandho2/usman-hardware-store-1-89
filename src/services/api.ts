import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// WordPress REST API Base URL
const API_BASE_URL = 'https://zaidawn.site/wp-json/ims/v1';

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const productsApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/products', { params });
      return response;
    } catch (error) {
      console.error("Failed to fetch products:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/products/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch product with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (productData: any) => {
    try {
      const response = await instance.post('/products', productData);
      return response;
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    }
  },

  update: async (id: number, productData: any) => {
    try {
      const response = await instance.put(`/products/${id}`, productData);
      return response;
    } catch (error) {
      console.error(`Failed to update product with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/products/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete product with ID ${id}:`, error);
      throw error;
    }
  },
};

export const customersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/customers', { params });
      return response;
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/customers/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch customer with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (customerData: any) => {
    try {
      const response = await instance.post('/customers', customerData);
      return response;
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  },

  update: async (id: number, customerData: any) => {
    try {
      const response = await instance.put(`/customers/${id}`, customerData);
      return response;
    } catch (error) {
      console.error(`Failed to update customer with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/customers/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete customer with ID ${id}:`, error);
      throw error;
    }
  },
};

export const salesApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/sales', { params });
      return response;
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/sales/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch sale with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (saleData) => {
    try {
      const response = await instance.post('/sales', saleData);
      return response;
    } catch (error) {
      console.error("Failed to create sale:", error);
      throw error;
    }
  },

  update: async (id, updateData) => {
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
      return result;
    } catch (error) {
      console.error('Sales update error:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/sales/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete sale with ID ${id}:`, error);
      throw error;
    }
  },
};

export const suppliersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/suppliers', { params });
      return response;
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/suppliers/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch supplier with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (supplierData: any) => {
    try {
      const response = await instance.post('/suppliers', supplierData);
      return response;
    } catch (error) {
      console.error("Failed to create supplier:", error);
      throw error;
    }
  },

  update: async (id: number, supplierData: any) => {
    try {
      const response = await instance.put(`/suppliers/${id}`, supplierData);
      return response;
    } catch (error) {
      console.error(`Failed to update supplier with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/suppliers/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete supplier with ID ${id}:`, error);
      throw error;
    }
  },
};

export const purchaseOrdersApi = {
  getAll: async (params = {}) => {
    try {
      const response = await instance.get('/purchase-orders', { params });
      return response;
    } catch (error) {
      console.error("Failed to fetch purchase orders:", error);
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await instance.get(`/purchase-orders/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch purchase order with ID ${id}:`, error);
      throw error;
    }
  },

  create: async (poData: any) => {
    try {
      const response = await instance.post('/purchase-orders', poData);
      return response;
    } catch (error) {
      console.error("Failed to create purchase order:", error);
      throw error;
    }
  },

   update: async (id: number, poData: any) => {
    try {
      const response = await instance.put(`/purchase-orders/${id}`, poData);
      return response;
    } catch (error) {
      console.error(`Failed to update purchase order with ID ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      const response = await instance.delete(`/purchase-orders/${id}`);
      return response;
    } catch (error) {
      console.error(`Failed to delete purchase order with ID ${id}:`, error);
      throw error;
    }
  },
};
