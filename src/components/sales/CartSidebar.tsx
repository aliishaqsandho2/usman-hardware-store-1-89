
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ShoppingCart, User, X, Plus, Minus, UserPlus, Edit2, CreditCard } from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  unit: string;
  adjustedPrice?: number; // For price negotiations
}

interface CartSidebarProps {
  cart: CartItem[];
  selectedCustomer: any;
  customers: any[];
  orderStatus: string;
  paymentMethod: string;
  isCustomerDialogOpen: boolean;
  isQuickCustomerOpen: boolean;
  onSetSelectedCustomer: (customer: any) => void;
  onSetIsCustomerDialogOpen: (open: boolean) => void;
  onSetIsQuickCustomerOpen: (open: boolean) => void;
  onSetOrderStatus: (status: string) => void;
  onSetPaymentMethod: (method: string) => void;
  onUpdateCartQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onCheckout: () => void;
  onUpdateItemPrice?: (productId: number, newPrice: number) => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  selectedCustomer,
  customers,
  orderStatus,
  paymentMethod,
  isCustomerDialogOpen,
  isQuickCustomerOpen,
  onSetSelectedCustomer,
  onSetIsCustomerDialogOpen,
  onSetIsQuickCustomerOpen,
  onSetOrderStatus,
  onSetPaymentMethod,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onCheckout,
  onUpdateItemPrice
}) => {
  const [priceEditingItem, setPriceEditingItem] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<string>("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const finalPrice = item.adjustedPrice || item.price;
      return total + (finalPrice * item.quantity);
    }, 0);
  };

  const handlePriceEdit = (item: CartItem) => {
    setPriceEditingItem(item.productId);
    setTempPrice((item.adjustedPrice || item.price).toString());
  };

  const handlePriceSave = (productId: number) => {
    const newPrice = parseFloat(tempPrice);
    if (!isNaN(newPrice) && newPrice > 0 && onUpdateItemPrice) {
      onUpdateItemPrice(productId, newPrice);
    }
    setPriceEditingItem(null);
    setTempPrice("");
  };

  const handlePriceCancel = () => {
    setPriceEditingItem(null);
    setTempPrice("");
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  return (
    <div className="w-72 bg-card border-l border-border shadow-lg flex flex-col">
      {/* Customer Section */}
      <div className="p-3 border-b border-border bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            Customer
          </h3>
        </div>
        
        {selectedCustomer ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-2 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200 text-sm">{selectedCustomer.name}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">{selectedCustomer.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetSelectedCustomer(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-2 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-200 mb-2 font-medium">Cash Sale (Walk-in Customer)</p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetIsCustomerDialogOpen(true)}
                className="flex-1 text-xs h-7 bg-background"
              >
                Search customer...
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetIsQuickCustomerOpen(true)}
                className="px-2 h-7 bg-background"
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="p-3 border-b border-border bg-muted/50">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-card-foreground flex items-center gap-2">
            <CreditCard className="h-3 w-3" />
            Payment Method
          </Label>
          <Select value={paymentMethod} onValueChange={onSetPaymentMethod}>
            <SelectTrigger className="h-8 text-xs bg-background border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Order Status Selection */}
      <div className="p-3 border-b border-border bg-muted/50">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-card-foreground">Order Status</Label>
          <Select value={orderStatus} onValueChange={onSetOrderStatus}>
            <SelectTrigger className="h-8 text-xs bg-background border-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cart Section */}
      <div className="flex-1 p-3 overflow-auto bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-card-foreground flex items-center gap-2 text-sm">
            <ShoppingCart className="h-4 w-4" />
            Cart ({cart.length})
          </h3>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="bg-muted/50 border border-border p-2 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-xs text-card-foreground">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Original: PKR {item.price.toLocaleString()} / {item.unit}
                      </p>
                      {item.adjustedPrice && item.adjustedPrice !== item.price && (
                        <Badge variant="secondary" className="text-xs">Negotiated</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFromCart(item.productId)}
                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Price editing section */}
                <div className="mb-2">
                  {priceEditingItem === item.productId ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        className="h-6 text-xs flex-1"
                        placeholder="New price"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePriceSave(item.productId)}
                        className="h-6 w-6 p-0 bg-green-600 text-white"
                      >
                        ✓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePriceCancel}
                        className="h-6 w-6 p-0 bg-red-600 text-white"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">
                          PKR {(item.adjustedPrice || item.price).toLocaleString()} / {item.unit}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePriceEdit(item)}
                          className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                          title="Negotiate price"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateCartQuantity(item.productId, item.quantity - 0.25)}
                      className="h-6 w-6 p-0 bg-background"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-16 text-center text-xs font-medium text-card-foreground">{item.quantity} {item.unit}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateCartQuantity(item.productId, item.quantity + 0.25)}
                      className="h-6 w-6 p-0 bg-background"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-blue-600 text-xs">
                    PKR {((item.adjustedPrice || item.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Section */}
      {cart.length > 0 && (
        <div className="p-3 border-t border-border bg-card">
          <div className="space-y-2 mb-3">
            <div className="border-t border-border pt-2">
              <div className="flex justify-between font-bold">
                <span className="text-sm text-card-foreground">Total:</span>
                <span className="text-green-600 text-sm">PKR {getCartTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={onCheckout}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-10 text-sm font-medium"
            size="lg"
          >
            Complete Sale ({paymentMethod === 'cash' ? 'Cash' : paymentMethod === 'credit' ? 'Credit' : 'Card'})
          </Button>
        </div>
      )}

      {/* Customer Selection Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={onSetIsCustomerDialogOpen}>
        <DialogContent className="max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search customers..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              className="mb-4 bg-background border-input"
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-card"
                    onClick={() => {
                      onSetSelectedCustomer(customer);
                      onSetIsCustomerDialogOpen(false);
                      setCustomerSearchTerm("");
                    }}
                  >
                    <p className="font-medium text-card-foreground">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    {customer.email && (
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No customers found</p>
                  {customerSearchTerm && (
                    <p className="text-xs">Try a different search term</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
