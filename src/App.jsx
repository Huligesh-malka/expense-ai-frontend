import { Routes, Route } from "react-router-dom";

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

function App() {
    return (
        <Routes>
            {/* Authentication */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Expense */}
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/edit-expense/:id" element={<EditExpense />} />

            {/* Business */}
            <Route path="/create-business" element={<CreateBusiness />} />

            {/* Categories */}
            <Route path="/categories" element={<Categories />} />
            <Route path="/add-category" element={<AddCategory />} />
            <Route path="/edit-category/:id" element={<EditCategory />} />

            <Route path="/review-receipt/:receiptId" element={<ReviewReceipt />} />

            <Route path="/expenses" element={<Expenses />} />

            {/* AI Receipt */}
            <Route path="/upload" element={<UploadReceipt />} />

            {/* Receipts */}
            <Route path="/receipts" element={<Receipts />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
            <Route
path="/shop-designer"
element={<ShopDesigner />}
/>

            <Route
    path="/create-layout"
    element={<CreateLayout />}
/>

            {/* Products */}
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/products" element={<Products />} />

            {/* Customers */}
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/customers" element={<Customers />} />

            {/* Billing POS */}
            <Route path="/billing-pos" element={<BillingPOS />} />

            {/* Sales */}
            <Route path="/sales" element={<SalesHistory />} />

            {/* Invoice */}
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
        </Routes>
    );
}

export default App;