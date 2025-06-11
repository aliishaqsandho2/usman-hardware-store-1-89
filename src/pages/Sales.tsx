import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Package, Search, Plus, Minus, Pin, PinOff, Filter, Menu, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi, customersApi, productsApi } from "@/services/api";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { TodaysOrdersModal } from "@/components/sales/TodaysOrdersModal";
import { ProductCard } from "@/components/sales/ProductCard";
import { CartSidebar } from "@/components/sales/CartSidebar";
import { QuickProductAddModal } from "@/components/sales/QuickProductAddModal";
import { useIsMobile } from "@/hooks/use-mobile";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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
  const [isQuickProductAddOpen, setIsQuickProductAddOpen] = useState(false);
  const [todaysOrders, setTodaysOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pinnedProducts, setPinnedProducts] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderStatus, setOrderStatus] = useState("completed");
  const [quantityInputs, setQuantityInputs] = useState<{[key: number]: string}>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

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

  const handleProductAdded = (newProduct: any) => {
    // Add the new product to the current products list
    setProducts(prev => [newProduct, ...prev]);
    
    // Update categories if it's a new category
    if (newProduct.category && !categories.includes(newProduct.category)) {
      setCategories(prev => [...prev, newProduct.category]);
    }
    
    // Show special notification for incomplete quantity products
    if (newProduct.incompleteQuantity) {
      toast({
        title: "Product Added with Incomplete Quantity",
        description: `${newProduct.name} has been added. Remember to update the quantity later.`,
        variant: "default"
      });
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
      // Calculate total without any tax
      const totalAmount = cart.reduce((sum, item) => {
        const finalPrice = item.adjustedPrice || item.price;
        return sum + (finalPrice * item.quantity);
      }, 0);

      const saleData = {
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || "Walk-in Customer",
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.adjustedPrice || item.price,
          totalPrice: (item.adjustedPrice || item.price) * item.quantity
        })),
        totalAmount: totalAmount, // Pure total without tax
        subtotal: totalAmount, // Same as total since no tax
        tax: 0, // Explicitly set tax to 0
        discount: 0,
        paymentMethod: paymentMethod,
        status: orderStatus,
        saleDate: new Date().toISOString(),
        notes: selectedCustomer ? `Sale to ${selectedCustomer.name}` : "Walk-in customer sale"
      };

      console.log('Sending sale data:', saleData);

      const response = await salesApi.create(saleData);
      
      if (response.success) {
        // AUTO-GENERATE RECEIPT after successful sale
        await generateReceiptPDF({
          id: response.data?.id || Date.now(),
          orderNumber: response.data?.orderNumber || `UH-${Date.now()}`,
          customerId: selectedCustomer?.id || null,
          customerName: selectedCustomer?.name || null,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.adjustedPrice || item.price,
            total: (item.adjustedPrice || item.price) * item.quantity
          })),
          subtotal: totalAmount,
          discount: 0,
          tax: 0,
          total: totalAmount,
          paymentMethod: paymentMethod,
          status: orderStatus,
          createdBy: "POS User",
          createdAt: new Date().toISOString()
        });

        setCart([]);
        setSelectedCustomer(null);
        setQuantityInputs({});
        setPaymentMethod("cash");
        fetchTodaysOrders();
        toast({
          title: "Sale Completed Successfully",
          description: `Order has been processed with status: ${orderStatus}. Payment: ${paymentMethod}. Total: PKR ${saleData.totalAmount.toFixed(2)}. Receipt downloaded automatically.`,
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

  // AUTO RECEIPT GENERATION FUNCTION
  const generateReceiptPDF = async (order: any) => {
    try {
      // Generate QR code with proper encoding
      const qrData = `USMAN-HARDWARE-${order.orderNumber}-${order.total}-VERIFIED`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 60,
        margin: 1,
        color: {
          dark: '#1a365d',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      // Create 80mm thermal receipt
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 300] // 80mm width, sufficient height
      });

      const pageWidth = 80;
      let yPos = 8;

      // Set default font to avoid character encoding issues
      pdf.setFont('helvetica', 'normal');

      // SUBTLE WATERMARK - Light diagonal background
      pdf.setTextColor(250, 250, 250);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      
      pdf.saveGraphicsState();
      pdf.setGState(pdf.GState({ opacity: 0.05 }));
      
      // Create subtle watermark pattern
      for (let i = 0; i < 6; i++) {
        const yWatermark = 40 + (i * 30);
        pdf.text('USMAN HARDWARE', pageWidth / 2, yWatermark, {
          angle: -20,
          align: 'center'
        });
      }
      
      pdf.restoreGraphicsState();
      pdf.setTextColor(0, 0, 0); // Reset to black

      // HEADER SECTION with clean design
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(4, yPos, pageWidth - 8, 32, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('USMAN HARDWARE', pageWidth / 2, yPos + 7, { align: 'center' });
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Premium Furniture Hardware', pageWidth / 2, yPos + 13, { align: 'center' });
      pdf.text('Hafizabad, Punjab', pageWidth / 2, yPos + 18, { align: 'center' });
      pdf.text('+92-300-1234567', pageWidth / 2, yPos + 23, { align: 'center' });
      pdf.text('www.usmanhardware.com', pageWidth / 2, yPos + 28, { align: 'center' });

      yPos += 40;

      // RECEIPT TITLE
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(6, yPos, pageWidth - 12, 10, 1, 1, 'F');
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(6, yPos, pageWidth - 12, 10, 1, 1, 'S');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 54, 93);
      pdf.text('SALES RECEIPT', pageWidth / 2, yPos + 6.5, { align: 'center' });
      
      yPos += 16;

      // RECEIPT DETAILS with proper spacing - LEFT ALIGNED
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Clean info section
      pdf.setFillColor(252, 252, 254);
      pdf.roundedRect(5, yPos, pageWidth - 10, 26, 1, 1, 'F');
      
      yPos += 4;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receipt:', 8, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.orderNumber, 25, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Date:', 8, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(order.date).toLocaleDateString('en-GB'), 25, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Time:', 8, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.time, 25, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Customer:', 8, yPos);
      pdf.setFont('helvetica', 'normal');
      const customerName = order.customerName || 'Walk-in Customer';
      pdf.text(customerName.length > 23 ? customerName.substring(0, 23) + '...' : customerName, 25, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cashier:', 8, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.createdBy, 25, yPos);
      yPos += 8;

      // ITEMS HEADER - LEFT ALIGNED
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(5, yPos, pageWidth - 10, 7, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('ITEM', 8, yPos + 4.5);
      pdf.text('QTY', 50, yPos + 4.5);
      pdf.text('RATE', 58, yPos + 4.5);
      pdf.text('TOTAL', 68, yPos + 4.5);
      
      yPos += 7;

      // ITEMS with complete product names and proper spacing - LEFT ALIGNED
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      order.items.forEach((item: any, index: number) => {
        // Calculate how many lines needed for product name
        const maxCharsPerLine = 20;
        const productName = item.productName;
        const lines = [];
        
        if (productName.length <= maxCharsPerLine) {
          lines.push(productName);
        } else {
          // Split into multiple lines
          let remaining = productName;
          while (remaining.length > maxCharsPerLine) {
            let breakPoint = maxCharsPerLine;
            // Try to break at a space
            const lastSpace = remaining.substring(0, maxCharsPerLine).lastIndexOf(' ');
            if (lastSpace > maxCharsPerLine * 0.7) {
              breakPoint = lastSpace;
            }
            lines.push(remaining.substring(0, breakPoint));
            remaining = remaining.substring(breakPoint).trim();
          }
          if (remaining.length > 0) {
            lines.push(remaining);
          }
        }
        
        const itemHeight = Math.max(5, lines.length * 4);
        
        // Alternating row colors for better readability
        if (index % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(5, yPos, pageWidth - 10, itemHeight, 'F');
        }
        
        // Product name - complete with line breaks - LEFT ALIGNED
        lines.forEach((line, lineIndex) => {
          pdf.text(line, 8, yPos + 3 + (lineIndex * 3.5));
        });
        
        // Quantity, rate, total aligned to specific positions - LEFT ALIGNED
        pdf.text(item.quantity.toString(), 50, yPos + 3);
        pdf.text(item.unitPrice.toFixed(0), 58, yPos + 3);
        pdf.text(item.total.toFixed(0), 68, yPos + 3);
        
        yPos += itemHeight;
      });

      // SEPARATOR LINE
      yPos += 3;
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.5);
      pdf.line(8, yPos, pageWidth - 8, yPos);
      yPos += 6;

      // TOTALS SECTION - LEFT ALIGNED
      const totalsStartX = 8;
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text('Subtotal:', totalsStartX, yPos);
      pdf.text(`PKR ${order.subtotal.toFixed(0)}`, totalsStartX + 35, yPos);
      yPos += 4;
      
      if (order.discount > 0) {
        pdf.setTextColor(220, 38, 127);
        pdf.text('Discount:', totalsStartX, yPos);
        pdf.text(`-PKR ${order.discount.toFixed(0)}`, totalsStartX + 35, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 4;
      }
      
      if (order.tax > 0) {
        pdf.text('Tax:', totalsStartX, yPos);
        pdf.text(`PKR ${order.tax.toFixed(0)}`, totalsStartX + 35, yPos);
        yPos += 4;
      }
      
      // Grand Total with emphasis - LEFT ALIGNED
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(totalsStartX, yPos, 45, 6, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('TOTAL:', totalsStartX + 3, yPos + 4);
      pdf.text(`PKR ${order.total.toFixed(0)}`, totalsStartX + 25, yPos + 4);
      
      yPos += 12;

      // PAYMENT METHOD centered
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Method:', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      
      // Payment badge centered
      const paymentColor = order.paymentMethod === 'cash' ? [34, 197, 94] : [59, 130, 246];
      pdf.setFillColor(paymentColor[0], paymentColor[1], paymentColor[2]);
      pdf.roundedRect(pageWidth / 2 - 12, yPos, 24, 5, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(order.paymentMethod.toUpperCase(), pageWidth / 2, yPos + 3.5, { align: 'center' });
      
      yPos += 12;

      // QR CODE SECTION centered
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan to Verify:', pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      
      // QR frame centered
      const qrSize = 20;
      const qrX = pageWidth / 2 - qrSize / 2;
      
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(qrX - 2, yPos, qrSize + 4, qrSize + 4, 1, 1, 'F');
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(qrX - 2, yPos, qrSize + 4, qrSize + 4, 1, 1, 'S');
      
      pdf.addImage(qrCodeDataURL, 'PNG', qrX, yPos + 2, qrSize, qrSize);
      
      yPos += 28;

      // THANK YOU MESSAGE centered
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(6, yPos, pageWidth - 12, 15, 2, 2, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 54, 93);
      pdf.text('Thank You!', pageWidth / 2, yPos + 6, { align: 'center' });
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Your trust means everything to us', pageWidth / 2, yPos + 10, { align: 'center' });
      pdf.text('Visit us again soon!', pageWidth / 2, yPos + 13, { align: 'center' });
      
      yPos += 20;

      // FOOTER POLICIES centered
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(4, yPos, pageWidth - 8, 18, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXCHANGE POLICY', pageWidth / 2, yPos + 4, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.text('Items exchangeable within 7 days', pageWidth / 2, yPos + 7, { align: 'center' });
      pdf.text('Original receipt required', pageWidth / 2, yPos + 10, { align: 'center' });
      pdf.text('Support: +92-300-1234567', pageWidth / 2, yPos + 13, { align: 'center' });
      pdf.text('Hours: Mon-Sat 9AM-8PM', pageWidth / 2, yPos + 16, { align: 'center' });
      
      yPos += 23;

      // FINAL FOOTER centered
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      pdf.text(`Receipt ID: ${order.orderNumber}`, pageWidth / 2, yPos + 3, { align: 'center' });

      // Save with descriptive filename
      pdf.save(`UH_Receipt_${order.orderNumber}_80mm.pdf`);
      
      console.log('Auto-generated receipt for order:', order.orderNumber);
    } catch (error) {
      console.error('Failed to auto-generate receipt:', error);
      // Don't show error toast for auto-generation to avoid interrupting the sale flow
    }
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

  // Calculate total cart items and value (without tax)
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartValue = cart.reduce((sum, item) => {
    const finalPrice = item.adjustedPrice || item.price;
    return sum + (finalPrice * item.quantity);
  }, 0);

  // Count products with incomplete quantity information
  const incompleteQuantityCount = products.filter(p => p.incompleteQuantity).length;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading POS...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="bg-background shadow-sm border-b px-3 md:px-4 py-3 flex-shrink-0">
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

        {/* Products Section - NO SCROLLBARS, FIXED HEIGHT */}
        <div className="flex-1 overflow-hidden bg-background flex flex-col min-h-0">
          <div className="p-3 md:p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Products
                <Badge variant="outline" className="ml-1 text-xs">{pinnedProducts.length} pinned</Badge>
                {incompleteQuantityCount > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs text-orange-600 border-orange-300">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {incompleteQuantityCount} incomplete
                  </Badge>
                )}
              </h2>
              
              {/* Quick Add Product Button */}
              <Button
                onClick={() => setIsQuickProductAddOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Quick Add Product
              </Button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 md:h-10 bg-background border-input text-sm"
              />
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

          {/* Responsive Products Grid - INTERNAL SCROLLING ONLY */}
          <div className="flex-1 overflow-auto px-3 md:px-4 pb-4 min-h-0">
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
      </div>

      {/* Desktop Cart Sidebar */}
      <div className={`${isMobile ? 'hidden' : ''} flex-shrink-0`}>
        <CartSidebar
          cart={cart}
          selectedCustomer={selectedCustomer}
          customers={customers}
          orderStatus={orderStatus}
          paymentMethod={paymentMethod}
          isCustomerDialogOpen={isCustomerDialogOpen}
          isQuickCustomerOpen={isQuickCustomerOpen}
          onSetSelectedCustomer={setSelectedCustomer}
          onSetIsCustomerDialogOpen={setIsCustomerDialogOpen}
          onSetIsQuickCustomerOpen={setIsQuickCustomerOpen}
          onSetOrderStatus={setOrderStatus}
          onSetPaymentMethod={setPaymentMethod}
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

      {/* Quick Product Add Modal */}
      <QuickProductAddModal
        open={isQuickProductAddOpen}
        onOpenChange={setIsQuickProductAddOpen}
        onProductAdded={handleProductAdded}
        categories={categories}
      />
    </div>
  );
};

export default Sales;
