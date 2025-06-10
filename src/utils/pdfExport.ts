
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ProductForPDF {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  minStock: number;
  costPrice?: number;
  description?: string;
  supplier?: string;
}

export const generateProductsPDF = (products: ProductForPDF[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text('Complete Product Inventory Report', 14, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
  
  // Calculate totals
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  const totalCostValue = products.reduce((sum, product) => sum + ((product.costPrice || 0) * product.stock), 0);
  const lowStockItems = products.filter(p => p.stock <= p.minStock).length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('Inventory Summary', 14, 45);
  
  const summaryData = [
    ['Total Products', totalProducts.toString()],
    ['Total Stock Value (Retail)', `PKR ${totalStockValue.toLocaleString()}`],
    ['Total Stock Value (Cost)', `PKR ${totalCostValue.toLocaleString()}`],
    ['Potential Profit', `PKR ${(totalStockValue - totalCostValue).toLocaleString()}`],
    ['Low Stock Items', lowStockItems.toString()],
    ['Out of Stock Items', outOfStockItems.toString()],
  ];
  
  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });
  
  // Add products table
  doc.setFontSize(14);
  doc.setTextColor(40);
  const summaryHeight = (doc as any).lastAutoTable.finalY + 20;
  doc.text('Complete Product List', 14, summaryHeight);
  
  const tableData = products.map(product => [
    product.sku,
    product.name,
    product.category,
    `PKR ${product.price.toLocaleString()}`,
    product.costPrice ? `PKR ${product.costPrice.toLocaleString()}` : 'N/A',
    `${product.stock} ${product.unit}`,
    `${product.minStock} ${product.unit}`,
    product.stock <= product.minStock ? 'Low Stock' : 'In Stock',
    `PKR ${(product.price * product.stock).toLocaleString()}`,
  ]);
  
  autoTable(doc, {
    startY: summaryHeight + 5,
    head: [['SKU', 'Product Name', 'Category', 'Price', 'Cost Price', 'Stock', 'Min Stock', 'Status', 'Total Value']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 35 },
      2: { cellWidth: 20 },
      3: { cellWidth: 18 },
      4: { cellWidth: 18 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      if (data.column.index === 7 && data.cell.text[0] === 'Low Stock') {
        data.cell.styles.textColor = [220, 38, 38];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
  
  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    doc.text('Usman Hardware Store - Inventory Management System', 14, doc.internal.pageSize.height - 10);
  }
  
  // Save the PDF
  const fileName = `inventory-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
