import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

export default function EditCategory() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({

        category_name: "",

        category_image: "",

        description: "",

        status: "active"

    });

    useEffect(() => {

        fetchCategory();

    }, []);

    const fetchCategory = async () => {

        try {

            const res = await API.get(

                `/categories/${id}`

            );

            setForm({

                category_name: res.data.data.category_name || "",

                category_image: res.data.data.category_image || "",

                description: res.data.data.description || "",

                status: res.data.data.status || "active"

            });

        }

        catch (err) {

            console.log(err);

            alert("Unable to load category.");

        }

        finally {

            setLoading(false);

        }

    };

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const res = await API.put(

                `/categories/${id}`,

                form

            );

            alert(res.data.message);

            navigate("/categories");

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Unable to update category."

            );

        }

    };

    if (loading) {

        return (

            <h2
                style={{
                    textAlign: "center",
                    marginTop: "100px"
                }}
            >
                Loading...
            </h2>

        );

    }

    return (

        <div
            style={{
                maxWidth: "700px",
                margin: "30px auto",
                background: "#fff",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 0 10px #ddd"
            }}
        >

            <h1>Edit Category</h1>

            <form onSubmit={handleSubmit}>

                <input

                    type="text"

                    name="category_name"

                    placeholder="Category Name"

                    value={form.category_name}

                    onChange={handleChange}

                    required

                    style={inputStyle}

                />

                <br /><br />

                <input

                    type="text"

                    name="category_image"

                    placeholder="Image URL"

                    value={form.category_image}

                    onChange={handleChange}

                    style={inputStyle}

                />

                <br /><br />

                <textarea

                    name="description"

                    rows="4"

                    placeholder="Description"

                    value={form.description}

                    onChange={handleChange}

                    style={inputStyle}

                />

                <br /><br />

                <select

                    name="status"

                    value={form.status}

                    onChange={handleChange}

                    style={inputStyle}

                >

                    <option value="active">

                        Active

                    </option>

                    <option value="inactive">

                        Inactive

                    </option>

                </select>

                <br /><br />

                <button

                    type="submit"

                    style={saveButton}

                >

                    Update Category

                </button>

                <button

                    type="button"

                    onClick={() => navigate("/categories")}

                    style={cancelButton}

                >

                    Cancel

                </button>

            </form>

        </div>

    );

}

const inputStyle = {

    width: "100%",

    padding: "12px",

    border: "1px solid #ddd",

    borderRadius: "8px",

    fontSize: "15px",

    boxSizing: "border-box"

};

const saveButton = {

    padding: "12px 25px",

    background: "#16a34a",

    color: "#fff",

    border: "none",

    borderRadius: "8px",

    cursor: "pointer",

    marginRight: "10px"

};

const cancelButton = {

    padding: "12px 25px",

    background: "#ef4444",

    color: "#fff",

    border: "none",

    borderRadius: "8px",

    cursor: "pointer"

};