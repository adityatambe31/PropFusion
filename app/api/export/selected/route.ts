import { NextRequest, NextResponse } from "next/server";
import {
	generateSelectedCombinedReportPDF,
	generateSelectedLandsReportPDF,
	generateSelectedPropertiesReportPDF,
} from "@/lib/export/selected-pdf-generator";
import type { Land, Property } from "@/lib/types";

type SelectedExportType = "properties" | "lands" | "combined";

interface SelectedExportPayload {
	type?: SelectedExportType;
	properties?: Property[];
	lands?: Land[];
	title?: string;
}

export async function POST(request: NextRequest) {
	try {
		const body = (await request.json()) as SelectedExportPayload;
		const exportType = body.type ?? "combined";
		const properties: Property[] = Array.isArray(body.properties)
			? body.properties
			: [];
		const lands: Land[] = Array.isArray(body.lands) ? body.lands : [];

		let buffer: Buffer;
		let fileName = "selected-report.pdf";

		if (exportType === "properties") {
			buffer = generateSelectedPropertiesReportPDF(properties, {
				title: body.title,
			});
			fileName = "selected-properties-report.pdf";
		} else if (exportType === "lands") {
			buffer = generateSelectedLandsReportPDF(lands, { title: body.title });
			fileName = "selected-lands-report.pdf";
		} else {
			buffer = generateSelectedCombinedReportPDF(properties, lands);
			fileName = "selected-combined-report.pdf";
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
		{ message: "Use POST with selected assets to generate a PDF." },
		{ status: 200 },
	);
}
