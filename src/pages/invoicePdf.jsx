import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* jsPDF's built-in fonts don't include the ₹ glyph, so the PDF uses "Rs." */
const money = (n) =>
    "Rs. " +
    new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(n) || 0);

const formatQuantity = (item) => {
    const enteredQty = Number(item.entered_quantity || item.quantity || 0);
    const enteredUnit = item.entered_unit || item.unit || "pcs";
    const baseQty = Number(item.base_quantity || item.quantity || 0);
    const baseUnit = item.base_unit || item.unit || "pcs";
    if (enteredUnit === baseUnit || enteredQty === baseQty) {
        return `${enteredQty} ${enteredUnit}`;
    }
    return `${enteredQty} ${enteredUnit} (${baseQty} ${baseUnit})`;
};

const formatUnitPrice = (item) => {
    const price = Number(item.price || 0);
    const baseUnit = item.base_unit || item.unit || "pcs";
    return `Rs. ${price.toFixed(2)}/${baseUnit.toUpperCase()}`;
};

export function numberToWords(num) {
    if (!num) return "Amount in words: Zero Rupees Only";

    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

    const convertHundreds = (n) => {
        let words = "";
        if (n >= 100) {
            words += ones[Math.floor(n / 100)] + " Hundred ";
            n %= 100;
        }
        if (n >= 20) {
            words += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        }
        if (n >= 10) {
            words += teens[n - 10] + " ";
            n = 0;
        }
        if (n > 0) words += ones[n] + " ";
        return words;
    };

    let rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let result = "";
    if (rupees >= 10000000) {
        result += convertHundreds(Math.floor(rupees / 10000000)) + "Crore ";
        rupees %= 10000000;
    }
    if (rupees >= 100000) {
        result += convertHundreds(Math.floor(rupees / 100000)) + "Lakh ";
        rupees %= 100000;
    }
    if (rupees >= 1000) {
        result += convertHundreds(Math.floor(rupees / 1000)) + "Thousand ";
        rupees %= 1000;
    }
    result += convertHundreds(rupees);
    result += "Rupees";
    if (paise > 0) result += " and " + convertHundreds(paise) + "Paise";
    result += " Only";
    return "Amount in words: " + result.trim();
}

/**
 * Builds the invoice PDF and downloads it straight away (no print dialog).
 */
export function downloadInvoicePdf(invoice, items = []) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    const right = pageW - margin;
    const center = pageW / 2;

    const INK = [11, 18, 32];
    const MUTED = [100, 116, 139];
    const LINE = [219, 226, 235];

    const discount = Number(invoice.discount) || 0;
    const subtotal = Number(invoice.subtotal) || 0;
    const total = Number(invoice.total_amount) || 0;
    const taxable = Math.max(0, subtotal - discount);
    const cgstAmount = Number(invoice.cgst || 0);
    const sgstAmount = Number(invoice.sgst || 0);
    const cgstRate =
        Number(invoice.cgst_rate) > 0 ? Number(invoice.cgst_rate) : taxable > 0 ? (cgstAmount / taxable) * 100 : 0;
    const sgstRate =
        Number(invoice.sgst_rate) > 0 ? Number(invoice.sgst_rate) : taxable > 0 ? (sgstAmount / taxable) * 100 : 0;

    const isPaid = invoice.payment_status?.toLowerCase() === "paid";
    const docTitle = invoice.gst_number ? "TAX INVOICE" : "CASH MEMO";

    let y = 18;

    /* ── Header ── */
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(invoice.business_name || "Business Name", center, y, { align: "center" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);

    const addressLine = [
        invoice.address,
        invoice.city,
        invoice.state,
        invoice.pincode ? `- ${invoice.pincode}` : "",
    ]
        .filter(Boolean)
        .join(", ")
        .replace(", -", " -");
    if (addressLine) {
        const lines = doc.splitTextToSize(addressLine, pageW - margin * 2 - 20);
        doc.text(lines, center, y, { align: "center" });
        y += lines.length * 4.2;
    }
    const contact = [invoice.business_phone, invoice.business_email].filter(Boolean).join("   |   ");
    if (contact) {
        doc.text(contact, center, y, { align: "center" });
        y += 4.5;
    }
    if (invoice.gst_number) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...INK);
        doc.text(`GSTIN: ${invoice.gst_number}`, center, y, { align: "center" });
        y += 4.5;
    }

    y += 2;
    doc.setDrawColor(...LINE);
    doc.line(margin, y, right, y);
    y += 5.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(docTitle, center, y, { align: "center", charSpace: 1.2 });
    y += 3;
    doc.line(margin, y, right, y);
    y += 8;

    /* ── Bill info (left) + status/total (right) ── */
    const created = new Date(invoice.created_at);
    const dateStr = created.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = created.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const method = invoice.payment_method
        ? invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1)
        : "N/A";

    const infoRows = [
        ["Bill No.", `#${invoice.invoice_no}`],
        ["Date", dateStr],
        ["Time", timeStr],
        ["Paid By", method],
    ];
    if (invoice.customer_phone) infoRows.push(["Customer", invoice.customer_phone]);
    if (invoice.customer_email) infoRows.push(["Email", invoice.customer_email]);

    const infoStartY = y;
    infoRows.forEach(([k, v]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...MUTED);
        doc.text(k.toUpperCase(), margin, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        doc.text(String(v), margin + 28, y);
        y += 6;
    });

    // Total box on the right
    const boxW = 66;
    const boxH = 28;
    const boxX = right - boxW;
    doc.setFillColor(11, 18, 32);
    doc.roundedRect(boxX, infoStartY - 4, boxW, boxH, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("TOTAL AMOUNT", boxX + boxW / 2, infoStartY + 3, { align: "center", charSpace: 0.8 });
    doc.setFontSize(16);
    doc.setTextColor(200, 255, 0);
    doc.text(money(total), boxX + boxW / 2, infoStartY + 12, { align: "center" });
    doc.setFontSize(9);
    if (isPaid) doc.setTextColor(74, 222, 128);
    else doc.setTextColor(251, 191, 36);
    doc.text(
        (invoice.payment_status || "N/A").toUpperCase(),
        boxX + boxW / 2,
        infoStartY + 19,
        { align: "center", charSpace: 1 }
    );

    y = Math.max(y, infoStartY - 4 + boxH) + 4;

    /* ── Items table ── */
    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["#", "Product", "Qty", "Price", "Total"]],
        body: items.map((it, i) => [
            i + 1,
            it.description ? `${it.product_name}\n${it.description}` : it.product_name,
            formatQuantity(it),
            formatUnitPrice(it),
            money(it.total),
        ]),
        theme: "plain",
        styles: {
            font: "helvetica",
            fontSize: 9,
            textColor: INK,
            cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
            lineColor: LINE,
            lineWidth: 0,
        },
        headStyles: {
            fontStyle: "bold",
            fontSize: 8,
            textColor: MUTED,
            fillColor: [248, 250, 252],
            lineWidth: { bottom: 0.3 },
            lineColor: LINE,
        },
        columnStyles: {
            0: { cellWidth: 9, halign: "center" },
            1: { cellWidth: "auto" },
            2: { cellWidth: 34, halign: "right" },
            3: { cellWidth: 34, halign: "right" },
            4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
        },
        didParseCell: (data) => {
            if (data.section === "head" && [2, 3, 4].includes(data.column.index)) data.cell.styles.halign = "right";
            if (data.section === "body") data.cell.styles.lineWidth = { bottom: 0.15 };
        },
    });

    y = doc.lastAutoTable.finalY + 8;

    /* ── Summary ── */
    const ensureSpace = (needed) => {
        if (y + needed > pageH - 18) {
            doc.addPage();
            y = 18;
        }
    };
    ensureSpace(60);

    const sumLabelX = right - 70;
    const sumRow = (label, value, color = INK) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...MUTED);
        doc.text(label, sumLabelX, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...color);
        doc.text(value, right, y, { align: "right" });
        y += 6;
    };

    sumRow("Sub Total", money(subtotal));
    if (discount > 0) sumRow("Discount", `-${money(discount)}`, [185, 28, 28]);
    sumRow(`CGST (${cgstRate.toFixed(2)}%)`, money(cgstAmount));
    sumRow(`SGST (${sgstRate.toFixed(2)}%)`, money(sgstAmount));

    y += 1;
    doc.setFillColor(200, 255, 0);
    doc.roundedRect(sumLabelX - 4, y - 5.5, right - sumLabelX + 8, 11, 2.5, 2.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text("Net Payable", sumLabelX, y + 1.5);
    doc.text(money(total), right, y + 1.5, { align: "right" });
    y += 14;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    const words = doc.splitTextToSize(numberToWords(total), pageW - margin * 2);
    doc.text(words, right, y, { align: "right" });
    y += words.length * 4 + 4;

    /* ── Notes / terms ── */
    const block = (title, text) => {
        if (!text) return;
        const lines = doc.splitTextToSize(String(text), pageW - margin * 2 - 6);
        ensureSpace(lines.length * 4 + 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(title.toUpperCase(), margin, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...INK);
        doc.text(lines, margin, y);
        y += lines.length * 4 + 4;
    };
    block("Note", invoice.notes);
    block("Terms", invoice.terms);

    /* ── Footer ── */
    ensureSpace(20);
    y += 2;
    doc.setDrawColor(...LINE);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(margin, y, right, y);
    doc.setLineDashPattern([], 0);
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text("Thank you! Visit again", center, y, { align: "center" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${invoice.invoice_no} · Computer generated bill, no signature required`, center, y, {
        align: "center",
    });

    doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}