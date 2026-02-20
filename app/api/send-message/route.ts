import { NextResponse } from "next/server";

type SendMessageRequestBody = {
	message: string;
};

type SendMessageSuccessResponse = {
	success: true;
};

type SendMessageErrorResponse = {
	success: false;
	error: string;
};

type LinePushMessageRequest = {
	to: string;
	messages: Array<{
		type: "text";
		text: string;
	}>;
};

type LineApiErrorBody = {
	message?: string;
};

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

function jsonError(error: string, status: number) {
	return NextResponse.json<SendMessageErrorResponse>({ success: false, error }, { status });
}

function parseMessageFromBody(body: SendMessageRequestBody) {
	return typeof body.message === "string" ? body.message.trim() : "";
}

function buildLinePayload(targetUserId: string, message: string): LinePushMessageRequest {
	return {
		to: targetUserId,
		messages: [{ type: "text", text: message }],
	};
}

async function postLinePushMessage({
	channelAccessToken,
	payload,
}: {
	channelAccessToken: string;
	payload: LinePushMessageRequest;
}): Promise<{ response: Response } | { error: string }> {
	try {
		const response = await fetch(LINE_PUSH_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${channelAccessToken}`,
			},
			body: JSON.stringify(payload),
			cache: "no-store",
		});

		return { response } as const;
	} catch (error) {
		console.error("[send-message] LINE API fetch failed:", error);
		return { error: "Failed to reach LINE API" } as const;
	}
}

async function readResponseTextSafely(response: Response) {
	try {
		return await response.text();
	} catch (error) {
		console.error("[send-message] Failed reading LINE response body:", error);
		return "";
	}
}

function getLineErrorMessage(lineResponseBodyText: string) {
	if (!lineResponseBodyText) {
		return "LINE push API request failed";
	}

	try {
		const lineErrorBody = JSON.parse(lineResponseBodyText) as LineApiErrorBody;
		if (typeof lineErrorBody.message === "string" && lineErrorBody.message) {
			return lineErrorBody.message;
		}
	} catch {
		return lineResponseBodyText;
	}

	return lineResponseBodyText;
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as SendMessageRequestBody;
		const message = parseMessageFromBody(body);

		console.log("[send-message] Incoming request body:", {
			message,
			messageLength: message.length,
		});

		if (!message) {
			return jsonError("Message is required", 400);
		}

		const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
		const targetUserId = process.env.LINE_TARGET_USER_ID;

		if (!channelAccessToken || !targetUserId) {
			return jsonError(
				"LINE_CHANNEL_ACCESS_TOKEN or LINE_TARGET_USER_ID is not configured",
				500
			);
		}

		const payload = buildLinePayload(targetUserId, message);
		const lineResult = await postLinePushMessage({ channelAccessToken, payload });

		if ("error" in lineResult) {
			return jsonError(lineResult.error, 502);
		}

		const lineResponse = lineResult.response;
		const lineResponseBodyText = await readResponseTextSafely(lineResponse);

		console.log("[send-message] LINE API response:", {
			status: lineResponse.status,
			ok: lineResponse.ok,
			body: lineResponseBodyText,
		});

		if (!lineResponse.ok) {
			const lineErrorMessage = getLineErrorMessage(lineResponseBodyText);
			return jsonError(lineErrorMessage, lineResponse.status);
		}

		return NextResponse.json<SendMessageSuccessResponse>(
			{ success: true },
			{ status: 200 }
		);
	} catch (error) {
		console.error("[send-message] Unexpected handler error:", error);
		const isInvalidJson = error instanceof SyntaxError;
		return NextResponse.json<SendMessageErrorResponse>(
			{
				success: false,
				error: isInvalidJson ? "Invalid request body" : "Internal server error",
			},
			{ status: isInvalidJson ? 400 : 500 }
		);
	}
}