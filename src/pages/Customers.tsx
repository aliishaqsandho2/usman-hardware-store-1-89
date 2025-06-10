import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Users, Search, Plus, Edit, CreditCard, Phone, MapPin, Calendar, Mail, Building, IdCard, Receipt, History, AlertCircle, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customersApi } from "@/services/api";
import { CustomerEditModal } from "@/components/customers/CustomerEditModal";

const Customers = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // NEW: States for customer edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<any>(null);

  const customerTypes = [
    { value: "all", label: "All Customers" },
    { value: "individual", label: "Individual" },
    { value: "business", label: "Business" },
  ];

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, customerTypeFilter]);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 20,
        status: 'active'
      };
      
      if (searchTerm) params.search = searchTerm;
      if (customerTypeFilter !== 'all') params.type = customerTypeFilter;

      const response = await customersApi.getAll(params);
      
      if (response.success) {
        const customerData = response.data?.customers || response.data || [];
        console.log('Customers response:', response.data);
        
        // Ensure we're working with an array
        const customersArray = Array.isArray(customerData) ? customerData : [];
        setCustomers(customersArray);
        
        // Update pagination if available
        if (response.data?.pagination) {
          setPagination(response.data.pagination);
        } else {
          // Set basic pagination info if not provided
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalItems: customersArray.length,
            itemsPerPage: 20
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (formData: any) => {
    try {
      const response = await customersApi.create(formData);
      if (response.success) {
        setIsDialogOpen(false);
        fetchCustomers();
        toast({
          title: "Customer Added",
          description: "New customer has been added successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to add customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCustomer = async (customerId: number, formData: any) => {
    try {
      const response = await customersApi.update(customerId, formData);
      if (response.success) {
        fetchCustomers();
        toast({
          title: "Customer Updated",
          description: "Customer has been updated successfully.",
        });
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive"
      });
    }
  };

  // NEW: Handle edit customer
  const handleEditCustomer = (customer: any) => {
    setCustomerToEdit(customer);
    setIsEditModalOpen(true);
  };

  // NEW: Handle customer updated
  const handleCustomerUpdated = () => {
    fetchCustomers();
    setIsEditModalOpen(false);
    setCustomerToEdit(null);
  };

  // NEW: Handle customer deleted
  const handleCustomerDeleted = () => {
    fetchCustomers();
    setIsEditModalOpen(false);
    setCustomerToEdit(null);
  };

  const filteredCustomers = customers.filter(customer => {
    if (!customer) return false;
    
    const matchesSearch = customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = customerTypeFilter === "all" || customer.type === customerTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalDues = customers.reduce((sum, customer) => sum + (customer.currentBalance || customer.dueAmount || 0), 0);
  const activeCustomers = customers.filter(c => c.status === "active" || !c.status).length;
  const customersWithDues = customers.filter(c => (c.currentBalance || c.dueAmount || 0) > 0).length;

  const getCustomerTypeColor = (type: string) => {
    const colors = {
      individual: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      business: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    };
    return colors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
  };

  const getStatusColor = (status: string) => {
    return status === "active" || !status ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Loading customers...</div>
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
            <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
            <p className="text-muted-foreground">Manage customer profiles, dues, and transactions</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <CustomerDialog onSubmit={handleAddCustomer} onClose={() => setIsDialogOpen(false)} />
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Dues</p>
                <p className="text-2xl font-bold text-red-600">PKR {totalDues.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Customers with Dues</p>
                <p className="text-2xl font-bold text-orange-600">{customersWithDues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8">
              <div className="text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No customers found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg text-foreground">{customer.name}</CardTitle>
                      <Badge className={`text-xs ${getCustomerTypeColor(customer.type || 'individual')}`}>
                        {customer.type || 'individual'}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(customer.status)}`}>
                        {customer.status || 'active'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      {customer.phone}
                    </div>
                  </div>
                  {(customer.currentBalance || customer.dueAmount || 0) > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      Due: PKR {(customer.currentBalance || customer.dueAmount)?.toLocaleString()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{customer.address || 'Address not provided'}</span>
                </div>

                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Purchases</p>
                    <p className="font-bold text-green-600">PKR {customer.totalPurchases?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Credit Limit</p>
                    <p className="font-medium text-foreground">PKR {customer.creditLimit?.toLocaleString() || '0'}</p>
                  </div>
                </div>

                {customer.lastPurchase && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last purchase: {customer.lastPurchase}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <CustomerDetailsDialog
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onUpdate={handleUpdateCustomer}
        />
      )}

      {/* Customer Edit Modal */}
      {customerToEdit && (
        <CustomerEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          customer={customerToEdit}
          onCustomerUpdated={handleCustomerUpdated}
          onCustomerDeleted={handleCustomerDeleted}
        />
      )}
    </div>
  );
};

// Customer Dialog Component
const CustomerDialog = ({ onSubmit, onClose }: { onSubmit: (data: any) => void; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    name: "", 
    phone: "", 
    email: "", 
    address: "", 
    city: "",
    type: "individual",
    creditLimit: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      creditLimit: parseFloat(formData.creditLimit) || 0
    });
    setFormData({ 
      name: "", phone: "", email: "", address: "", city: "", type: "individual", creditLimit: "" 
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Add New Customer</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="type">Customer Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="creditLimit">Credit Limit (PKR)</Label>
          <Input
            id="creditLimit"
            type="number"
            value={formData.creditLimit}
            onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">Add Customer</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </DialogContent>
  );
};

// Customer Details Dialog Component
const CustomerDetailsDialog = ({ 
  customer, 
  onClose, 
  onUpdate 
}: { 
  customer: any; 
  onClose: () => void; 
  onUpdate: (id: number, data: any) => void;
}) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer.name} - Customer Details</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Information</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Contact Information</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Phone:</strong> {customer.phone}</p>
                    <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                    <p><strong>Address:</strong> {customer.address}</p>
                    <p><strong>City:</strong> {customer.city}</p>
                    <p><strong>Type:</strong> {customer.type}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Account Summary</Label>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><strong>Total Purchases:</strong> PKR {customer.totalPurchases?.toLocaleString() || '0'}</p>
                    <p><strong>Credit Limit:</strong> PKR {customer.creditLimit?.toLocaleString() || '0'}</p>
                    <p><strong>Outstanding Amount:</strong> <span className="text-red-600 font-bold">PKR {(customer.currentBalance || customer.dueAmount || 0)?.toLocaleString()}</span></p>
                    <p><strong>Available Credit:</strong> PKR {((customer.creditLimit || 0) - (customer.currentBalance || customer.dueAmount || 0)).toLocaleString()}</p>
                    <p><strong>Last Purchase:</strong> {customer.lastPurchase || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default Customers;
