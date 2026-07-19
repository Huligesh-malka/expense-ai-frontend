import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

export default function Categories() {

    const [categories, setCategories] = useState([]);

    const businessId = localStorage.getItem("businessId") || 1;

    useEffect(() => {

        fetchCategories();

    }, []);

    const fetchCategories = async () => {

        try {

            const res = await API.get(

                `/categories/business/${businessId}`

            );

            setCategories(res.data.data);

        }

        catch (err) {

            console.log(err);

        }

    };

    const deleteCategory = async (id) => {

        if (!window.confirm("Delete this category?")) {

            return;

        }

        try {

            await API.delete(

                `/categories/${id}`

            );

            fetchCategories();

        }

        catch (err) {

            console.log(err);

        }

    };

    return (

        <div
            style={{
                padding: "30px"
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px"
                }}
            >

                <h1>Categories</h1>

                <Link to="/add-category">

                    <button>

                        + Add Category

                    </button>

                </Link>

            </div>

            <table
                border="1"
                cellPadding="10"
                width="100%"
            >

                <thead>

                    <tr>

                        <th>ID</th>

                        <th>Name</th>

                        <th>Description</th>

                        <th>Status</th>

                        <th>Actions</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        categories.length === 0 ?

                        (

                            <tr>

                                <td colSpan="5">

                                    No Categories

                                </td>

                            </tr>

                        )

                        :

                        (

                            categories.map(cat => (

                                <tr key={cat.id}>

                                    <td>{cat.id}</td>

                                    <td>{cat.category_name}</td>

                                    <td>{cat.description}</td>

                                    <td>{cat.status}</td>

                                    <td>

                                        <Link
                                            to={`/edit-category/${cat.id}`}
                                        >

                                            <button>

                                                Edit

                                            </button>

                                        </Link>

                                        {" "}

                                        <button
                                            onClick={() =>
                                                deleteCategory(cat.id)
                                            }
                                        >

                                            Delete

                                        </button>

                                    </td>

                                </tr>

                            ))

                        )

                    }

                </tbody>

            </table>

        </div>

    );

}