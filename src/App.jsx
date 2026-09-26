import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// ===============================
// Authentication / Public Pages
// ===============================
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateBusiness from "./pages/CreateBusiness";

// ===============================
// Owner Education / Marketing Pages
// ===============================
import BusinessBenefits from "./pages/BusinessBenefits";
import HowItWorks from "./pages/HowItWorks";
import BusinessGuide from "./pages/BusinessGuide";

// ===============================
// Main Dashboard
// ===============================
import Dashboard from "./pages/Dashboard";

// ===============================
// Expenses
// ===============================
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Expenses from "./pages/Expenses";

// ===============================
// AI Receipt
// ===============================
import UploadReceipt from "./pages/UploadReceipt";
import Receipts from "./pages/Receipts";
import ReviewReceipt from "./pages/ReviewReceipt";

// ===============================
// Reports
// ===============================
import Reports from "./pages/Reports";

// ===============================
// Profile / Business
// ===============================
import Profile from "./pages/Profile";
import EditBusiness from "./pages/EditBusiness";

// ===============================
// Shop Designer
// ===============================
import ShopDesigner from "./pages/ShopDesigner";
import CreateLayout from "./pages/CreateLayout";

// ===============================
// Categories
// ===============================
import Categories from "./pages/Categories";
import AddCategory from "./pages/AddCategory";
import EditCategory from "./pages/EditCategory";

// ===============================
// Products
// ===============================
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";

// ===============================
// Customers
// ===============================
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";

// ===============================
// Billing / Sales
// ===============================
import BillingPOS from "./pages/BillingPOS";
import SalesHistory from "./pages/SalesHistory";
import Invoice from "./pages/Invoice";

// ===============================
// Suppliers
// ===============================
import Suppliers from "./pages/Suppliers";
import AddSupplier from "./pages/AddSupplier";
import ViewSupplier from "./pages/ViewSupplier";
import EditSupplier from "./pages/EditSupplier";

// ===============================
// Purchases
// ===============================
import Purchase from "./pages/Purchase";
import AddPurchase from "./pages/AddPurchase";
import PurchaseDetails from "./pages/PurchaseDetails";
import EditPurchase from "./pages/EditPurchase";

// ===============================
// QR Ordering
// ===============================
import QROrdering from "./pages/QROrdering";
import QROrders from "./pages/QROrders";
import PublicQRMenu from "./pages/PublicQRMenu";

// ===============================
// Admin
// ===============================
import AdminDashboard from "./pages/admin/AdminDashboard";

// ===============================
// AI Business
// ===============================
import AIBusiness from "./pages/AIBusiness";

// ===============================
// 404
// ===============================
import NotFound from "./pages/NotFound";


function App() {
    return (
        <Routes>

            {/* =====================================================
                PUBLIC ROUTES
                These pages can be viewed without login.
               ===================================================== */}

            {/* Login */}
            <Route
                path="/"
                element={<Login />}
            />

            <Route
                path="/login"
                element={<Login />}
            />

            {/* Registration */}
            <Route
                path="/register"
                element={<Register />}
            />

            {/* =====================================================
                OWNER EDUCATION / PRODUCT INFORMATION
                These are intentionally public.
               ===================================================== */}

            {/* Why should an owner use FinancePro? */}
            <Route
                path="/business-benefits"
                element={<BusinessBenefits />}
            />

            {/* How does FinancePro work? */}
            <Route
                path="/how-it-works"
                element={<HowItWorks />}
            />

            {/* What can an owner manage? */}
            <Route
                path="/business-guide"
                element={<BusinessGuide />}
            />

            {/* =====================================================
                BUSINESS CREATION
                New users can create their business before entering
                the protected application.
               ===================================================== */}

            <Route
                path="/create-business"
                element={<CreateBusiness />}
            />


            {/* =====================================================
                QR ORDERING
               ===================================================== */}

            <Route
                path="/qr-ordering"
                element={<QROrdering />}
            />

            <Route
                path="/qr-orders"
                element={<QROrders />}
            />

            {/* Public customer QR menu */}
            <Route
                path="/qr/:token"
                element={<PublicQRMenu />}
            />


            {/* =====================================================
                AI BUSINESS
               ===================================================== */}

            <Route
                path="/ai-business"
                element={<AIBusiness />}
            />


            {/* =====================================================
                ADMIN ROUTES
                Protected separately using AdminRoute.
               ===================================================== */}

            <Route element={<AdminRoute />}>

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />

            </Route>


            {/* =====================================================
                PROTECTED BUSINESS ROUTES
                Login required.
               ===================================================== */}

            <Route element={<ProtectedRoute />}>

                {/* ============================
                    Dashboard
                   ============================ */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />


                {/* ============================
                    Expenses
                   ============================ */}

                <Route
                    path="/add-expense"
                    element={<AddExpense />}
                />

                <Route
                    path="/edit-expense/:id"
                    element={<EditExpense />}
                />

                <Route
                    path="/expenses"
                    element={<Expenses />}
                />


                {/* ============================
                    AI Receipt
                   ============================ */}

                <Route
                    path="/upload"
                    element={<UploadReceipt />}
                />

                <Route
                    path="/receipts"
                    element={<Receipts />}
                />

                <Route
                    path="/review-receipt/:receiptId"
                    element={<ReviewReceipt />}
                />


                {/* ============================
                    Reports
                   ============================ */}

                <Route
                    path="/reports"
                    element={<Reports />}
                />


                {/* ============================
                    Profile
                   ============================ */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* ============================
                    Business Settings
                   ============================ */}

                <Route
                    path="/edit-business"
                    element={<EditBusiness />}
                />


                {/* ============================
                    Shop Designer
                   ============================ */}

                <Route
                    path="/shop-designer"
                    element={<ShopDesigner />}
                />

                <Route
                    path="/create-layout"
                    element={<CreateLayout />}
                />


                {/* ============================
                    Categories
                   ============================ */}

                <Route
                    path="/categories"
                    element={<Categories />}
                />

                <Route
                    path="/add-category"
                    element={<AddCategory />}
                />

                <Route
                    path="/edit-category/:id"
                    element={<EditCategory />}
                />


                {/* ============================
                    Products
                   ============================ */}

                <Route
                    path="/products"
                    element={<Products />}
                />

                <Route
                    path="/add-product"
                    element={<AddProduct />}
                />

                <Route
                    path="/edit-product/:id"
                    element={<EditProduct />}
                />


                {/* ============================
                    Customers
                   ============================ */}

                <Route
                    path="/customers"
                    element={<Customers />}
                />

                <Route
                    path="/customers/:id"
                    element={<CustomerDetails />}
                />


                {/* ============================
                    Billing POS
                   ============================ */}

                <Route
                    path="/billing-pos"
                    element={<BillingPOS />}
                />


                {/* ============================
                    Sales
                   ============================ */}

                <Route
                    path="/sales"
                    element={<SalesHistory />}
                />

                <Route
                    path="/invoice/:id"
                    element={<Invoice />}
                />


                {/* ============================
                    Suppliers
                   ============================ */}

                <Route
                    path="/suppliers"
                    element={<Suppliers />}
                />

                <Route
                    path="/add-supplier"
                    element={<AddSupplier />}
                />

                <Route
                    path="/supplier/:id"
                    element={<ViewSupplier />}
                />

                <Route
                    path="/edit-supplier/:id"
                    element={<EditSupplier />}
                />


                {/* ============================
                    Purchases
                   ============================ */}

                <Route
                    path="/purchases"
                    element={<Purchase />}
                />

                <Route
                    path="/add-purchase"
                    element={<AddPurchase />}
                />

                <Route
                    path="/purchase/:id"
                    element={<PurchaseDetails />}
                />

                <Route
                    path="/edit-purchase/:id"
                    element={<EditPurchase />}
                />

            </Route>


            {/* =====================================================
                404
               ===================================================== */}

            <Route
                path="*"
                element={<NotFound />}
            />

        </Routes>
    );
}

export default App;