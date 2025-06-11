import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Package, Calendar, DollarSign, RotateCcw, AlertTriangle, Minus, Plus, ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi } from "@/services/api";

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onOrderUpdated?: () => void;
}

export const OrderDetailsModal = ({ open, onOpenChange, order, onOrderUpdated }: OrderDetailsModalProps) => {
  const { toast } = useToast();
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentItems, setAdjustmentItems] = useState<any[]>([]);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  
  // Edit mode states
  const [editMode, setEditMode] = useState<'status' | 'payment' | 'customer' | null>(null);
  const [editValues, setEditValues] = useState({
    status: order?.status || '',
    paymentMethod: order?.paymentMethod || '',
    customerId: order?.customerId || null,
    customerName: order?.customerName || ''
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  if (!order) return null;

  // FIXED: Use useEffect instead of useState for side effects
  useEffect(() => {
    if (order) {
      setEditValues({
        status: order.status || '',
        paymentMethod: order.paymentMethod || '',
        customerId: order.customerId || null,
        customerName: order.customerName || ''
      });
    }
  }, [order]);

  // Fetch customers when customer edit mode is activated
  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll({ limit: 100 });
      if (response.success) {
        setCustomers(response.data.customers || response.data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleEditStart = (field: 'status' | 'payment' | 'customer') => {
    setEditMode(field);
    setEditValues({
      status: order.status,
      paymentMethod: order.paymentMethod,
      customerId: order.customerId,
      customerName: order.customerName
    });
    
    if (field === 'customer') {
      fetchCustomers();
    }
  };

  const handleEditCancel = () => {
    setEditMode(null);
    setEditValues({
      status: order.status,
      paymentMethod: order.paymentMethod,
      customerId: order.customerId,
      customerName: order.customerName
    });
    setCustomerSearch('');
  };

  const handleEditSave = async () => {
    try {
      setEditLoading(true);
      
      console.log('Attempting to save edit mode:', editMode);
      console.log('Edit values:', editValues);
      console.log('Order ID:', order.id);
      
      if (editMode === 'status') {
        console.log('Updating status to:', editValues.status);
        const response = await salesApi.updateStatus(order.id, { status: editValues.status });
        console.log('Status update response:', response);
        
        if (response.success) {
          toast({
            title: "Status Updated",
            description: "Order status has been updated successfully",
          });
        } else {
          throw new Error(response.message || 'Failed to update status');
        }
      } else if (editMode === 'payment' || editMode === 'customer') {
        const updateData: any = {};
        
        if (editMode === 'payment') {
          updateData.paymentMethod = editValues.paymentMethod;
          console.log('Updating payment method to:', editValues.paymentMethod);
        } else if (editMode === 'customer') {
          updateData.customerId = editValues.customerId;
          console.log('Updating customer to:', editValues.customerId);
        }
        
        console.log('Sending update data:', updateData);
        
        // Using direct fetch for now since salesApi doesn't have a general update method
        const response = await fetch(`https://zaidawn.site/wp-json/ims/v1/sales/${order.id}/details`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        console.log('Update response:', result);
        
        if (result.success) {
          toast({
            title: "Order Updated",
            description: `${editMode === 'payment' ? 'Payment method' : 'Customer'} has been updated successfully`,
          });
        } else {
          throw new Error(result.message || 'Update failed');
        }
      }
      
      setEditMode(null);
      onOrderUpdated?.();
      
    } catch (error) {
      console.error('Failed to update order:', error);
      toast({
        title: "Update Failed",
        description: `Failed to update ${editMode}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Fixed customer selection handler
  const handleCustomerSelect = (customer: any) => {
    setEditValues(prev => ({ 
      ...prev, 
      customerId: customer ? customer.id : null, 
      customerName: customer ? customer.name : 'Walk-in Customer' 
    }));
    setCustomerSearch('');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{status}</Badge>;
    }
  };

  const initializeAdjustmentForm = () => {
    setAdjustmentItems(order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      originalQuantity: item.quantity,
      returnQuantity: 0,
      unitPrice: item.unitPrice,
      reason: ""
    })));
    setShowAdjustmentForm(true);
  };

  const updateReturnQuantity = (index: number, quantity: number) => {
    const updatedItems = [...adjustmentItems];
    updatedItems[index].returnQuantity = Math.max(0, Math.min(quantity, updatedItems[index].originalQuantity));
    setAdjustmentItems(updatedItems);
  };

  const updateReturnReason = (index: number, reason: string) => {
    const updatedItems = [...adjustmentItems];
    updatedItems[index].reason = reason;
    setAdjustmentItems(updatedItems);
  };

  const handleOrderAdjustment = async () => {
    try {
      setAdjustmentLoading(true);
      
      const itemsToReturn = adjustmentItems.filter(item => item.returnQuantity > 0);
      
      if (itemsToReturn.length === 0) {
        toast({
          title: "No Items to Return",
          description: "Please specify quantities to return",
          variant: "destructive"
        });
        return;
      }

      const refundAmount = itemsToReturn.reduce((sum, item) => sum + (item.returnQuantity * item.unitPrice), 0);

      const adjustmentData = {
        type: "return",
        items: itemsToReturn.map(item => ({
          productId: item.productId,
          quantity: item.returnQuantity,
          reason: item.reason || "customer_request"
        })),
        adjustmentReason: adjustmentNotes || "Order adjustment - items returned after completion",
        refundAmount: refundAmount,
        restockItems: true
      };

      console.log('Sending adjustment data:', adjustmentData);

      const response = await salesApi.adjustOrder(order.id, adjustmentData);
      
      if (response.success) {
        toast({
          title: "Order Adjusted Successfully",
          description: "Items have been returned and inventory updated",
        });
        setShowAdjustmentForm(false);
        setAdjustmentItems([]);
        setAdjustmentNotes("");
        onOrderUpdated?.();
        onOpenChange(false);
      } else {
        throw new Error(response.message || 'Failed to adjust order');
      }
    } catch (error) {
      console.error('Failed to adjust order:', error);
      toast({
        title: "Adjustment Failed",
        description: `Error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive"
      });
    } finally {
      setAdjustmentLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Order Details - {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        {!showAdjustmentForm ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                    {editMode !== 'customer' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStart('customer')}
                        className="h-6 w-6 p-0 ml-auto"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {editMode === 'customer' ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">Search Customer</Label>
                        <Input
                          placeholder="Search by name or phone..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        <div
                          className="p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleCustomerSelect(null)}
                        >
                          <p className="font-medium">Walk-in Customer</p>
                          <p className="text-sm text-gray-600">No customer account</p>
                        </div>
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className={`p-2 border rounded cursor-pointer hover:bg-blue-50 transition-colors ${
                              editValues.customerId === customer.id ? 'bg-blue-100 border-blue-300' : ''
                            }`}
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.phone}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditSave} disabled={editLoading}>
                          <Save className="h-3 w-3 mr-1" />
                          {editLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel}>
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p><strong>Name:</strong> {order.customerName || 'Walk-in Customer'}</p>
                      <p><strong>Customer ID:</strong> {order.customerId || 'N/A'}</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Date:</strong> {new Date(order.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {order.time}</p>
                  
                  {/* Status with edit capability */}
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    {editMode === 'status' ? (
                      <div className="flex items-center gap-2">
                        <Select value={editValues.status} onValueChange={(value) => setEditValues(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleEditSave} disabled={editLoading}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart('status')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Payment Method with edit capability */}
                  <div className="flex items-center gap-2">
                    <strong>Payment:</strong>
                    {editMode === 'payment' ? (
                      <div className="flex items-center gap-2">
                        <Select value={editValues.paymentMethod} onValueChange={(value) => setEditValues(prev => ({ ...prev, paymentMethod: value }))}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleEditSave} disabled={editLoading}>
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleEditCancel}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{order.paymentMethod}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart('payment')}
                          className="h-6 w-6 p-0"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName || 'Unknown Product'}</TableCell>
                          <TableCell>{item.quantity || 0}</TableCell>
                          <TableCell>PKR {(item.unitPrice || 0).toFixed(2)}</TableCell>
                          <TableCell>PKR {(item.total || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No items found in this order
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {(order.subtotal || 0).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>PKR {order.discount.toFixed(2)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>PKR {order.tax.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>PKR {(order.total || 0).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              {order.status === 'completed' && (
                <Button
                  onClick={initializeAdjustmentForm}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Return Items
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdjustmentForm(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Order Details
              </Button>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-700">Return Items from Order</h3>
              </div>
            </div>

            {/* Return Items Form */}
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-medium text-orange-800 mb-2">Order: {order.orderNumber}</h4>
                <p className="text-sm text-orange-700">
                  Select the items and quantities you want to return. These items will be added back to inventory.
                </p>
              </div>

              <div className="grid gap-4">
                {adjustmentItems.map((item, index) => (
                  <Card key={index} className="border-2 border-gray-200 hover:border-orange-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.productName}</h4>
                          <p className="text-sm text-gray-600">
                            Original Quantity: <span className="font-medium">{item.originalQuantity}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="font-medium">PKR {item.unitPrice.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`return-qty-${index}`} className="text-sm font-medium text-gray-700">
                            Return Quantity
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateReturnQuantity(index, item.returnQuantity - 1)}
                              disabled={item.returnQuantity <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              id={`return-qty-${index}`}
                              type="number"
                              min="0"
                              max={item.originalQuantity}
                              value={item.returnQuantity}
                              onChange={(e) => updateReturnQuantity(index, parseInt(e.target.value) || 0)}
                              className="w-20 text-center"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateReturnQuantity(index, item.returnQuantity + 1)}
                              disabled={item.returnQuantity >= item.originalQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`reason-${index}`} className="text-sm font-medium text-gray-700">
                            Return Reason
                          </Label>
                          <select
                            id={`reason-${index}`}
                            value={item.reason}
                            onChange={(e) => updateReturnReason(index, e.target.value)}
                            className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="">Select reason</option>
                            <option value="damaged">Damaged</option>
                            <option value="wrong_item">Wrong Item</option>
                            <option value="customer_request">Customer Request</option>
                          </select>
                        </div>
                      </div>
                      
                      {item.returnQuantity > 0 && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">
                            <strong>Refund Amount:</strong> PKR {(item.returnQuantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <Label htmlFor="adjustment-notes" className="text-sm font-medium text-gray-700">
                  Additional Notes
                </Label>
                <Textarea
                  id="adjustment-notes"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Any additional notes about this return..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Summary */}
              {adjustmentItems.some(item => item.returnQuantity > 0) && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-blue-800 mb-2">Return Summary</h4>
                    <div className="space-y-1 text-sm">
                      {adjustmentItems
                        .filter(item => item.returnQuantity > 0)
                        .map((item, index) => (
                          <div key={index} className="flex justify-between text-blue-700">
                            <span>{item.productName} x {item.returnQuantity}</span>
                            <span>PKR {(item.returnQuantity * item.unitPrice).toFixed(2)}</span>
                          </div>
                        ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-medium text-blue-800">
                        <span>Total Refund:</span>
                        <span>
                          PKR {adjustmentItems
                            .reduce((sum, item) => sum + (item.returnQuantity * item.unitPrice), 0)
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustmentForm(false)}
                  disabled={adjustmentLoading}
                  className="min-w-24"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleOrderAdjustment}
                  disabled={adjustmentLoading || !adjustmentItems.some(item => item.returnQuantity > 0)}
                  className="bg-orange-600 hover:bg-orange-700 text-white min-w-32"
                >
                  {adjustmentLoading ? 'Processing...' : 'Process Return'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
