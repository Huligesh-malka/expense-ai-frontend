import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import UploadReceipt from "./pages/UploadReceipt";
import Receipts from "./pages/Receipts";
import Reports from "./pages/Reports";
import EditExpense from "./pages/EditExpense";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Expenses from "./pages/Expenses";
import ShopDesigner from "./pages/ShopDesigner";
import ReviewReceipt from "./pages/ReviewReceipt";
import EditBusiness from './pages/EditBusiness';
import CreateBusiness from "./pages/CreateBusiness";
import SalesHistory from "./pages/SalesHistory";
import CreateLayout from "./pages/CreateLayout";
import CustomerDetails from "./pages/CustomerDetails";
import Purchase from "./pages/Purchase";
import AddPurchase from "./pages/AddPurchase";
import PurchaseDetails from "./pages/PurchaseDetails";
import Categories from "./pages/Categories";
import AddCategory from "./pages/AddCategory";
import EditCategory from "./pages/EditCategory";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import EditProduct from "./pages/EditProduct";
import Invoice from "./pages/Invoice";
import Suppliers from "./pages/Suppliers";
import AddSupplier from "./pages/AddSupplier";
import ViewSupplier from "./pages/ViewSupplier";
import EditSupplier from "./pages/EditSupplier";
import EditPurchase from "./pages/EditPurchase";
import AddProduct from "./pages/AddProduct";
import BillingPOS from "./pages/BillingPOS";


import QROrdering from "./pages/QROrdering";
import QROrders from "./pages/QROrders";
import PublicQRMenu from "./pages/PublicQRMenu";


import AdminDashboard from "./pages/admin/AdminDashboard";
import AIBusiness from "./pages/AIBusiness";
function App() {
    return (
        <Routes>
            {/* Public Routes - Authentication */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public Route - Business Creation (for new users) */}
            <Route path="/create-business" element={<CreateBusiness />} />



            <Route
    path="/qr-ordering"
    element={<QROrdering />}
/>

<Route
    path="/qr-orders"
    element={<QROrders />}
/>

<Route
    path="/qr/:token"
    element={<PublicQRMenu />}
/>

<Route element={<AdminRoute />}>
    <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
    />
</Route>



<Route
    path="/ai-business"
    element={<AIBusiness />}
/>





            {/* Protected Routes - All business pages */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />

             

                {/* Expenses */}
                <Route path="/add-expense" element={<AddExpense />} />
                <Route path="/edit-expense/:id" element={<EditExpense />} />
                <Route path="/expenses" element={<Expenses />} />

                {/* AI Receipt */}
                <Route path="/upload" element={<UploadReceipt />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/review-receipt/:receiptId" element={<ReviewReceipt />} />

                {/* Reports */}
                <Route path="/reports" element={<Reports />} />

                {/* Profile */}
                <Route path="/profile" element={<Profile />} />

                {/* Shop Designer */}
                <Route path="/shop-designer" element={<ShopDesigner />} />
                <Route path="/edit-business" element={<EditBusiness />} />
                <Route path="/create-layout" element={<CreateLayout />} />

                {/* Categories */}
                <Route path="/categories" element={<Categories />} />
                <Route path="/add-category" element={<AddCategory />} />
                <Route path="/edit-category/:id" element={<EditCategory />} />

                {/* Products */}
                <Route path="/products" element={<Products />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/edit-product/:id" element={<EditProduct />} />

                {/* Customers */}
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetails />} />

                {/* Billing POS */}
                <Route path="/billing-pos" element={<BillingPOS />} />

                {/* Sales */}
                <Route path="/sales" element={<SalesHistory />} />
                <Route path="/invoice/:id" element={<Invoice />} />

                {/* Suppliers */}
                <Route path="/suppliers" element={<Suppliers />} />
                <Route path="/add-supplier" element={<AddSupplier />} />
                <Route path="/supplier/:id" element={<ViewSupplier />} />
                <Route path="/edit-supplier/:id" element={<EditSupplier />} />

                {/* Purchases */}
                <Route path="/purchases" element={<Purchase />} />
                <Route path="/add-purchase" element={<AddPurchase />} />
                <Route path="/purchase/:id" element={<PurchaseDetails />} />
                <Route path="/edit-purchase/:id" element={<EditPurchase />} />
            </Route>

            {/* 404 - Not Found */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;