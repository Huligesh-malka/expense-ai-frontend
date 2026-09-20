import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    getPublicQRMenu,
    createQROrder
} from "../services/qrOrderApi";

/*
 * PUBLIC BUSINESS QR ORDERING
 *
 * Flow:
 * Scan QR -> View business products -> Add to cart ->
 * Place order -> Owner receives order -> Owner accepts ->
 * Customer pays directly to owner.
 *
 * No table selection is used.
 * Customer only receives customer-facing product information.
 */

export default function PublicQRMenu() {
    const { token } = useParams();

    const [business, setBusiness] = useState(null);
    const [products, setProducts] = useState([]);

    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("All");

    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [notes, setNotes] = useState("");

    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [successOrder, setSuccessOrder] = useState(null);

    // ------------------------------------------------------------
    // LOAD BUSINESS + PRODUCTS
    // ------------------------------------------------------------

    useEffect(() => {
        let mounted = true;

        const loadMenu = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getPublicQRMenu(token);
                const payload = response?.data || response || {};

                if (!mounted) return;

                setBusiness(payload.business || null);
                setProducts(
                    Array.isArray(payload.products)
                        ? payload.products
                        : []
                );
            } catch (err) {
                console.error("QR Menu Error:", err);

                if (!mounted) return;

                setBusiness(null);
                setProducts([]);
                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load business menu"
                );
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (token) {
            loadMenu();
        } else {
            setLoading(false);
            setError("Invalid QR code.");
        }

        return () => {
            mounted = false;
        };
    }, [token]);

    // ------------------------------------------------------------
    // CATEGORIES
    // ------------------------------------------------------------

    const categories = useMemo(() => {
        const values = products
            .map(product => product.category)
            .filter(Boolean);

        return ["All", ...new Set(values)];
    }, [products]);

    // ------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------

    const filteredProducts = useMemo(() => {
        const text = search.trim().toLowerCase();

        return products.filter(product => {
            const name = String(
                product.product_name || ""
            ).toLowerCase();

            const description = String(
                product.description || ""
            ).toLowerCase();

            const code = String(
                product.product_code || ""
            ).toLowerCase();

            const matchesSearch =
                !text ||
                name.includes(text) ||
                description.includes(text) ||
                code.includes(text);

            const matchesCategory =
                category === "All" ||
                product.category === category;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    // ------------------------------------------------------------
    // HELPERS
    // ------------------------------------------------------------

    const getStock = product =>
        Number(product?.stock || 0);

    const getTax = product =>
        Number(product?.tax || 0);

    const getUnitPrice = product => {
        const sellingPrice = Number(
            product?.selling_price || 0
        );

        const pricePer = Number(
            product?.price_per || 1
        );

        if (!Number.isFinite(sellingPrice)) return 0;
        if (!Number.isFinite(pricePer) || pricePer <= 0) {
            return sellingPrice;
        }

        return sellingPrice / pricePer;
    };

    const money = value =>
        `₹${Number(value || 0).toFixed(2)}`;

    // ------------------------------------------------------------
    // CART
    // ------------------------------------------------------------

    const addToCart = product => {
        const stock = getStock(product);

        if (stock <= 0) {
            alert("This product is currently out of stock.");
            return;
        }

        setCart(current => {
            const existing = current.find(
                item => item.id === product.id
            );

            if (existing) {
                if (existing.quantity >= stock) {
                    alert(`Only ${stock} available.`);
                    return current;
                }

                return current.map(item =>
                    item.id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1
                          }
                        : item
                );
            }

            return [
                ...current,
                {
                    ...product,
                    quantity: 1
                }
            ];
        });

        setShowCart(true);
    };

    const changeQuantity = (productId, amount) => {
        setCart(current =>
            current
                .map(item => {
                    if (item.id !== productId) return item;

                    const quantity =
                        Number(item.quantity) + amount;

                    if (quantity <= 0) return null;

                    const stock = getStock(item);

                    if (quantity > stock) {
                        alert(`Only ${stock} available.`);
                        return item;
                    }

                    return {
                        ...item,
                        quantity
                    };
                })
                .filter(Boolean)
        );
    };

    const removeFromCart = productId => {
        setCart(current =>
            current.filter(item => item.id !== productId)
        );
    };

    // ------------------------------------------------------------
    // TOTALS
    // ------------------------------------------------------------

    const subtotal = useMemo(
        () =>
            cart.reduce(
                (sum, item) =>
                    sum +
                    getUnitPrice(item) *
                        Number(item.quantity),
                0
            ),
        [cart]
    );

    const tax = useMemo(
        () =>
            cart.reduce((sum, item) => {
                const itemSubtotal =
                    getUnitPrice(item) *
                    Number(item.quantity);

                return (
                    sum +
                    itemSubtotal *
                        (getTax(item) / 100)
                );
            }, 0),
        [cart]
    );

    const total = subtotal + tax;

    const cartItemCount = cart.reduce(
        (sum, item) =>
            sum + Number(item.quantity),
        0
    );

    // ------------------------------------------------------------
    // PLACE ORDER
    // ------------------------------------------------------------

    const placeOrder = async () => {
        if (!cart.length) {
            alert("Please add products to your cart.");
            return;
        }

        if (placing) return;

        try {
            setPlacing(true);

            const response = await createQROrder({
                qr_token: token,

                customer_name:
                    customerName.trim() || null,

                customer_phone:
                    customerPhone.trim() || null,

                notes:
                    notes.trim() || null,

                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: Number(item.quantity)
                }))
            });

            const payload =
                response?.data || response || {};

            setSuccessOrder(
                payload?.data ||
                payload?.order ||
                payload
            );

            setCart([]);
            setCustomerName("");
            setCustomerPhone("");
            setNotes("");
            setShowCart(false);
        } catch (err) {
            console.error(
                "Place QR Order Error:",
                err
            );

            alert(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to place order"
            );
        } finally {
            setPlacing(false);
        }
    };

    // ------------------------------------------------------------
    // LOADING
    // ------------------------------------------------------------

    if (loading) {
        return (
            <div className="customer-loading">
                <div className="loading-spinner">⟳</div>
                <h2>Loading menu...</h2>
                <p>
                    Preparing the business products.
                </p>
            </div>
        );
    }

    // ------------------------------------------------------------
    // ERROR
    // ------------------------------------------------------------

    if (!business || error) {
        return (
            <div className="customer-error">
                <div className="error-icon">!</div>

                <h1>QR Ordering Unavailable</h1>

                <p>
                    {error ||
                        "This QR code is invalid, inactive or no longer available."}
                </p>
            </div>
        );
    }

    // ------------------------------------------------------------
    // ORDER SUCCESS
    // ------------------------------------------------------------

    if (successOrder) {
        const orderNumber =
            successOrder?.order_no ||
            successOrder?.orderNumber ||
            successOrder?.id ||
            "Received";

        const orderTotal = Number(
            successOrder?.total_amount ||
            total ||
            0
        );

        return (
            <div className="order-success">
                <div className="success-icon">✓</div>

                <h1>Order Placed</h1>

                <p>
                    Your order has been sent to{" "}
                    <strong>
                        {business.business_name}
                    </strong>.
                </p>

                <div className="success-card">
                    <div className="success-row">
                        <span>Order</span>
                        <strong>
                            #{orderNumber}
                        </strong>
                    </div>

                    <div className="success-row">
                        <span>Amount</span>
                        <strong>
                            {money(orderTotal)}
                        </strong>
                    </div>

                    <div className="success-row">
                        <span>Status</span>
                        <strong className="order-status new">
                            Waiting for owner
                        </strong>
                    </div>

                    <div className="success-message">
                        <strong>
                            What happens next?
                        </strong>

                        <p>
                            The owner will review and
                            accept your order. After the
                            owner accepts it, pay the
                            amount directly to the owner
                            using the payment method
                            provided by the business.
                        </p>
                    </div>
                </div>

                <button
                    className="primary-btn"
                    onClick={() =>
                        setSuccessOrder(null)
                    }
                >
                    Continue Shopping
                </button>
            </div>
        );
    }

    // ------------------------------------------------------------
    // CUSTOMER MENU
    // ------------------------------------------------------------

    return (
        <div className="customer-menu">

            {/* BUSINESS HEADER */}

            <header className="customer-header">
                <div className="business-identity">

                    {business.logo ? (
                        <img
                            src={business.logo}
                            alt={
                                business.business_name ||
                                "Business"
                            }
                        />
                    ) : (
                        <div className="business-logo-placeholder">
                            {String(
                                business.business_name ||
                                "B"
                            )
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                    )}

                    <div>
                        <h1>
                            {business.business_name}
                        </h1>

                        <p>
                            Order Online
                        </p>
                    </div>
                </div>
            </header>

            {/* BUSINESS INFORMATION */}

            {(business.address ||
                business.city ||
                business.phone) && (
                <div className="business-info">

                    {business.address && (
                        <span>
                            📍 {business.address}
                        </span>
                    )}

                    {business.city && (
                        <span>
                            {business.city}
                            {business.state
                                ? `, ${business.state}`
                                : ""}
                        </span>
                    )}

                    {business.phone && (
                        <span>
                            📞 {business.phone}
                        </span>
                    )}
                </div>
            )}

            {/* SEARCH */}

            <div className="menu-search">
                <span>🔎</span>

                <input
                    value={search}
                    onChange={e =>
                        setSearch(e.target.value)
                    }
                    placeholder="Search products..."
                />

                {search && (
                    <button
                        onClick={() =>
                            setSearch("")
                        }
                    >
                        ×
                    </button>
                )}
            </div>

            {/* CATEGORIES */}

            <div className="category-scroll">
                {categories.map(item => (
                    <button
                        key={item}
                        className={
                            category === item
                                ? "category active"
                                : "category"
                        }
                        onClick={() =>
                            setCategory(item)
                        }
                    >
                        {item}
                    </button>
                ))}
            </div>

            {/* PRODUCT COUNT */}

            <div className="product-count">
                <strong>
                    {filteredProducts.length}
                </strong>{" "}
                products available
            </div>

            {/* PRODUCTS */}

            <main className="product-grid">
                {filteredProducts.length === 0 ? (
                    <div className="empty-products">
                        <div className="empty-icon">
                            🛍️
                        </div>

                        <h2>
                            No products found
                        </h2>

                        <p>
                            Try another search or
                            category.
                        </p>

                        {(search ||
                            category !== "All") && (
                            <button
                                className="secondary-btn"
                                onClick={() => {
                                    setSearch("");
                                    setCategory("All");
                                }}
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    filteredProducts.map(product => {
                        const stock =
                            getStock(product);

                        const outOfStock =
                            stock <= 0;

                        return (
                            <article
                                className="menu-product"
                                key={product.id}
                            >
                                <div className="product-image">

                                    {product.image ? (
                                        <img
                                            src={
                                                product.image
                                            }
                                            alt={
                                                product.product_name
                                            }
                                        />
                                    ) : (
                                        <div className="no-image">
                                            🛍️
                                        </div>
                                    )}

                                    {outOfStock && (
                                        <span className="stock-badge">
                                            Out of stock
                                        </span>
                                    )}
                                </div>

                                <div className="product-content">

                                    {product.category && (
                                        <span className="product-category">
                                            {
                                                product.category
                                            }
                                        </span>
                                    )}

                                    <h3>
                                        {
                                            product.product_name
                                        }
                                    </h3>

                                    {product.description && (
                                        <p>
                                            {
                                                product.description
                                            }
                                        </p>
                                    )}

                                    <div className="product-bottom">

                                        <div>
                                            <strong>
                                                {money(
                                                    getUnitPrice(
                                                        product
                                                    )
                                                )}
                                            </strong>

                                            <small>
                                                {" "}
                                                /{" "}
                                                {
                                                    product.price_unit ||
                                                    "unit"
                                                }
                                            </small>

                                            {getTax(
                                                product
                                            ) > 0 && (
                                                <div className="product-tax">
                                                    Tax{" "}
                                                    {
                                                        getTax(
                                                            product
                                                        )
                                                    }
                                                    %
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            disabled={
                                                outOfStock
                                            }
                                            onClick={() =>
                                                addToCart(
                                                    product
                                                )
                                            }
                                        >
                                            {outOfStock
                                                ? "Unavailable"
                                                : "+ Add"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                )}
            </main>

            {/* FLOATING CART */}

            {cart.length > 0 && (
                <button
                    className="floating-cart"
                    onClick={() =>
                        setShowCart(true)
                    }
                >
                    <span>
                        🛒 {cartItemCount}{" "}
                        {cartItemCount === 1
                            ? "item"
                            : "items"}
                    </span>

                    <strong>
                        {money(total)}
                    </strong>
                </button>
            )}

            {/* CART */}

            {showCart && (
                <div
                    className="cart-overlay"
                    onClick={e => {
                        if (
                            e.target ===
                            e.currentTarget
                        ) {
                            setShowCart(false);
                        }
                    }}
                >
                    <aside className="cart-drawer">

                        <div className="cart-header">
                            <div>
                                <h2>
                                    Your Cart
                                </h2>

                                <span>
                                    {cartItemCount}{" "}
                                    {cartItemCount === 1
                                        ? "item"
                                        : "items"}
                                </span>
                            </div>

                            <button
                                onClick={() =>
                                    setShowCart(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        {/* CART ITEMS */}

                        <div className="cart-items">
                            {cart.map(item => (
                                <div
                                    className="cart-item"
                                    key={item.id}
                                >
                                    <div className="cart-item-info">
                                        <strong>
                                            {
                                                item.product_name
                                            }
                                        </strong>

                                        <span>
                                            {money(
                                                getUnitPrice(
                                                    item
                                                )
                                            )}
                                            {" / "}
                                            {
                                                item.price_unit ||
                                                "unit"
                                            }
                                        </span>
                                    </div>

                                    <div className="quantity">
                                        <button
                                            onClick={() =>
                                                changeQuantity(
                                                    item.id,
                                                    -1
                                                )
                                            }
                                        >
                                            −
                                        </button>

                                        <span>
                                            {
                                                item.quantity
                                            }
                                        </span>

                                        <button
                                            onClick={() =>
                                                changeQuantity(
                                                    item.id,
                                                    1
                                                )
                                            }
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        className="remove-item"
                                        onClick={() =>
                                            removeFromCart(
                                                item.id
                                            )
                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* SUMMARY */}

                        <div className="cart-summary">
                            <div>
                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    {money(subtotal)}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Tax
                                </span>

                                <strong>
                                    {money(tax)}
                                </strong>
                            </div>

                            <div className="grand-total">
                                <strong>
                                    Total
                                </strong>

                                <strong>
                                    {money(total)}
                                </strong>
                            </div>
                        </div>

                        {/* CUSTOMER DETAILS */}

                        <div className="customer-fields">
                            <h3>
                                Order Details
                            </h3>

                            <input
                                value={
                                    customerName
                                }
                                onChange={e =>
                                    setCustomerName(
                                        e.target.value
                                    )
                                }
                                placeholder="Your name (optional)"
                            />

                            <input
                                value={
                                    customerPhone
                                }
                                onChange={e =>
                                    setCustomerPhone(
                                        e.target.value
                                    )
                                }
                                placeholder="Phone number (optional)"
                                type="tel"
                            />

                            <textarea
                                value={notes}
                                onChange={e =>
                                    setNotes(
                                        e.target.value
                                    )
                                }
                                placeholder="Order note (optional)"
                                rows="3"
                            />
                        </div>

                        {/* PAYMENT MESSAGE */}

                        <div className="payment-notice">
                            <strong>
                                Pay directly to the owner
                            </strong>

                            <p>
                                Place the order first.
                                The owner will accept
                                it and provide the
                                payment instructions.
                            </p>
                        </div>

                        {/* PLACE ORDER */}

                        <button
                            className="place-order-btn"
                            disabled={placing}
                            onClick={placeOrder}
                        >
                            {placing
                                ? "Placing Order..."
                                : `Place Order • ${money(
                                      total
                                  )}`}
                        </button>
                    </aside>
                </div>
            )}
        </div>
    );
}
