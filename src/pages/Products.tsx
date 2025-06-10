import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Package, Search, Plus, Edit, Trash2, AlertTriangle, RefreshCw, DollarSign, TrendingUp, Package2, BarChart3, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { productsApi, categoriesApi, unitsApi, inventoryApi, reportsApi } from "@/services/api";
import { ProductDetailsModal } from "@/components/sales/ProductDetailsModal";
import { FilteredProductsModal } from "@/components/FilteredProductsModal";
import { generateSKU } from "@/utils/skuGenerator";

const Products = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState({ name: "", label: "" });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [filteredProductsModal, setFilteredProductsModal] = useState({
    open: false,
    title: '',
    filterType: 'all' as 'lowStock' | 'outOfStock' | 'inStock' | 'all'
  });
  const [productDetailsModal, setProductDetailsModal] = useState({
    open: false,
    product: null as any
  });
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    totalRetailValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    overstockItems: 0,
    averageCostPrice: 0,
    averageSellingPrice: 0,
    inventoryTurnover: 0,
    deadStockValue: 0,
    fastMovingItems: 0,
    slowMovingItems: 0
  });

  useEffect(() => {
    fetchProducts(1);
    fetchCategories();
    fetchUnits();
    fetchMovements();
    fetchInventoryStats();
  }, [searchTerm, categoryFilter, statusFilter]);

  const fetchInventoryStats = async () => {
    try {
      console.log('Fetching inventory stats from API...');
      
      // Fetch inventory report from API
      const inventoryReport = await reportsApi.getInventoryReport();
      console.log('Inventory report response:', inventoryReport);
      
      // Fetch inventory data for detailed calculations
      const inventoryData = await inventoryApi.getAll({ limit: 1000 });
      console.log('Inventory data response:', inventoryData);
      
      if (inventoryReport.success && inventoryReport.data) {
        const reportData = inventoryReport.data.inventoryReport || inventoryReport.data;
        console.log('Setting inventory stats:', reportData);
        
        setInventoryStats({
          totalProducts: reportData.totalProducts || 0,
          totalValue: reportData.totalValue || 0,
          totalRetailValue: reportData.totalRetailValue || 0,
          lowStockItems: reportData.lowStockItems || 0,
          outOfStockItems: reportData.outOfStockItems || 0,
          overstockItems: reportData.overstockItems || 0,
          averageCostPrice: reportData.averageCostPrice || 0,
          averageSellingPrice: reportData.averageSellingPrice || 0,
          inventoryTurnover: reportData.inventoryTurnover || 0,
          deadStockValue: reportData.deadStockValue || 0,
          fastMovingItems: reportData.fastMovingItems || 0,
          slowMovingItems: reportData.slowMovingItems || 0
        });
      } else {
        // Fallback: calculate from products data if report API doesn't work
        console.log('Using fallback calculation from products data');
        calculateStatsFromProducts();
      }
    } catch (error) {
      console.error('Failed to fetch inventory stats:', error);
      // Fallback to calculation from products
      calculateStatsFromProducts();
    }
  };

  const calculateStatsFromProducts = () => {
    let totalProducts = 0;
    let totalValue = 0;
    let totalRetailValue = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let overstockItems = 0;
    let totalCostPrice = 0;
    let totalSellingPrice = 0;

    products.forEach(product => {
      totalProducts++;
      const costValue = (product.costPrice || 0) * (product.stock || 0);
      const retailValue = (product.price || 0) * (product.stock || 0);
      
      totalValue += costValue;
      totalRetailValue += retailValue;
      totalCostPrice += (product.costPrice || 0);
      totalSellingPrice += (product.price || 0);

      if ((product.stock || 0) === 0) {
        outOfStockItems++;
      } else if ((product.stock || 0) <= (product.minStock || 0)) {
        lowStockItems++;
      } else if ((product.maxStock || 0) > 0 && (product.stock || 0) > (product.maxStock || 0)) {
        overstockItems++;
      }
    });

    setInventoryStats({
      totalProducts,
      totalValue,
      totalRetailValue,
      lowStockItems,
      outOfStockItems,
      overstockItems,
      averageCostPrice: totalProducts > 0 ? totalCostPrice / totalProducts : 0,
      averageSellingPrice: totalProducts > 0 ? totalSellingPrice / totalProducts : 0,
      inventoryTurnover: 0,
      deadStockValue: 0,
      fastMovingItems: 0,
      slowMovingItems: 0
    });
  };

  const fetchMovements = async () => {
    try {
      console.log('Fetching movements...');
      const response = await inventoryApi.getMovements({ limit: 20 });
      console.log('Movements response:', response);
      
      if (response.success) {
        const movementData = response.data?.movements || response.data || [];
        setMovements(Array.isArray(movementData) ? movementData : []);
      }
    } catch (error) {
      console.error('Failed to fetch movements:', error);
      setMovements([]);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await categoriesApi.getAll();
      console.log('Categories response:', response);
      
      if (response.success && response.data) {
        const categoryList = [
          { value: "all", label: "All Categories" }
        ];
        
        if (Array.isArray(response.data)) {
          response.data.forEach((cat: any) => {
            if (typeof cat === 'string') {
              categoryList.push({ value: cat, label: cat });
            } else if (cat && typeof cat === 'object' && cat.name) {
              categoryList.push({ value: cat.name, label: cat.name });
            }
          });
        }
        
        setCategories(categoryList);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([
        { value: "all", label: "All Categories" },
        { value: "hinges", label: "Hinges & Hardware" },
        { value: "locks", label: "Locks & Security" },
        { value: "handles", label: "Handles & Knobs" },
        { value: "fasteners", label: "Fasteners & Screws" },
        { value: "sliding", label: "Sliding Systems" },
        { value: "tools", label: "Tools & Equipment" }
      ]);
    }
  };

  const fetchUnits = async () => {
    try {
      console.log('Fetching units...');
      const response = await unitsApi.getAll();
      console.log('Units response:', response);
      
      if (response.success && response.data) {
        const unitsList: any[] = [];
        
        if (Array.isArray(response.data)) {
          response.data.forEach((unit: any) => {
            if (typeof unit === 'string') {
              unitsList.push({ value: unit, label: unit });
            } else if (unit && typeof unit === 'object') {
              unitsList.push({ 
                value: unit.name || unit.value, 
                label: unit.label || unit.name || unit.value 
              });
            }
          });
        }
        
        setUnits(unitsList);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
      setUnits([
        { value: "pieces", label: "Pieces" },
        { value: "kg", label: "Kilograms" },
        { value: "meters", label: "Meters" },
        { value: "liters", label: "Liters" },
        { value: "sets", label: "Sets" },
      ]);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      console.log('Fetching products with params:', { page, searchTerm, categoryFilter, statusFilter });
      
      const params: any = {
        page,
        limit: 20,
        status: 'active'
      };
      
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter === 'low') params.lowStock = true;
      if (statusFilter === 'out') params.outOfStock = true;

      const response = await productsApi.getAll(params);
      console.log('Products response:', response);
      
      if (response.success) {
        const productData = response.data.products || response.data || [];
        setProducts(Array.isArray(productData) ? productData : []);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchProducts(page);
    }
  };

  const handleAddProduct = async (formData: any) => {
    try {
      const response = await productsApi.create(formData);
      if (response.success) {
        setIsDialogOpen(false);
        fetchProducts();
        fetchInventoryStats();
        toast({
          title: "Product Added",
          description: "New product has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async (formData: any) => {
    try {
      const response = await productsApi.update(selectedProduct.id, formData);
      if (response.success) {
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        fetchProducts();
        fetchInventoryStats();
        toast({
          title: "Product Updated",
          description: "Product has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const response = await productsApi.delete(id);
      if (response.success) {
        fetchProducts();
        fetchInventoryStats();
        toast({
          title: "Product Deleted",
          description: "Product has been removed from inventory.",
        });
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const handleStockAdjustment = async (formData: any) => {
    if (!selectedProduct) return;

    try {
      const response = await productsApi.adjustStock(selectedProduct.id, formData);
      if (response.success) {
        setIsStockAdjustmentOpen(false);
        setSelectedProduct(null);
        fetchProducts();
        fetchMovements();
        fetchInventoryStats();
        toast({
          title: "Stock Adjusted",
          description: "Stock has been adjusted successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast({
        title: "Error",
        description: "Failed to adjust stock",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await categoriesApi.create({ name: newCategory });
      if (response.success) {
        setNewCategory("");
        setIsCategoryDialogOpen(false);
        fetchCategories();
        toast({
          title: "Category Added",
          description: "New category has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.name.trim() || !newUnit.label.trim()) return;
    
    try {
      const response = await unitsApi.create(newUnit);
      if (response.success) {
        setNewUnit({ name: "", label: "" });
        setIsUnitDialogOpen(false);
        fetchUnits();
        toast({
          title: "Unit Added",
          description: "New unit has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add unit:', error);
      toast({
        title: "Error",
        description: "Failed to add unit",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      hinges: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      locks: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      handles: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      fasteners: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
      sliding: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      tools: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  const getStockStatus = (currentStock: number, minStock: number, maxStock?: number) => {
    if (currentStock === 0) return { status: 'out', color: 'bg-red-500 text-white' };
    if (currentStock <= minStock) return { status: 'low', color: 'bg-orange-500 text-white' };
    if (maxStock && currentStock > maxStock) return { status: 'overstock', color: 'bg-purple-500 text-white' };
    return { status: 'adequate', color: 'bg-green-500 text-white' };
  };

  const lowStockProducts = products.filter(product => product.stock <= product.minStock);

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const { currentPage, totalPages } = pagination;
    const pages = [];

    pages.push(1);

    if (currentPage > 3) {
      pages.push('ellipsis-start');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis-end');
    }

    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(currentPage - 1)}
              className={currentPage <= 1 ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(currentPage + 1)}
              className={currentPage >= totalPages ? "pointer-events-none opacity-50 cursor-not-allowed" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const openFilteredModal = (filterType: 'lowStock' | 'outOfStock' | 'inStock' | 'all', title: string) => {
    setFilteredProductsModal({
      open: true,
      title,
      filterType
    });
  };

  const openProductDetails = (product: any) => {
    setProductDetailsModal({
      open: true,
      product
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Complete inventory control and product management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCategory} className="flex-1">Add Category</Button>
                  <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Unit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unitName">Unit Name</Label>
                  <Input
                    id="unitName"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({...newUnit, name: e.target.value})}
                    placeholder="e.g., kg, pieces"
                  />
                </div>
                <div>
                  <Label htmlFor="unitLabel">Unit Label</Label>
                  <Input
                    id="unitLabel"
                    value={newUnit.label}
                    onChange={(e) => setNewUnit({...newUnit, label: e.target.value})}
                    placeholder="e.g., Kilograms, Pieces"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddUnit} className="flex-1">Add Unit</Button>
                  <Button variant="outline" onClick={() => setIsUnitDialogOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <ProductDialog 
              onSubmit={handleAddProduct} 
              onClose={() => setIsDialogOpen(false)} 
              categories={categories} 
              units={units}
            />
          </Dialog>
        </div>
      </div>

      {/* Enhanced Inventory Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryStats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value (Cost)</p>
                <p className="text-2xl font-bold text-green-600">PKR {inventoryStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Retail Value</p>
                <p className="text-2xl font-bold text-purple-600">PKR {inventoryStats.totalRetailValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Stock Alerts</p>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems + inventoryStats.outOfStockItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Cost Price</p>
              <p className="text-lg font-bold text-foreground">PKR {inventoryStats.averageCostPrice.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Selling Price</p>
              <p className="text-lg font-bold text-foreground">PKR {inventoryStats.averageSellingPrice.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-lg font-bold text-orange-600">{inventoryStats.lowStockItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-lg font-bold text-red-600">{inventoryStats.outOfStockItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Overstock Items</p>
              <p className="text-lg font-bold text-purple-600">{inventoryStats.overstockItems}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Potential Profit</p>
              <p className="text-lg font-bold text-green-600">PKR {(inventoryStats.totalRetailValue - inventoryStats.totalValue).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products & Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>
                Product Inventory 
                {pagination.totalItems > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({pagination.totalItems} total items)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-muted-foreground">Loading...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-muted-foreground">No products found</div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product.stock || 0, product.minStock || 0, product.maxStock);
                      const costValue = (product.costPrice || 0) * (product.stock || 0);
                      const retailValue = (product.price || 0) * (product.stock || 0);
                      
                      return (
                        <Card key={product.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-medium text-foreground text-sm">{product.name}</h3>
                                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge className={`text-xs ${getCategoryColor(product.category)}`}>
                                    {product.category}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openProductDetails(product)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Cost:</span>
                                  <p className="font-medium">PKR {product.costPrice?.toLocaleString() || '0'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Sell:</span>
                                  <p className="font-medium text-green-600">PKR {product.price?.toLocaleString() || '0'}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-muted-foreground">Stock Value:</span>
                                  <p className="font-medium">PKR {costValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Retail Value:</span>
                                  <p className="font-medium text-green-600">PKR {retailValue.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <Badge variant={stockStatus.status === 'out' ? "destructive" : stockStatus.status === 'low' ? "secondary" : "default"} className={stockStatus.color}>
                                  {product.stock || 0} {product.unit}s
                                </Badge>
                                {(product.stock || 0) <= (product.minStock || 0) && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="flex-1 text-xs"
                                  onClick={() => openEditDialog(product)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setIsStockAdjustmentOpen(true);
                                  }}
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Adjust
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                      {renderPagination()}
                    </div>
                  )}

                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} products
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No stock movements found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          movement.type === 'sale' ? 'bg-red-100 text-red-600' :
                          movement.type === 'purchase' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{movement.productName}</p>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          <p className="text-xs text-muted-foreground">{movement.createdAt}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </p>
                        <p className="text-sm text-muted-foreground">Balance: {movement.balanceAfter}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Healthy Stock:</span>
                    <span className="font-bold text-green-600">{inventoryStats.totalProducts - inventoryStats.lowStockItems - inventoryStats.outOfStockItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Low Stock:</span>
                    <span className="font-bold text-orange-600">{inventoryStats.lowStockItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Out of Stock:</span>
                    <span className="font-bold text-red-600">{inventoryStats.outOfStockItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overstocked:</span>
                    <span className="font-bold text-purple-600">{inventoryStats.overstockItems}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Investment:</span>
                    <span className="font-bold">PKR {inventoryStats.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential Revenue:</span>
                    <span className="font-bold text-green-600">PKR {inventoryStats.totalRetailValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential Profit:</span>
                    <span className="font-bold text-blue-600">PKR {(inventoryStats.totalRetailValue - inventoryStats.totalValue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit Margin:</span>
                    <span className="font-bold text-purple-600">
                      {inventoryStats.totalRetailValue > 0 ? (((inventoryStats.totalRetailValue - inventoryStats.totalValue) / inventoryStats.totalRetailValue) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Categories:</span>
                    <span className="font-bold">{categories.length - 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Product Value:</span>
                    <span className="font-bold">PKR {inventoryStats.totalProducts > 0 ? (inventoryStats.totalValue / inventoryStats.totalProducts).toFixed(2) : '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stock Efficiency:</span>
                    <span className="font-bold text-blue-600">
                      {inventoryStats.totalProducts > 0 ? (((inventoryStats.totalProducts - inventoryStats.outOfStockItems) / inventoryStats.totalProducts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alert Ratio:</span>
                    <span className="font-bold text-orange-600">
                      {inventoryStats.totalProducts > 0 ? (((inventoryStats.lowStockItems + inventoryStats.outOfStockItems) / inventoryStats.totalProducts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <ProductDialog 
            onSubmit={handleEditProduct} 
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedProduct(null);
            }}
            categories={categories}
            units={units}
            initialData={selectedProduct}
            isEdit={true}
          />
        </Dialog>
      )}

      {selectedProduct && (
        <Dialog open={isStockAdjustmentOpen} onOpenChange={setIsStockAdjustmentOpen}>
          <StockAdjustmentDialog
            product={selectedProduct}
            onSubmit={handleStockAdjustment}
            onClose={() => {
              setIsStockAdjustmentOpen(false);
              setSelectedProduct(null);
            }}
          />
        </Dialog>
      )}

      <FilteredProductsModal
        open={filteredProductsModal.open}
        onOpenChange={(open) => setFilteredProductsModal(prev => ({ ...prev, open }))}
        title={filteredProductsModal.title}
        products={products}
        filterType={filteredProductsModal.filterType}
      />

      <ProductDetailsModal
        open={productDetailsModal.open}
        onOpenChange={(open) => setProductDetailsModal(prev => ({ ...prev, open }))}
        product={productDetailsModal.product}
      />
    </div>
  );
};

const ProductDialog = ({ 
  onSubmit, 
  onClose, 
  categories, 
  units,
  initialData = null, 
  isEdit = false 
}: { 
  onSubmit: (data: any) => void; 
  onClose: () => void; 
  categories: any[];
  units: any[];
  initialData?: any;
  isEdit?: boolean;
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    price: initialData?.price?.toString() || "",
    stock: initialData?.stock?.toString() || "",
    category: initialData?.category || "",
    unit: initialData?.unit || "",
    minStock: initialData?.minStock?.toString() || "",
    description: initialData?.description || "",
    costPrice: initialData?.costPrice?.toString() || "",
    maxStock: initialData?.maxStock?.toString() || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      costPrice: parseFloat(formData.costPrice),
      maxStock: parseInt(formData.maxStock)
    };
    onSubmit(submitData);
    if (!isEdit) {
      setFormData({ 
        name: "", sku: "", price: "", stock: "", category: "", 
        unit: "", minStock: "", description: "", costPrice: "", maxStock: "" 
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-generate SKU when name changes (only for new products)
      if (field === 'name' && !isEdit) {
        newData.sku = generateSKU(value);
      }
      
      return newData;
    });
  };

  const handleRegenerateSKU = () => {
    if (formData.name) {
      setFormData(prev => ({
        ...prev,
        sku: generateSKU(prev.name)
      }));
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="sku">SKU {!isEdit && '(Auto-generated)'}</Label>
            <div className="flex gap-1">
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder={isEdit ? "Enter SKU" : "Auto-generated from name"}
                required
                className="flex-1"
              />
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateSKU}
                  disabled={!formData.name}
                  className="px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="price">Price (PKR)</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="costPrice">Cost Price (PKR)</Label>
            <Input
              id="costPrice"
              type="number"
              value={formData.costPrice}
              onChange={(e) => handleInputChange('costPrice', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="stock">Stock Quantity</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="minStock">Minimum Stock</Label>
            <Input
              id="minStock"
              type="number"
              value={formData.minStock}
              onChange={(e) => handleInputChange('minStock', e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(cat => cat.value !== "all").map((category) => (
                  <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.value || unit.name} value={unit.value || unit.name}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {isEdit ? 'Update Product' : 'Add Product'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
};

const StockAdjustmentDialog = ({ 
  product, 
  onSubmit, 
  onClose 
}: { 
  product: any; 
  onSubmit: (data: any) => void; 
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    type: "adjustment",
    quantity: "",
    reason: "",
    reference: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      quantity: parseInt(formData.quantity)
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Stock Adjustment - {product.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="type">Adjustment Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adjustment">Stock Adjustment</SelectItem>
              <SelectItem value="restock">Restock</SelectItem>
              <SelectItem value="damage">Damage</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity ({product.unit})</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            placeholder="Enter quantity (+ for increase, - for decrease)"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Current stock: {product.stock || 0} {product.unit}
          </p>
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            placeholder="Reason for adjustment"
            required
          />
        </div>

        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData({...formData, reference: e.target.value})}
            placeholder="Reference number (optional)"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">Adjust Stock</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default Products;
