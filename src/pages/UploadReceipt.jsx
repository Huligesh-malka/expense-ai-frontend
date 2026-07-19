import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function UploadReceipt() {

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {

        const selectedFile = e.target.files[0];

        if (!selectedFile) return;

        setFile(selectedFile);

        if (selectedFile.type.startsWith("image")) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview("");
        }

    };

    const handleUpload = async () => {

        if (!file) {
            alert("Please select a receipt.");
            return;
        }

        try {

            setLoading(true);

            const formData = new FormData();

            formData.append("receipt", file);

            formData.append("user_id", 1);

            const res = await API.post(
                "/receipts/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            const receiptId = res.data.receiptId;

            // Run OCR
            await API.get(`/ocr/scan/${receiptId}`);

            // Run AI Parsing
            await API.get(`/ai/parse/${receiptId}`);

            alert("Receipt scanned successfully.");

            navigate(`/review-receipt/${receiptId}`);

        } catch (err) {

            console.log(err);

            alert("Upload Failed");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div
            style={{
                width: "500px",
                margin: "40px auto"
            }}
        >

            <h2>Upload Receipt</h2>

            <br />

            <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
            />

            <br />
            <br />

            {
                preview &&
                <img
                    src={preview}
                    alt="preview"
                    width="300"
                />
            }

            <br />
            <br />

            <button
                onClick={handleUpload}
            >

                {
                    loading
                        ? "Uploading..."
                        : "Upload Receipt"
                }

            </button>

        </div>

    );

}