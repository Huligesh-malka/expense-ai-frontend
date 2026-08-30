import React, {
    useEffect,
    useMemo,
    useState
} from "react";

import { useParams } from "react-router-dom";

import {
    getPublicQRMenu,
    createQROrder
} from "../services/qrOrderApi";

export default function PublicQRMenu() {

    const { token } = useParams();

    const [business, setBusiness] =
        useState(null);

    const [tables, setTables] =
        useState([]);

    const [products, setProducts] =
        useState([]);

    const [selectedTable, setSelectedTable] =
        useState("");

    const [cart, setCart] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [category, setCategory] =
        useState("All");

    const [customerName, setCustomerName] =
        useState("");

    const [customerPhone, setCustomerPhone] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [placing, setPlacing] =
        useState(false);

    const [successOrder, setSuccessOrder] =
        useState(null);


    useEffect(() => {

        const loadMenu = async () => {

            try {

                const response =
                    await getPublicQRMenu(token);

                setBusiness(response.business);
                setTables(response.tables || []);
                setProducts(response.products || []);

            } catch (error) {

                alert(error.message);

            } finally {

                setLoading(false);

            }
        };


        loadMenu();

    }, [token]);


    // ======================================
    // CATEGORIES
    // ======================================

    const categories = useMemo(() => {

        const values = products
            .map((product) => product.category)
            .filter(Boolean);

        return [
            "All",
            ...new Set(values)
        ];

    }, [products]);


    // ======================================
    // FILTER PRODUCTS
    // ======================================

    const filteredProducts = useMemo(() => {

        return products.filter((product) => {

            const matchesSearch =
                !search ||
                product.product_name
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );


            const matchesCategory =
                category === "All" ||
                product.category === category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });

    }, [
        products,
        search,
        category
    ]);


    // ======================================
    // ADD PRODUCT
    // ======================================

    const addToCart = (product) => {

        setCart((current) => {

            const existing =
                current.find(
                    (item) =>
                        item.id === product.id
                );


            if (existing) {

                return current.map((item) =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity:
                                item.quantity + 1
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

    };


    const changeQuantity = (
        productId,
        amount
    ) => {

        setCart((current) =>
            current
                .map((item) =>
                    item.id === productId
                        ? {
                            ...item,
                            quantity:
                                item.quantity +
                                amount
                        }
                        : item
                )
                .filter(
                    (item) =>
                        item.quantity > 0
                )
        );

    };


    // ======================================
    // CART TOTAL
    // ======================================

    const subtotal = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.selling_price) *
            Number(item.quantity),
        0
    );


    const tax = cart.reduce(
        (sum, item) => {

            const itemSubtotal =
                Number(item.selling_price) *
                Number(item.quantity);

            return (
                sum +
                itemSubtotal *
                (Number(item.tax || 0) / 100)
            );

        },
        0
    );


    const total =
        subtotal + tax;


    // ======================================
    // PLACE ORDER
    // ======================================

    const placeOrder = async () => {

        if (!selectedTable) {

            alert(
                "Please select your table"
            );

            return;
        }


        if (cart.length === 0) {

            alert(
                "Please add products"
            );

            return;
        }


        try {

            setPlacing(true);


            const response =
                await createQROrder({

                    qr_token: token,

                    table_id:
                        Number(selectedTable),

                    customer_name:
                        customerName.trim() ||
                        null,

                    customer_phone:
                        customerPhone.trim() ||
                        null,

                    items: cart.map(
                        (item) => ({
                            product_id:
                                item.id,

                            quantity:
                                item.quantity
                        })
                    )

                });


            setSuccessOrder(
                response.data
            );

            setCart([]);

        } catch (error) {

            alert(error.message);

        } finally {

            setPlacing(false);

        }

    };


    if (loading) {

        return (
            <div className="customer-loading">
                Loading menu...
            </div>
        );

    }


    if (successOrder) {

        return (

            <div className="order-success">

                <div className="success-icon">
                    ✓
                </div>

                <h1>
                    Order Placed!
                </h1>

                <p>
                    Your order has been
                    sent to the restaurant.
                </p>


                <div className="success-card">

                    <strong>
                        Order #
                        {
                            successOrder.order_no
                        }
                    </strong>

                    <span>
                        Table{" "}
                        {
                            successOrder.table_number
                        }
                    </span>

                    <strong>
                        ₹
                        {
                            Number(
                                successOrder.total_amount
                            ).toFixed(2)
                        }
                    </strong>

                </div>


                <button
                    className="primary-btn"
                    onClick={() =>
                        setSuccessOrder(null)
                    }
                >
                    Order More
                </button>

            </div>

        );

    }


    return (

        <div className="customer-menu">

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <header className="customer-header">

                {business?.logo && (

                    <img
                        src={business.logo}
                        alt=""
                    />

                )}

                <div>

                    <h1>
                        {
                            business?.business_name
                        }
                    </h1>

                    <p>
                        Digital Menu
                    </p>

                </div>

            </header>


            {/* ================================= */}
            {/* TABLE */}
            {/* ================================= */}

            <div className="table-selector">

                <label>
                    Select Your Table
                </label>

                <select
                    value={selectedTable}
                    onChange={(e) =>
                        setSelectedTable(
                            e.target.value
                        )
                    }
                >

                    <option value="">
                        Select table
                    </option>

                    {tables.map((table) => (

                        <option
                            key={table.id}
                            value={table.id}
                        >
                            Table{" "}
                            {table.table_number}
                            {table.table_name
                                ? ` - ${table.table_name}`
                                : ""}
                        </option>

                    ))}

                </select>

            </div>


            {/* ================================= */}
            {/* SEARCH */}
            {/* ================================= */}

            <div className="menu-search">

                <input
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    placeholder="Search food..."
                />

            </div>


            {/* ================================= */}
            {/* CATEGORIES */}
            {/* ================================= */}

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
                                setCategory(item)
                            }
                        >
                            {item}
                        </button>

                    )
                )}

            </div>


            {/* ================================= */}
            {/* PRODUCTS */}
            {/* ================================= */}

            <main className="product-grid">

                {filteredProducts.map(
                    (product) => (

                        <div
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
                                        🍽️
                                    </div>

                                )}

                            </div>


                            <div className="product-content">

                                <span className="product-category">
                                    {
                                        product.category
                                    }
                                </span>

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

                                    <strong>
                                        ₹
                                        {Number(
                                            product.selling_price
                                        ).toFixed(2)}
                                    </strong>

                                    <button
                                        onClick={() =>
                                            addToCart(
                                                product
                                            )
                                        }
                                    >
                                        + Add
                                    </button>

                                </div>

                            </div>

                        </div>

                    )
                )}

            </main>


            {/* ================================= */}
            {/* CART */}
            {/* ================================= */}

            {cart.length > 0 && (

                <div className="cart-panel">

                    <h2>
                        Your Order
                    </h2>


                    {cart.map(
                        (item) => (

                            <div
                                className="cart-item"
                                key={item.id}
                            >

                                <div>

                                    <strong>
                                        {
                                            item.product_name
                                        }
                                    </strong>

                                    <span>
                                        ₹
                                        {Number(
                                            item.selling_price
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

                            </div>

                        )
                    )}


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
                                GST
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


                    {/* CUSTOMER DETAILS */}

                    <div className="customer-fields">

                        <input
                            value={customerName}
                            onChange={(e) =>
                                setCustomerName(
                                    e.target.value
                                )
                            }
                            placeholder="Name (optional)"
                        />

                        <input
                            value={customerPhone}
                            onChange={(e) =>
                                setCustomerPhone(
                                    e.target.value
                                )
                            }
                            placeholder="Phone (optional)"
                        />

                    </div>


                    <button
                        className="place-order-btn"
                        onClick={placeOrder}
                        disabled={placing}
                    >
                        {placing
                            ? "Placing Order..."
                            : `Place Order • ₹${total.toFixed(2)}`}
                    </button>

                </div>

            )}

        </div>

    );

}