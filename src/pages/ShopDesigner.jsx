import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Text, Box } from "@react-three/drei";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ShopDesigner() {

  const businessId = localStorage.getItem("businessId");

  const [layout, setLayout] = useState(null);
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  
  const [editObject, setEditObject] = useState({
    x: 0,
    y: 0,
    z: 0,
    rotation: 0,
  });

  useEffect(() => {
    loadLayout();
  }, []);

  const loadLayout = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/shop/layout/${businessId}`
      );

      setLayout(res.data.layout);

      if(res.data.objects){
        setObjects(res.data.objects);
      }
    } catch (err) {
      console.error("Error loading layout:", err);
    }
  };

  const addShelf = async() => {
    try {
      const newShelf = {
        layout_id: layout.id,
        object_type: "Shelf",
        object_name: "Shelf",
        x: 0,
        y: 1,
        z: 0,
        rotation: 0,
        width: 4,
        height: 2,
        depth: 1,
        color: "#8B4513"
      };

      const res = await axios.post(
        "http://localhost:5000/api/shop/object",
        newShelf
      );

      setObjects([
        ...objects,
        {
          id: res.data.id,
          ...newShelf
        }
      ]);
    } catch (err) {
      console.error("Error adding shelf:", err);
    }
  };

  const deleteObject = async () => {
    if (!selectedObject) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/shop/object/${selectedObject}`
      );

      setObjects(
        objects.filter(obj => obj.id !== selectedObject)
      );

      setSelectedObject(null);
      setEditObject({
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
      });
    } catch (err) {
      console.error("Error deleting object:", err);
    }
  };

  const saveObjectChanges = async () => {
    if (!selectedObject) return;

    try {
      const obj = objects.find(o => o.id === selectedObject);
      
      await axios.put(
        `http://localhost:5000/api/shop/object/${selectedObject}`,
        {
          ...editObject,
          width: obj.width,
          height: obj.height,
          depth: obj.depth,
          color: obj.color,
          object_name: obj.object_name,
        }
      );

      // Update local state
      setObjects(prev =>
        prev.map(o =>
          o.id === selectedObject
            ? {
                ...o,
                x: editObject.x,
                y: editObject.y,
                z: editObject.z,
                rotation: editObject.rotation,
              }
            : o
        )
      );

      await loadLayout();
      
      alert("Object updated successfully!");
    } catch (err) {
      console.error("Error saving object:", err);
      alert("Failed to save object changes");
    }
  };

  const duplicateObject = async () => {
    if (!selectedObject) return;

    try {
      await axios.post(
        `http://localhost:5000/api/shop/object/${selectedObject}/duplicate`
      );
      
      await loadLayout();
      alert("Object duplicated successfully!");
    } catch (err) {
      console.error("Error duplicating object:", err);
      alert("Failed to duplicate object");
    }
  };

  const rotateObject = async (rotationValue) => {
    if (!selectedObject) return;

    try {
      await axios.put(
        `http://localhost:5000/api/shop/object/${selectedObject}/rotate`,
        { rotation: rotationValue }
      );

      setEditObject({
        ...editObject,
        rotation: rotationValue,
      });

      setObjects(prev =>
        prev.map(o =>
          o.id === selectedObject
            ? { ...o, rotation: rotationValue }
            : o
        )
      );

      await loadLayout();
    } catch (err) {
      console.error("Error rotating object:", err);
      alert("Failed to rotate object");
    }
  };

  if(!layout) return <h2 style={{ padding: 20 }}>Loading...</h2>;

  const selectedObjectData = objects.find(o => o.id === selectedObject);

  return(
    <>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={addShelf}
          style={{
            padding: "12px 20px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          + Add Shelf
        </button>

        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 8,
            width: 300,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", fontSize: 18 }}>
            Properties Panel
          </h3>
          
          {selectedObject ? (
            <div>
              <p style={{ margin: "5px 0", fontSize: 14 }}>
                <strong>ID:</strong> {selectedObject}
              </p>
              <p style={{ margin: "5px 0", fontSize: 14 }}>
                <strong>Name:</strong> {selectedObjectData?.object_name || "N/A"}
              </p>
              <p style={{ margin: "5px 0", fontSize: 14 }}>
                <strong>Type:</strong> {selectedObjectData?.object_type || "N/A"}
              </p>
              
              <hr style={{ margin: "15px 0" }} />

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
                  Position X:
                </label>
                <input
                  type="number"
                  value={editObject.x}
                  onChange={(e) =>
                    setEditObject({ ...editObject, x: Number(e.target.value) })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
                  Position Y:
                </label>
                <input
                  type="number"
                  value={editObject.y}
                  onChange={(e) =>
                    setEditObject({ ...editObject, y: Number(e.target.value) })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
                  Position Z:
                </label>
                <input
                  type="number"
                  value={editObject.z}
                  onChange={(e) =>
                    setEditObject({ ...editObject, z: Number(e.target.value) })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: "bold", marginBottom: 5 }}>
                  Rotation (degrees):
                </label>
                <input
                  type="number"
                  value={editObject.rotation}
                  onChange={(e) =>
                    setEditObject({ ...editObject, rotation: Number(e.target.value) })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 5, marginTop: 5 }}>
                  <button
                    onClick={() => rotateObject(0)}
                    style={{
                      flex: 1,
                      padding: "5px 10px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    0°
                  </button>
                  <button
                    onClick={() => rotateObject(Math.PI / 2)}
                    style={{
                      flex: 1,
                      padding: "5px 10px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    90°
                  </button>
                  <button
                    onClick={() => rotateObject(Math.PI)}
                    style={{
                      flex: 1,
                      padding: "5px 10px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    180°
                  </button>
                  <button
                    onClick={() => rotateObject((3 * Math.PI) / 2)}
                    style={{
                      flex: 1,
                      padding: "5px 10px",
                      background: "#e5e7eb",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    270°
                  </button>
                </div>
              </div>

              <hr style={{ margin: "15px 0" }} />

              <button
                onClick={saveObjectChanges}
                style={{
                  width: "100%",
                  padding: "10px 20px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                💾 Save Changes
              </button>

              <button
                onClick={duplicateObject}
                style={{
                  width: "100%",
                  padding: "10px 20px",
                  background: "#8b5cf6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                📋 Duplicate
              </button>

              <button
                onClick={deleteObject}
                style={{
                  width: "100%",
                  padding: "10px 20px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 10px 0", color: "#666" }}>
                No Object Selected
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#999" }}>
                Click on a shelf in the 3D view to edit its properties
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height: "100vh" }}>
        <Canvas camera={{ position: [20, 20, 20], fov: 60 }}>
          <ambientLight intensity={2}/>
          <directionalLight position={[20, 20, 20]} intensity={2}/>
          
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.1}
          />

          <Grid args={[100, 100]}/>

          <mesh rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[Number(layout.width), Number(layout.length)]}/>
            <meshStandardMaterial color="#d9d9d9"/>
          </mesh>

          <Text
            position={[0, 0.1, -Number(layout.length)/2 - 2]}
            rotation={[-Math.PI/2, 0, 0]}
            fontSize={1}
          >
            {layout.shop_name}
          </Text>

          {objects.map((obj) => {
            const shelf = (
              <Box
                args={[obj.width, obj.height, obj.depth]}
                position={[obj.x, obj.y, obj.z]}
                rotation={[0, obj.rotation || 0, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedObject(obj.id);
                  setEditObject({
                    x: obj.x,
                    y: obj.y,
                    z: obj.z,
                    rotation: obj.rotation || 0,
                  });
                }}
              >
                <meshStandardMaterial
                  color={selectedObject === obj.id ? "#ff0000" : obj.color}
                />
              </Box>
            );

            return (
              <group key={obj.id}>
                {shelf}
              </group>
            );
          })}
        </Canvas>
      </div>
    </>
  );
}