
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsApi } from "@/services/api";

interface QuickAddProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (product: any) => void;
}

export const QuickAddProductForm: React.FC<QuickAddProductFormProps> = ({
  open,
  onOpenChange,
  onProductAdded
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    estimatedStock: '',
    unit: 'pieces',
    category: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast({
        title: "Missing Required Fields",
        description: "Product name and price are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Generate a temporary SKU
      const tempSku = `TEMP-${Date.now()}`;
      
      const productData = {
        name: formData.name,
        sku: tempSku,
        price: parseFloat(formData.price),
        stock: parseFloat(formData.estimatedStock) || 0,
        unit: formData.unit,
        category: formData.category || 'Miscellaneous',
        description: `INCOMPLETE ENTRY - Added during sale. Original notes: ${formData.notes}`,
        status: 'active',
        isIncomplete: true, // Flag to mark this as incomplete
        quickAddDate: new Date().toISOString(),
        minStock: 0
      };

      console.log('Creating quick product:', productData);

      const response = await productsApi.create(productData);
      
      if (response.success && response.data) {
        const newProduct = response.data;
        
        // Reset form
        setFormData({
          name: '',
          price: '',
          estimatedStock: '',
          unit: 'pieces',
          category: '',
          notes: ''
        });
        
        onProductAdded(newProduct);
        onOpenChange(false);
        
        toast({
          title: "Product Added Successfully",
          description: `${newProduct.name} has been added as an incomplete entry. Remember to update it later with complete details.`,
        });
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Failed to create quick product:', error);
      toast({
        title: "Failed to Add Product",
        description: error.message || "An error occurred while adding the product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Quick Add Product
            <Badge variant="outline" className="ml-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Incomplete Entry
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 p-3 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">Quick Entry Mode</p>
              <p className="text-orange-700 dark:text-orange-300 text-xs mt-1">
                This product will be marked as incomplete. Remember to update it later with complete stock quantities and details.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter product name..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">
                Price (PKR) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unit
              </Label>
              <Input
                id="unit"
                placeholder="pieces, kg, etc."
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedStock" className="text-sm font-medium">
                Estimated Stock
              </Label>
              <Input
                id="estimatedStock"
                type="number"
                step="0.01"
                placeholder="Rough estimate"
                value={formData.estimatedStock}
                onChange={(e) => handleInputChange('estimatedStock', e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category
              </Label>
              <Input
                id="category"
                placeholder="e.g., Hardware"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes & Reminders
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this product - stock location, supplier info, exact quantity unknown, etc."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
