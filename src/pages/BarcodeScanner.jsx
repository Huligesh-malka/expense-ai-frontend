import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";
import API from "../services/api";

export default function BarcodeScanner({
  businessId,
  onProductFound,
  onClose,
}) {
  const videoRef = useRef(null);
  const codeReader = useRef(null);
  const controls = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [lastScanned, setLastScanned] = useState(null);
  const [searching, setSearching] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const scanTimeoutRef = useRef(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const videoTrackRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        stopScanner();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;

    try {
      const newTorchState = !torchOn;
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.log("Torch not supported on this device");
      setTorchAvailable(false);
    }
  };

  const startScanner = async () => {
    try {
      setLoading(true);
      setError("");

      // Create ZXing hints for better detection
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
        BarcodeFormat.AZTEC,
      ]);

      // Create reader with hints
      const reader = new BrowserMultiFormatReader(hints);
      codeReader.current = reader;

      // Get cameras - NOW USING @zxing/browser's method
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();

      if (!devices.length) {
        setError("No camera found");
        setLoading(false);
        return;
      }

      // Prefer back camera
      let deviceId = devices[0].deviceId;
      const backCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
      );

      if (backCamera) {
        deviceId = backCamera.deviceId;
      }

      console.log("📷 Using camera:", deviceId);

      // Start scanner - decodeFromVideoDevice handles camera opening
      controls.current = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        async (result, error) => {
          if (result && isScanning) {
            const barcode = result.getText();

            // Prevent duplicate scans
            if (barcode === lastScanned) return;

            console.log("✅ Barcode detected:", barcode);
            console.log("Format:", result.getBarcodeFormat());

            setLastScanned(barcode);
            setIsScanning(false);

            // Clear any existing timeout
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
            }

            try {
              const res = await API.get(
                `/products/barcode/${encodeURIComponent(
                  barcode
                )}?business_id=${businessId}`
              );

              if (res.data.success) {
                await stopScanner();

                // Small delay for clean transition
                setTimeout(() => {
                  onClose();
                  onProductFound(res.data.data);
                }, 300);
              } else {
                setError("Product not found in inventory");
                setIsScanning(true);

                setTimeout(() => {
                  setError("");
                }, 3000);
              }
            } catch (e) {
              console.error("Error searching product:", e);
              setError("Error searching product");
              setIsScanning(true);

              setTimeout(() => {
                setError("");
              }, 3000);
            }

            // Reset scanning after cooldown
            scanTimeoutRef.current = setTimeout(() => {
              setIsScanning(true);
            }, 2000);
          }

          if (error) {
            // Ignore normal scan errors (NotFoundException means no barcode detected)
            if (error.name !== "NotFoundException") {
              console.log("Scanner error:", error.name);
            }
          }
        }
      );

      setLoading(false);

      // Check if torch is available after stream starts
      setTimeout(async () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = videoRef.current.srcObject.getVideoTracks();
          if (tracks.length > 0) {
            videoTrackRef.current = tracks[0];
            // Check if torch is available
            const capabilities = tracks[0].getCapabilities();
            if (capabilities.torch) {
              setTorchAvailable(true);
            }
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Unable to access camera. Please use manual entry.");
      setLoading(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (controls.current) {
        controls.current.stop();
        controls.current = null;
      }
    } catch (e) {
      console.log("Error stopping controls:", e);
    }

    try {
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    } catch (e) {
      console.log("Error resetting reader:", e);
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        videoRef.current.srcObject.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
      } catch (e) {
        console.log("Error stopping video tracks:", e);
      }
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    setTorchOn(false);
    videoTrackRef.current = null;
  };

  const searchManualBarcode = async () => {
    if (!manualBarcode.trim()) {
      alert("Please enter a barcode");
      return;
    }

    setSearching(true);
    try {
      const res = await API.get(
        `/products/barcode/${encodeURIComponent(manualBarcode)}?business_id=${businessId}`
      );

      if (res.data.success) {
        await stopScanner();
        onClose();
        onProductFound(res.data.data);
      } else {
        alert("Product not found");
      }
    } catch (err) {
      alert("Product not found. Please check the barcode.");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      searchManualBarcode();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        padding: "10px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopScanner();
          onClose();
        }
      }}
    >
      <div
        style={{
          width: "1100px",
          maxWidth: "100%",
          height: "90vh",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: 12,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0 }}>📦 Barcode Scanner</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            {torchAvailable && (
              <button
                onClick={toggleTorch}
                style={{
                  background: torchOn ? "#f59e0b" : "#6b7280",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                {torchOn ? "🔦 On" : "🔦 Off"}
              </button>
            )}
            <button
              onClick={async () => {
                await stopScanner();
                onClose();
              }}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h3>📷 Opening Camera...</h3>
            <p style={{ color: "#666" }}>Please allow camera access</p>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: 15,
              borderRadius: 8,
              marginBottom: 15,
              flexShrink: 0,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <div
          style={{
            position: "relative",
            width: "100%",
            flex: "1 1 auto",
            background: "#000",
            borderRadius: 10,
            overflow: "hidden",
            minHeight: "300px",
          }}
        >
          <video
            ref={videoRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: loading ? "none" : "block",
            }}
            playsInline
            muted
          />

          {/* Scanning overlay - better for barcode alignment */}
          {!loading && !error && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "85%",
                maxWidth: "500px",
                height: "120px",
                border: "3px solid rgba(255, 255, 255, 0.7)",
                borderRadius: 10,
                boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.3)",
                pointerEvents: "none",
              }}
            >
              {/* Corner markers */}
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  left: -3,
                  width: 30,
                  height: 30,
                  borderTop: "4px solid #3b82f6",
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "4px 0 0 0",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 30,
                  height: 30,
                  borderTop: "4px solid #3b82f6",
                  borderRight: "4px solid #3b82f6",
                  borderRadius: "0 4px 0 0",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -3,
                  left: -3,
                  width: 30,
                  height: 30,
                  borderBottom: "4px solid #3b82f6",
                  borderLeft: "4px solid #3b82f6",
                  borderRadius: "0 0 0 4px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 30,
                  height: 30,
                  borderBottom: "4px solid #3b82f6",
                  borderRight: "4px solid #3b82f6",
                  borderRadius: "0 0 4px 0",
                }}
              />
              {/* Center line for better barcode alignment */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "10%",
                  right: "10%",
                  height: "2px",
                  background: "rgba(59, 130, 246, 0.5)",
                  transform: "translateY(-50%)",
                }}
              />
            </div>
          )}
        </div>

        <hr style={{ margin: "16px 0", flexShrink: 0 }} />

        <div style={{ flexShrink: 0 }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Manual Barcode Entry</h3>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
              onKeyPress={handleKeyPress}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "14px",
                fontSize: "18px",
                borderRadius: 8,
                border: "1px solid #ccc",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
              disabled={searching}
            />
            <button
              onClick={searchManualBarcode}
              disabled={searching || !manualBarcode.trim()}
              style={{
                background:
                  searching || !manualBarcode.trim() ? "#94a3b8" : "#2563eb",
                color: "#fff",
                border: "none",
                padding: "14px 30px",
                borderRadius: 8,
                cursor:
                  searching || !manualBarcode.trim() ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: "16px",
                whiteSpace: "nowrap",
              }}
            >
              {searching ? "⏳ Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "10px 15px",
            background: "#f3f4f6",
            borderRadius: 8,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            📷 Supported: EAN-13 • EAN-8 • UPC-A • UPC-E • CODE-128 • CODE-39 •
            QR Code • Data Matrix • Aztec
          </p>
        </div>
      </div>
    </div>
  );
}