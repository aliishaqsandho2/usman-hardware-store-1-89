
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Package, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { salesApi } from "@/services/api";

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  open,
  onOpenChange,
  product
}) => {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerStats, setCustomerStats] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (open && product) {
      fetchProductSalesData();
    }
  }, [open, product]);

  const fetchProductSalesData = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getAll({ limit: 1000 });
      if (response.success) {
        const allSales = response.data?.sales || response.data || [];
        
        // Filter sales that contain this product
        const productSales = allSales.filter((sale: any) => 
          sale.items && sale.items.some((item: any) => item.productId === product.id)
        );

        // Extract only the relevant items and add sale info
        const relevantSales = productSales.map((sale: any) => {
          const productItem = sale.items.find((item: any) => item.productId === product.id);
          return {
            ...productItem,
            saleDate: sale.saleDate,
            customerName: sale.customerName,
            customerId: sale.customerId,
            saleId: sale.id
          };
        });

        setSalesData(relevantSales);

        // Calculate customer statistics
        const stats: {[key: string]: any} = {};
        relevantSales.forEach((sale: any) => {
          const customerKey = sale.customerName || 'Walk-in Customer';
          if (!stats[customerKey]) {
            stats[customerKey] = {
              name: customerKey,
              totalQuantity: 0,
              totalValue: 0,
              purchaseCount: 0,
              averagePrice: 0,
              lastPurchase: sale.saleDate
            };
          }
          stats[customerKey].totalQuantity += sale.quantity || 0;
          stats[customerKey].totalValue += sale.totalPrice || 0;
          stats[customerKey].purchaseCount += 1;
          
          // Calculate average price per unit
          if (stats[customerKey].totalQuantity > 0) {
            stats[customerKey].averagePrice = stats[customerKey].totalValue / stats[customerKey].totalQuantity;
          }
          
          // Keep the most recent purchase date
          if (new Date(sale.saleDate) > new Date(stats[customerKey].lastPurchase)) {
            stats[customerKey].lastPurchase = sale.saleDate;
          }
        });

        setCustomerStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch product sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return Math.round(value).toLocaleString();
  };

  const totalSold = salesData.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0);
  const uniqueCustomers = Object.keys(customerStats).length;

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Product Sales Details - {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Overview */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalSold} {product.unit}</div>
                  <div className="text-sm text-muted-foreground">Total Sold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">PKR {formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{uniqueCustomers}</div>
                  <div className="text-sm text-muted-foreground">Unique Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{salesData.length}</div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Purchase Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Purchase Summary
            </h3>
            <div className="grid gap-3">
              {Object.values(customerStats).map((customer: any, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last purchase: {formatDate(customer.lastPurchase)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-blue-600">{customer.totalQuantity} {product.unit}</div>
                        <div className="text-muted-foreground">Total Quantity</div>
                      </div>
                      <div>
                        <div className="font-medium text-green-600">PKR {formatCurrency(customer.totalValue)}</div>
                        <div className="text-muted-foreground">Total Value</div>
                      </div>
                      <div>
                        <div className="font-medium text-purple-600">PKR {formatCurrency(customer.averagePrice)}</div>
                        <div className="text-muted-foreground">Avg. Price/{product.unit}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Sales History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Sales History
            </h3>
            <div className="space-y-2">
              {salesData
                .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
                .slice(0, 10)
                .map((sale, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{sale.customerName || 'Walk-in Customer'}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(sale.saleDate)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{sale.quantity || 0} {product.unit}</div>
                        <div className="text-sm text-green-600">PKR {formatCurrency(sale.unitPrice)}/{product.unit}</div>
                        <div className="text-sm font-medium">Total: PKR {formatCurrency(sale.totalPrice)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Loading sales data...</div>
            </div>
          )}

          {!loading && salesData.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <div className="text-muted-foreground">No sales history found for this product</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
