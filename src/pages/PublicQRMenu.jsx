import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useParams
} from "react-router-dom";

import {
    getPublicQRMenu,
    createQROrder
} from "../services/qrOrderApi";


export default function PublicQRMenu() {

    const { token } =
        useParams();


    // =========================================================
    // DATA
    // =========================================================

    const [business, setBusiness] =
        useState(null);

    const [products, setProducts] =
        useState([]);


    // =========================================================
    // CART
    // =========================================================

    const [cart, setCart] =
        useState([]);


    // =========================================================
    // SEARCH / CATEGORY
    // =========================================================

    const [search, setSearch] =
        useState("");

    const [category, setCategory] =
        useState("All");


    // =========================================================
    // CUSTOMER
    // =========================================================

    const [customerName, setCustomerName] =
        useState("");

    const [customerPhone, setCustomerPhone] =
        useState("");

    const [notes, setNotes] =
        useState("");


    // =========================================================
    // UI
    // =========================================================

    const [loading, setLoading] =
        useState(true);

    const [placing, setPlacing] =
        useState(false);

    const [successOrder, setSuccessOrder] =
        useState(null);


    // =========================================================
    // LOAD BUSINESS MENU
    // =========================================================

    useEffect(() => {

        const loadMenu = async () => {

            try {

                setLoading(true);


                const response =
                    await getPublicQRMenu(
                        token
                    );


                /*
                 * Backend response:
                 *
                 * {
                 *   success: true,
                 *   business: {...},
                 *   products: [...]
                 * }
                 */


                const payload =
                    response?.data ||
                    response;


                setBusiness(
                    payload?.business ||
                    null
                );


                setProducts(
                    payload?.products ||
                    []
                );


            } catch (error) {

                console.error(
                    "QR Menu Error:",
                    error
                );


                alert(
                    error.response?.data?.message ||
                    error.message ||
                    "Failed to load business menu"
                );

            } finally {

                setLoading(false);
            }
        };


        if (token) {
            loadMenu();
        }

    }, [token]);


    // =========================================================
    // CATEGORIES
    // =========================================================

    const categories =
        useMemo(() => {

            const values =
                products
                    .map(
                        (product) =>
                            product.category
                    )
                    .filter(Boolean);


            return [
                "All",
                ...new Set(values)
            ];

        }, [products]);


    // =========================================================
    // FILTER PRODUCTS
    // =========================================================

    const filteredProducts =
        useMemo(() => {

            return products.filter(
                (product) => {

                    const productName =
                        String(
                            product.product_name ||
                            ""
                        );


                    const matchesSearch =
                        !search ||
                        productName
                            .toLowerCase()
                            .includes(
                                search.toLowerCase()
                            );


                    const matchesCategory =
                        category === "All" ||
                        product.category ===
                            category;


                    return (
                        matchesSearch &&
                        matchesCategory
                    );
                }
            );

        }, [
            products,
            search,
            category
        ]);


    // =========================================================
    // GET UNIT PRICE
    //
    // Same calculation used by backend.
    // =========================================================

    const getUnitPrice = (
        product
    ) => {

        const sellingPrice =
            Number(
                product.selling_price || 0
            );


        const pricePer =
            Number(
                product.price_per || 1
            );


        return (
            sellingPrice /
            pricePer
        );
    };


    // =========================================================
    // ADD TO CART
    // =========================================================

    const addToCart = (
        product
    ) => {

        const availableStock =
            Number(
                product.stock || 0
            );


        if (
            availableStock <= 0
        ) {

            alert(
                "This product is currently out of stock."
            );

            return;
        }


        setCart(
            (current) => {

                const existing =
                    current.find(
                        (item) =>
                            item.id ===
                            product.id
                    );


                if (existing) {

                    if (
                        existing.quantity >=
                        availableStock
                    ) {

                        alert(
                            `Only ${availableStock} available.`
                        );

                        return current;
                    }


                    return current.map(
                        (item) =>
                            item.id ===
                            product.id
                                ? {
                                    ...item,
                                    quantity:
                                        item.quantity +
                                        1
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
            }
        );
    };


    // =========================================================
    // CHANGE QUANTITY
    // =========================================================

    const changeQuantity = (
        productId,
        amount
    ) => {

        setCart(
            (current) => {

                return current
                    .map(
                        (item) => {

                            if (
                                item.id !==
                                productId
                            ) {
                                return item;
                            }


                            const newQuantity =
                                item.quantity +
                                amount;


                            if (
                                newQuantity <= 0
                            ) {
                                return null;
                            }


                            const stock =
                                Number(
                                    item.stock ||
                                    0
                                );


                            if (
                                newQuantity >
                                stock
                            ) {

                                alert(
                                    `Only ${stock} available.`
                                );

                                return item;
                            }


                            return {
                                ...item,
                                quantity:
                                    newQuantity
                            };
                        }
                    )
                    .filter(Boolean);
            }
        );
    };


    // =========================================================
    // REMOVE FROM CART
    // =========================================================

    const removeFromCart = (
        productId
    ) => {

        setCart(
            (current) =>
                current.filter(
                    (item) =>
                        item.id !==
                        productId
                )
        );
    };


    // =========================================================
    // CART SUBTOTAL
    // =========================================================

    const subtotal =
        cart.reduce(
            (
                sum,
                item
            ) => {

                const price =
                    getUnitPrice(
                        item
                    );


                return (
                    sum +
                    price *
                    Number(
                        item.quantity
                    )
                );

            },
            0
        );


    // =========================================================
    // TAX
    // =========================================================

    const tax =
        cart.reduce(
            (
                sum,
                item
            ) => {

                const itemSubtotal =
                    getUnitPrice(
                        item
                    ) *
                    Number(
                        item.quantity
                    );


                const taxRate =
                    Number(
                        item.tax || 0
                    );


                return (
                    sum +
                    itemSubtotal *
                    (
                        taxRate /
                        100
                    )
                );

            },
            0
        );


    // =========================================================
    // TOTAL
    // =========================================================

    const total =
        subtotal +
        tax;


    // =========================================================
    // TOTAL CART ITEMS
    // =========================================================

    const cartItemCount =
        cart.reduce(
            (
                totalItems,
                item
            ) =>
                totalItems +
                Number(
                    item.quantity
                ),
            0
        );


    // =========================================================
    // PLACE ORDER
    //
    // NO TABLE ID
    // =========================================================

    const placeOrder = async () => {

        if (
            cart.length === 0
        ) {

            alert(
                "Please add products to your cart."
            );

            return;
        }


        try {

            setPlacing(true);


            const response =
                await createQROrder({

                    qr_token:
                        token,


                    customer_name:
                        customerName.trim() ||
                        null,


                    customer_phone:
                        customerPhone.trim() ||
                        null,


                    notes:
                        notes.trim() ||
                        null,


                    items:
                        cart.map(
                            (item) => ({

                                product_id:
                                    item.id,

                                quantity:
                                    item.quantity

                            })
                        )

                });


            const payload =
                response?.data ||
                response;


            setSuccessOrder(
                payload?.data ||
                payload
            );


            setCart([]);

            setCustomerName("");

            setCustomerPhone("");

            setNotes("");


        } catch (error) {

            console.error(
                "Place QR Order Error:",
                error
            );


            alert(
                error.response?.data?.message ||
                error.message ||
                "Failed to place order"
            );

        } finally {

            setPlacing(false);
        }
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <div className="customer-loading">

                <div className="loading-spinner">
                    ⟳
                </div>

                <h2>
                    Loading...
                </h2>

                <p>
                    Preparing the business menu.
                </p>

            </div>
        );
    }


    // =========================================================
    // BUSINESS NOT FOUND
    // =========================================================

    if (!business) {

        return (

            <div className="customer-error">

                <div className="error-icon">
                    !
                </div>

                <h1>
                    QR Ordering Unavailable
                </h1>

                <p>
                    This QR code is invalid,
                    inactive or no longer available.
                </p>

            </div>
        );
    }


    // =========================================================
    // ORDER SUCCESS
    // =========================================================

    if (successOrder) {

        return (

            <div className="order-success">

                <div className="success-icon">
                    ✓
                </div>


                <h1>
                    Order Placed
                </h1>


                <p>
                    Your order has been sent
                    to the business.
                </p>


                <div className="success-card">


                    <div className="success-row">

                        <span>
                            Order
                        </span>

                        <strong>
                            #{successOrder.order_no}
                        </strong>

                    </div>


                    <div className="success-row">

                        <span>
                            Amount
                        </span>

                        <strong>
                            ₹
                            {Number(
                                successOrder.total_amount ||
                                0
                            ).toFixed(2)}
                        </strong>

                    </div>


                    <div className="success-row">

                        <span>
                            Status
                        </span>

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
                            order is accepted, follow the
                            payment instructions provided
                            by the business.
                        </p>

                    </div>

                </div>


                <button
                    className="primary-btn"
                    onClick={() =>
                        setSuccessOrder(
                            null
                        )
                    }
                >
                    Continue Shopping
                </button>

            </div>
        );
    }


    // =========================================================
    // MAIN CUSTOMER PAGE
    // =========================================================

    return (

        <div className="customer-menu">


            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header className="customer-header">


                {business.logo && (

                    <img
                        src={
                            business.logo
                        }

                        alt={
                            business.business_name ||
                            "Business"
                        }
                    />

                )}


                <div>

                    <h1>
                        {
                            business.business_name
                        }
                    </h1>

                    <p>
                        Order Online
                    </p>

                </div>

            </header>



            {/* ================================================= */}
            {/* BUSINESS INFO */}
            {/* ================================================= */}

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



            {/* ================================================= */}
            {/* SEARCH */}
            {/* ================================================= */}

            <div className="menu-search">

                <input
                    value={search}

                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }

                    placeholder="Search products..."
                />

            </div>



            {/* ================================================= */}
            {/* CATEGORIES */}
            {/* ================================================= */}

            <div className="category-scroll">

                {categories.map(
                    (item) => (

                        <button
                            key={item}

                            className={
                                category === item
                                    ? "category active"
                                    : "category"
                            }

                            onClick={() =>
                                setCategory(
                                    item
                                )
                            }
                        >
                            {item}
                        </button>

                    )
                )}

            </div>



            {/* ================================================= */}
            {/* PRODUCTS */}
            {/* ================================================= */}

            <main className="product-grid">

                {filteredProducts.length ===
                    0 ? (

                    <div className="empty-products">

                        <h2>
                            No products found
                        </h2>

                        <p>
                            Try another search or category.
                        </p>

                    </div>

                ) : (

                    filteredProducts.map(
                        (product) => (

                            <div
                                className="menu-product"
                                key={product.id}
                            >


                                {/* IMAGE */}

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
                                            Product
                                        </div>

                                    )}

                                </div>



                                {/* CONTENT */}

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
                                                ₹
                                                {getUnitPrice(
                                                    product
                                                ).toFixed(2)}
                                            </strong>


                                            <small>
                                                /
                                                {
                                                    product.price_unit ||
                                                    "unit"
                                                }
                                            </small>

                                        </div>


                                        <button
                                            onClick={() =>
                                                addToCart(
                                                    product
                                                )
                                            }

                                            disabled={
                                                Number(
                                                    product.stock ||
                                                    0
                                                ) <= 0
                                            }
                                        >

                                            {Number(
                                                product.stock ||
                                                0
                                            ) <= 0
                                                ? "Out of Stock"
                                                : "+ Add"}

                                        </button>

                                    </div>

                                </div>

                            </div>

                        )
                    )

                )}

            </main>



            {/* ================================================= */}
            {/* CART */}
            {/* ================================================= */}

            {cart.length > 0 && (

                <div className="cart-panel">


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

                    </div>



                    {/* CART ITEMS */}

                    <div className="cart-items">

                        {cart.map(
                            (item) => (

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
                                            ₹
                                            {getUnitPrice(
                                                item
                                            ).toFixed(2)}
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

                            )
                        )}

                    </div>



                    {/* ================================================= */}
                    {/* SUMMARY */}
                    {/* ================================================= */}

                    <div className="cart-summary">


                        <div>

                            <span>
                                Subtotal
                            </span>

                            <strong>
                                ₹
                                {subtotal.toFixed(2)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Tax
                            </span>

                            <strong>
                                ₹
                                {tax.toFixed(2)}
                            </strong>

                        </div>


                        <div className="grand-total">

                            <span>
                                Total
                            </span>

                            <strong>
                                ₹
                                {total.toFixed(2)}
                            </strong>

                        </div>

                    </div>



                    {/* ================================================= */}
                    {/* CUSTOMER DETAILS */}
                    {/* ================================================= */}

                    <div className="customer-fields">


                        <h3>
                            Order Details
                        </h3>


                        <input
                            value={
                                customerName
                            }

                            onChange={(e) =>
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

                            onChange={(e) =>
                                setCustomerPhone(
                                    e.target.value
                                )
                            }

                            placeholder="Phone number (optional)"
                            type="tel"
                        />


                        <textarea
                            value={
                                notes
                            }

                            onChange={(e) =>
                                setNotes(
                                    e.target.value
                                )
                            }

                            placeholder="Order note (optional)"
                            rows="3"
                        />

                    </div>



                    {/* ================================================= */}
                    {/* PLACE ORDER */}
                    {/* ================================================= */}

                    <button
                        className="place-order-btn"

                        onClick={
                            placeOrder
                        }

                        disabled={
                            placing
                        }
                    >

                        {placing

                            ? "Placing Order..."

                            : `Place Order • ₹${total.toFixed(2)}`

                        }

                    </button>


                </div>

            )}

        </div>
    );
}