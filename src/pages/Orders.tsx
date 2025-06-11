import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, ShoppingCart, Eye, Calendar, DollarSign, User, Package, Download, FileText, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { salesApi } from "@/services/api";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface Sale {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customerName: string | null;
  date: string;
  time: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

const Orders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0
  });
  
  // NEW: State for order details modal
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus, filterCustomer, filterPaymentMethod, dateFrom, dateTo]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 20,
      };

      if (filterStatus !== "all") {
        params.status = filterStatus;
      }

      if (filterCustomer) {
        params.customerId = parseInt(filterCustomer);
      }

      if (dateFrom) {
        params.dateFrom = dateFrom;
      }

      if (dateTo) {
        params.dateTo = dateTo;
      }

      const response = await salesApi.getAll(params);
      
      if (response.success) {
        setOrders(response.data.sales);
        setTotalPages(response.data.pagination.totalPages);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle view order details
  const handleViewOrder = (order: Sale) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  // BEAUTIFUL 80MM THERMAL RECEIPT with Enhanced Design & Watermark
  const handleOrderPDF = async (order: Sale) => {
    try {
      // Generate beautiful QR code with enhanced styling
      const qrData = `USMAN-HARDWARE-${order.orderNumber}-${order.total}-VERIFIED`;
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 80,
        margin: 1,
        color: {
          dark: '#1a365d',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      // Create beautiful 80mm thermal receipt
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 250] // 80mm width, variable height
      });

      const pageWidth = 80;
      let yPos = 8;

      // WATERMARK - Elegant diagonal background
      pdf.setTextColor(245, 245, 245);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      
      // Create beautiful diagonal watermark
      pdf.saveGraphicsState();
      pdf.setGState(pdf.GState({ opacity: 0.08 }));
      
      // Multiple watermark lines for better coverage
      for (let i = 0; i < 8; i++) {
        const yWatermark = 30 + (i * 25);
        pdf.text('USMAN HARDWARE', pageWidth / 2, yWatermark, {
          angle: -25,
          align: 'center'
        });
      }
      
      pdf.restoreGraphicsState();
      pdf.setTextColor(0, 0, 0); // Reset to black

      // ELEGANT HEADER with gradient effect simulation
      pdf.setFillColor(26, 54, 93); // Dark blue
      pdf.roundedRect(2, yPos, pageWidth - 4, 35, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('USMAN HARDWARE', pageWidth / 2, yPos + 8, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Premium Furniture Hardware', pageWidth / 2, yPos + 15, { align: 'center' });
      pdf.text('📍 Hafizabad, Punjab', pageWidth / 2, yPos + 21, { align: 'center' });
      pdf.text('📞 +92-300-1234567', pageWidth / 2, yPos + 27, { align: 'center' });
      pdf.text('🌐 www.usmanhardware.com', pageWidth / 2, yPos + 33, { align: 'center' });

      yPos += 45;

      // DECORATIVE SEPARATOR
      pdf.setTextColor(0, 0, 0);
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.5);
      for (let i = 0; i < pageWidth - 10; i += 3) {
        pdf.circle(5 + i, yPos, 0.3, 'F');
      }
      yPos += 5;

      // RECEIPT TITLE with elegant box
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(5, yPos, pageWidth - 10, 12, 1, 1, 'F');
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(5, yPos, pageWidth - 10, 12, 1, 1, 'S');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 54, 93);
      pdf.text('✦ SALES RECEIPT ✦', pageWidth / 2, yPos + 8, { align: 'center' });
      
      yPos += 18;

      // RECEIPT DETAILS with icons and beautiful formatting
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      
      // Receipt Info Box
      pdf.setFillColor(252, 252, 254);
      pdf.roundedRect(3, yPos, pageWidth - 6, 28, 1, 1, 'F');
      pdf.setDrawColor(200, 200, 220);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(3, yPos, pageWidth - 6, 28, 1, 1, 'S');
      
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('📋 Receipt:', 6, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.orderNumber, 30, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('📅 Date:', 6, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(order.date).toLocaleDateString('en-GB'), 30, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('🕒 Time:', 6, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.time, 30, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('👤 Customer:', 6, yPos);
      pdf.setFont('helvetica', 'normal');
      const customerName = order.customerName || 'Walk-in Customer';
      pdf.text(customerName.length > 25 ? customerName.substring(0, 25) + '...' : customerName, 30, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('👨‍💼 Cashier:', 6, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(order.createdBy, 30, yPos);
      yPos += 8;

      // ITEMS SECTION with beautiful table
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(3, yPos, pageWidth - 6, 8, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('ITEM', 6, yPos + 5);
      pdf.text('QTY', pageWidth - 35, yPos + 5);
      pdf.text('RATE', pageWidth - 25, yPos + 5);
      pdf.text('TOTAL', pageWidth - 12, yPos + 5);
      
      yPos += 8;

      // Items with alternating backgrounds
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      
      order.items.forEach((item: any, index: number) => {
        // Alternating row colors for better readability
        if (index % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(3, yPos, pageWidth - 6, 6, 'F');
        }
        
        // Product name with elegant truncation
        const productName = item.productName.length > 28 
          ? item.productName.substring(0, 28) + '...' 
          : item.productName;
        
        pdf.text(productName, 6, yPos + 4);
        pdf.text(item.quantity.toString(), pageWidth - 33, yPos + 4);
        pdf.text(item.unitPrice.toFixed(0), pageWidth - 24, yPos + 4);
        pdf.text(item.total.toFixed(0), pageWidth - 10, yPos + 4);
        yPos += 6;
      });

      // Beautiful separator line
      yPos += 2;
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.5);
      pdf.line(6, yPos, pageWidth - 6, yPos);
      yPos += 5;

      // TOTALS SECTION with elegant styling
      pdf.setFillColor(252, 252, 254);
      pdf.roundedRect(pageWidth - 40, yPos, 35, 20, 1, 1, 'F');
      pdf.setDrawColor(200, 200, 220);
      pdf.setLineWidth(0.2);
      pdf.roundedRect(pageWidth - 40, yPos, 35, 20, 1, 1, 'S');
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      
      const totalsX = pageWidth - 37;
      yPos += 4;
      
      pdf.text('Subtotal:', totalsX - 15, yPos);
      pdf.text(`PKR ${order.subtotal.toFixed(0)}`, totalsX, yPos);
      yPos += 4;
      
      if (order.discount > 0) {
        pdf.setTextColor(220, 38, 127);
        pdf.text('Discount:', totalsX - 15, yPos);
        pdf.text(`-PKR ${order.discount.toFixed(0)}`, totalsX, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 4;
      }
      
      if (order.tax > 0) {
        pdf.text('Tax:', totalsX - 15, yPos);
        pdf.text(`PKR ${order.tax.toFixed(0)}`, totalsX, yPos);
        yPos += 4;
      }
      
      // Grand Total with emphasis
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(pageWidth - 40, yPos, 35, 8, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('TOTAL:', totalsX - 15, yPos + 5);
      pdf.text(`PKR ${order.total.toFixed(0)}`, totalsX, yPos + 5);
      
      yPos += 15;

      // PAYMENT METHOD with beautiful badge
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('💳 Payment Method:', 6, yPos);
      
      // Payment badge
      const paymentColor = order.paymentMethod === 'cash' ? [34, 197, 94] : [59, 130, 246];
      pdf.setFillColor(paymentColor[0], paymentColor[1], paymentColor[2]);
      pdf.roundedRect(6, yPos + 3, 25, 6, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(order.paymentMethod.toUpperCase(), 18.5, yPos + 7, { align: 'center' });
      
      yPos += 15;

      // QR CODE SECTION with beautiful frame
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('🔍 Scan to Verify:', 6, yPos);
      
      // Elegant QR frame
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(pageWidth / 2 - 12, yPos + 3, 24, 24, 2, 2, 'F');
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(1);
      pdf.roundedRect(pageWidth / 2 - 12, yPos + 3, 24, 24, 2, 2, 'S');
      
      pdf.addImage(qrCodeDataURL, 'PNG', pageWidth / 2 - 10, yPos + 5, 20, 20);
      
      yPos += 30;

      // THANK YOU MESSAGE with decorative elements
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(3, yPos, pageWidth - 6, 18, 2, 2, 'F');
      pdf.setDrawColor(26, 54, 93);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(3, yPos, pageWidth - 6, 18, 2, 2, 'S');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 54, 93);
      pdf.text('✨ Thank You! ✨', pageWidth / 2, yPos + 6, { align: 'center' });
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Your trust means everything to us', pageWidth / 2, yPos + 11, { align: 'center' });
      pdf.text('Visit us again soon!', pageWidth / 2, yPos + 15, { align: 'center' });
      
      yPos += 25;

      // POLICIES & CONTACT with elegant formatting
      pdf.setFillColor(26, 54, 93);
      pdf.roundedRect(3, yPos, pageWidth - 6, 20, 1, 1, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXCHANGE POLICY', pageWidth / 2, yPos + 4, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.text('• Items exchangeable within 7 days', pageWidth / 2, yPos + 8, { align: 'center' });
      pdf.text('• Original receipt required', pageWidth / 2, yPos + 11, { align: 'center' });
      pdf.text('• Support: +92-300-1234567', pageWidth / 2, yPos + 14, { align: 'center' });
      pdf.text('• Hours: Mon-Sat 9AM-8PM', pageWidth / 2, yPos + 17, { align: 'center' });
      
      yPos += 25;

      // FOOTER with timestamp
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
      pdf.text(`Receipt ID: ${order.orderNumber}`, pageWidth / 2, yPos + 3, { align: 'center' });

      // Save with descriptive filename
      pdf.save(`UH_Receipt_${order.orderNumber}_80mm.pdf`);
      
      toast({
        title: "Beautiful 80mm Receipt Generated! 🎉",
        description: `Thermal receipt for order ${order.orderNumber} downloaded with elegant design and watermark`,
      });
    } catch (error) {
      console.error('Failed to generate 80mm receipt:', error);
      toast({
        title: "Receipt Generation Failed",
        description: "Failed to generate thermal receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchOrders();
  };

  const handleOrdersExportCSV = async () => {
    try {
      setExportLoading(true);
      
      // Fetch all orders for export (without pagination)
      const response = await salesApi.getAll({ 
        limit: 10000, // Large number to get all orders
        page: 1
      });
      
      if (response.success) {
        const allOrders = response.data.sales || response.data || [];
        const exportData = allOrders.map((order: Sale) => ({
          'Order Number': order.orderNumber,
          'Customer Name': order.customerName || 'Walk-in',
          'Customer ID': order.customerId || 'N/A',
          'Date': new Date(order.date).toLocaleDateString(),
          'Time': order.time,
          'Items Count': order.items.length,
          'Items': order.items.map(item => `${item.productName} (${item.quantity}x)`).join('; '),
          'Subtotal (PKR)': order.subtotal,
          'Discount (PKR)': order.discount,
          'Tax (PKR)': order.tax,
          'Total (PKR)': order.total,
          'Payment Method': order.paymentMethod,
          'Status': order.status,
          'Created By': order.createdBy,
          'Created At': order.createdAt
        }));

        // Calculate summary
        const totalSales = allOrders.reduce((sum: number, order: Sale) => sum + order.total, 0);
        const totalOrders = allOrders.length;

        // Add summary row
        exportData.unshift({
          'Order Number': 'SUMMARY',
          'Customer Name': `Total Orders: ${totalOrders}`,
          'Customer ID': `Export Date: ${new Date().toLocaleString()}`,
          'Date': `Total Sales: PKR ${totalSales.toLocaleString()}`,
          'Time': '',
          'Items Count': '',
          'Items': '',
          'Subtotal (PKR)': '',
          'Discount (PKR)': '',
          'Tax (PKR)': '',
          'Total (PKR)': '',
          'Payment Method': '',
          'Status': '',
          'Created By': '',
          'Created At': ''
        });

        // Convert to CSV
        const headers = Object.keys(exportData[1] || {});
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => {
              const value = row[header as keyof typeof row];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "CSV Export Successful",
          description: `Exported ${allOrders.length} orders with complete details.`,
        });
      }
    } catch (error) {
      console.error('Failed to export orders:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export orders data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleOrdersExportPDF = async () => {
    try {
      setExportLoading(true);
      
      // Fetch all orders for export (without pagination)
      const response = await salesApi.getAll({ 
        limit: 10000, // Large number to get all orders
        page: 1
      });
      
      if (response.success) {
        const allOrders = response.data.sales || response.data || [];
        
        // Create PDF
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 20;
        let yPos = margin;

        // Title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Orders Export Report', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Export info
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += 8;
        pdf.text(`Total Orders: ${allOrders.length}`, margin, yPos);
        yPos += 8;

        // Calculate total sales
        const totalSales = allOrders.reduce((sum: number, order: Sale) => sum + order.total, 0);
        pdf.text(`Total Sales: PKR ${totalSales.toLocaleString()}`, margin, yPos);
        yPos += 15;

        // Table headers
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        const headers = ['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status'];
        const colWidths = [25, 35, 25, 15, 25, 20];
        let xPos = margin;

        headers.forEach((header, index) => {
          pdf.text(header, xPos, yPos);
          xPos += colWidths[index];
        });
        yPos += 8;

        // Draw line under headers
        pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
        yPos += 3;

        // Table data
        pdf.setFont('helvetica', 'normal');
        allOrders.forEach((order: Sale) => {
          // Check if we need a new page
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }

          xPos = margin;
          const rowData = [
            order.orderNumber.substring(0, 12),
            (order.customerName || 'Walk-in').substring(0, 18),
            new Date(order.date).toLocaleDateString(),
            order.items.length.toString(),
            order.total.toLocaleString(),
            order.status
          ];

          rowData.forEach((data, index) => {
            pdf.text(data, xPos, yPos);
            xPos += colWidths[index];
          });
          yPos += 6;
        });

        // Footer
        yPos = pageHeight - 20;
        pdf.setFontSize(8);
        pdf.text(`Generated by Order Management System`, pageWidth / 2, yPos, { align: 'center' });

        // Save PDF
        pdf.save(`orders_export_${new Date().toISOString().split('T')[0]}.pdf`);

        toast({
          title: "PDF Export Successful",
          description: `Exported ${allOrders.length} orders to PDF with complete details.`,
        });
      }
    } catch (error) {
      console.error('Failed to export orders to PDF:', error);
      toast({
        title: "PDF Export Failed",
        description: "Failed to export orders data to PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportLoading(false);
    }
  };

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

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "cash":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cash</Badge>;
      case "credit":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Credit</Badge>;
      case "card":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Card</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPaymentMethod = filterPaymentMethod === "all" || order.paymentMethod === filterPaymentMethod;
    
    return matchesSearch && matchesPaymentMethod;
  });

  if (loading) {
    return (
      <div className="flex-1 p-4 md:p-6 space-y-6 min-h-screen bg-slate-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 min-h-screen bg-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Orders Management</h1>
            <p className="text-slate-600">View and manage all customer orders</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleOrdersExportCSV}
            disabled={exportLoading}
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            {exportLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {exportLoading ? 'Exporting...' : 'CSV Export'}
          </Button>

          <Button 
            variant="outline" 
            onClick={handleOrdersExportPDF}
            disabled={exportLoading}
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {exportLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {exportLoading ? 'Exporting...' : 'PDF Export'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{summary.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Sales</p>
                <p className="text-2xl font-bold text-green-600">Rs. {summary.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">Rs. {summary.avgOrderValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Orders List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by order number, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />

            <Input
              placeholder="Customer ID"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              type="number"
            />
          </div>

          {/* Orders Table - UPDATED Actions Column */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {order.customerName || "Walk-in"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(order.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        <div className="text-xs text-slate-500">
                          {order.items.slice(0, 2).map(item => item.productName).join(', ')}
                          {order.items.length > 2 && '...'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">Rs. {order.total.toLocaleString()}</TableCell>
                    <TableCell>{getPaymentMethodBadge(order.paymentMethod)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleOrderPDF(order)}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No orders found matching your criteria.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Order Details Modal */}
      <OrderDetailsModal
        open={isOrderDetailsOpen}
        onOpenChange={setIsOrderDetailsOpen}
        order={selectedOrder}
        onOrderUpdated={fetchOrders}
      />
    </div>
  );
};

export default Orders;
