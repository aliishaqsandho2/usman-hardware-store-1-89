import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Package, Search, Plus, Minus, Pin, PinOff, Filter, Menu, X, PackagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi, productsApi } from "@/services/api";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { TodaysOrdersModal } from "@/components/sales/TodaysOrdersModal";
import { ProductCard } from "@/components/sales/ProductCard";
import { CartSidebar } from "@/components/sales/CartSidebar";
import { QuickAddProductForm } from "@/components/sales/QuickAddProductForm";
import { useIsMobile } from "@/hooks/use-mobile";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sku: string;
  unit: string;
  adjustedPrice?: number; // For price negotiations
}

const Sales = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isTodaysOrdersOpen, setIsTodaysOrdersOpen] = useState(false);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedProducts, setPinnedProducts] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderStatus, setOrderStatus] = useState("completed");
  const [quantityInputs, setQuantityInputs] = useState<{[key: number]: string}>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchTodaysOrders();
    // Load pinned products from localStorage
    const saved = localStorage.getItem('pinnedProducts');
    if (saved) {
      try {
        setPinnedProducts(JSON.parse(saved));
      } catch (error) {
        console.error('Error parsing pinned products from localStorage:', error);
        setPinnedProducts([]);
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getAll({ 
        limit: 100,
        status: 'active'
      });
      if (response.success && response.data) {
        const productsData = response.data?.products || response.data || [];
        const validProducts = Array.isArray(productsData) ? productsData : [];
        setProducts(validProducts);
        
        // Extract unique categories from products
        const uniqueCategories = [...new Set(
          validProducts
            .map(product => product.category)
            .filter(category => category && typeof category === 'string')
        )];
        setCategories(uniqueCategories);
      } else {
        setProducts([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
      setCategories([]);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customersApi.getAll({ limit: 100 });
      if (response.success) {
        const customersData = response.data?.customers || response.data || [];
        setCustomers(Array.isArray(customersData) ? customersData : []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchTodaysOrders = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const response = await salesApi.getAll({ 
        dateFrom: today,
        dateTo: today,
        limit: 50
      });
      if (response.success) {
        const ordersData = response.data?.sales || response.data || [];
        setTodaysOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setTodaysOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch today\'s orders:', error);
      setTodaysOrders([]);
    }
  };

  const togglePinProduct = (productId: number) => {
    const newPinned = pinnedProducts.includes(productId)
      ? pinnedProducts.filter(id => id !== productId)
      : [...pinnedProducts, productId];
    
    setPinnedProducts(newPinned);
    localStorage.setItem('pinnedProducts', JSON.stringify(newPinned));
    
    toast({
      title: pinnedProducts.includes(productId) ? "Product Unpinned" : "Product Pinned",
      description: `Product ${pinnedProducts.includes(productId) ? 'removed from' : 'added to'} pinned items`,
    });
  };

  const addToCartWithCustomQuantity = (product: any, customQuantity?: number) => {
    const quantity = customQuantity || 1;
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        sku: product.sku,
        unit: product.unit
      }]);
    }

    // Clear the quantity input for this product
    setQuantityInputs(prev => ({...prev, [product.id]: ""}));

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.unit} of ${product.name} added to cart`,
    });
  };

  const handleQuantityInputChange = (productId: number, value: string) => {
    // Allow decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setQuantityInputs(prev => ({...prev, [productId]: value}));
    }
  };

  const addCustomQuantityToCart = (product: any) => {
    const inputValue = quantityInputs[product.id];
    const quantity = parseFloat(inputValue);
    
    if (inputValue && !isNaN(quantity) && quantity > 0) {
      addToCartWithCustomQuantity(product, quantity);
    } else {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity",
        variant: "destructive"
      });
    }
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateItemPrice = (productId: number, newPrice: number) => {
    setCart(cart.map(item => 
      item.productId === productId 
        ? { ...item, adjustedPrice: newPrice }
        : item
    ));
    
    toast({
      title: "Price Updated",
      description: "Item price has been adjusted for negotiation",
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    try {
      const saleData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.adjustedPrice || item.price, // Use adjusted price if available
          totalPrice: (item.adjustedPrice || item.price) * item.quantity
        })),
        totalAmount: cart.reduce((sum, item) => {
          const finalPrice = item.adjustedPrice || item.price;
          return sum + (finalPrice * item.quantity);
        }, 0),
        discount: 0,
        paymentMethod: paymentMethod,
        status: orderStatus,
        saleDate: new Date().toISOString(),
        notes: selectedCustomer ? `Sale to ${selectedCustomer.name}` : "Walk-in customer sale"
      };

      console.log('Sending sale data:', saleData);

      const response = await salesApi.create(saleData);
      
      if (response.success) {
        setCart([]);
        setSelectedCustomer(null);
        setQuantityInputs({});
        setPaymentMethod("cash");
        fetchTodaysOrders();
        toast({
          title: "Sale Completed Successfully",
          description: `Order has been processed with status: ${orderStatus}. Total: PKR ${saleData.totalAmount.toFixed(2)}`,
        });
      } else {
        throw new Error(response.message || 'Failed to process sale');
      }
    } catch (error) {
      console.error('Failed to process sale:', error);
      toast({
        title: "Sale Failed",
        description: `Error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive"
      });
    }
  };

  const handleProductAdded = (newProduct: any) => {
    // Add the new product to the products list
    setProducts(prev => [newProduct, ...prev]);
    
    // Update categories if it's a new category
    if (newProduct.category && !categories.includes(newProduct.category)) {
      setCategories(prev => [...prev, newProduct.category]);
    }
    
    toast({
      title: "Product Ready for Sale",
      description: `${newProduct.name} is now available in the product list`,
    });
  };

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    const matchesSearch = product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === null || product?.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort products: pinned first, then by name
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aIsPinned = pinnedProducts.includes(a.id);
    const bIsPinned = pinnedProducts.includes(b.id);
    
    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Calculate total cart items and value
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = cart.reduce((sum, item) => {
    const finalPrice = item.adjustedPrice || item.price;
    return sum + (finalPrice * item.quantity);
  }, 0);

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading POS...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-background shadow-sm border-b px-3 md:px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <SidebarTrigger />
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                    Sales System (POS)
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Usman Hardware - Hafizabad
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Quick Add Product Button */}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsQuickAddProductOpen(true)}
                className="h-8 text-xs md:text-sm px-2 md:px-3 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                title="Quick add new product"
              >
                <PackagePlus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="hidden sm:inline">Add Product</span>
              </Button>
              
              {/* Mobile Cart Toggle */}
              {isMobile && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="h-8 w-8 p-0 md:hidden relative"
                >
                  <Package className="h-4 w-4" />
                  {totalCartItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600">
                      {totalCartItems}
                    </Badge>
                  )}
                </Button>
              )}
              
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full hidden md:inline">
                {totalCartItems} items - PKR {totalCartValue.toLocaleString()}
              </span>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
                onClick={() => setIsTodaysOrdersOpen(true)}
              >
                Today's Orders
              </Button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="flex-1 p-3 md:p-4 overflow-auto bg-background">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Products
                <Badge variant="outline" className="ml-1 text-xs">{pinnedProducts.length} pinned</Badge>
              </h2>
            </div>
            
            {/* Search and Quick Add Info */}
            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 md:h-10 bg-background border-input text-sm"
                />
              </div>

              {/* Quick Add Info Banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <PackagePlus className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">Can't find a product?</p>
                    <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                      Use "Add Product" button to quickly add new products during sale. You can update complete details later.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Category Filter Bar */}
            <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filter by Category:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  className="h-7 md:h-8 text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  All ({products.length})
                </Button>
                {categories.map((category) => {
                  const categoryCount = products.filter(p => p.category === category).length;
                  return (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      className="h-7 md:h-8 text-xs"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category} ({categoryCount})
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Responsive Products Grid - More cards per row with smaller size */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isPinned={pinnedProducts.includes(product.id)}
                quantityInput={quantityInputs[product.id] || ""}
                onTogglePin={togglePinProduct}
                onQuantityChange={handleQuantityInputChange}
                onAddToCart={addToCartWithCustomQuantity}
                onAddCustomQuantity={addCustomQuantityToCart}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Cart Sidebar */}
      <div className={`${isMobile ? 'hidden' : ''}`}>
        <CartSidebar
          cart={cart}
          selectedCustomer={selectedCustomer}
          customers={customers}
          orderStatus={orderStatus}
          isCustomerDialogOpen={isCustomerDialogOpen}
          isQuickCustomerOpen={isQuickCustomerOpen}
          onSetSelectedCustomer={setSelectedCustomer}
          onSetIsCustomerDialogOpen={setIsCustomerDialogOpen}
          onSetIsQuickCustomerOpen={setIsQuickCustomerOpen}
          onSetOrderStatus={setOrderStatus}
          onUpdateCartQuantity={updateCartQuantity}
          onRemoveFromCart={removeFromCart}
          onCheckout={handleCheckout}
          onUpdateItemPrice={updateItemPrice}
        />
      </div>

      {/* Mobile Cart Overlay */}
      {isMobile && isCartOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] bg-background shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Cart ({cart.length})</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCartOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Mobile Cart Content */}
            <div className="flex flex-col h-full">
              {/* Mobile Cart Items */}
              <div className="flex-1 overflow-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>No items in cart</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <Card key={item.productId} className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            ×
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 w-6 p-0"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium">{item.quantity} {item.unit}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 w-6 p-0"
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-green-600 text-sm">
                            PKR {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Checkout */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-background">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">PKR {totalCartValue.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      handleCheckout();
                      setIsCartOpen(false);
                    }}
                  >
                    Complete Sale ({paymentMethod})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <TodaysOrdersModal
        open={isTodaysOrdersOpen}
        onOpenChange={setIsTodaysOrdersOpen}
        orders={todaysOrders}
      />

      {/* Quick Customer Form */}
      <QuickCustomerForm
        open={isQuickCustomerOpen}
        onOpenChange={setIsQuickCustomerOpen}
        onCustomerCreated={(customer) => {
          setCustomers([...customers, customer]);
          setSelectedCustomer(customer);
        }}
      />

      {/* Quick Add Product Form */}
      <QuickAddProductForm
        open={isQuickAddProductOpen}
        onOpenChange={setIsQuickAddProductOpen}
        onProductAdded={handleProductAdded}
      />
    </div>
  );
};

export default Sales;
