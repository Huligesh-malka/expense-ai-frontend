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
  const streamRef = useRef(null);
  const frameSkipRef = useRef(0);
  const lastBarcodeRef = useRef("");
  const beepRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Preload beep sound
  useEffect(() => {
    // Create audio context for better sound handling
    try {
      beepRef.current = new Audio("/beep.mp3");
      beepRef.current.volume = 0.7;
      beepRef.current.preload = "auto";
      
      // Preload the audio
      beepRef.current.load();
    } catch (e) {
      console.log("Failed to load audio:", e);
    }
    
    return () => {
      if (beepRef.current) {
        beepRef.current.pause();
        beepRef.current.src = "";
        beepRef.current = null;
      }
    };
  }, []);

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

  const playBeep = () => {
    if (!soundEnabled) return;
    
    try {
      if (beepRef.current) {
        // Reset audio to start
        beepRef.current.currentTime = 0;
        
        // Create a promise for playing
        const playPromise = beepRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Audio played successfully
            })
            .catch((error) => {
              // Auto-play was prevented
              console.log("Audio play prevented:", error);
              // Try to play with user interaction
              const playOnInteraction = () => {
                beepRef.current?.play().catch(() => {});
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              };
              document.addEventListener('click', playOnInteraction);
              document.addEventListener('touchstart', playOnInteraction);
            });
        }
      } else {
        // Fallback: Create a temporary audio context for beep
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = "sine";
          
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
          
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.2);
        } catch (e) {
          console.log("Fallback beep failed:", e);
        }
      }
    } catch (e) {
      console.log("Beep error:", e);
    }
  };

  const startScanner = async () => {
    try {
      setLoading(true);
      setError("");

      // Create ZXing hints for better detection - INCLUDING MORE FORMATS
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
        BarcodeFormat.PDF_417,
        BarcodeFormat.MAXICODE,
        BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED,
      ]);

      // Create reader with hints
      const reader = new BrowserMultiFormatReader(hints);
      codeReader.current = reader;

      // Get cameras
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

      // HIGH-RESOLUTION camera constraints
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment",
          aspectRatio: { ideal: 1.3333333333333333 },
        },
      };

      // Get user media with high resolution
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Get video track for advanced controls
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;

      // APPLY PROFESSIONAL CAMERA SETTINGS
      try {
        // 1. CONTINUOUS AUTOFOCUS
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" }],
        });
        console.log("✅ Continuous autofocus enabled");
      } catch (e) {
        console.log("Autofocus not supported");
      }

      try {
        // 2. OPTICAL ZOOM (50% of max)
        const capabilities = track.getCapabilities();
        if (capabilities.zoom) {
          const zoomLevel = capabilities.zoom.max * 0.5;
          await track.applyConstraints({
            advanced: [{ zoom: zoomLevel }],
          });
          console.log(`✅ Zoom set to ${zoomLevel.toFixed(1)}x`);
        }
      } catch (e) {
        console.log("Zoom not supported");
      }

      try {
        // 3. CONTINUOUS EXPOSURE
        await track.applyConstraints({
          advanced: [{ exposureMode: "continuous" }],
        });
        console.log("✅ Continuous exposure enabled");
      } catch (e) {
        console.log("Exposure control not supported");
      }

      // Check torch availability
      const capabilities = track.getCapabilities();
      if (capabilities.torch) {
        setTorchAvailable(true);
      }

      // START DECODING WITH FRAME SKIP FOR PERFORMANCE
      let lastResult = null;
      let lastResultTime = 0;
      const MIN_RESULT_INTERVAL = 200; // Minimum 200ms between results

      controls.current = await reader.decodeFromStream(
        stream,
        videoRef.current,
        (result, error) => {
          // Frame skipping - process every 2nd frame for better performance
          frameSkipRef.current++;
          if (frameSkipRef.current % 2 !== 0) return;

          if (result && isScanning) {
            const barcode = result.getText();
            const now = Date.now();

            // Prevent duplicate scans using ref (faster than state)
            if (lastBarcodeRef.current === barcode) {
              return;
            }

            // Prevent rapid re-scans
            if (now - lastResultTime < MIN_RESULT_INTERVAL) {
              return;
            }

            lastResultTime = now;
            lastBarcodeRef.current = barcode;

            console.log("✅ Barcode detected:", barcode);
            console.log("Format:", result.getBarcodeFormat());

            // PLAY BEEP + VIBRATE
            playBeep();

            // Vibrate
            try {
              navigator.vibrate?.(100);
            } catch (e) {}

            setIsScanning(false);

            // Clear any existing timeout
            if (scanTimeoutRef.current) {
              clearTimeout(scanTimeoutRef.current);
            }

            // Search product
            searchProduct(barcode);
          }

          if (error) {
            // Ignore normal scan errors
            if (error.name !== "NotFoundException") {
              console.log("Scanner error:", error.name);
            }
          }
        }
      );

      setLoading(false);
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Unable to access camera. Please use manual entry.");
      setLoading(false);
    }
  };

  const searchProduct = async (barcode) => {
    try {
      const res = await API.get(
        `/products/barcode/${encodeURIComponent(barcode)}?business_id=${businessId}`
      );

      if (res.data.success) {
        // Play success sound
        playBeep();
        
        // Stop scanner after successful scan
        await stopScanner();

        // Small delay for transition
        setTimeout(() => {
          onClose();
          onProductFound(res.data.data);
        }, 300);
      } else {
        // Play error sound (different frequency)
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          oscillator.frequency.value = 300;
          oscillator.type = "sawtooth";
          
          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
        
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

    // Stop all tracks in stream
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      } catch (e) {
        console.log("Error stopping stream tracks:", e);
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    setTorchOn(false);
    videoTrackRef.current = null;
    lastBarcodeRef.current = "";
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
        playBeep();
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
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                background: soundEnabled ? "#10b981" : "#6b7280",
                color: "#fff",
                border: "none",
                padding: "10px 15px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "16px",
              }}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
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

          {/* Professional scanning overlay - optimized for small barcodes */}
          {!loading && !error && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "70%",
                maxWidth: "450px",
                height: "140px",
                border: "2px solid rgba(255, 255, 255, 0.8)",
                borderRadius: 12,
                boxShadow: "0 0 0 4000px rgba(0, 0, 0, 0.3)",
                pointerEvents: "none",
              }}
            >
              {/* Corner markers with neon glow */}
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  left: -3,
                  width: 35,
                  height: 35,
                  borderTop: "4px solid #00ff00",
                  borderLeft: "4px solid #00ff00",
                  borderRadius: "4px 0 0 0",
                  boxShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -3,
                  right: -3,
                  width: 35,
                  height: 35,
                  borderTop: "4px solid #00ff00",
                  borderRight: "4px solid #00ff00",
                  borderRadius: "0 4px 0 0",
                  boxShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -3,
                  left: -3,
                  width: 35,
                  height: 35,
                  borderBottom: "4px solid #00ff00",
                  borderLeft: "4px solid #00ff00",
                  borderRadius: "0 0 0 4px",
                  boxShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 35,
                  height: 35,
                  borderBottom: "4px solid #00ff00",
                  borderRight: "4px solid #00ff00",
                  borderRadius: "0 0 4px 0",
                  boxShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
                }}
              />
              {/* Animated scanning line for better alignment */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "5%",
                  right: "5%",
                  height: "3px",
                  background: "linear-gradient(90deg, transparent, #00ff00, transparent)",
                  transform: "translateY(-50%)",
                  animation: "scanLine 1.5s ease-in-out infinite",
                  boxShadow: "0 0 20px rgba(0, 255, 0, 0.5)",
                }}
              />
              {/* Text hint */}
              <div
                style={{
                  position: "absolute",
                  bottom: -40,
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  textShadow: "0 0 10px rgba(0,0,0,0.8)",
                }}
              >
                Align barcode within frame
              </div>
            </div>
          )}
        </div>

        {/* Add CSS animation */}
        <style jsx>{`
          @keyframes scanLine {
            0%, 100% {
              top: 20%;
              opacity: 0.3;
            }
            50% {
              top: 80%;
              opacity: 1;
            }
          }
        `}</style>

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
            QR Code • Data Matrix • Aztec • PDF417 • MaxiCode • RSS-14
          </p>
        </div>
      </div>
    </div>
  );
}