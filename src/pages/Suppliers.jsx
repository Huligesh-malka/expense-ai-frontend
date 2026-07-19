import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiEye,
  FiTruck,
  FiPhone,
  FiMail
} from "react-icons/fi";

export default function Suppliers() {

  const businessId = localStorage.getItem("businessId");

  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {

    loadSuppliers();

  }, []);

  const loadSuppliers = async () => {

    try {

      const res = await axios.get(

        `http://localhost:5000/api/suppliers?business_id=${businessId}`

      );

      setSuppliers(res.data.data || []);

    } catch (err) {

      console.log(err);

      alert("Failed to load suppliers");

    } finally {

      setLoading(false);

    }

  };

  const deleteSupplier = async (id) => {

    const ok = window.confirm(
      "Are you sure you want to delete this supplier?"
    );

    if (!ok) return;

    try {

      await axios.delete(

        `http://localhost:5000/api/suppliers/${id}`

      );

      alert("Supplier deleted successfully.");

      loadSuppliers();

    } catch (err) {

      console.log(err);

      alert(
        err.response?.data?.message ||
        "Failed to delete supplier."
      );

    }

  };

  const filteredSuppliers = suppliers.filter((item) =>

    item.supplier_name
      .toLowerCase()
      .includes(search.toLowerCase()) ||

    (item.company_name || "")
      .toLowerCase()
      .includes(search.toLowerCase()) ||

    (item.supplier_phone || "")
      .includes(search)

  );

  // Get status color
  const getStatusColor = (status) => {
    const statusColors = {
      'active': '#22c55e',
      'inactive': '#ef4444',
      'pending': '#f59e0b'
    };
    return statusColors[status?.toLowerCase()] || '#6b7280';
  };

  if (loading) {

    return (

      <div
        style={{
          padding: 40,
          textAlign: "center",
          fontSize: 18
        }}
      >
        Loading Suppliers...
      </div>

    );

  }

  return (

    <div
      style={{
        padding:30,
        background:"#f5f7fb",
        minHeight:"100vh"
      }}
    >

      {/* Header */}

      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:25,
          flexWrap:"wrap",
          gap:15
        }}
      >

        <div>

          <h1
            style={{
              margin:0,
              color:"#1f2937"
            }}
          >
            Suppliers
          </h1>

          <p
            style={{
              color:"#6b7280"
            }}
          >
            Manage all suppliers
          </p>

        </div>

        <Link to="/add-supplier">

          <button
            style={{
              background:"#2563eb",
              color:"#fff",
              border:"none",
              padding:"12px 20px",
              borderRadius:10,
              cursor:"pointer",
              display:"flex",
              alignItems:"center",
              gap:8,
              transition:"background 0.2s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#1d4ed8"}
            onMouseLeave={(e) => e.target.style.background = "#2563eb"}
          >
            <FiPlus />
            Add Supplier
          </button>

        </Link>

      </div>

      {/* Search */}

      <div
        style={{
          background:"#fff",
          padding:20,
          borderRadius:12,
          marginBottom:20
        }}
      >

        <div
          style={{
            position:"relative"
          }}
        >

          <FiSearch
            style={{
              position:"absolute",
              top:14,
              left:15,
              color:"#888"
            }}
          />

          <input

            type="text"

            placeholder="Search supplier..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            style={{
              width:"100%",
              padding:"12px 45px",
              borderRadius:8,
              border:"1px solid #ddd",
              outline:"none",
              fontSize:"14px"
            }}

          />

        </div>

      </div>

      {/* Table */}

      <div
        style={{
          background:"#fff",
          borderRadius:12,
          overflow:"hidden",
          boxShadow:"0 2px 8px rgba(0,0,0,.08)",
          overflowX:"auto"
        }}
      >

        <table
          width="100%"
          cellPadding="15"
          style={{
            borderCollapse:"collapse",
            minWidth:"700px"
          }}
        >

          <thead>

            <tr
              style={{
                background:"#2563eb",
                color:"#fff"
              }}
            >

              <th align="left">Supplier</th>

              <th align="left">Phone</th>

              <th align="left">Email</th>

              <th align="left">Opening Balance</th>

              <th align="left">Status</th>

              <th align="center">Action</th>

            </tr>

          </thead>

          <tbody>

            {filteredSuppliers.length===0 && (

              <tr>

                <td
                  colSpan="6"
                  align="center"
                  style={{
                    padding:40
                  }}
                >

                  No Suppliers Found

                </td>

              </tr>

            )}

            {filteredSuppliers.map((supplier)=>(

              <tr
                key={supplier.id}
                style={{
                  borderBottom:"1px solid #eee",
                  transition:"background 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.background = "#f8fafc"}
                onMouseLeave={(e) => e.target.style.background = "transparent"}
              >

                <td>

                  <div
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:10
                    }}
                  >

                    <div
                      style={{
                        width:42,
                        height:42,
                        borderRadius:"50%",
                        background:"#e0f2fe",
                        display:"flex",
                        justifyContent:"center",
                        alignItems:"center",
                        flexShrink:0
                      }}
                    >
                      <FiTruck color="#2563eb"/>
                    </div>

                    <div>

                      <div
                        style={{
                          fontWeight:"bold"
                        }}
                      >
                        {supplier.supplier_name}
                      </div>

                      <div
                        style={{
                          fontSize:13,
                          color:"#777"
                        }}
                      >
                        {supplier.company_name || "-"}
                      </div>

                    </div>

                  </div>

                </td>

                <td>

                  <div
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:6
                    }}
                  >
                    <FiPhone size={14}/>

                    {supplier.supplier_phone || "-"}

                  </div>

                </td>

                <td>

                  <div
                    style={{
                      display:"flex",
                      alignItems:"center",
                      gap:6
                    }}
                  >

                    <FiMail size={14}/>

                    {supplier.supplier_email || "-"}

                  </div>

                </td>

                <td>

                  ₹{Number(supplier.opening_balance || 0).toFixed(2)}

                </td>

                <td>

                  <span
                    style={{
                      display:"inline-block",
                      padding:"4px 12px",
                      borderRadius:20,
                      fontSize:12,
                      fontWeight:600,
                      background: getStatusColor(supplier.status),
                      color:"#fff"
                    }}
                  >
                    {supplier.status || "Active"}
                  </span>

                </td>

                <td align="center">

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 8,
                      flexWrap: "wrap"
                    }}
                  >

                    {/* View */}

                    <Link to={`/supplier/${supplier.id}`}>

                      <button
                        style={{
                          background: "#0ea5e9",
                          color: "#fff",
                          border: "none",
                          padding: "8px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "transform 0.1s, background 0.2s",
                          display:"inline-flex",
                          alignItems:"center"
                        }}
                        title="View Supplier"
                        onMouseEnter={(e) => {
                          e.target.style.background = "#0284c7";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#0ea5e9";
                          e.target.style.transform = "scale(1)";
                        }}
                      >
                        <FiEye />
                      </button>

                    </Link>

                    {/* Edit */}

                    <Link to={`/edit-supplier/${supplier.id}`}>

                      <button
                        style={{
                          background: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          padding: "8px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "transform 0.1s, background 0.2s",
                          display:"inline-flex",
                          alignItems:"center"
                        }}
                        title="Edit Supplier"
                        onMouseEnter={(e) => {
                          e.target.style.background = "#d97706";
                          e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "#f59e0b";
                          e.target.style.transform = "scale(1)";
                        }}
                      >
                        <FiEdit />
                      </button>

                    </Link>

                    {/* Delete */}

                    <button
                      onClick={() => deleteSupplier(supplier.id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        padding: "8px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "transform 0.1s, background 0.2s",
                        display:"inline-flex",
                        alignItems:"center"
                      }}
                      title="Delete Supplier"
                      onMouseEnter={(e) => {
                        e.target.style.background = "#dc2626";
                        e.target.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "#ef4444";
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}