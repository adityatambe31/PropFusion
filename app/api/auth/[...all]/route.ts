import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handler = auth ? toNextJsHandler(auth) : null;

const shouldDebugAuth =
	process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV === "production";

function logAuthRequest(request: NextRequest, method: "GET" | "POST") {
	if (!shouldDebugAuth) return;
	const url = new URL(request.url);
	if (!url.pathname.includes("/api/auth/")) return;

	const cookieNames = request.cookies.getAll().map((c) => c.name);
	console.log("[AUTH DEBUG] request", {
		method,
		path: url.pathname,
		host: request.headers.get("host"),
		origin: request.headers.get("origin"),
		hasSessionCookie:
			cookieNames.includes("better-auth.session_token") ||
			cookieNames.includes("__Secure-better-auth.session_token"),
		cookieNames,
	});
}

function logAuthResponse(request: NextRequest, response: Response, method: "GET" | "POST") {
	if (!shouldDebugAuth) return;
	const url = new URL(request.url);
	if (!url.pathname.includes("/api/auth/")) return;

	const setCookie = response.headers.get("set-cookie");
	console.log("[AUTH DEBUG] response", {
		method,
		path: url.pathname,
		status: response.status,
		hasSetCookie: Boolean(setCookie),
		hasSecureSessionCookie:
			Boolean(setCookie?.includes("__Secure-better-auth.session_token")) ||
			Boolean(setCookie?.includes("better-auth.session_token")),
	});
}

export async function GET(request: NextRequest) {
	if (!handler) {
		return new Response("Auth is unavailable without MONGODB_URI", { status: 503 });
	}
	logAuthRequest(request, "GET");
	const response = await handler.GET(request);
	logAuthResponse(request, response, "GET");
	return response;
}

export async function POST(request: NextRequest) {
	if (!handler) {
		return new Response("Auth is unavailable without MONGODB_URI", { status: 503 });
	}
	logAuthRequest(request, "POST");
	const response = await handler.POST(request);
	logAuthResponse(request, response, "POST");
	return response;
}
