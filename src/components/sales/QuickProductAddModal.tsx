
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { productsApi } from "@/services/api";
import { Package, AlertTriangle } from "lucide-react";

interface QuickProductAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: (product: any) => void;
  categories: string[];
}

export const QuickProductAddModal: React.FC<QuickProductAddModalProps> = ({
  open,
  onOpenChange,
  onProductAdded,
  categories
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'pieces',
    description: '',
    incompleteQuantity: false,
    quantityNote: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.sku || !formData.price) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in name, SKU, and price",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Prepare comprehensive product data with all potential required fields
      const productData = {
        name: formData.name.trim() || 'N/A',
        sku: formData.sku.trim() || 'N/A',
        category: formData.category || 'Uncategorized',
        price: parseFloat(formData.price) || 0,
        stock: formData.incompleteQuantity ? 0 : (parseFloat(formData.stock) || 0),
        unit: formData.unit || 'pieces',
        description: formData.description.trim() || 'N/A',
        status: 'active',
        // Additional fields that might be required by the backend
        barcode: 'N/A',
        brand: 'N/A',
        supplier: 'N/A',
        costPrice: parseFloat(formData.costPrice) || (parseFloat(formData.price) * 0.7) || 0,
        weight: 0,
        dimensions: 'N/A',
        minStock: 5,
        maxStock: 1000,
        reorderLevel: 5,
        location: 'N/A',
        tags: '',
        notes: formData.incompleteQuantity ? `Incomplete quantity: ${formData.quantityNote}` : '',
        isActive: true,
        trackStock: !formData.incompleteQuantity,
        allowBackorder: formData.incompleteQuantity,
        taxable: true,
        taxRate: 0,
        discountable: true,
        createdBy: 'Sales System',
        updatedBy: 'Sales System'
      };

      console.log('Creating quick product with comprehensive data:', productData);

      const response = await productsApi.create(productData);
      
      if (response.success) {
        // Enhance the product data with our frontend tracking fields
        const enhancedProduct = {
          ...response.data,
          incompleteQuantity: formData.incompleteQuantity,
          quantityNote: formData.incompleteQuantity ? formData.quantityNote : '',
          addedFromSales: true,
          needsQuantityUpdate: formData.incompleteQuantity
        };

        onProductAdded(enhancedProduct);
        
        // Reset form
        setFormData({
          name: '',
          sku: '',
          category: '',
          price: '',
          costPrice: '',
          stock: '',
          unit: 'pieces',
          description: '',
          incompleteQuantity: false,
          quantityNote: ''
        });
        
        onOpenChange(false);
        
        toast({
          title: "Product Added Successfully",
          description: `${productData.name} has been added${formData.incompleteQuantity ? ' with incomplete quantity data' : ''}`,
        });
      } else {
        throw new Error(response.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      
      // Enhanced error handling with more specific messages
      let errorMessage = 'An error occurred while adding the product';
      
      if (error.message) {
        if (error.message.includes('400')) {
          errorMessage = 'Invalid product data. Please verify all required fields are properly filled.';
        } else if (error.message.includes('409')) {
          errorMessage = 'A product with this SKU already exists. Please use a different SKU.';
        } else if (error.message.includes('422')) {
          errorMessage = 'Validation error. Please check the data format and try again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Failed to Add Product",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Quick Add Product
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Product Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sku" className="text-sm font-medium">
                  SKU *
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Product SKU"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-sm font-medium">
                  Price (PKR) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="costPrice" className="text-sm font-medium">
                Cost Price (PKR)
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', e.target.value)}
                placeholder="Enter cost price"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unit
                </Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="meter">Meter</SelectItem>
                    <SelectItem value="liter">Liter</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="packet">Packet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quantity Management */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incompleteQuantity"
                checked={formData.incompleteQuantity}
                onCheckedChange={(checked) => handleInputChange('incompleteQuantity', checked)}
              />
              <Label htmlFor="incompleteQuantity" className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Incomplete quantity information
              </Label>
            </div>

            {!formData.incompleteQuantity ? (
              <div>
                <Label htmlFor="stock" className="text-sm font-medium">
                  Stock Quantity
                </Label>
                <Input
                  id="stock"
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="Enter quantity"
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="quantityNote" className="text-sm font-medium">
                  Quantity Note
                </Label>
                <Textarea
                  id="quantityNote"
                  value={formData.quantityNote}
                  onChange={(e) => handleInputChange('quantityNote', e.target.value)}
                  placeholder="Add a note about the incomplete quantity (e.g., 'Need to count inventory', 'Partial stock in warehouse')"
                  className="mt-1 h-20"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief product description (optional)"
              className="mt-1 h-16"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name || !formData.sku || !formData.price}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
