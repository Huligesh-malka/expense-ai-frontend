
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

  // NEW: Prevent duplicate sale submissions
  const [savingSale, setSavingSale] = useState(false);

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
        if (cart.length > 0 && !savingSale) {
          saveSale();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [cart, savingSale]);

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

    // delta === 0 is used by the remove button.
    if (delta === 0) {
      setCart(cart.filter((i) => !(i.id === id && i.unit === unit)));
      return;
    }

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

  // Save sale - FIXED: removed business_id from payload, added duplicate protection
  const saveSale = async () => {
    // Prevent duplicate submissions
    if (savingSale || cart.length === 0) return;

    setSavingSale(true);

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
    } finally {
      setSavingSale(false);
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

        :root {
          --pos-bg:#f6f7fb;
          --surface:#ffffff;
          --surface-2:#f0f2f7;
          --ink:#171a24;
          --muted:#73798b;
          --line:#e4e7ef;
          --primary:#635bff;
          --primary-dark:#5148e8;
          --primary-soft:#eeedff;
          --green:#18a66b;
          --green-soft:#e7f8f0;
          --orange:#f59e0b;
          --orange-soft:#fff5df;
          --red:#e5484d;
          --red-soft:#fff0f1;
          --blue:#1683f8;
          --blue-soft:#eaf4ff;
          --shadow:0 10px 30px rgba(24,31,56,.07);
          --shadow-lg:0 20px 60px rgba(24,31,56,.12);
        }

        * { box-sizing:border-box; }
        button,input,select { font:inherit; }
        button { -webkit-tap-highlight-color:transparent; }

        .retail-pos {
          min-height:100vh;
          background:
            radial-gradient(circle at 8% 0%, rgba(99,91,255,.08), transparent 28%),
            radial-gradient(circle at 92% 15%, rgba(22,131,248,.06), transparent 24%),
            var(--pos-bg);
          color:var(--ink);
          font-family:'DM Sans',sans-serif;
          padding:18px;
        }

        .pos-shell { max-width:1600px; margin:0 auto; }

        .topbar {
          background:rgba(255,255,255,.92);
          backdrop-filter:blur(18px);
          border:1px solid rgba(228,231,239,.9);
          border-radius:20px;
          min-height:72px;
          padding:12px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          box-shadow:var(--shadow);
          position:sticky;
          top:12px;
          z-index:20;
        }

        .brand-area { display:flex; align-items:center; gap:12px; min-width:0; }
        .brand-logo {
          width:46px; height:46px; border-radius:14px;
          display:grid; place-items:center;
          color:white; font-size:20px; font-weight:800;
          background:linear-gradient(135deg,var(--primary),#8b84ff);
          box-shadow:0 8px 20px rgba(99,91,255,.28);
          flex:0 0 auto;
        }
        .brand-copy { min-width:0; }
        .brand-name {
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:17px; font-weight:800;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
          max-width:260px;
        }
        .brand-sub { font-size:11px; color:var(--muted); margin-top:2px; }

        .top-actions { display:flex; align-items:center; gap:8px; }
        .online-pill,.top-stat {
          display:flex; align-items:center; gap:7px;
          border:1px solid var(--line); background:var(--surface);
          border-radius:12px; padding:9px 11px; font-size:12px;
        }
        .online-dot { width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 4px var(--green-soft); }
        .top-stat strong { font-size:13px; }
        .top-stat .label { color:var(--muted); }

        .dashboard-strip {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:12px;
          margin:16px 0;
        }
        .mini-card {
          background:var(--surface);
          border:1px solid var(--line);
          border-radius:16px;
          padding:14px 16px;
          display:flex; justify-content:space-between; align-items:center;
          box-shadow:0 4px 18px rgba(24,31,56,.04);
        }
        .mini-label { color:var(--muted); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.6px; }
        .mini-value { font-family:'Plus Jakarta Sans',sans-serif; font-size:19px; font-weight:800; margin-top:3px; }
        .mini-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; font-size:17px; }
        .mini-icon.purple { background:var(--primary-soft); }
        .mini-icon.green { background:var(--green-soft); }
        .mini-icon.orange { background:var(--orange-soft); }
        .mini-icon.blue { background:var(--blue-soft); }

        .main-grid {
          display:grid;
          grid-template-columns:minmax(0,1fr) 430px;
          gap:16px;
          align-items:start;
        }

        .catalog-panel,.checkout-panel {
          background:var(--surface);
          border:1px solid var(--line);
          border-radius:22px;
          box-shadow:var(--shadow);
        }
        .catalog-panel { padding:18px; min-width:0; }
        .checkout-panel {
          position:sticky; top:100px;
          overflow:hidden;
          box-shadow:var(--shadow-lg);
        }

        .catalog-head {
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:16px; margin-bottom:14px;
        }
        .eyebrow {
          color:var(--primary); font-size:11px; font-weight:800;
          text-transform:uppercase; letter-spacing:1.4px;
        }
        .catalog-title {
          margin:4px 0 0;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:25px; font-weight:800; letter-spacing:-.7px;
        }
        .catalog-desc { color:var(--muted); font-size:12px; margin-top:4px; }

        .search-row { display:flex; gap:9px; margin-bottom:12px; }
        .search-wrap { position:relative; flex:1; }
        .search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--muted); }
        .main-search {
          width:100%; height:48px; padding:0 16px 0 42px;
          border:1px solid var(--line); border-radius:13px; outline:none;
          background:#fbfcfe; color:var(--ink);
          transition:.18s;
        }
        .main-search:focus { border-color:var(--primary); box-shadow:0 0 0 4px rgba(99,91,255,.10); background:white; }
        .tool-btn {
          height:48px; border:1px solid var(--line); background:white; color:var(--ink);
          border-radius:13px; padding:0 15px; cursor:pointer; font-weight:700;
          display:flex; align-items:center; gap:7px; transition:.18s;
        }
        .tool-btn:hover { transform:translateY(-1px); border-color:#cdd1dc; box-shadow:0 7px 16px rgba(24,31,56,.07); }
        .tool-btn.primary { background:var(--ink); color:white; border-color:var(--ink); }

        .voice-banner {
          background:linear-gradient(135deg,#181b2a,#292d43);
          color:white; border-radius:15px; padding:11px 14px; margin-bottom:12px;
          display:flex; align-items:center; gap:10px;
        }
        .voice-orb {
          width:34px; height:34px; border-radius:11px; display:grid; place-items:center;
          background:rgba(255,255,255,.1);
        }
        .voice-banner strong { display:block; font-size:12px; }
        .voice-banner span { color:#b8bdd0; font-size:11px; }
        .voice-stop { margin-left:auto; border:0; background:#ff4d57; color:white; border-radius:9px; padding:7px 10px; cursor:pointer; font-size:11px; font-weight:700; }

        .category-row {
          display:flex; gap:7px; overflow-x:auto; padding:2px 0 12px;
          scrollbar-width:none;
        }
        .category-row::-webkit-scrollbar { display:none; }
        .category-pill {
          border:1px solid var(--line); background:#fff; color:#686f80;
          border-radius:999px; padding:8px 13px; white-space:nowrap;
          cursor:pointer; font-size:12px; font-weight:700; transition:.15s;
        }
        .category-pill:hover { border-color:#c8c4ff; color:var(--primary); }
        .category-pill.active { background:var(--primary); color:#fff; border-color:var(--primary); box-shadow:0 6px 14px rgba(99,91,255,.2); }

        .catalog-meta { display:flex; justify-content:space-between; align-items:center; margin:2px 2px 10px; }
        .result-count { color:var(--muted); font-size:11px; font-weight:600; }

        .product-grid {
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(185px,1fr));
          gap:11px;
          max-height:calc(100vh - 345px);
          min-height:300px;
          overflow:auto;
          padding:2px 3px 10px 2px;
        }
        .product-grid::-webkit-scrollbar { width:6px; }
        .product-grid::-webkit-scrollbar-thumb { background:#d8dce5; border-radius:10px; }

        .product-card {
          border:1px solid var(--line); border-radius:17px; background:#fff;
          padding:13px; min-height:194px; display:flex; flex-direction:column;
          cursor:pointer; position:relative; overflow:hidden; transition:.18s;
        }
        .product-card::after {
          content:''; position:absolute; width:70px; height:70px; border-radius:50%;
          background:var(--primary-soft); right:-35px; top:-35px; opacity:.7;
        }
        .product-card:hover { transform:translateY(-3px); border-color:#c8c4ff; box-shadow:0 13px 26px rgba(24,31,56,.09); }
        .product-card.out { opacity:.62; cursor:not-allowed; }
        .product-top { display:flex; justify-content:space-between; gap:7px; position:relative; z-index:1; }
        .product-avatar {
          width:40px; height:40px; border-radius:12px; display:grid; place-items:center;
          background:var(--primary-soft); color:var(--primary); font-weight:800; font-size:15px;
        }
        .stock-pill { font-size:9px; font-weight:800; padding:5px 7px; border-radius:999px; height:max-content; }
        .stock-pill.high { background:var(--green-soft); color:var(--green); }
        .stock-pill.mid { background:var(--orange-soft); color:#b66c00; }
        .stock-pill.low,.stock-pill.out { background:var(--red-soft); color:var(--red); }
        .product-name { font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; line-height:1.35; font-weight:700; margin:12px 0 5px; min-height:35px; }
        .product-sku { font-size:9px; color:#9aa0ae; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .product-bottom { margin-top:auto; display:flex; justify-content:space-between; align-items:end; gap:8px; }
        .product-price { font-family:'Plus Jakarta Sans',sans-serif; font-size:17px; font-weight:800; }
        .product-rate { color:var(--muted); font-size:9px; margin-top:2px; }
        .add-circle {
          width:35px; height:35px; border:0; border-radius:11px; cursor:pointer;
          background:var(--ink); color:white; font-size:19px; display:grid; place-items:center;
          transition:.15s;
        }
        .add-circle:hover:not(:disabled) { background:var(--primary); transform:scale(1.05); }
        .add-circle:disabled { background:#e6e8ee; color:#999; cursor:not-allowed; }

        .checkout-head {
          padding:18px 18px 14px; color:white;
          background:linear-gradient(135deg,#171a27,#272c42);
        }
        .checkout-title-row { display:flex; justify-content:space-between; align-items:center; }
        .checkout-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:17px; font-weight:800; }
        .invoice-tag { color:#b8bdd0; font-size:10px; }
        .total-label { color:#aeb4c6; text-transform:uppercase; letter-spacing:1.3px; font-size:9px; margin-top:17px; }
        .grand-total { font-family:'Plus Jakarta Sans',sans-serif; font-size:34px; font-weight:800; letter-spacing:-1.3px; margin-top:2px; }
        .checkout-meta { display:flex; gap:7px; margin-top:8px; flex-wrap:wrap; }
        .meta-chip { padding:5px 8px; border-radius:7px; background:rgba(255,255,255,.08); color:#d3d6e1; font-size:9px; }

        .checkout-body { padding:14px; }
        .customer-box { background:#f8f9fc; border:1px solid var(--line); border-radius:13px; padding:10px; margin-bottom:11px; }
        .field-label { display:block; color:#73798b; font-size:10px; font-weight:700; margin-bottom:6px; }
        .customer-input {
          width:100%; height:38px; border:1px solid var(--line); border-radius:9px;
          background:white; padding:0 10px; outline:none; font-size:12px;
        }
        .customer-input:focus { border-color:var(--primary); }
        .customer-status { font-size:10px; margin-top:6px; }
        .status-found { color:var(--green); font-weight:700; }
        .status-new { color:var(--primary); }
        .status-invalid { color:var(--red); }
        .status-searching { color:var(--muted); }
        .walkin { margin-top:7px; font-size:10px; color:var(--muted); }

        .bill-items { max-height:255px; overflow:auto; margin:0 -3px; padding:0 3px; }
        .bill-items::-webkit-scrollbar { width:4px; }
        .bill-items::-webkit-scrollbar-thumb { background:#d9dce5; border-radius:10px; }
        .bill-empty {
          border:1px dashed #d8dce5; border-radius:14px; padding:30px 15px;
          text-align:center; color:var(--muted); font-size:11px;
        }
        .empty-icon { font-size:26px; opacity:.65; margin-bottom:7px; }
        .bill-item {
          display:grid; grid-template-columns:minmax(0,1fr) auto auto;
          gap:8px; align-items:center; padding:10px 3px;
          border-bottom:1px solid #f0f1f5;
        }
        .bill-name { font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .bill-rate { color:var(--muted); font-size:9px; margin-top:2px; }
        .qty-control { display:flex; align-items:center; gap:5px; background:#f4f5f8; border-radius:9px; padding:3px; }
        .qty-control button { border:0; width:22px; height:22px; border-radius:6px; background:white; cursor:pointer; font-weight:800; }
        .qty-control span { min-width:20px; text-align:center; font-size:10px; font-weight:800; }
        .bill-amount { font-size:11px; font-weight:800; min-width:57px; text-align:right; }
        .remove-item { border:0; background:transparent; color:#b5b9c4; cursor:pointer; font-size:12px; }

        .summary {
          border-top:1px dashed #dfe2e9; margin-top:10px; padding-top:10px;
        }
        .summary-row { display:flex; justify-content:space-between; color:#707688; font-size:10px; margin:6px 0; }
        .summary-row strong { color:var(--ink); }
        .settings-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0; }
        .small-field label { display:block; color:var(--muted); font-size:9px; font-weight:700; margin-bottom:5px; }
        .small-field input {
          width:100%; height:34px; border:1px solid var(--line); border-radius:8px;
          padding:0 9px; outline:none; font-size:11px;
        }
        .small-field input:focus { border-color:var(--primary); }

        .payment-row { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin:10px 0; }
        .payment-btn {
          border:1px solid var(--line); background:white; border-radius:9px; height:34px;
          cursor:pointer; font-size:10px; font-weight:700; color:#6e7484;
        }
        .payment-btn.active { background:var(--primary-soft); color:var(--primary); border-color:#c8c4ff; }

        .cash-box { background:#f8f9fc; border:1px solid var(--line); border-radius:11px; padding:9px; margin-bottom:10px; }
        .cash-line { display:flex; align-items:center; justify-content:space-between; font-size:10px; color:var(--muted); }
        .cash-input { width:110px; height:30px; border:1px solid var(--line); border-radius:7px; text-align:right; padding:0 8px; outline:none; background:white; }
        .change-value { color:var(--green); font-weight:800; }

        .mode-row { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-bottom:9px; }
        .mode-btn {
          height:34px; border:1px solid var(--line); background:white; border-radius:9px;
          cursor:pointer; color:#727889; font-size:10px; font-weight:700;
        }
        .mode-btn.active { background:#171a27; color:white; border-color:#171a27; }

        .action-row { display:grid; grid-template-columns:90px 1fr; gap:7px; }
        .clear-btn,.settle-btn { height:46px; border-radius:11px; cursor:pointer; font-weight:800; }
        .clear-btn { background:white; color:#73798b; border:1px solid var(--line); }
        .clear-btn:disabled { opacity:.45; cursor:not-allowed; }
        .settle-btn {
          border:0; color:white; background:linear-gradient(135deg,var(--primary),var(--primary-dark));
          box-shadow:0 9px 20px rgba(99,91,255,.23); font-size:13px;
        }
        .settle-btn:disabled { opacity:.45; box-shadow:none; cursor:not-allowed; }

        .invoice-btn {
          width:100%; height:34px; margin-bottom:9px; border:1px solid #c8c4ff;
          background:var(--primary-soft); color:var(--primary); border-radius:9px;
          cursor:pointer; font-size:10px; font-weight:800;
        }
        .success-banner {
          padding:9px 10px; border-radius:9px; background:var(--green-soft); color:var(--green);
          font-size:10px; font-weight:800; margin-bottom:9px;
        }
        .shortcuts { display:flex; justify-content:center; gap:9px; flex-wrap:wrap; color:#9aa0ae; font-size:8px; margin-top:10px; }
        kbd { background:#f0f1f5; border:1px solid #dfe2e9; padding:2px 4px; border-radius:4px; color:#697080; }

        .modal-overlay {
          position:fixed; inset:0; background:rgba(12,15,24,.58); backdrop-filter:blur(5px);
          display:grid; place-items:center; padding:20px; z-index:100;
        }
        .qty-modal {
          width:min(430px,100%); background:white; border-radius:22px; box-shadow:0 30px 90px rgba(0,0,0,.28);
          overflow:hidden;
        }
        .qty-modal-head { padding:18px; background:linear-gradient(135deg,#171a27,#272c42); color:white; display:flex; justify-content:space-between; gap:10px; }
        .qty-modal-head h3 { margin:0; font-family:'Plus Jakarta Sans',sans-serif; font-size:17px; }
        .qty-close { border:0; background:rgba(255,255,255,.1); color:white; width:32px; height:32px; border-radius:9px; cursor:pointer; }
        .qty-modal-body { padding:18px; }
        .qty-rate { color:var(--muted); font-size:11px; margin-bottom:14px; }
        .qty-rate b { color:var(--primary); font-size:16px; }
        .qty-field { margin-bottom:12px; }
        .qty-field label { display:block; color:var(--muted); font-size:10px; font-weight:800; margin-bottom:6px; }
        .qty-input,.qty-select { width:100%; height:42px; border:1px solid var(--line); border-radius:10px; padding:0 11px; outline:none; background:white; }
        .qty-input:focus,.qty-select:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(99,91,255,.09); }
        .qty-preview { background:#f7f8fb; border-radius:13px; padding:12px; margin-top:12px; }
        .qty-preview-row { display:flex; justify-content:space-between; color:var(--muted); font-size:10px; margin:5px 0; }
        .qty-preview-row span:last-child { color:var(--ink); font-weight:700; }
        .qty-total { border-top:1px dashed #d8dce5; margin-top:9px; padding-top:10px; display:flex; justify-content:space-between; align-items:center; }
        .qty-total strong { font-family:'Plus Jakarta Sans',sans-serif; color:var(--primary); font-size:24px; }
        .stock-note { color:var(--green); font-size:10px; font-weight:700; margin:10px 0; }
        .modal-actions { display:grid; grid-template-columns:1fr 1.5fr; gap:8px; margin-top:13px; }
        .modal-actions button { height:42px; border-radius:10px; cursor:pointer; font-weight:800; border:1px solid var(--line); }
        .modal-cancel { background:white; color:var(--muted); }
        .modal-confirm { background:var(--primary); color:white; border-color:var(--primary)!important; }

        @media(max-width:1150px) {
          .main-grid { grid-template-columns:1fr; }
          .checkout-panel { position:relative; top:auto; }
          .product-grid { max-height:none; }
          .dashboard-strip { grid-template-columns:repeat(2,1fr); }
        }
        @media(max-width:700px) {
          .retail-pos { padding:9px; }
          .topbar { top:5px; border-radius:15px; }
          .top-stat,.online-pill { display:none; }
          .catalog-panel { padding:12px; border-radius:17px; }
          .catalog-head { align-items:flex-start; }
          .catalog-title { font-size:21px; }
          .search-row { flex-wrap:wrap; }
          .search-wrap { flex-basis:100%; }
          .tool-btn { flex:1; justify-content:center; }
          .dashboard-strip { grid-template-columns:1fr 1fr; gap:8px; }
          .mini-card { padding:10px; }
          .mini-value { font-size:15px; }
          .product-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
          .product-card { min-height:180px; padding:10px; }
          .checkout-panel { border-radius:17px; }
        }
      `}</style>

      <div className="retail-pos">
        <div className="pos-shell">
          <header className="topbar">
            <div className="brand-area">
              <div className="brand-logo">₹</div>
              <div className="brand-copy">
                <div className="brand-name">{businessName}</div>
                <div className="brand-sub">Retail billing workspace · {invoiceNo}</div>
              </div>
            </div>
            <div className="top-actions">
              <div className="online-pill"><span className="online-dot" /> Online</div>
              <div className="top-stat"><span className="label">Today</span><strong>₹{Number(dashboard.todaySales || 0).toLocaleString("en-IN")}</strong></div>
              <div className="top-stat"><span className="label">Bills</span><strong>{dashboard.todayBills || 0}</strong></div>
            </div>
          </header>

          <section className="dashboard-strip">
            <div className="mini-card">
              <div><div className="mini-label">Today Sales</div><div className="mini-value">₹{Number(dashboard.todaySales || 0).toLocaleString("en-IN",{maximumFractionDigits:0})}</div></div>
              <div className="mini-icon purple">↗</div>
            </div>
            <div className="mini-card">
              <div><div className="mini-label">Monthly Sales</div><div className="mini-value">₹{Number(dashboard.monthSales || 0).toLocaleString("en-IN",{maximumFractionDigits:0})}</div></div>
              <div className="mini-icon green">₹</div>
            </div>
            <div className="mini-card">
              <div><div className="mini-label">Customers</div><div className="mini-value">{dashboard.totalCustomers || 0}</div></div>
              <div className="mini-icon blue">◉</div>
            </div>
            <div className="mini-card">
              <div><div className="mini-label">Low Stock</div><div className="mini-value">{dashboard.lowStock || 0}</div></div>
              <div className="mini-icon orange">!</div>
            </div>
          </section>

          <div className="main-grid">
            <section className="catalog-panel">
              <div className="catalog-head">
                <div>
                  <div className="eyebrow">Smart counter</div>
                  <h1 className="catalog-title">Build a new bill</h1>
                  <div className="catalog-desc">Search, scan or speak. Tap any product to add it.</div>
                </div>
                <div className="result-count">{products.length} products</div>
              </div>

              <div className="search-row">
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input
                    id="search-input"
                    className="main-search"
                    placeholder="Search product, barcode or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="tool-btn" onClick={startVoiceBilling}>
                  {isListening ? "🔴 Listening" : "🎤 Voice"}
                </button>
                <button className="tool-btn primary" onClick={() => setShowScanner(true)}>▣ Scan</button>
              </div>

              {(isListening || voiceText || voiceMessage) && (
                <div className="voice-banner">
                  <div className="voice-orb">{isListening ? "🎙️" : "🗣️"}</div>
                  <div>
                    <strong>{isListening ? "Voice billing is active" : "Voice result"}</strong>
                    <span>{voiceText || voiceMessage}</span>
                  </div>
                  {isListening && <button className="voice-stop" onClick={stopVoiceBilling}>Stop</button>}
                </div>
              )}

              <div className="category-row">
                {categories.map((cat) => (
                  <button key={cat} className={`category-pill ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>

              <div className="catalog-meta">
                <span className="result-count">{search ? `${filteredProducts.length} matching products` : "Popular products"}</span>
                <span className="result-count">{selectedCategory}</span>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const unit = product.price_unit || "pcs";
                  const out = Number(product.stock) <= 0;
                  const initial = String(product.product_name || "?").trim().charAt(0).toUpperCase();
                  return (
                    <div key={product.id} className={`product-card ${out ? "out" : ""}`} onClick={() => {
                        if (out) return;
                        scanMode === "quick" ? quickAddToCart(product) : openQuantityModal(product);
                      }}>
                      <div className="product-top">
                        <div className="product-avatar">{initial}</div>
                        <span className={`stock-pill ${stockStatus.tone}`}>{out ? "OUT" : stockStatus.text}</span>
                      </div>
                      <div className="product-name">{product.product_name}</div>
                      {product.sku && <div className="product-sku">SKU · {product.sku}</div>}
                      <div className="product-bottom">
                        <div>
                          <div className="product-price">₹{formatPrice(product.selling_price)}</div>
                          <div className="product-rate">per {product.price_per || 1} {formatUnitDisplay(unit)}</div>
                        </div>
                        <button className="add-circle" disabled={out} onClick={(e) => {
                            e.stopPropagation();
                            if (!out) {
                              scanMode === "quick" ? quickAddToCart(product) : openQuantityModal(product);
                            }
                          }}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filteredProducts.length === 0 && <div className="bill-empty" style={{gridColumn:"1 / -1"}}>No products found. Try another name, barcode or SKU.</div>}
              </div>
            </section>

            <aside className="checkout-panel">
              <div className="checkout-head">
                <div className="checkout-title-row">
                  <div className="checkout-title">Current Bill</div>
                  <div className="invoice-tag">{invoiceNo}</div>
                </div>
                <div className="total-label">Amount to collect</div>
                <div className="grand-total">₹{grandTotal.toFixed(2)}</div>
                <div className="checkout-meta">
                  <span className="meta-chip">{cart.reduce((sum,item)=>sum+item.quantity,0)} items</span>
                  <span className="meta-chip">{paymentMethod}</span>
                  <span className="meta-chip">{currentTime.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span>
                </div>
              </div>

              <div className="checkout-body">
                {saleComplete && <div className="success-banner">✓ Bill saved successfully</div>}

                {lastInvoice && (
                  <button className="invoice-btn" onClick={() => printInvoice(lastInvoice)}>🧾 Print / Save last invoice · {lastInvoice.invoiceNo}</button>
                )}

                <div className="customer-box">
                  <label className="field-label">Customer phone <span style={{fontWeight:400}}>(optional)</span></label>
                  <input
                    className="customer-input"
                    placeholder="Enter 10-digit number"
                    value={customerPhone}
                    onChange={(e) => {
                      const phone = e.target.value.replace(/\D/g,"");
                      setCustomerPhone(phone);
                      if (phone.length === 10) searchCustomer(phone);
                      else { setIsCustomerFound(false); setCustomerId(null); setCustomerName(""); }
                    }}
                    type="tel"
                    maxLength="10"
                  />
                  {customerPhone ? (
                    <div className="customer-status">
                      {isSearching ? <span className="status-searching">Checking customer...</span> :
                       isCustomerFound ? <span className="status-found">✓ {customerName}</span> :
                       customerPhone.length === 10 ? <span className="status-new">New customer</span> :
                       <span className="status-invalid">Enter 10 digits</span>}
                    </div>
                  ) : <div className="walkin">👤 Walk-in Customer</div>}
                </div>

                <div className="bill-items">
                  {cart.length === 0 ? (
                    <div className="bill-empty">
                      <div className="empty-icon">🛒</div>
                      <strong>Your bill is empty</strong>
                      <div style={{marginTop:4}}>Select products from the catalog</div>
                    </div>
                  ) : cart.map((item,index) => (
                    <div key={`${item.id}-${index}`} className="bill-item">
                      <div>
                        <div className="bill-name">{item.product_name}</div>
                        <div className="bill-rate">₹{(item.price_per_unit || 0).toFixed(2)} / {formatUnitDisplay(item.base_unit || item.unit)}</div>
                      </div>
                      <div className="qty-control">
                        <button onClick={() => changeQty(item.id,-1,item.unit)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => changeQty(item.id,1,item.unit)}>+</button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:3}}>
                        <span className="bill-amount">₹{(item.totalPrice || 0).toFixed(2)}</span>
                        <button className="remove-item" onClick={() => changeQty(item.id,0,item.unit)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="summary">
                  <div className="summary-row"><span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong></div>
                  <div className="summary-row"><span>Discount ({discount}%)</span><strong>−₹{discountAmount.toFixed(2)}</strong></div>
                  <div className="summary-row"><span>Taxable</span><strong>₹{taxableAmount.toFixed(2)}</strong></div>
                  <div className="summary-row"><span>CGST + SGST ({gst}%)</span><strong>₹{taxAmount.toFixed(2)}</strong></div>
                </div>

                <div className="settings-row">
                  <div className="small-field"><label>Discount %</label><input type="number" value={discount} min="0" max="100" onChange={(e)=>setDiscount(Number(e.target.value))}/></div>
                  <div className="small-field"><label>GST %</label><input type="number" value={gst} min="0" max="100" onChange={(e)=>setGst(Number(e.target.value))}/></div>
                </div>

                <div className="payment-row">
                  {["Cash","UPI","Card"].map((method)=>(
                    <button key={method} className={`payment-btn ${paymentMethod===method ? "active" : ""}`} onClick={()=>setPaymentMethod(method)}>
                      {method==="Cash" ? "💵" : method==="UPI" ? "📱" : "💳"} {method}
                    </button>
                  ))}
                </div>

                {paymentMethod === "Cash" && (
                  <div className="cash-box">
                    <div className="cash-line"><span>Cash received</span><input id="cash-received" className="cash-input" type="number" placeholder="0.00" value={cashReceived} onChange={(e)=>setCashReceived(e.target.value)}/></div>
                    {showChange && <div className="cash-line" style={{marginTop:7}}><span>Change</span><span className="change-value">₹{change.toFixed(2)}</span></div>}
                  </div>
                )}

                <div className="mode-row">
                  <button className={`mode-btn ${scanMode==="quick" ? "active" : ""}`} onClick={()=>setScanMode("quick")}>⚡ Quick add</button>
                  <button className={`mode-btn ${scanMode==="ask" ? "active" : ""}`} onClick={()=>{setScanMode("ask");setManualSelectedProduct(null);}}>📋 Ask quantity</button>
                </div>

                <div className="action-row">
                  <button className="clear-btn" onClick={clearCart} disabled={!cart.length}>Clear</button>
                  <button className="settle-btn" onClick={saveSale} disabled={savingSale || !cart.length || !isPhoneValid}>
                    {savingSale ? "Saving..." : `Complete bill · ₹${grandTotal.toFixed(2)}`}
                  </button>
                </div>

                <div className="shortcuts">
                  <span><kbd>F2</kbd> Search</span><span><kbd>F4</kbd> Scan</span><span><kbd>F8</kbd> Cash</span><span><kbd>Ctrl+Enter</kbd> Pay</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showQtyModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => {setShowQtyModal(false);setSelectedProduct(null);setQuantity(1);setSelectedUnit("pcs");}}>
          <div className="qty-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="qty-modal-head">
              <div><h3>{selectedProduct.product_name}</h3><div style={{fontSize:10,color:"#b8bdd0",marginTop:4}}>Add product to current bill</div></div>
              <button className="qty-close" onClick={()=>{setShowQtyModal(false);setSelectedProduct(null);setQuantity(1);setSelectedUnit("pcs");}}>✕</button>
            </div>
            <div className="qty-modal-body">
              <div className="qty-rate"><b>₹{formatPrice(selectedProduct.selling_price)}</b> per {selectedProduct.price_per || 1} {formatUnitDisplay(selectedProduct.price_unit || "pcs")}</div>
              <div className="qty-field"><label>Quantity</label><input ref={quantityInputRef} className="qty-input" type="number" value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} onKeyDown={handleKeyPress} min="0.01" max={selectedProduct.stock} step="0.01"/></div>
              <div className="qty-field"><label>Unit</label><select className="qty-select" value={selectedUnit} onChange={(e)=>setSelectedUnit(e.target.value)}>{getCompatibleUnits(selectedProduct.price_unit || "pcs").map((unit)=><option key={unit} value={unit}>{formatUnitDisplay(unit)}</option>)}</select></div>
              <div className="qty-preview">
                <div className="qty-preview-row"><span>Entered</span><span>{quantity} {formatUnitDisplay(selectedUnit)}</span></div>
                {selectedUnit !== (selectedProduct.price_unit || "pcs") && <div className="qty-preview-row"><span>Converted</span><span>{calculateLivePrice().displayQuantity.toFixed(2)} {formatUnitDisplay(calculateLivePrice().displayUnit)}</span></div>}
                <div className="qty-preview-row"><span>Rate</span><span>₹{formatPrice(selectedProduct.selling_price)} / {selectedProduct.price_per || 1} {formatUnitDisplay(selectedProduct.price_unit || "pcs")}</span></div>
                <div className="qty-total"><span style={{fontSize:10,color:"var(--muted)",fontWeight:700}}>ITEM TOTAL</span><strong>₹{liveTotalDigits}</strong></div>
              </div>
              <div className="stock-note">✓ {selectedProduct.stock} {formatUnitDisplay(selectedProduct.price_unit || "pcs")} available</div>
              <div className="modal-actions">
                <button className="modal-cancel" onClick={()=>{setShowQtyModal(false);setSelectedProduct(null);setQuantity(1);setSelectedUnit("pcs");}}>Cancel</button>
                <button className="modal-confirm" onClick={addToCartWithQuantity}>Add to bill</button>
              </div>
              <div style={{textAlign:"center",fontSize:9,color:"var(--muted)",marginTop:9}}><kbd>Enter</kbd> add · <kbd>Esc</kbd> cancel</div>
            </div>
          </div>
        </div>
      )}

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
