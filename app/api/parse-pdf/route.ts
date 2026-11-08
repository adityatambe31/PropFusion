import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

interface PDFData {
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  text: string;
  version: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
  status: "success";
  cardLastFour: string;
  type: "credit" | "debit";
}

// Parse PDF bank statements
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Empty file provided" },
        { status: 400 },
      );
    }

    // Parse PDF with error handling
    let pdfData: PDFData;
    try {
      console.log("Attempting to parse PDF, buffer size:", buffer.length);

      // Dynamic import with proper typing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfModule = (await import("pdf-parse")) as any;
      const pdfParse = (pdfModule.default || pdfModule) as (
        dataBuffer: Buffer,
      ) => Promise<PDFData>;

      pdfData = await pdfParse(buffer);

      console.log(
        "PDF parsed successfully, text length:",
        pdfData.text?.length || 0,
      );
    } catch (pdfError) {
      const error = pdfError as Error;
      console.error("PDF parsing library error:", error);
      console.error("Error details:", error.message, error.stack);
      return NextResponse.json(
        {
          error:
            "Failed to read PDF file. The file may be corrupted, password-protected, or scanned (image-based).",
          details: error.message,
          transactions: [],
        },
        { status: 400 },
      );
    }

    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "No text found in PDF. This may be a scanned document requiring OCR.",
          transactions: [],
        },
        { status: 400 },
      );
    }

    // Parse transactions from PDF text
    let transactions: Transaction[];
    try {
      transactions = parseBankStatement(text);
    } catch (parseError) {
      const error = parseError as Error;
      console.error("Transaction parsing error:", error);
      return NextResponse.json(
        {
          error:
            "Failed to parse transactions from PDF. The format may not be supported.",
          transactions: [],
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      transactions,
      success: true,
      message: `Parsed ${transactions.length} transactions from PDF`,
    });
  } catch (error) {
    const err = error as Error;
    console.error("Unexpected error parsing PDF:", err);
    return NextResponse.json(
      {
        error: err.message || "An unexpected error occurred while parsing PDF",
        transactions: [],
      },
      { status: 500 },
    );
  }
}

function parseBankStatement(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split("\n");

  // Common date patterns: 2026-01-01, 01/01/2026, Jan 01, 2026, etc.
  const datePattern =
    /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\w{3}\s+\d{1,2},?\s+\d{4})/i;
  // Amount pattern: $123.45, 123.45, (123.45), -123.45
  const amountPattern = /\$?([\d,]+\.\d{2})|(\(\s*[\d,]+\.\d{2}\s*\))/;

  let currentDate = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line contains a date
    const dateMatch = line.match(datePattern);
    if (dateMatch && dateMatch[1]) {
      currentDate = normalizeDate(dateMatch[1]);
    }

    // Look for transaction patterns
    // Format: Date Description Amount [Debit/Credit markers]
    if (currentDate && amountPattern.test(line)) {
      const amounts = line.match(new RegExp(amountPattern.source, "g"));
      if (!amounts) continue;

      // Extract description (text between date and amount)
      const descriptionMatch = line.split(datePattern).pop()?.trim() || "";
      const description = descriptionMatch
        .replace(amountPattern, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      if (!description) continue;

      // Parse amount
      let amount = 0;
      const amountStr = amounts[0];
      if (amountStr.includes("(") || amountStr.includes(")")) {
        // Negative amount in parentheses
        amount = -parseFloat(amountStr.replace(/[$,()\\s]/g, ""));
      } else {
        amount = parseFloat(amountStr.replace(/[$,]/g, ""));
      }

      // Determine if debit or credit
      // Look for keywords: debit, withdrawal, payment vs credit, deposit
      const isCredit =
        line.toLowerCase().includes("credit") ||
        line.toLowerCase().includes("deposit") ||
        line.toLowerCase().includes("transfer from") ||
        (amount > 0 && !line.toLowerCase().includes("debit"));

      const transaction: Transaction = {
        id: Date.now().toString() + transactions.length,
        date: currentDate,
        description: description.substring(0, 100), // Limit description length
        merchant: extractMerchant(description),
        amount: isCredit ? Math.abs(amount) : -Math.abs(amount),
        category: "Uncategorized",
        status: "success" as const,
        cardLastFour: "****",
        type: isCredit ? ("credit" as const) : ("debit" as const),
      };

      transactions.push(transaction);
    }
  }

  return transactions;
}

function normalizeDate(dateStr: string): string {
  // Try to parse various date formats
  let date: Date;

  if (dateStr.includes("-")) {
    // Already in ISO format: 2026-01-01
    return dateStr;
  } else if (dateStr.includes("/")) {
    // MM/DD/YYYY or DD/MM/YYYY
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      // Assume MM/DD/YYYY for North American banks
      date = new Date(
        `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`,
      );
    } else {
      return new Date().toISOString().split("T")[0];
    }
  } else {
    // Month name format: Jan 01, 2026
    date = new Date(dateStr);
  }

  return date.toISOString().split("T")[0];
}

function extractMerchant(description: string): string {
  // Clean up common transaction prefixes
  const cleaned = description
    .replace(/^(POS|PURCHASE|PAYMENT|WITHDRAWAL|TRANSFER|DEBIT|CREDIT)\s*/i, "")
    .replace(/\s*#\d+.*$/, "") // Remove location numbers
    .replace(/\s{2,}/g, " ")
    .trim();

  // Take first part before common separators
  const merchant = cleaned.split(/\s+-\s+|\s+\*\s+/)[0];

  return merchant.substring(0, 50) || "Unknown";
}
