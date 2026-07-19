import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function AddCategory() {

    const navigate = useNavigate();

    const [form, setForm] = useState({

        business_id: localStorage.getItem("businessId") || 1,

        category_name: "",

        category_image: "",

        description: "",

        status: "active"

    });

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const res = await API.post(

                "/categories/create",

                form

            );

            alert(res.data.message);

            navigate("/categories");

        }

        catch (err) {

            console.log(err);

            alert(

                err.response?.data?.message ||

                "Unable to create category."

            );

        }

    };

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

            <h1>Add Category</h1>

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

                    placeholder="Image URL (Optional)"

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

                    style={buttonStyle}

                >

                    Save Category

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

const buttonStyle = {

    padding: "12px 25px",

    background: "#2563eb",

    color: "#fff",

    border: "none",

    borderRadius: "8px",

    cursor: "pointer",

    fontSize: "16px"

};