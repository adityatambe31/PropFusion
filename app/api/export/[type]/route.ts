import { NextRequest, NextResponse } from "next/server";
import {
	generateCombinedPortfolioPDF,
	generateLandPortfolioPDF,
	generatePropertyPortfolioPDF,
} from "@/lib/export/pdf-generator";
import type { Land, Property } from "@/lib/types";

type ExportType = "properties" | "lands" | "combined";

interface ExportPayload {
	properties?: Property[];
	lands?: Land[];
	title?: string;
}

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ type: string }> },
) {
	try {
		const { type } = await context.params;
		const exportType = type as ExportType;
		const body = (await request.json()) as ExportPayload;

		const properties: Property[] = Array.isArray(body.properties)
			? body.properties
			: [];
		const lands: Land[] = Array.isArray(body.lands) ? body.lands : [];

		let buffer: Buffer;
		let fileName = "portfolio-report.pdf";

		if (exportType === "properties") {
			buffer = generatePropertyPortfolioPDF(properties, { title: body.title });
			fileName = "properties-report.pdf";
		} else if (exportType === "lands") {
			buffer = generateLandPortfolioPDF(lands, { title: body.title });
			fileName = "lands-report.pdf";
		} else if (exportType === "combined") {
			buffer = generateCombinedPortfolioPDF(properties, lands);
			fileName = "combined-portfolio-report.pdf";
		} else {
			return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
		}

		return new NextResponse(new Uint8Array(buffer), {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename=${fileName}`,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Export failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export function GET() {
	return NextResponse.json(
		{ message: "Use POST with export data to generate a PDF." },
		{ status: 200 },
	);
}
