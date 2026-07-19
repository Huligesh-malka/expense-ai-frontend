import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function CreateLayout() {
  const navigate = useNavigate();

  const [shopName, setShopName] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");

  const businessId = localStorage.getItem("businessId");

  const createLayout = async (e) => {
    e.preventDefault();

    if (!shopName || !width || !length) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/shop/layout",
        {
          business_id: businessId,
          shop_name: shopName,
          width,
          length,
        }
      );

      alert("Layout Created Successfully");

      navigate("/shop-designer", {
        state: {
          layoutId: res.data.layoutId,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create layout");
    }
  };

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "40px auto",
        background: "#fff",
        padding: 30,
        borderRadius: 10,
        boxShadow: "0 0 10px rgba(0,0,0,.1)",
      }}
    >
      <h2>Create Shop Layout</h2>

      <form onSubmit={createLayout}>

        <label>Shop Name</label>

        <input
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="My Grocery Shop"
          style={inputStyle}
        />

        <label>Width (Feet)</label>

        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          style={inputStyle}
        />

        <label>Length (Feet)</label>

        <input
          type="number"
          value={length}
          onChange={(e) => setLength(e.target.value)}
          style={inputStyle}
        />

        <button style={buttonStyle}>
          Create Layout
        </button>

      </form>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 20,
  marginTop: 5,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const buttonStyle = {
  width: "100%",
  padding: 14,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer",
};