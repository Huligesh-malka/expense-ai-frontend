import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function BillingPOS() {
    const navigate = useNavigate();
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [discount, setDiscount] = useState(0);
    const [gst, setGst] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState("pcs");
    const [availableUnits, setAvailableUnits] = useState(["pcs"]);
    const barcodeRef = useRef(null);

    useEffect(() => {
        loadProducts();
        // Focus barcode input on mount
        if (barcodeRef.current) {
            barcodeRef.current.focus();
        }
    }, []);

    const loadProducts = async () => {
        try {
            // ✅ FIXED: No business_id needed - backend gets from token
            const res = await API.get("/products");
            setProducts(res.data.data || []);
        } catch (err) {
            console.error("Error loading products:", err);
            setMessage("Couldn't load products");
            setMessageType("error");
        }
    };

    // ─── BARCODE SCANNING ─────────────────────────────────────
    const handleBarcodeScan = async () => {
        if (!barcodeInput.trim()) {
            setMessage("Please scan or enter a barcode");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            // ✅ FIXED: No business_id needed
            const res = await API.get(`/products/barcode/${barcodeInput.trim()}`);
            
            if (res.data.data) {
                const product = res.data.data;
                // Check if product is already in cart
                const existingItem = cart.find(item => item.id === product.id);
                if (existingItem) {
                    // Update quantity
                    updateCartQuantity(product.id, existingItem.quantity + 1);
                } else {
                    // Add to cart with default quantity 1
                    addToCart(product, 1);
                }
                setBarcodeInput("");
                setMessage(`Added: ${product.product_name}`);
                setMessageType("success");
                setTimeout(() => setMessage(""), 2000);
            }
        } catch (err) {
            console.error("Error scanning barcode:", err);
            setMessage("Product not found");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    // ─── ADD TO CART ──────────────────────────────────────────
    const addToCart = (product, qty = 1) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            updateCartQuantity(product.id, existingItem.quantity + qty);
        } else {
            setCart([...cart, {
                ...product,
                quantity: qty,
                entered_unit: product.unit || "pcs"
            }]);
        }
    };

    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.id !== productId));
            return;
        }
        setCart(cart.map(item => 
            item.id === productId ? { ...item, quantity: newQuantity } : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    // ─── PRODUCT SEARCH ──────────────────────────────────────
    const handleProductSearch = () => {
        if (!search.trim()) return;
        
        const found = products.find(p => 
            p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
            p.product_code?.toLowerCase().includes(search.toLowerCase())
        );
        
        if (found) {
            setSelectedProduct(found);
            setQuantity(1);
            setUnit(found.unit || "pcs");
            setAvailableUnits(found.available_units || [found.unit || "pcs"]);
            setShowProductModal(true);
            setSearch("");
        } else {
            setMessage("Product not found");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    // ─── CUSTOMER LOOKUP ──────────────────────────────────────
    const handleCustomerLookup = async () => {
        if (!customerPhone) return;
        
        try {
            // ✅ FIXED: No business_id needed
            const res = await API.get(`/customers?phone=${customerPhone}`);
            if (res.data.data && res.data.data.length > 0) {
                const customer = res.data.data[0];
                setCustomerId(customer.id);
                setCustomerName(customer.name);
                setMessage(`Customer found: ${customer.name}`);
                setMessageType("success");
                setTimeout(() => setMessage(""), 2000);
            } else {
                // Auto-create new customer
                setCustomerId("");
                setMessage("New customer will be created");
                setMessageType("info");
                setTimeout(() => setMessage(""), 2000);
            }
        } catch (err) {
            console.error("Error looking up customer:", err);
            setMessage("Couldn't lookup customer");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
        }
    };

    // ─── CHECKOUT ─────────────────────────────────────────────
    const handleCheckout = async () => {
        if (cart.length === 0) {
            setMessage("Cart is empty");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        setLoading(true);
        
        try {
            // ✅ FIXED: Removed business_id from payload
            const payload = {
                customer_id: customerId || null,
                customer_name: customerName || "Walk-in Customer",
                customer_phone: customerPhone || null,
                payment_method: paymentMethod,
                payment_status: "Paid",
                discount: Number(discount) || 0,
                gst: Number(gst) || 0,
                items: cart.map((item) => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    entered_unit: item.entered_unit || item.unit || "pcs",
                })),
            };

            const res = await API.post("/sales/create", payload);
            
            if (res.data.success) {
                setMessage("Sale completed successfully!");
                setMessageType("success");
                setCart([]);
                setCustomerId("");
                setCustomerName("");
                setCustomerPhone("");
                setDiscount(0);
                setGst(0);
                
                // Navigate to invoice
                setTimeout(() => {
                    navigate(`/invoice/${res.data.data.id}`);
                }, 1500);
            }
        } catch (err) {
            console.error("Error creating sale:", err);
            setMessage(err.response?.data?.message || "Couldn't complete sale");
            setMessageType("error");
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    // ─── CALCULATIONS ─────────────────────────────────────────
    const calculateTotals = () => {
        let subtotal = 0;
        let totalItems = 0;
        
        cart.forEach(item => {
            subtotal += (item.selling_price || 0) * item.quantity;
            totalItems += item.quantity;
        });

        const discountAmount = (subtotal * (discount || 0)) / 100;
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = (taxableAmount * (gst || 0)) / 100;
        const total = taxableAmount + taxAmount;

        return { subtotal, discountAmount, taxableAmount, taxAmount, total, totalItems };
    };

    const totals = calculateTotals();

    // ─── RENDER ────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.title}>🧾 Billing POS</h1>
                    <div style={styles.headerStats}>
                        <span style={styles.headerStat}>
                            Items: <strong>{totals.totalItems}</strong>
                        </span>
                        <span style={styles.headerStat}>
                            Total: <strong>₹{totals.total.toFixed(2)}</strong>
                        </span>
                    </div>
                </div>

                {message && (
                    <div style={{
                        ...styles.message,
                        ...(messageType === "success" ? styles.successMessage : 
                           messageType === "error" ? styles.errorMessage : 
                           styles.infoMessage),
                    }}>
                        {message}
                    </div>
                )}

                {/* ─── SCANNING / SEARCH ─────────────────────── */}
                <div style={styles.scanSection}>
                    <div style={styles.scanRow}>
                        <input
                            ref={barcodeRef}
                            placeholder="Scan barcode or enter manually…"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleBarcodeScan()}
                            style={styles.barcodeInput}
                        />
                        <button style={styles.scanButton} onClick={handleBarcodeScan}>
                            Add
                        </button>
                    </div>
                    
                    <div style={styles.searchRow}>
                        <input
                            placeholder="Search product by name or code…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleProductSearch()}
                            style={styles.searchInput}
                        />
                        <button style={styles.searchButton} onClick={handleProductSearch}>
                            Search
                        </button>
                    </div>
                </div>

                {/* ─── CUSTOMER SECTION ──────────────────────── */}
                <div style={styles.customerSection}>
                    <h3 style={styles.sectionTitle}>Customer</h3>
                    <div style={styles.customerRow}>
                        <input
                            placeholder="Phone number"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            style={styles.customerInput}
                        />
                        <button style={styles.lookupButton} onClick={handleCustomerLookup}>
                            Lookup
                        </button>
                        <input
                            placeholder="Customer name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            style={{ ...styles.customerInput, flex: 2 }}
                        />
                    </div>
                </div>

                {/* ─── CART ────────────────────────────────────── */}
                <div style={styles.cartSection}>
                    <h3 style={styles.sectionTitle}>
                        Cart ({cart.length} items)
                    </h3>
                    
                    {cart.length === 0 ? (
                        <div style={styles.emptyCart}>
                            <p>No items in cart</p>
                            <p style={styles.emptyCartSub}>Scan a barcode or search for products</p>
                        </div>
                    ) : (
                        <>
                            <div style={styles.tableWrapper}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Product</th>
                                            <th style={styles.th}>Price</th>
                                            <th style={styles.th}>Qty</th>
                                            <th style={styles.th}>Unit</th>
                                            <th style={styles.th}>Total</th>
                                            <th style={styles.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cart.map((item) => (
                                            <tr key={item.id} style={styles.tableRow}>
                                                <td style={styles.td}>
                                                    <div style={styles.productName}>{item.product_name}</div>
                                                    <div style={styles.productCode}>{item.product_code}</div>
                                                </td>
                                                <td style={styles.td}>₹{item.selling_price?.toFixed(2)}</td>
                                                <td style={styles.td}>
                                                    <div style={styles.qtyControls}>
                                                        <button
                                                            style={styles.qtyButton}
                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={styles.qtyValue}>{item.quantity}</span>
                                                        <button
                                                            style={styles.qtyButton}
                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={styles.unitTag}>
                                                        {item.entered_unit || item.unit || "pcs"}
                                                    </span>
                                                </td>
                                                <td style={styles.td}>
                                                    ₹{(item.selling_price * item.quantity).toFixed(2)}
                                                </td>
                                                <td style={styles.td}>
                                                    <button
                                                        style={styles.removeButton}
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ─── TOTALS ────────────────────────── */}
                            <div style={styles.totalsSection}>
                                <div style={styles.totalsRow}>
                                    <span>Subtotal:</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                {discount > 0 && (
                                    <div style={styles.totalsRow}>
                                        <span>Discount ({discount}%):</span>
                                        <span style={styles.discountAmount}>-₹{totals.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={styles.totalsRow}>
                                    <span>Taxable Amount:</span>
                                    <span>₹{totals.taxableAmount.toFixed(2)}</span>
                                </div>
                                {gst > 0 && (
                                    <div style={styles.totalsRow}>
                                        <span>GST ({gst}%):</span>
                                        <span>₹{totals.taxAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div style={{ ...styles.totalsRow, ...styles.totalsGrand }}>
                                    <span>Total:</span>
                                    <span>₹{totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ─── PAYMENT SECTION ────────────────────────── */}
                {cart.length > 0 && (
                    <div style={styles.paymentSection}>
                        <div style={styles.paymentRow}>
                            <div style={styles.paymentField}>
                                <label style={styles.label}>Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={styles.select}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="upi">UPI</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>
                            <div style={styles.paymentField}>
                                <label style={styles.label}>Discount %</label>
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                                    style={styles.numberInput}
                                    min="0"
                                    max="100"
                                />
                            </div>
                            <div style={styles.paymentField}>
                                <label style={styles.label}>GST %</label>
                                <input
                                    type="number"
                                    value={gst}
                                    onChange={(e) => setGst(Math.max(0, Number(e.target.value)))}
                                    style={styles.numberInput}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <button
                            style={styles.checkoutButton}
                            onClick={handleCheckout}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : `Checkout ₹${totals.total.toFixed(2)}`}
                        </button>
                    </div>
                )}
            </div>

            {/* ─── PRODUCT MODAL ────────────────────────────── */}
            {showProductModal && selectedProduct && (
                <div style={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
                    <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Add to Cart</h3>
                            <button style={styles.modalClose} onClick={() => setShowProductModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.modalProductInfo}>
                                <h4>{selectedProduct.product_name}</h4>
                                <p>Code: {selectedProduct.product_code}</p>
                                <p>Price: ₹{selectedProduct.selling_price?.toFixed(2)}</p>
                                <p>Stock: {selectedProduct.stock} {selectedProduct.unit}</p>
                            </div>
                            <div style={styles.modalControls}>
                                <div style={styles.modalField}>
                                    <label>Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                        style={styles.modalInput}
                                        min="1"
                                    />
                                </div>
                                <div style={styles.modalField}>
                                    <label>Unit</label>
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                        style={styles.modalSelect}
                                    >
                                        {availableUnits.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                style={styles.modalAddButton}
                                onClick={() => {
                                    addToCart(selectedProduct, quantity);
                                    setShowProductModal(false);
                                    setMessage(`Added ${quantity} ${unit} of ${selectedProduct.product_name}`);
                                    setMessageType("success");
                                    setTimeout(() => setMessage(""), 2000);
                                }}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── STYLES ──────────────────────────────────────────────────
const TEAL = "#0B4F52";
const TEAL_DARK = "#083B3D";
const MARIGOLD = "#FFC53D";
const PAPER = "#FFFBF2";
const INK = "#182422";
const INK_SOFT = "#5C6B67";
const RULE = "#E4DEC8";
const GREEN = "#2F8F5B";
const RED = "#D6482B";

const styles = {
    page: {
        background: PAPER,
        minHeight: "100vh",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: INK,
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 20px 40px",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px",
    },
    title: {
        fontFamily: "'Baloo 2', sans-serif",
        fontSize: "32px",
        color: TEAL,
        margin: 0,
    },
    headerStats: {
        display: "flex",
        gap: "24px",
        fontSize: "16px",
    },
    headerStat: {
        color: INK_SOFT,
    },

    message: {
        padding: "12px 18px",
        marginBottom: "20px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "500",
        borderLeft: "4px solid",
    },
    successMessage: {
        background: "#E4F5EC",
        color: "#1F6B45",
        borderLeftColor: GREEN,
    },
    errorMessage: {
        background: "#FBE7E0",
        color: "#A5341A",
        borderLeftColor: RED,
    },
    infoMessage: {
        background: "#E4F0F5",
        color: "#1A5C8C",
        borderLeftColor: "#2A6E8C",
    },

    scanSection: {
        background: "#FFFFFF",
        border: `2px solid ${RULE}`,
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
    },
    scanRow: {
        display: "flex",
        gap: "8px",
        flex: 2,
        minWidth: "280px",
    },
    barcodeInput: {
        flex: 1,
        padding: "11px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
        fontFamily: "'JetBrains Mono', monospace",
        minWidth: "160px",
    },
    scanButton: {
        padding: "11px 24px",
        background: TEAL,
        color: "#FFFFFF",
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "background 0.2s",
    },
    searchRow: {
        display: "flex",
        gap: "8px",
        flex: 1,
        minWidth: "240px",
    },
    searchInput: {
        flex: 1,
        padding: "11px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
        minWidth: "120px",
    },
    searchButton: {
        padding: "11px 24px",
        background: MARIGOLD,
        color: TEAL_DARK,
        border: "none",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },

    customerSection: {
        background: "#FFFFFF",
        border: `2px solid ${RULE}`,
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
    },
    sectionTitle: {
        fontSize: "14px",
        fontWeight: "700",
        color: TEAL,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        margin: "0 0 12px 0",
    },
    customerRow: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center",
    },
    customerInput: {
        flex: 1,
        padding: "10px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
        minWidth: "140px",
    },
    lookupButton: {
        padding: "10px 20px",
        background: "#EAF3EE",
        color: TEAL,
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },

    cartSection: {
        background: "#FFFFFF",
        border: `2px solid ${RULE}`,
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "20px",
    },
    emptyCart: {
        padding: "40px 20px",
        textAlign: "center",
        color: INK_SOFT,
    },
    emptyCartSub: {
        fontSize: "13px",
        marginTop: "4px",
    },
    tableWrapper: {
        overflowX: "auto",
        marginBottom: "16px",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "13.5px",
        minWidth: "600px",
    },
    th: {
        padding: "10px 12px",
        textAlign: "left",
        fontWeight: "700",
        color: TEAL,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: `2px solid ${RULE}`,
        whiteSpace: "nowrap",
    },
    tableRow: {
        borderBottom: `1px dashed ${RULE}`,
    },
    td: {
        padding: "10px 12px",
        verticalAlign: "middle",
    },
    productName: {
        fontWeight: "600",
        fontSize: "14px",
    },
    productCode: {
        fontSize: "11px",
        color: INK_SOFT,
        fontFamily: "'JetBrains Mono', monospace",
    },
    qtyControls: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    qtyButton: {
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        border: `2px solid ${RULE}`,
        background: "#FFFFFF",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "700",
        color: TEAL,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s",
    },
    qtyValue: {
        fontWeight: "600",
        fontSize: "15px",
        minWidth: "30px",
        textAlign: "center",
    },
    unitTag: {
        fontSize: "12px",
        background: "#EAF3EE",
        color: TEAL,
        padding: "2px 10px",
        borderRadius: "20px",
        fontWeight: "600",
    },
    removeButton: {
        background: "none",
        border: "none",
        color: RED,
        fontSize: "18px",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
        transition: "background 0.2s",
    },

    totalsSection: {
        background: "#FBF7EA",
        borderRadius: "10px",
        padding: "16px 20px",
        maxWidth: "320px",
        marginLeft: "auto",
    },
    totalsRow: {
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: "14px",
    },
    totalsGrand: {
        fontSize: "18px",
        fontWeight: "700",
        color: TEAL,
        borderTop: `2px solid ${RULE}`,
        paddingTop: "8px",
        marginTop: "4px",
    },
    discountAmount: {
        color: RED,
    },

    paymentSection: {
        background: "#FFFFFF",
        border: `2px solid ${RULE}`,
        borderRadius: "12px",
        padding: "20px",
        marginTop: "20px",
    },
    paymentRow: {
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "16px",
    },
    paymentField: {
        flex: 1,
        minWidth: "140px",
    },
    label: {
        display: "block",
        fontSize: "12px",
        fontWeight: "700",
        color: INK_SOFT,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "4px",
    },
    select: {
        width: "100%",
        padding: "10px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
        cursor: "pointer",
    },
    numberInput: {
        width: "100%",
        padding: "10px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
    },
    checkoutButton: {
        width: "100%",
        padding: "16px",
        background: MARIGOLD,
        color: TEAL_DARK,
        border: "none",
        borderRadius: "12px",
        fontSize: "18px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "transform 0.1s, box-shadow 0.2s",
        boxShadow: "0 4px 0 #D69A18",
        marginTop: "4px",
        "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 0 #D69A18",
        },
        "&:disabled": {
            opacity: 0.6,
            cursor: "not-allowed",
            transform: "none",
        },
    },

    // ─── MODAL ────────────────────────────────────────────────
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
    },
    modal: {
        background: PAPER,
        borderRadius: "16px",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        animation: "slideUp 0.3s ease",
    },
    modalHeader: {
        padding: "16px 24px",
        borderBottom: `2px solid ${RULE}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    modalTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: TEAL,
        margin: 0,
        fontFamily: "'Baloo 2', sans-serif",
    },
    modalClose: {
        background: "none",
        border: "none",
        fontSize: "24px",
        color: INK_SOFT,
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
    },
    modalBody: {
        padding: "24px",
    },
    modalProductInfo: {
        marginBottom: "20px",
        "& h4": {
            fontSize: "18px",
            margin: "0 0 4px 0",
        },
        "& p": {
            margin: "4px 0",
            color: INK_SOFT,
        },
    },
    modalControls: {
        display: "flex",
        gap: "16px",
        marginBottom: "20px",
    },
    modalField: {
        flex: 1,
    },
    modalInput: {
        width: "100%",
        padding: "10px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
    },
    modalSelect: {
        width: "100%",
        padding: "10px 14px",
        border: `2px solid ${RULE}`,
        borderRadius: "10px",
        fontSize: "14px",
        backgroundColor: "#FFFFFF",
        outline: "none",
        cursor: "pointer",
    },
    modalAddButton: {
        width: "100%",
        padding: "14px",
        background: TEAL,
        color: "#FFFFFF",
        border: "none",
        borderRadius: "10px",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: "background 0.2s",
        "&:hover": {
            background: TEAL_DARK,
        },
    },
};

// Inject styles
if (typeof document !== "undefined" && !document.getElementById("pos-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "pos-styles";
    styleSheet.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        .barcode-input:focus, .search-input:focus, .customer-input:focus,
        .number-input:focus, .select:focus, .modal-input:focus, .modal-select:focus {
            border-color: #FFC53D !important;
            box-shadow: 0 0 0 3px rgba(255,197,61,0.25) !important;
        }
        
        .scan-button:hover { background: #083B3D !important; }
        .search-button:hover { background: #D69A18 !important; }
        .lookup-button:hover { background: #D6E8FF !important; }
        .qty-button:hover { background: #FBF7EA !important; }
        .remove-button:hover { background: #FBE7E0 !important; }
        .modal-close:hover { background: #F5F0E4 !important; }
        .modal-add-button:hover { background: #083B3D !important; }
        
        tr:hover td { background: #FFFDF5 !important; }
    `;
    document.head.appendChild(styleSheet);
}