/**
 * Selective Report Generation Utilities
 * Generate reports based on user-selected properties and lands
 */

import { jsPDF } from "jspdf";
import type { Property, Land } from "@/lib/types";

interface ReportOptions {
  title?: string;
  includeFooter?: boolean;
}

/**
 * Generate Property Report for Selected Properties Only
 */
export function generateSelectedPropertiesReportPDF(
  properties: Property[],
  options: ReportOptions = {},
): Buffer {
  const { title = "Property Portfolio Report", includeFooter = true } = options;

  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margins = { left: 15, right: 15, top: 15, bottom: 15 };
  const maxY = pageHeight - margins.bottom;

  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(title, margins.left, yPosition);
  yPosition += 15;

  // Info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleDateString()} | Items Selected: ${properties.length}`,
    margins.left,
    yPosition,
  );
  yPosition += 8;

  // Summary box
  const occupiedCount = properties.filter((p) => p.status === "Occupied").length;
  const vacantCount = properties.filter((p) => p.status === "Vacant").length;
  const totalValue = properties.reduce(
    (sum, p) =>
      sum + (parseFloat(p.currentValue || p.purchasePrice || "0") || 0),
    0,
  );

  doc.setDrawColor(200);
  doc.rect(margins.left, yPosition, doc.internal.pageSize.width - 2 * margins.left, 25);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Properties: ${properties.length} | Occupied: ${occupiedCount} | Vacant: ${vacantCount} | Total Value: $${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    margins.left + 5,
    yPosition,
  );
  yPosition += 20;

  // Detailed listings
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Property Details", margins.left, yPosition);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  for (const property of properties) {
    if (yPosition > maxY - 30) {
      doc.addPage();
      yPosition = margins.top;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${property.name}`, margins.left, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    const details = [
      `Location: ${property.location}${property.city ? ", " + property.city : ""}${property.state ? ", " + property.state : ""}`,
      `Type: ${property.type} | Unit: ${property.unit} | Status: ${property.status}`,
      `Tenants: ${property.tenantCount || 0} | Area: ${property.area}`,
      `Price: $${property.price} | Current Value: $${property.currentValue || property.purchasePrice || "N/A"}`,
      ...(property.description ? [`Description: ${property.description.substring(0, 150)}`] : []),
    ];

    for (const detail of details) {
      doc.text(detail, margins.left + 5, yPosition);
      yPosition += 4;
    }

    yPosition += 3;
  }

  if (includeFooter) {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      "This is an automatically generated report from PropFusion",
      margins.left,
      pageHeight - 10,
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate Land Report for Selected Lands Only
 */
export function generateSelectedLandsReportPDF(
  lands: Land[],
  options: ReportOptions = {},
): Buffer {
  const { title = "Agricultural Land Report", includeFooter = true } = options;

  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margins = { left: 15, right: 15, top: 15, bottom: 15 };
  const maxY = pageHeight - margins.bottom;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(title, margins.left, yPosition);
  yPosition += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleDateString()} | Items Selected: ${lands.length}`,
    margins.left,
    yPosition,
  );
  yPosition += 8;

  // Summary
  const uniqueCrops = new Set(lands.map((l) => l.crop)).size;
  const totalArea = lands.reduce((sum, l) => {
    const areaNum = parseFloat(l.area || "0");
    return sum + (isNaN(areaNum) ? 0 : areaNum);
  }, 0);
  const totalValue = lands.reduce(
    (sum, l) =>
      sum + (parseFloat(l.currentValue || l.purchasePrice || "0") || 0),
    0,
  );

  doc.setDrawColor(200);
  doc.rect(margins.left, yPosition, doc.internal.pageSize.width - 2 * margins.left, 25);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Lands: ${lands.length} | Total Area: ${totalArea.toFixed(2)} acres | Crops: ${uniqueCrops} | Total Value: $${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    margins.left + 5,
    yPosition,
  );
  yPosition += 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Land Details", margins.left, yPosition);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  for (const land of lands) {
    if (yPosition > maxY - 30) {
      doc.addPage();
      yPosition = margins.top;
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${land.name}`, margins.left, yPosition);
    yPosition += 5;

    doc.setFont("helvetica", "normal");
    const details = [
      `Location: ${land.location}${land.city ? ", " + land.city : ""}${land.state ? ", " + land.state : ""}`,
      `Crop: ${land.crop} | Area: ${land.area} | Lease: ${land.leaseDuration}`,
      `Profit: ${land.profit} | Revenue: ${land.revenue || "N/A"}`,
      `Value: $${land.currentValue || land.purchasePrice || "N/A"} | Season: ${land.cropSeason || "N/A"}`,
    ];

    for (const detail of details) {
      doc.text(detail, margins.left + 5, yPosition);
      yPosition += 4;
    }

    yPosition += 3;
  }

  if (includeFooter) {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      "This is an automatically generated report from PropFusion",
      margins.left,
      pageHeight - 10,
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}

/**
 * Generate Combined Report for Selected Items
 */
export function generateSelectedCombinedReportPDF(
  properties: Property[],
  lands: Land[],
): Buffer {
  const doc = new jsPDF();
  let yPosition = 20;
  const pageHeight = doc.internal.pageSize.height;
  const margins = { left: 15, right: 15, top: 15, bottom: 15 };
  const maxY = pageHeight - margins.bottom;

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Portfolio Report (Selected Items)", margins.left, yPosition);
  yPosition += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margins.left, yPosition);
  yPosition += 10;

  // Summary
  const propValue = properties.reduce(
    (sum, p) =>
      sum + (parseFloat(p.currentValue || p.purchasePrice || "0") || 0),
    0,
  );
  const landValue = lands.reduce(
    (sum, l) =>
      sum + (parseFloat(l.currentValue || l.purchasePrice || "0") || 0),
    0,
  );
  const totalValue = propValue + landValue;

  doc.setDrawColor(50, 120, 220);
  doc.setFillColor(240, 245, 255);
  doc.rect(
    margins.left,
    yPosition,
    doc.internal.pageSize.width - 2 * margins.left,
    45,
    "F",
  );
  yPosition += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Portfolio Summary", margins.left + 5, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Real Estate: ${properties.length} selected | Value: $${propValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    margins.left + 5,
    yPosition,
  );
  yPosition += 6;

  doc.text(
    `Agriculture: ${lands.length} selected | Value: $${landValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    margins.left + 5,
    yPosition,
  );
  yPosition += 6;

  doc.setFont("helvetica", "bold");
  doc.text(
    `Combined Value: $${totalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`,
    margins.left + 5,
    yPosition,
  );
  yPosition += 15;

  // Properties section
  if (properties.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Real Estate Properties", margins.left, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (const prop of properties) {
      if (yPosition > maxY - 20) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`• ${prop.name}`, margins.left + 3, yPosition);
      yPosition += 4;

      doc.setFont("helvetica", "normal");
      doc.text(
        `${prop.location}, ${prop.city} | ${prop.status} | $${prop.currentValue || prop.purchasePrice}`,
        margins.left + 8,
        yPosition,
      );
      yPosition += 4;
    }
    yPosition += 5;
  }

  // Lands section
  if (lands.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Agricultural Lands", margins.left, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (const land of lands) {
      if (yPosition > maxY - 20) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`• ${land.name} (${land.crop})`, margins.left + 3, yPosition);
      yPosition += 4;

      doc.setFont("helvetica", "normal");
      doc.text(
        `${land.location}, ${land.city} | ${land.area} | $${land.currentValue || land.purchasePrice}`,
        margins.left + 8,
        yPosition,
      );
      yPosition += 4;
    }
  }

  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(
    "This is an automatically generated report from PropFusion",
    margins.left,
    pageHeight - 10,
  );

  return Buffer.from(doc.output("arraybuffer"));
}
