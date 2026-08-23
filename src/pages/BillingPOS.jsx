import { useEffect, useState, useRef } from "react";
import API from "../services/api";
import BarcodeScanner from "../pages/BarcodeScanner";

export default function BillingPOS() {
  // Business profile state
  const [businessName, setBusinessName] = useState("Your Store");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // Dashboard state
  const [dashboard, setDashboard] = useState({
    todaySales: 0,
    todayBills: 0,
    monthSales: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStock: 0,
  });

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState("quick"); // "quick" or "ask"

  // Voice billing states
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const recognitionRef = useRef(null);
  const voiceActiveRef = useRef(false);

  // Customer fields – phone is now optional
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [isCustomerFound, setIsCustomerFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Discount and GST
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [saleComplete, setSaleComplete] = useState(false);

  // Last completed invoice snapshot (for print/download)
  const [lastInvoice, setLastInvoice] = useState(null);

  // Cash received for change calculation
  const [cashReceived, setCashReceived] = useState("");

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([]);

  // Quantity input refs
  const quantityInputRef = useRef(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("pcs");

  // Manual quantity states (for the new manual input feature)
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualUnit, setManualUnit] = useState("pcs");
  const [manualSelectedProduct, setManualSelectedProduct] = useState(null);

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());

  // Helper function to safely format price
  const formatPrice = (price) => {
    if (price === undefined || price === null) return "0.00";
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  // Helper function to safely get numeric price
  const getNumericPrice = (price) => {
    if (price === undefined || price === null) return 0;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? 0 : numPrice;
  };

  // Load business profile - uses JWT to get business
  const loadBusinessProfile = async () => {
    try {
      const res = await API.get("/business/profile");
      if (res.data.business) {
        setBusinessName(
          res.data.business.business_name || "Your Store"
        );
      }
    } catch (err) {
      console.log("Could not load business profile:", err);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2 - Focus search
      if (e.key === "F2") {
        e.preventDefault();
        document.getElementById("search-input")?.focus();
      }
      // F4 - Open scanner
      if (e.key === "F4") {
        e.preventDefault();
        setShowScanner(true);
      }
      // F8 - Focus payment
      if (e.key === "F8") {
        e.preventDefault();
        document.getElementById("cash-received")?.focus();
      }
      // Ctrl+Enter - Complete bill
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        if (cart.length > 0) saveSale();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cart]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-dismiss the "bill settled" confirmation banner
  useEffect(() => {
    if (saleComplete) {
      const t = setTimeout(() => setSaleComplete(false), 2600);
      return () => clearTimeout(t);
    }
  }, [saleComplete]);

  // Get supported units based on price unit
  const getSupportedUnits = (priceUnit) => {
    const unitMap = {
      pcs: ["pcs"],
      g: ["g", "kg"],
      kg: ["g", "kg"],
      ml: ["ml", "l"],
      l: ["ml", "l"],
      pack: ["pack"],
      box: ["box"],
      bottle: ["bottle"],
      dozen: ["pcs", "dozen"],
      meter: ["meter", "feet"],
      feet: ["meter", "feet"],
    };
    return unitMap[priceUnit] || ["pcs"];
  };

  // Convert quantity to price unit
  const convertToPriceUnit = (quantity, fromUnit, priceUnit) => {
    if (fromUnit === priceUnit) return Number(quantity);

    if (priceUnit === "kg" && fromUnit === "g") {
      return Number(quantity) / 1000;
    }

    if (priceUnit === "g" && fromUnit === "kg") {
      return Number(quantity) * 1000;
    }

    if (priceUnit === "l" && fromUnit === "ml") {
      return Number(quantity) / 1000;
    }

    if (priceUnit === "ml" && fromUnit === "l") {
      return Number(quantity) * 1000;
    }

    if (priceUnit === "dozen" && fromUnit === "pcs") {
      return Number(quantity) / 12;
    }

    if (priceUnit === "pcs" && fromUnit === "dozen") {
      return Number(quantity) * 12;
    }

    if (priceUnit === "meter" && fromUnit === "feet") {
      return Number(quantity) * 0.3048;
    }

    if (priceUnit === "feet" && fromUnit === "meter") {
      return Number(quantity) / 0.3048;
    }

    return Number(quantity);
  };

  // ========== FIXED: Calculate manual price ==========
  const calculateManualPrice = () => {
    if (!manualSelectedProduct || !manualQuantity) return 0;

    const convertedQuantity = convertToPriceUnit(
      Number(manualQuantity),
      manualUnit,
      manualSelectedProduct.price_unit || "pcs"
    );

    const sellingPrice = getNumericPrice(
      manualSelectedProduct.selling_price
    );

    const pricePer = Number(manualSelectedProduct.price_per || 1);

    const pricePerBaseUnit = sellingPrice / pricePer;

    return convertedQuantity * pricePerBaseUnit;
  };

  // ========== FIXED: Add manual product to cart ==========
  const addManualProductToCart = () => {
    if (!manualSelectedProduct) return;

    const qty = Number(manualQuantity);

    if (!qty || qty <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    const baseUnit = manualSelectedProduct.price_unit || "pcs";

    const convertedQuantity = convertToPriceUnit(
      qty,
      manualUnit,
      baseUnit
    );

    const sellingPrice = getNumericPrice(
      manualSelectedProduct.selling_price
    );

    const pricePer = Number(
      manualSelectedProduct.price_per || 1
    );

    const pricePerBaseUnit = sellingPrice / pricePer;

    const totalPrice =
      convertedQuantity * pricePerBaseUnit;

    if (
      Number(manualSelectedProduct.stock) <
      convertedQuantity
    ) {
      alert(
        `Only ${manualSelectedProduct.stock} ${baseUnit} available`
      );
      return;
    }

    const cartItem = {
      id: manualSelectedProduct.id,
      product_name: manualSelectedProduct.product_name,

      price_per_unit: pricePerBaseUnit,

      base_unit: baseUnit,

      quantity: qty,
      unit: manualUnit,

      convertedQuantity,

      displayQuantity: qty,
      displayUnit: manualUnit,

      totalPrice: Number(totalPrice.toFixed(2)),
    };

    setCart((prevCart) => [
      ...prevCart,
      cartItem,
    ]);

    setManualQuantity(1);
    setManualUnit(baseUnit);
    setManualSelectedProduct(null);
  };

  // Get compatible units based on product's base unit
  const getCompatibleUnits = (priceUnit) => {
    const unitMap = {
      pcs: ["pcs", "dozen"],
      g: ["g", "kg"],
      kg: ["g", "kg"],
      ml: ["ml", "l"],
      l: ["ml", "l"],
      pack: ["pack"],
      box: ["box"],
      bottle: ["bottle"],
      dozen: ["pcs", "dozen"],
      meter: ["meter", "feet"],
      feet: ["meter", "feet"],
    };
    return unitMap[priceUnit] || ["pcs"];
  };

  // Unit display names
  const unitDisplayNames = {
    pcs: "Pieces",
    g: "Gram",
    kg: "Kilogram",
    ml: "Milliliter",
    l: "Liter",
    pack: "Pack",
    box: "Box",
    bottle: "Bottle",
    dozen: "Dozen",
    meter: "Meter",
    feet: "Feet",
  };

  // Convert quantity from one unit to another
  const convertDisplayUnit = (quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;

    let baseQuantity = quantity;
    if (fromUnit === "kg") baseQuantity = quantity * 1000;
    else if (fromUnit === "l") baseQuantity = quantity * 1000;
    else if (fromUnit === "dozen") baseQuantity = quantity * 12;
    else if (fromUnit === "feet") baseQuantity = quantity * 0.3048;
    else if (fromUnit === "g") baseQuantity = quantity;
    else if (fromUnit === "ml") baseQuantity = quantity;
    else if (fromUnit === "meter") baseQuantity = quantity;
    else if (fromUnit === "pcs") baseQuantity = quantity;

    let result = baseQuantity;
    if (toUnit === "kg") result = baseQuantity / 1000;
    else if (toUnit === "l") result = baseQuantity / 1000;
    else if (toUnit === "dozen") result = baseQuantity / 12;
    else if (toUnit === "feet") result = baseQuantity / 0.3048;
    else if (toUnit === "g") result = baseQuantity;
    else if (toUnit === "ml") result = baseQuantity;
    else if (toUnit === "meter") result = baseQuantity;
    else if (toUnit === "pcs") result = baseQuantity;

    return result;
  };

  // Format unit display
  const formatUnitDisplay = (unit) => {
    return unitDisplayNames[unit] || unit;
  };

  // AUTO CUSTOMER SEARCH FUNCTION - FIXED: removed business_id param
  const searchCustomer = async (phone) => {
    if (phone.length < 10) {
      setIsCustomerFound(false);
      setCustomerId(null);
      setCustomerName("");
      return;
    }

    setIsSearching(true);
    try {
      // REMOVED: ?business_id=${businessId} - backend uses JWT
      const res = await API.get(`/customers/search/${phone}`);

      if (res.data.success && res.data.data) {
        setCustomerId(res.data.data.id);
        setCustomerName(res.data.data.customer_name);
        setIsCustomerFound(true);
      } else {
        setCustomerId(null);
        setCustomerName("");
        setIsCustomerFound(false);
      }
    } catch (err) {
      setCustomerId(null);
      setCustomerName("");
      setIsCustomerFound(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Load dashboard data - FIXED: removed business_id param
  const loadDashboard = async () => {
    try {
      // REMOVED: ?business_id=${businessId} - backend uses JWT
      const res = await API.get("/dashboard");

      if (res.data.success) {
        setDashboard(res.data);
      }
    } catch (err) {
      console.log("Dashboard Error:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    generateInvoiceNo();
    extractCategories();
    loadDashboard();
    loadBusinessProfile();
  }, []);

  const generateInvoiceNo = () => {
    const prefix = "INV";
    const timestamp = Date.now().toString().slice(-8);
    setInvoiceNo(`${prefix}${timestamp}`);
  };

  // Load products - FIXED: removed business_id param
  const loadProducts = async () => {
    try {
      // REMOVED: ?business_id=${businessId} - backend uses JWT
      const res = await API.get("/products");
      setProducts(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  const extractCategories = () => {
    const uniqueCategories = ["All", "Grocery", "Medical", "Drinks", "Snacks", "Other"];
    setCategories(uniqueCategories);
  };

  const openQuantityModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setSelectedUnit(product.price_unit || "pcs");
    setShowQtyModal(true);
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 100);
  };

  // Quick add mode - automatically add product with quantity 1
  const quickAddToCart = (product) => {
    const unit = product.price_unit || "pcs";

    const priceData = calculateLivePriceForProduct(
      product,
      1,
      unit
    );

    if (product.stock < priceData.convertedQuantity) {
      alert(
        `Only ${product.stock} ${product.price_unit} available in stock`
      );

      return;
    }

    setCart((prevCart) => {
      const exist = prevCart.find(
        (item) =>
          item.id === product.id &&
          item.unit === unit
      );

      if (exist) {
        return prevCart.map((item) =>
          item.id === product.id &&
          item.unit === unit
            ? {
                ...item,
                quantity: item.quantity + 1,
                convertedQuantity: item.convertedQuantity + priceData.convertedQuantity,
                displayQuantity: item.displayQuantity + priceData.displayQuantity,
                totalPrice: (item.convertedQuantity + priceData.convertedQuantity) * item.price_per_unit,
              }
            : item
        );
      }

      return [
        ...prevCart,
        {
          id: product.id,
          product_name: product.product_name,
          price_per_unit: priceData.pricePerUnit,
          base_unit: product.price_unit || "pcs",
          quantity: 1,
          unit,
          convertedQuantity: priceData.convertedQuantity,
          displayQuantity: priceData.displayQuantity,
          displayUnit: priceData.displayUnit,
          totalPrice: priceData.total,
        },
      ];
    });
  };

  const calculateLivePriceForProduct = (product, qty, unit) => {
    const baseUnit = product.price_unit || "pcs";
    const convertedQuantity = convertDisplayUnit(qty, unit, baseUnit);
    const sellingPrice = getNumericPrice(product.selling_price);
    const pricePerUnit = sellingPrice / (product.price_per || 1);
    const total = convertedQuantity * pricePerUnit;

    let displayQuantity = convertedQuantity;
    let displayUnit = baseUnit;

    if (baseUnit === "g" && convertedQuantity >= 1000) {
      displayQuantity = convertedQuantity / 1000;
      displayUnit = "kg";
    } else if (baseUnit === "ml" && convertedQuantity >= 1000) {
      displayQuantity = convertedQuantity / 1000;
      displayUnit = "l";
    } else if (baseUnit === "pcs" && convertedQuantity >= 12) {
      displayQuantity = convertedQuantity / 12;
      displayUnit = "dozen";
    } else {
      displayQuantity = convertedQuantity;
      displayUnit = baseUnit;
    }

    return {
      total,
      convertedQuantity,
      displayQuantity,
      displayUnit,
      baseUnit,
      pricePerUnit,
    };
  };

  const calculateLivePrice = () => {
    if (!selectedProduct)
      return {
        total: 0,
        convertedQuantity: 0,
        displayQuantity: 0,
        displayUnit: selectedProduct?.price_unit || "pcs",
        baseUnit: selectedProduct?.price_unit || "pcs",
        pricePerUnit: 0,
      };

    return calculateLivePriceForProduct(selectedProduct, quantity, selectedUnit);
  };

  const addToCartWithQuantity = () => {
    if (!selectedProduct) return;

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const priceData = calculateLivePrice();

    if (selectedProduct.stock < priceData.convertedQuantity) {
      alert(`Only ${selectedProduct.stock} ${selectedProduct.price_unit} available in stock`);
      return;
    }

    const exist = cart.find(
      (item) => item.id === selectedProduct.id && item.unit === selectedUnit
    );

    if (exist) {
      setCart(
        cart.map((item) =>
          item.id === selectedProduct.id && item.unit === selectedUnit
            ? {
                ...item,
                quantity: item.quantity + quantity,
                convertedQuantity: item.convertedQuantity + priceData.convertedQuantity,
                displayQuantity: item.displayQuantity + priceData.displayQuantity,
                totalPrice:
                  (item.convertedQuantity + priceData.convertedQuantity) *
                  item.price_per_unit,
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: selectedProduct.id,
          product_name: selectedProduct.product_name,
          price_per_unit: priceData.pricePerUnit,
          base_unit: selectedProduct.price_unit || "pcs",
          quantity: quantity,
          unit: selectedUnit,
          convertedQuantity: priceData.convertedQuantity,
          displayQuantity: priceData.displayQuantity,
          displayUnit: priceData.displayUnit,
          totalPrice: priceData.total,
        },
      ]);
    }

    setShowQtyModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setSelectedUnit("pcs");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addToCartWithQuantity();
    }
    if (e.key === "Escape") {
      setShowQtyModal(false);
      setSelectedProduct(null);
      setQuantity(1);
      setSelectedUnit("pcs");
    }
  };

  const changeQty = (id, delta, unit) => {
    const item = cart.find((i) => i.id === id && i.unit === unit);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => !(i.id === id && i.unit === unit)));
      return;
    }

    const ratio = newQty / item.quantity;
    setCart(
      cart.map((i) => {
        if (i.id === id && i.unit === unit) {
          return {
            ...i,
            quantity: newQty,
            convertedQuantity: i.convertedQuantity * ratio,
            displayQuantity: i.displayQuantity * ratio,
            totalPrice: i.price_per_unit * i.convertedQuantity * ratio,
          };
        }
        return i;
      })
    );
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = subtotal * (Number(discount) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(gst) / 100);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const grandTotal = taxableAmount + taxAmount;

  // Validate phone number (optional now)
  const isPhoneValid = customerPhone.length === 0 || (customerPhone.length === 10 && /^\d{10}$/.test(customerPhone));

  // Calculate change
  const change = cashReceived ? Number(cashReceived) - grandTotal : 0;
  const showChange = paymentMethod === "Cash" && cashReceived && change >= 0;

  // Build a printable/downloadable invoice window for the given invoice snapshot
  const printInvoice = (invoice) => {
    if (!invoice) return;

    const win = window.open("", "_blank", "width=380,height=640");
    if (!win) {
      alert("Please allow pop-ups for this site to download/print the invoice");
      return;
    }

    const itemsHtml = invoice.items
      .map(
        (item) => `
      <tr>
        <td style="padding:4px 2px;border-bottom:1px dashed #999;">${item.product_name}</td>
        <td style="padding:4px 2px;border-bottom:1px dashed #999;text-align:center;">${item.quantity} ${formatUnitDisplay(item.unit)}</td>
        <td style="padding:4px 2px;border-bottom:1px dashed #999;text-align:right;">₹${(item.totalPrice || 0).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>${invoice.invoiceNo}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Courier New', monospace; padding: 16px; font-size: 12px; color:#111; margin:0; }
            h2 { text-align:center; margin: 4px 0; letter-spacing: 0.5px; }
            .meta { text-align:center; font-size: 11px; margin-bottom: 10px; line-height:1.6; color:#333; }
            table { width:100%; border-collapse: collapse; margin-top: 8px; }
            th { text-align:left; font-size: 10px; text-transform:uppercase; letter-spacing:0.5px; padding-bottom:4px; border-bottom:1px solid #333; }
            .totals { margin-top:10px; }
            .totals div { display:flex; justify-content:space-between; padding:2px 0; font-size:12px; }
            .grand { font-weight:bold; font-size:15px; border-top:1px dashed #000; margin-top:8px; padding-top:8px; }
            .footer { text-align:center; margin-top:20px; font-size:11px; color:#333; }
            .btn-row { text-align:center; margin-top:16px; }
            .btn-row button {
              padding:8px 18px; font-size:12px; font-weight:bold; border-radius:6px;
              border:1px solid #333; background:#111; color:#FFB000; cursor:pointer;
            }
            @media print {
              .btn-row { display:none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h2>${invoice.businessName}</h2>
          <div class="meta">
            Invoice: ${invoice.invoiceNo}<br/>
            ${invoice.date.toLocaleString("en-IN")}<br/>
            Customer: ${invoice.customerName}${invoice.customerPhone ? " · " + invoice.customerPhone : ""}
          </div>
          <table>
            <thead>
              <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Amt</th></tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="totals">
            <div><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
            <div><span>Discount (${invoice.discount}%)</span><span>−₹${invoice.discountAmount.toFixed(2)}</span></div>
            <div><span>CGST (${(invoice.gst / 2).toFixed(0)}%)</span><span>₹${invoice.cgst.toFixed(2)}</span></div>
            <div><span>SGST (${(invoice.gst / 2).toFixed(0)}%)</span><span>₹${invoice.sgst.toFixed(2)}</span></div>
            <div class="grand"><span>TOTAL</span><span>₹${invoice.grandTotal.toFixed(2)}</span></div>
            <div><span>Payment</span><span>${invoice.paymentMethod}</span></div>
          </div>
          <div class="footer">Thank you for shopping with us!</div>
          <div class="btn-row">
            <button onclick="window.print()">🖨️ Print / Save as PDF</button>
          </div>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Save sale - FIXED: removed business_id from payload
  const saveSale = async () => {
    try {
      const payload = {
        // REMOVED: business_id: businessId - backend uses JWT
        customer_id: customerId,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone || null,
        payment_method: paymentMethod,
        payment_status: "Paid",
        discount: Number(discount),
        gst: Number(gst),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          entered_unit: item.unit,
        })),
      };

      const res = await API.post("/sales/create", payload);

      // Snapshot the invoice BEFORE we clear the cart/fields, so we can
      // print or download it after the sale is settled.
      const invoiceSnapshot = {
        invoiceNo,
        businessName,
        date: new Date(),
        customerName: customerName || "Walk-in Customer",
        customerPhone,
        items: cart,
        subtotal,
        discount: Number(discount),
        discountAmount,
        gst: Number(gst),
        cgst,
        sgst,
        grandTotal,
        paymentMethod,
      };
      setLastInvoice(invoiceSnapshot);

      setSaleComplete(true);
      setCart([]);
      loadProducts();
      loadDashboard();
      generateInvoiceNo();

      setCustomerName("");
      setCustomerPhone("");
      setCustomerId(null);
      setIsCustomerFound(false);
      setDiscount(0);
      setGst(18);
      setCashReceived("");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error creating sale");
    }
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm("Clear all items from cart?")) {
      setCart([]);
    }
  };

  const getStockStatus = (product) => {
    const unit = product.price_unit || "pcs";
    const unitDisplay = formatUnitDisplay(unit);
    const stock = Number(product.stock) || 0;

    if (stock <= 0) {
      return { text: "OUT OF STOCK", tone: "out" };
    } else if (stock <= 5) {
      return { text: `${stock} ${unitDisplay} left`, tone: "low" };
    } else if (stock <= 20) {
      return { text: `${stock} ${unitDisplay} left`, tone: "mid" };
    }
    return { text: `${stock} ${unitDisplay} available`, tone: "high" };
  };

  const liveTotalDigits = showQtyModal ? calculateLivePrice().total.toFixed(2) : null;

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(search)) ||
                          (p.sku && p.sku.includes(search));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ===============================
  // VOICE BILLING FUNCTIONS
  // ===============================

  // Same POS success beep for voice/barcode actions
  const playSuccessBeep = () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        900,
        audioContext.currentTime
      );

      gainNode.gain.setValueAtTime(
        0.15,
        audioContext.currentTime
      );

      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.15
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);

      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (error) {
      console.log("Beep sound error:", error);
    }
  };

  const stopVoiceBilling = () => {
    voiceActiveRef.current = false;

    setIsListening(false);
    setVoiceMessage("🎤 Voice billing stopped");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.log("Voice stop error:", error);
      }

      recognitionRef.current = null;
    }
  };

  const startVoiceBilling = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice recognition is not supported in this browser. Please use Google Chrome."
      );
      return;
    }

    // If already active, stop voice mode
    if (voiceActiveRef.current) {
      stopVoiceBilling();
      return;
    }

    voiceActiveRef.current = true;
    setIsListening(true);
    setVoiceText("");
    setVoiceMessage("🎤 Voice billing active");

    const createRecognition = () => {
      // Don't start if owner stopped voice mode
      if (!voiceActiveRef.current) return;

      const recognition = new SpeechRecognition();

      recognition.lang = "en-IN";

      // IMPORTANT
      // Recognition can continue listening
      recognition.continuous = true;

      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        if (!voiceActiveRef.current) return;

        setIsListening(true);
        setVoiceMessage("🎤 Listening... Say a product");
      };

      recognition.onresult = (event) => {
        if (!voiceActiveRef.current) return;

        // Process all new final results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue;

          const transcript =
            event.results[i][0].transcript.trim();

          if (!transcript) continue;

          console.log("🎤 Voice:", transcript);

          setVoiceText(transcript);
          setVoiceMessage(`🗣️ "${transcript}"`);

          processVoiceCommand(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.log("Voice error:", event.error);

        // These errors can happen normally during continuous recognition
        if (
          event.error === "no-speech" ||
          event.error === "aborted"
        ) {
          return;
        }

        if (event.error === "not-allowed") {
          voiceActiveRef.current = false;
          setIsListening(false);
          setVoiceMessage("❌ Microphone permission denied");
          return;
        }

        setVoiceMessage(`⚠️ Voice error: ${event.error}`);
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        // Automatically start listening again
        if (voiceActiveRef.current) {
          setTimeout(() => {
            if (voiceActiveRef.current) {
              createRecognition();
            }
          }, 300);
        } else {
          setIsListening(false);
        }
      };

      try {
        recognition.start();
      } catch (error) {
        console.log("Recognition start error:", error);
      }
    };

    createRecognition();
  };

  const processVoiceCommand = (text) => {
    if (!text) return;

    let command = text.toLowerCase().trim();

    console.log("Voice command:", command);

    // ===============================
    // CLEAR CART
    // ===============================

    if (
      command === "clear cart" ||
      command === "clear the cart" ||
      command.includes("empty cart")
    ) {
      setCart([]);

      setVoiceMessage("🗑️ Cart cleared");

      return;
    }

    // ===============================
    // REMOVE PRODUCT
    // ===============================

    if (
      command.startsWith("remove ") ||
      command.startsWith("delete ")
    ) {
      let productName = command
        .replace(/^remove\s+/i, "")
        .replace(/^delete\s+/i, "")
        .replace(/\s+from cart$/i, "")
        .trim();

      const product = findVoiceProduct(productName);

      if (!product) {
        setVoiceMessage(`❌ Product "${productName}" not found`);
        return;
      }

      setCart((prevCart) =>
        prevCart.filter((item) => item.id !== product.id)
      );

      setVoiceMessage(`🗑️ Removed ${product.product_name}`);

      return;
    }

    // ===============================
    // ADVANCED ADD PRODUCT
    // ===============================

    let quantity = 1;

    // Number words
    const numberWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
    };

    // Remove common command words first
    let productName = command
      .replace(/^add\s+/i, "")
      .replace(/^buy\s+/i, "")
      .replace(/^give\s+/i, "")
      .replace(/^put\s+/i, "")
      .replace(/^please\s+/i, "")
      .replace(/\s+to\s+cart$/i, "")
      .replace(/\s+add\s+to\s+cart$/i, "")
      .replace(/\s+please$/i, "")
      .trim();

    // Numeric quantity
    const quantityMatch = productName.match(
      /^(\d+(?:\.\d+)?)\s+(.+)$/
    );

    if (quantityMatch) {
      quantity = Number(quantityMatch[1]);
      productName = quantityMatch[2].trim();
    }

    // Word quantity
    for (const word in numberWords) {
      if (productName.startsWith(`${word} `)) {
        quantity = numberWords[word];

        productName = productName
          .replace(
            new RegExp(`^${word}\\s+`, "i"),
            ""
          )
          .trim();

        break;
      }
    }

    if (!productName) {
      setVoiceMessage("🎤 Please say a product name");
      return;
    }

    // Find product
    const product = findVoiceProduct(productName);

    if (!product) {
      setVoiceMessage(
        `❌ "${productName}" not found`
      );

      return;
    }

    // Add product
    for (let i = 0; i < quantity; i++) {
      quickAddToCart(product);
    }

    // 🔊 Success sound
    playSuccessBeep();

    setVoiceMessage(
      `✅ Added ${quantity} × ${product.product_name}`
    );
  };

  const findVoiceProduct = (voiceName) => {
    if (!voiceName || !products.length) return null;

    const normalize = (value) => {
      return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    };

    const searchName = normalize(voiceName);

    // Exact normalized match
    let product = products.find((p) => {
      return normalize(p.product_name) === searchName;
    });

    if (product) return product;

    // Product name contains voice text
    product = products.find((p) => {
      const name = normalize(p.product_name);

      return (
        name.includes(searchName) ||
        searchName.includes(name)
      );
    });

    if (product) return product;

    // Word-based matching
    const words = String(voiceName)
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    product = products.find((p) => {
      const name = String(p.product_name || "").toLowerCase();

      return words.every((word) => name.includes(word));
    });

    return product || null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Manrope:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        :root {
          --pos-bg: #EEF1F4;
          --panel-dark: #1E2633;
          --panel-dark-2: #111720;
          --panel-dark-3: #151D2A;
          --gold: #FFB000;
          --gold-soft: #FFC44D;
          --text: #20242A;
          --muted: #737B85;
          --border: #D5DADF;
          --success: #35B86B;
          --danger: #EF5350;
          --brass-bright: #FFB000;
          --brass-deep: #C68A00;
          --charcoal: #1E2633;
          --charcoal-soft: #26303F;
          --charcoal-line: #36404D;
          --led-amber: #FFB000;
          --led-red: #EF5350;
          --ink: #20242A;
          --ink-soft: #5B616B;
          --line: #D5DADF;
          --good: #35B86B;
          --steel-panel: #FFFFFF;
          --steel-panel-2: #F0F2F5;
          --text-light: #F2F4F7;
          --text-secondary: #9AA4B2;
        }

        * { box-sizing: border-box; }

        .pos-wrap {
          font-family: 'Manrope', sans-serif;
          background: var(--pos-bg);
          min-height: 100vh;
          padding: 26px;
        }

        /* Top Status Bar */
        .status-bar {
          max-width: 1620px;
          margin: 0 auto 16px;
          background: #171A1F;
          border-radius: 12px;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #fff;
          font-size: 12px;
        }
        .status-left { display: flex; align-items: center; gap: 16px; }
        .status-brand {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--gold);
        }
        .status-online {
          color: var(--success);
          font-weight: 600;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .status-online::before {
          content: '';
          width: 7px;
          height: 7px;
          background: var(--success);
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .status-right {
          display: flex;
          gap: 20px;
          color: #8C93A0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        .status-data {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .status-data .label {
          color: #6B7178;
        }
        .status-data .value {
          color: #E8EAEE;
          font-weight: 600;
        }
        .status-data .value.gold {
          color: var(--gold);
        }

        .pos-layout {
          max-width: 1620px;
          margin: 0 auto;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        /* ============ LEFT: PRODUCT SHELF ============ */
        .shelf-col { flex: 1.75; }

        .shelf-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 3px solid var(--text);
        }
        .brand-block { display: flex; align-items: baseline; gap: 12px; }
        .brand-mark {
          width: 34px; height: 34px;
          border-radius: 7px;
          background: linear-gradient(155deg, var(--gold), var(--brass-deep));
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: var(--text);
          box-shadow: 0 2px 0 var(--brass-deep);
          flex-shrink: 0;
        }
        .shelf-heading {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 900;
          font-size: 34px;
          line-height: 1;
          color: var(--text);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .shelf-heading .sub {
          display: block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 2.5px;
          margin-top: 2px;
        }
        .shelf-count {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          color: var(--ink-soft);
          background: var(--steel-panel-2);
          border: 1px solid var(--border);
          padding: 5px 10px;
          border-radius: 20px;
        }

        .shelf-search-row {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        .shelf-search {
          flex: 1;
          padding: 13px 16px;
          border-radius: 9px;
          border: 1.5px solid var(--border);
          background: var(--steel-panel);
          font-family: 'Manrope', sans-serif;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .shelf-search:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(255,179,0,0.18); }
        
        .voice-button {
          border: none;
          border-radius: 12px;
          padding: 0 18px;
          min-height: 50px;
          background: #20242b;
          color: #ffffff;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .voice-button:hover {
          transform: translateY(-1px);
        }

        .voice-listening {
          background: #d93025;
          animation: voicePulse 1s infinite;
        }

        @keyframes voicePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(217, 48, 37, 0.5);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(217, 48, 37, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(217, 48, 37, 0);
          }
        }

        .voice-status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          background: #151a21;
          color: white;
        }

        .voice-icon {
          font-size: 25px;
        }

        .voice-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          opacity: 0.7;
        }

        .voice-result {
          margin-top: 3px;
          font-size: 14px;
          font-weight: 700;
        }

        .shelf-scan {
          padding: 0 22px;
          background: var(--text);
          color: var(--gold);
          border: none;
          border-radius: 9px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex; align-items: center; gap: 7px;
        }
        .shelf-scan:hover { background: var(--charcoal-soft); }
        .shelf-scan:active { transform: scale(0.96); }

        /* Category Filters */
        .category-filters {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .cat-btn {
          padding: 5px 14px;
          border: 1.5px solid var(--border);
          background: transparent;
          border-radius: 20px;
          font-family: 'Manrope', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all 0.15s;
        }
        .cat-btn:hover { border-color: var(--gold); color: var(--text); }
        .cat-btn.active {
          background: var(--text);
          color: var(--gold);
          border-color: var(--text);
        }

        .tag-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
          max-height: calc(100vh - 280px);
          overflow-y: auto;
          padding: 4px 6px 12px 2px;
        }
        .tag-grid::-webkit-scrollbar { width: 6px; }
        .tag-grid::-webkit-scrollbar-thumb { background: #B9C0C7; border-radius: 6px; }

        /* ===== COMPACT PRODUCT CARD ===== */
        .price-tag {
          position: relative;
          background: var(--steel-panel);
          border-radius: 10px;
          padding: 0 0 12px;
          box-shadow: 0 1px 2px rgba(20,22,26,0.06), 0 6px 16px rgba(20,22,26,0.05);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.14s, box-shadow 0.14s, border-color 0.14s;
          min-height: 220px;
        }
        .price-tag:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(20,22,26,0.12);
          border-color: var(--gold);
        }
        .tag-brass-strip {
          height: 3px;
          background: linear-gradient(90deg, var(--brass-deep), var(--gold) 45%, var(--brass-deep));
          flex-shrink: 0;
        }

        .tag-body { 
          padding: 14px 14px 10px; 
          display: flex; 
          flex-direction: column; 
          flex: 1; 
          gap: 8px;
        }

        .tag-name {
          font-family: 'Manrope', sans-serif;
          font-weight: 700;
          font-size: 14px;
          line-height: 1.3;
          color: var(--ink);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .tag-price-block {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 4px 0;
        }
        .tag-price {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: var(--gold);
          text-shadow: 0 0 8px rgba(255,179,0,0.45);
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .tag-price .rupee-symbol {
          font-size: 14px;
          opacity: 0.8;
          margin-right: 1px;
        }
        .tag-unit {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--ink-soft);
          font-weight: 500;
          white-space: nowrap;
        }
        .tag-unit .per-text {
          font-size: 10px;
          color: var(--muted);
        }

        .tag-stock {
          font-size: 12px;
          font-weight: 600;
          color: var(--muted);
          padding: 2px 0;
        }
        .tag-stock.high { color: var(--success); }
        .tag-stock.mid { color: var(--brass-deep); }
        .tag-stock.low { color: var(--danger); }
        .tag-stock.out { 
          color: var(--danger); 
          font-weight: 700;
          background: rgba(239,83,80,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        .tag-add-btn {
          margin-top: auto;
          width: 100%;
          padding: 9px 0;
          background: var(--text);
          color: var(--gold);
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          font-family: 'Manrope', sans-serif;
        }
        .tag-add-btn:hover:not(:disabled) { 
          background: linear-gradient(135deg, var(--gold), var(--brass-deep)); 
          color: var(--text);
        }
        .tag-add-btn:active:not(:disabled) { transform: scale(0.96); }
        .tag-add-btn:disabled {
          background: var(--steel-panel-2);
          color: var(--muted);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .tag-sku {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: var(--muted);
          padding: 2px 0 0;
          border-top: 1px solid var(--border);
          margin-top: 2px;
          opacity: 0.6;
          letter-spacing: 0.3px;
        }

        .no-products {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: var(--muted);
          font-weight: 500;
        }

        .search-result-count {
          font-size: 12px;
          color: var(--ink-soft);
          margin-bottom: 12px;
          font-family: 'JetBrains Mono', monospace;
        }

        /* ============ RIGHT: COUNTER DISPLAY PANEL ============ */
        .receipt-col {
          flex: 1;
          max-width: 408px;
          position: sticky;
          top: 26px;
        }
        .receipt {
          background: var(--panel-dark);
          border-radius: 16px;
          padding: 22px 22px 24px;
          color: var(--text-light);
          box-shadow: 0 20px 50px rgba(20,22,26,0.35);
          border: 1px solid var(--charcoal-line);
        }

        .receipt-store-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        .receipt-store {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 21px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #fff;
        }
        .receipt-inv {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .scale-display {
          margin-top: 14px;
          background: var(--panel-dark-2);
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid var(--charcoal-line);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
        }
        .scale-display .scale-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 4px;
          display: flex;
          justify-content: space-between;
        }
        .scale-display .scale-total {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          font-size: 40px;
          line-height: 1.1;
          color: var(--gold);
          text-shadow: 0 0 14px rgba(255,179,0,0.55), 0 0 2px rgba(255,179,0,0.8);
          letter-spacing: 1px;
        }
        .scale-display .scale-total .rupee { font-size: 22px; margin-right: 3px; opacity: 0.85; }
        .scale-display .scale-meta {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: var(--text-secondary);
        }

        .save-banner {
          background: var(--success);
          color: #fff;
          text-align: center;
          font-size: 12.5px;
          font-weight: 700;
          padding: 8px 0;
          border-radius: 7px;
          margin-top: 12px;
          animation: bannerIn 0.25s ease;
        }
        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .invoice-download-btn {
          width: 100%;
          margin-top: 8px;
          padding: 10px 0;
          background: var(--panel-dark-2);
          color: var(--gold);
          border: 1px solid var(--charcoal-line);
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.3px;
          transition: background 0.15s, border-color 0.15s;
        }
        .invoice-download-btn:hover {
          background: var(--charcoal-soft);
          border-color: var(--gold);
        }

        .receipt-dash {
          border: none;
          border-top: 1px dashed var(--charcoal-line);
          margin: 16px 0;
        }

        .customer-line label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 6px;
        }
        .customer-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: var(--text-light);
          font-family: 'JetBrains Mono', monospace;
          font-size: 14.5px;
          padding: 5px 2px;
          outline: none;
          transition: border-color 0.15s;
        }
        .customer-input:focus { border-bottom-color: var(--gold); }
        .customer-status {
          font-size: 11.5px;
          margin-top: 6px;
          font-weight: 600;
        }
        .status-found { color: var(--success); }
        .status-new { color: var(--text-secondary); }
        .status-searching { color: var(--gold); }
        .status-invalid { color: var(--danger); }

        .walkin-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: var(--panel-dark-2);
          border-radius: 6px;
          margin-top: 6px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .walkin-badge .icon { font-size: 18px; }

        .items-zone {
          min-height: 84px;
          max-height: 190px;
          overflow-y: auto;
          margin: 14px 0;
        }
        .items-zone::-webkit-scrollbar { width: 5px; }
        .items-zone::-webkit-scrollbar-thumb { background: var(--charcoal-line); border-radius: 6px; }
        .item-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .item-line:last-child { border-bottom: none; }
        .item-line .name-block { flex: 1; min-width: 0; }
        .item-line .name-block .nm {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
          font-weight: 600;
          color: var(--text-light);
        }
        .item-line .name-block .qty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: var(--text-secondary);
        }
        .item-line .qty-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .item-line .qty-btn {
          background: var(--panel-dark-2);
          border: 1px solid var(--charcoal-line);
          color: var(--text-light);
          border-radius: 4px;
          width: 22px;
          height: 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .item-line .qty-btn:hover { background: var(--charcoal-soft); }
        .item-line .qty-val {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
          color: var(--text-light);
        }
        .item-line .amt {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          color: var(--gold);
          white-space: nowrap;
          font-size: 12px;
          min-width: 60px;
          text-align: right;
        }
        .item-line .rm {
          background: none;
          border: none;
          color: var(--danger);
          font-weight: 700;
          cursor: pointer;
          padding: 0 0 0 6px;
          opacity: 0.75;
          font-size: 14px;
        }
        .item-line .rm:hover { opacity: 1; }
        .empty-receipt {
          text-align: center;
          color: var(--text-secondary);
          font-size: 12.5px;
          padding: 22px 0;
        }

        .totals-block { font-size: 12.5px; font-family: 'JetBrains Mono', monospace; }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          color: var(--text-secondary);
        }
        .totals-row .v { color: var(--text-light); font-weight: 600; }

        .field-pair { display: flex; gap: 12px; margin: 16px 0 14px; }
        .field-pair .fld { flex: 1; }
        .field-pair label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 4px;
        }
        .field-pair input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: var(--text-light);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          padding: 3px 0;
          outline: none;
        }
        .field-pair input:focus { border-bottom-color: var(--gold); }

        .pay-row { display: flex; gap: 6px; margin-bottom: 12px; }
        .pay-opt {
          flex: 1;
          padding: 8px 0;
          text-align: center;
          border: 1.5px solid var(--charcoal-line);
          background: transparent;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .pay-opt.active {
          border-color: var(--gold);
          background: linear-gradient(135deg, var(--gold), var(--brass-deep));
          color: var(--text);
        }

        .cash-change {
          background: var(--panel-dark-2);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 12px;
          border: 1px solid var(--charcoal-line);
        }
        .cash-change-row {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          padding: 2px 0;
        }
        .cash-change-row .lbl { color: var(--text-secondary); }
        .cash-change-row .val { color: var(--text-light); font-weight: 600; }
        .cash-change-row .val.change { color: var(--gold); }
        .cash-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid var(--charcoal-line);
          background: transparent;
          color: var(--text-light);
          font-family: 'JetBrains Mono', monospace;
          font-size: 14px;
          padding: 4px 2px;
          outline: none;
        }
        .cash-input:focus { border-bottom-color: var(--gold); }

        .receipt-actions { display: flex; gap: 8px; }
        .btn-clear {
          flex: 1;
          padding: 13px 0;
          background: transparent;
          border: 1.5px solid var(--danger);
          color: var(--danger);
          border-radius: 8px;
          font-weight: 700;
          font-size: 12.5px;
          cursor: pointer;
        }
        .btn-clear:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-settle {
          flex: 2.2;
          padding: 13px 0;
          background: linear-gradient(135deg, var(--gold), var(--brass-deep));
          color: var(--text);
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 13.5px;
          letter-spacing: 0.2px;
          cursor: pointer;
          font-family: 'Manrope', sans-serif;
          box-shadow: 0 4px 14px rgba(255,179,0,0.35);
        }
        .btn-settle:hover:not(:disabled) { filter: brightness(1.06); }
        .btn-settle:disabled { background: var(--charcoal-line); color: var(--text-secondary); box-shadow: none; cursor: not-allowed; }

        .scan-mode-toggle {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
          background: var(--panel-dark-2);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--charcoal-line);
        }
        .scan-mode-btn {
          flex: 1;
          padding: 5px 10px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .scan-mode-btn.active {
          background: var(--gold);
          color: var(--text);
        }
        .scan-mode-btn:hover:not(.active) { background: var(--charcoal-soft); }

        .shortcuts-hint {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #565C64;
          justify-content: center;
        }
        .shortcuts-hint kbd {
          background: var(--panel-dark-2);
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid var(--charcoal-line);
          font-size: 9px;
          color: var(--text-secondary);
        }

        /* ============ QTY MODAL ============ */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,17,20,0.62);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .qty-tag {
          background: var(--panel-dark);
          border-radius: 16px;
          padding: 24px;
          width: 400px;
          max-width: 100%;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          position: relative;
          border: 1px solid var(--charcoal-line);
          color: var(--text-light);
        }
        .qty-tag-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .qty-tag-head h3 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: #fff;
          margin: 0;
          padding-right: 12px;
        }
        .qty-close {
          background: none;
          border: none;
          font-size: 18px;
          color: var(--text-secondary);
          cursor: pointer;
          flex-shrink: 0;
        }
        .qty-rate {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0 0 18px;
        }
        .qty-rate b { color: var(--gold); font-weight: 700; }

        .qty-field { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .qty-field label { min-width: 68px; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
        .qty-input {
          flex: 1;
          padding: 9px 10px;
          border: 1.5px solid var(--charcoal-line);
          background: var(--panel-dark-2);
          border-radius: 8px;
          color: var(--text-light);
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          text-align: center;
          outline: none;
        }
        .qty-input:focus { border-color: var(--gold); }
        .qty-select {
          flex: 1;
          padding: 9px 10px;
          border: 1.5px solid var(--charcoal-line);
          background: var(--panel-dark-2);
          color: var(--text-light);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }

        .qty-preview {
          margin-top: 16px;
          background: var(--panel-dark-2);
          border-radius: 12px;
          padding: 4px;
          border: 1px solid var(--charcoal-line);
        }
        .qty-preview-rows { padding: 10px 12px 4px; }
        .qty-preview-row {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-secondary);
          padding: 3px 0;
        }
        .qty-preview-total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 12px 14px;
          margin-top: 6px;
          border-top: 1px dashed var(--charcoal-line);
        }
        .qty-preview-total .lbl {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9.5px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .qty-preview-total .val {
          font-family: 'Orbitron', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: var(--gold);
          text-shadow: 0 0 10px rgba(255,179,0,0.5);
        }

        .qty-stock-note {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
          text-align: right;
          margin-top: 8px;
        }
        .qty-footer { display: flex; gap: 10px; margin-top: 18px; }
        .qty-cancel {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: 1.5px solid var(--charcoal-line);
          border-radius: 9px;
          font-weight: 600;
          font-size: 13.5px;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .qty-confirm {
          flex: 2;
          padding: 12px;
          background: linear-gradient(135deg, var(--gold), var(--brass-deep));
          color: var(--text);
          border: none;
          border-radius: 9px;
          font-weight: 800;
          font-size: 13.5px;
          cursor: pointer;
        }
        .qty-confirm:hover { filter: brightness(1.06); }
        .qty-hint {
          text-align: center;
          margin-top: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 10.5px;
          color: #565C64;
        }

        /* ============ MANUAL QUANTITY BOX ============ */
        .manual-quantity-box {
          background: var(--panel-dark-2);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          border: 1px solid var(--charcoal-line);
          color: var(--text-light);
        }
        .manual-quantity-box h3 {
          font-family: 'Big Shoulders Display', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #fff;
          margin: 0 0 4px 0;
        }
        .manual-quantity-box p {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0 0 12px 0;
        }
        .manual-quantity-box p b {
          color: var(--gold);
        }
        .manual-quantity-box h2 {
          font-family: 'Orbitron', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--gold);
          text-shadow: 0 0 12px rgba(255,179,0,0.4);
          margin: 10px 0;
        }
        .manual-quantity-box .manual-input-group {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .manual-quantity-box .manual-input-group input {
          flex: 1;
          padding: 10px 12px;
          border: 1.5px solid var(--charcoal-line);
          background: var(--panel-dark);
          border-radius: 8px;
          color: var(--text-light);
          font-family: 'JetBrains Mono', monospace;
          font-size: 15px;
          outline: none;
        }
        .manual-quantity-box .manual-input-group input:focus {
          border-color: var(--gold);
        }
        .manual-quantity-box .manual-input-group select {
          padding: 10px 12px;
          border: 1.5px solid var(--charcoal-line);
          background: var(--panel-dark);
          color: var(--text-light);
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }
        .manual-quantity-box .manual-input-group select:focus {
          border-color: var(--gold);
        }
        .manual-add-btn {
          width: 100%;
          padding: 12px;
          margin-top: 12px;
          background: linear-gradient(135deg, var(--gold), var(--brass-deep));
          color: var(--text);
          border: none;
          border-radius: 8px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Manrope', sans-serif;
        }
        .manual-add-btn:hover {
          filter: brightness(1.06);
        }

        /* Product clickable for manual mode */
        .product-clickable {
          cursor: pointer;
        }
        .product-clickable:hover .price-tag {
          border-color: var(--gold);
          box-shadow: 0 0 0 2px rgba(255,179,0,0.3);
        }

        @media (max-width: 1100px) {
          .pos-layout { flex-direction: column; }
          .receipt-col { max-width: 100%; position: static; width: 100%; }
          .tag-grid { max-height: 480px; }
        }
        @media (max-width: 520px) {
          .pos-wrap { padding: 12px; }
          .tag-grid { 
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); 
            gap: 10px; 
          }
          .shelf-heading { font-size: 26px; }
          .scale-display .scale-total { font-size: 32px; }
          .status-right { display: none; }
          .tag-price { font-size: 17px; }
          .tag-name { font-size: 13px; }
        }
      `}</style>

      <div className="pos-wrap">
        {/* Status Bar - Now using real business name and dashboard data */}
        <div className="status-bar">
          <div className="status-left">
            <span className="status-brand">₹ {businessName.toUpperCase()} </span>
            <span className="status-online">ONLINE</span>
            <span style={{ color: '#6B7178' }}>Cashier: Admin</span>
          </div>
          <div className="status-right">
            <span className="status-data">
              <span className="label">Today:</span>
              <span className="value gold">
                ₹{Number(dashboard.todaySales).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </span>
            <span className="status-data">
              <span className="label">Bills:</span>
              <span className="value">{dashboard.todayBills || 0}</span>
            </span>
            <span>{currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <span style={{ color: 'var(--gold)' }}>
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        <div className="pos-layout">
          {/* LEFT: product shelf */}
          <div className="shelf-col">
            <div className="shelf-topbar">
              <div className="brand-block">
                <div className="brand-mark">₹</div>
                <div className="shelf-heading">
                  {businessName}
                  <span className="sub"></span>
                </div>
              </div>
              <div className="shelf-count">
                {products.length} PRODUCTS
                {search && ` · Showing ${filteredProducts.length} results`}
              </div>
            </div>

            <div className="shelf-search-row">
              <input
                id="search-input"
                className="shelf-search"
                placeholder="🔍 Search product / barcode / SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className={`voice-button ${isListening ? "voice-listening" : ""}`}
                onClick={startVoiceBilling}
              >
                {isListening ? "🔴 LISTENING" : "🎤 VOICE"}
              </button>
              <button className="shelf-scan" onClick={() => setShowScanner(true)}>
                📷 SCAN
              </button>
            </div>

            {/* Voice Status Display */}
            {(isListening || voiceText || voiceMessage) && (
              <div className="voice-status">
                <div className="voice-icon">
                  {isListening ? "🎤" : "🗣️"}
                </div>
                <div>
                  <div className="voice-title">
                    {isListening ? "Listening..." : "Voice Billing"}
                  </div>
                  <div className="voice-result">
                    {voiceText || voiceMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Category Filters */}
            <div className="category-filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="tag-grid">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const unit = product.price_unit || "pcs";
                const isOutOfStock = Number(product.stock) <= 0;
                const formattedPrice = formatPrice(product.selling_price);
                const pricePer = product.price_per || 1;
                
                return (
                  <div 
                    key={product.id} 
                    className="price-tag"
                  >
                    <div className="tag-brass-strip" />
                    <div className="tag-body">
                      <div className="tag-name">{product.product_name}</div>

                      <div className="tag-price-block">
                        <span className="tag-price">
                          <span className="rupee-symbol">₹</span>{formattedPrice}
                        </span>
                        <span className="tag-unit">
                          <span className="per-text">per</span> {pricePer} {formatUnitDisplay(unit)}
                        </span>
                      </div>

                      <div className={`tag-stock ${stockStatus.tone}`}>
                        {isOutOfStock ? '⚠ OUT OF STOCK' : stockStatus.text}
                      </div>

                      {/* ========== ALWAYS SHOW POPUP ========== */}
                      <button
                        className="tag-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isOutOfStock) return;
                          openQuantityModal(product);
                        }}
                        disabled={isOutOfStock}
                      >
                        {isOutOfStock ? 'SOLD OUT' : '+ ADD'}
                      </button>

                      {product.sku && (
                        <div className="tag-sku">SKU: {product.sku}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && <div className="no-products">No products found</div>}
            </div>
          </div>

          {/* RIGHT: digital counter display */}
          <div className="receipt-col">
            <div className="receipt">
              <div className="receipt-store-row">
                <span className="receipt-store">{businessName} </span>
                <span className="receipt-inv">{invoiceNo}</span>
              </div>

              <div className="scale-display">
                <div className="scale-label">
                  <span>BILL TOTAL</span>
                  <span>
                    {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    <span style={{ marginLeft: '8px', color: 'var(--gold)' }}>
                      {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                  </span>
                </div>
                <div className="scale-total">
                  <span className="rupee">₹</span>{grandTotal.toFixed(2)}
                </div>
                <div className="scale-meta">
                  <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  <span>{paymentMethod}</span>
                </div>
              </div>

              {saleComplete && <div className="save-banner">✓ Bill settled</div>}

              {/* Download / print the invoice for the last completed sale */}
              {lastInvoice && (
                <button
                  className="invoice-download-btn"
                  onClick={() => printInvoice(lastInvoice)}
                >
                  🧾 Download / Print Invoice ({lastInvoice.invoiceNo})
                </button>
              )}

              <hr className="receipt-dash" />

              <div className="customer-line">
                <label>Customer Phone <span style={{ fontWeight: 'normal', color: 'var(--text-secondary)' }}>(optional)</span></label>
                <input
                  className="customer-input"
                  placeholder="10-digit number or leave blank"
                  value={customerPhone}
                  onChange={(e) => {
                    const phone = e.target.value.replace(/\D/g, "");
                    setCustomerPhone(phone);
                    if (phone.length === 10) {
                      searchCustomer(phone);
                    } else {
                      setIsCustomerFound(false);
                      setCustomerId(null);
                      setCustomerName("");
                    }
                  }}
                  type="tel"
                  maxLength="10"
                />
                {customerPhone.length > 0 ? (
                  <div className="customer-status">
                    {isSearching ? (
                      <span className="status-searching">checking...</span>
                    ) : isCustomerFound ? (
                      <span className="status-found">✓ {customerName}</span>
                    ) : customerPhone.length === 10 ? (
                      <span className="status-new">new customer</span>
                    ) : (
                      <span className="status-invalid">enter 10 digits</span>
                    )}
                  </div>
                ) : (
                  <div className="walkin-badge">
                    <span className="icon">👤</span>
                    Walk-in Customer
                  </div>
                )}
              </div>

              <div className="items-zone">
                {cart.length === 0 ? (
                  <div className="empty-receipt">No items added yet</div>
                ) : (
                  cart.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="item-line">
                      <div className="name-block">
                        <span className="nm">{item.product_name}</span>
                        <span className="qty">
                          {formatUnitDisplay(item.unit)} · ₹{item.price_per_unit?.toFixed(2) || item.price?.toFixed(2) || "0.00"}/{formatUnitDisplay(item.base_unit || item.price_unit)}
                        </span>
                      </div>
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => changeQty(item.id, -1, item.unit)}>−</button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => changeQty(item.id, 1, item.unit)}>+</button>
                      </div>
                      <span className="amt">₹{(item.totalPrice || item.total || 0).toFixed(2)}</span>
                      <button className="rm" onClick={() => changeQty(item.id, 0, item.unit)}>✕</button>
                    </div>
                  ))
                )}
              </div>

              <hr className="receipt-dash" />

              <div className="totals-block">
                <div className="totals-row"><span>Subtotal</span><span className="v">₹{subtotal.toFixed(2)}</span></div>
                <div className="totals-row"><span>Discount ({discount}%)</span><span className="v">−₹{discountAmount.toFixed(2)}</span></div>
                <div className="totals-row"><span>Taxable</span><span className="v">₹{taxableAmount.toFixed(2)}</span></div>
                <div className="totals-row"><span>CGST ({(gst / 2).toFixed(0)}%)</span><span className="v">₹{cgst.toFixed(2)}</span></div>
                <div className="totals-row"><span>SGST ({(gst / 2).toFixed(0)}%)</span><span className="v">₹{sgst.toFixed(2)}</span></div>
              </div>

              <div className="field-pair">
                <div className="fld">
                  <label>Discount %</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} min="0" max="100" />
                </div>
                <div className="fld">
                  <label>GST %</label>
                  <input type="number" value={gst} onChange={(e) => setGst(Number(e.target.value))} min="0" max="100" />
                </div>
              </div>

              <div className="pay-row">
                <button
                  className={`pay-opt ${paymentMethod === "Cash" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Cash")}
                >
                  💵 Cash
                </button>
                <button
                  className={`pay-opt ${paymentMethod === "UPI" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("UPI")}
                >
                  📱 UPI
                </button>
                <button
                  className={`pay-opt ${paymentMethod === "Card" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("Card")}
                >
                  💳 Card
                </button>
              </div>

              {paymentMethod === "Cash" && (
                <div className="cash-change">
                  <div className="cash-change-row">
                    <span className="lbl">Bill Total</span>
                    <span className="val">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="cash-change-row" style={{ marginTop: '4px' }}>
                    <span className="lbl">Cash Received</span>
                    <input
                      id="cash-received"
                      className="cash-input"
                      type="number"
                      placeholder="0.00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      style={{ width: '120px', textAlign: 'right', display: 'inline-block' }}
                    />
                  </div>
                  {showChange && (
                    <div className="cash-change-row" style={{ marginTop: '4px', borderTop: '1px dashed var(--charcoal-line)', paddingTop: '4px' }}>
                      <span className="lbl">Change</span>
                      <span className="val change">₹{change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="scan-mode-toggle">
                <button
                  className={`scan-mode-btn ${scanMode === "quick" ? "active" : ""}`}
                  onClick={() => setScanMode("quick")}
                >
                  ⚡ Quick Add
                </button>
                <button
                  className={`scan-mode-btn ${scanMode === "ask" ? "active" : ""}`}
                  onClick={() => {
                    setScanMode("ask");
                    setManualSelectedProduct(null);
                  }}
                >
                  📋 Ask Quantity
                </button>
              </div>

              <div className="receipt-actions">
                <button className="btn-clear" onClick={clearCart} disabled={cart.length === 0}>Clear</button>
                <button
                  className="btn-settle"
                  onClick={saveSale}
                  disabled={cart.length === 0 || !isPhoneValid}
                >
                  Settle ₹{grandTotal.toFixed(2)}
                </button>
              </div>

              <div className="shortcuts-hint">
                <span><kbd>F2</kbd> Search</span>
                <span><kbd>F4</kbd> Scan</span>
                <span><kbd>F8</kbd> Cash</span>
                <span><kbd>Ctrl+Enter</kbd> Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantity modal */}
      {showQtyModal && selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowQtyModal(false);
            setSelectedProduct(null);
            setQuantity(1);
            setSelectedUnit("pcs");
          }}
        >
          <div className="qty-tag" onClick={(e) => e.stopPropagation()}>
            <div className="qty-tag-head">
              <h3>{selectedProduct.product_name}</h3>
              <button
                className="qty-close"
                onClick={() => {
                  setShowQtyModal(false);
                  setSelectedProduct(null);
                  setQuantity(1);
                  setSelectedUnit("pcs");
                }}
              >
                ✕
              </button>
            </div>
            <div className="qty-rate">
              <b>₹{formatPrice(selectedProduct.selling_price)}</b> per {selectedProduct.price_per || 1} {formatUnitDisplay(selectedProduct.price_unit || "pcs")}
            </div>

            <div className="qty-field">
              <label>Quantity</label>
              <input
                ref={quantityInputRef}
                className="qty-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                onKeyDown={handleKeyPress}
                min="0.01"
                max={selectedProduct.stock}
                step="0.01"
              />
            </div>

            <div className="qty-field">
              <label>Unit</label>
              <select
                className="qty-select"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                {getCompatibleUnits(selectedProduct.price_unit || "pcs").map((unit) => (
                  <option key={unit} value={unit}>{formatUnitDisplay(unit)}</option>
                ))}
              </select>
            </div>

            <div className="qty-preview">
              <div className="qty-preview-rows">
                <div className="qty-preview-row">
                  <span>Quantity</span>
                  <span>{quantity} {formatUnitDisplay(selectedUnit)}</span>
                </div>
                {selectedUnit !== (selectedProduct.price_unit || "pcs") && (
                  <div className="qty-preview-row">
                    <span>Converted</span>
                    <span>
                      {calculateLivePrice().displayQuantity.toFixed(2)}{" "}
                      {formatUnitDisplay(calculateLivePrice().displayUnit)}
                    </span>
                  </div>
                )}
                <div className="qty-preview-row">
                  <span>Rate</span>
                  <span>
                    ₹{formatPrice(selectedProduct.selling_price)} / {selectedProduct.price_per || 1}{" "}
                    {formatUnitDisplay(selectedProduct.price_unit || "pcs")}
                  </span>
                </div>
              </div>
              <div className="qty-preview-total">
                <span className="lbl">Total</span>
                <span className="val">₹{liveTotalDigits}</span>
              </div>
            </div>

            <div className="qty-stock-note">
              {selectedProduct.stock} {formatUnitDisplay(selectedProduct.price_unit || "pcs")} available
            </div>

            <div className="qty-footer">
              <button
                className="qty-cancel"
                onClick={() => {
                  setShowQtyModal(false);
                  setSelectedProduct(null);
                  setQuantity(1);
                  setSelectedUnit("pcs");
                }}
              >
                Cancel
              </button>
              <button className="qty-confirm" onClick={addToCartWithQuantity}>
                Add to Bill
              </button>
            </div>
            <div className="qty-hint"><kbd>Enter</kbd> to add · <kbd>Esc</kbd> to cancel</div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal - FIXED: removed businessId prop */}
      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onProductFound={(product) => {
            setShowScanner(false);
            openQuantityModal(product);
          }}
        />
      )}
    </>
  );
}