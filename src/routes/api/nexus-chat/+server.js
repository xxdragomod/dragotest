import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { detectNexusLanguage, getLocalNexusAnswer, isLivePredictionRequest } from '$lib/server/nexus-faq.js';

export const prerender = false;

const APINEX_URL = 'https://api.apinex.bond/v1/chat/completions';
const MODEL = 'free/gpt-5.6-luna';
const MAX_BODY_LENGTH = 32_000;
const MAX_MESSAGES = 18;
const MAX_MESSAGE_LENGTH = 5_000;
const MAX_HISTORY_LENGTH = 20_000;

function response(message, status) {
	return json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function getBackendUrl() {
	let configured = '';
	try {
		const config = JSON.parse(publicEnv.PUBLIC_DRAGO_CONFIG || '{}');
		configured = typeof config.API_URL === 'string' ? config.API_URL : '';
	} catch (_) {}

	configured ||= env.DRAGO_API_URL || 'https://dragopredictor.onrender.com';
	try {
		const parsed = new URL(configured);
		if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
		return parsed.origin;
	} catch (_) {
		return '';
	}
}

function getMessageText(content) {
	if (typeof content === 'string') return content.trim();
	if (Array.isArray(content)) {
		return content
			.map((part) => (typeof part?.text === 'string' ? part.text : ''))
			.filter(Boolean)
			.join('\n')
			.trim();
	}
	return '';
}

const PREDICTION_COPY = {
	en: {
		session: 'Your DRAGO session has expired. Please sign in again.',
		unavailable: 'The DRAGO prediction server is temporarily unavailable. Please try again shortly.',
		busy: 'The prediction server is busy. Please try again in a few seconds.',
		access: 'A prediction is not available for this account. Open the Prediction page to check access.',
		quota: '**Free prediction limit reached.** Upgrade to Pro for unlimited predictions.',
		quotaFull: '**Free prediction limit reached ({{used}}/{{limit}}).** Upgrade to Pro for unlimited predictions.',
		noSignal: 'The server did not return a usable signal. I have not guessed one; please try again shortly.',
		live: 'Live RX1 signal',
		stale: 'Last known RX1 signal (stale)',
		period: 'Period',
		confidence: 'Confidence',
		level: 'Level',
		trend: 'Trend',
		playTime: 'Play time',
		remaining: 'Free predictions left',
		used: 'This request used 1 Free prediction.',
		disclaimer: 'This is an estimate, not a guaranteed result.',
		upgradeAction: 'View Pro plans',
		predictionAction: 'Open Prediction'
	},
	hinglish: {
		session: 'Aapka DRAGO session expire ho gaya hai. Dobara sign in karein.',
		unavailable: 'DRAGO prediction server abhi available nahi hai. Thodi der baad try karein.',
		busy: 'Prediction server busy hai. Kuch seconds baad dobara try karein.',
		access: 'Is account ke liye prediction available nahi hai. Access check karne ke liye Prediction page kholen.',
		quota: '**Free prediction limit complete hai.** Unlimited predictions ke liye Pro plan dekhein.',
		quotaFull: '**Free limit complete ({{used}}/{{limit}}).** Unlimited predictions ke liye Pro plan dekhein.',
		noSignal: 'Server ne valid signal nahi diya. Maine signal guess nahi kiya; thodi der baad try karein.',
		live: 'Live RX1 signal',
		stale: 'Last known RX1 signal (stale)',
		period: 'Period',
		confidence: 'Confidence',
		level: 'Level',
		trend: 'Trend',
		playTime: 'Play time',
		remaining: 'Free predictions baaki',
		used: 'Is request mein 1 Free prediction use hui.',
		disclaimer: 'Prediction estimate hai, guaranteed result nahi.',
		upgradeAction: 'Pro plans dekhein',
		predictionAction: 'Prediction kholen'
	},
	hi: {
		session: 'आपका DRAGO session expire हो गया है। कृपया फिर से sign in करें।',
		unavailable: 'DRAGO prediction server अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर try करें।',
		busy: 'Prediction server busy है। कुछ seconds बाद फिर try करें।',
		access: 'इस account के लिए prediction उपलब्ध नहीं है। Access देखने के लिए Prediction page खोलें।',
		quota: '**Free prediction limit पूरी हो गई है।** Unlimited predictions के लिए Pro plan देखें।',
		quotaFull: '**Free limit पूरी ({{used}}/{{limit}})।** Unlimited predictions के लिए Pro plan देखें।',
		noSignal: 'Server ने usable signal नहीं दिया। मैंने कोई signal guess नहीं किया; थोड़ी देर बाद फिर try करें।',
		live: 'Live RX1 signal',
		stale: 'पिछला RX1 signal (stale)',
		period: 'Period',
		confidence: 'Confidence',
		level: 'Level',
		trend: 'Trend',
		playTime: 'Play time',
		remaining: 'बाकी Free predictions',
		used: 'इस request में 1 Free prediction use हुई।',
		disclaimer: 'Prediction एक अनुमान है, guaranteed result नहीं।',
		upgradeAction: 'Pro plans देखें',
		predictionAction: 'Prediction खोलें'
	}
};

function nexusReply(reply, action, intent = 'live-prediction') {
	const payload = { reply, source: 'server', intent };
	if (action) payload.action = action;
	return json(payload, { headers: { 'Cache-Control': 'no-store' } });
}

function cleanServerText(value, maxLength = 100) {
	if (typeof value !== 'string' && typeof value !== 'number') return '';
	return String(value).replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}

function pickPredictionObject(payload) {
	if (!payload || typeof payload !== 'object') return null;
	if (payload.prediction && typeof payload.prediction === 'object') return payload.prediction;
	if (payload.data?.prediction && typeof payload.data.prediction === 'object') return payload.data.prediction;
	if (payload.result && typeof payload.result === 'object') return payload.result;
	return payload;
}

function predictionQuotaReply(copy, quota) {
	const limitValue = Number(quota?.free_pred_limit);
	const usedRaw = quota?.free_pred_used;
	const remainingRaw = quota?.free_pred_remaining;
	const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.floor(limitValue) : 3;
	const usedValue = Number(usedRaw);
	const remainingValue = Number(remainingRaw);
	const used = usedRaw != null && Number.isFinite(usedValue)
		? Math.max(0, Math.floor(usedValue))
		: remainingRaw != null && Number.isFinite(remainingValue)
			? limit - Math.max(0, Math.floor(remainingValue))
			: limit;
	const reply = copy.quotaFull.replace('{{used}}', String(Math.min(used, limit))).replace('{{limit}}', String(limit));
	return nexusReply(reply, { href: '/subscription/', label: copy.upgradeAction });
}

async function getLivePredictionReply({ fetch, backendUrl, token, language }) {
	const copy = PREDICTION_COPY[language] || PREDICTION_COPY.en;
	let quota;

	try {
		const quotaResponse = await fetch(`${backendUrl}/prediction-quota`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` },
			cache: 'no-store',
			signal: AbortSignal.timeout(8_000)
		});
		quota = await quotaResponse.json().catch(() => null);
		if (quotaResponse.status === 401 || quotaResponse.status === 403) return response(copy.session, 401);
		if (!quotaResponse.ok || !quota?.success) return response(copy.unavailable, 503);
	} catch (_) {
		return response(copy.unavailable, 503);
	}

	const isPro = quota.is_pro === true || String(quota.plan || '').toLowerCase() === 'pro';
	const quotaRemainingRaw = quota.free_pred_remaining;
	const quotaRemaining = Number(quotaRemainingRaw);
	const freeLimit = Number.isFinite(Number(quota.free_pred_limit)) && Number(quota.free_pred_limit) > 0
		? Math.floor(Number(quota.free_pred_limit))
		: 3;
	const remainingBefore = quotaRemainingRaw != null && Number.isFinite(quotaRemaining)
		? Math.max(0, Math.floor(quotaRemaining))
		: Math.max(0, freeLimit - (Number(quota.free_pred_used) || 0));

	if (!isPro && remainingBefore <= 0) return predictionQuotaReply(copy, quota);

	let predictionResponse;
	let payload;
	const consumeFreeUse = !isPro;
	try {
		predictionResponse = await fetch(`${backendUrl}/wingo30s_prediction${consumeFreeUse ? '?consume=1' : ''}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` },
			cache: 'no-store',
			signal: AbortSignal.timeout(8_000)
		});
		payload = await predictionResponse.json().catch(() => null);
	} catch (_) {
		return response(copy.unavailable, 503);
	}

	if (predictionResponse.status === 401) return response(copy.session, 401);
	if (predictionResponse.status === 402 || payload?.billing_required) {
		return predictionQuotaReply(copy, { ...quota, ...payload, free_pred_remaining: 0 });
	}
	if (predictionResponse.status === 403) {
		return nexusReply(copy.access, { href: '/prediction/', label: copy.predictionAction });
	}
	if (predictionResponse.status === 429) return response(copy.busy, 429);
	if (!predictionResponse.ok) return response(copy.unavailable, 503);

	const prediction = pickPredictionObject(payload);
	const signalValue = prediction?.prediction ?? prediction?.signal ?? prediction?.result ?? prediction?.value;
	const signalText = cleanServerText(signalValue, 48);
	if (!signalText) return response(copy.noSignal, 502);
	const signalUpper = signalText.toUpperCase();
	if (!/^(BIG|SMALL|WAIT|SKIP)(?:\b|$)/u.test(signalUpper)) return response(copy.noSignal, 502);

	const fields = [];
	const period = cleanServerText(prediction.period ?? prediction.issueNumber ?? prediction.issue, 80);
	if (period) fields.push(`• **${copy.period}:** ${period}`);

	const confidenceValue = prediction.confidence ?? prediction.conf ?? prediction.score ?? prediction.probability;
	const confidenceNumber = Number(confidenceValue);
	if (confidenceValue != null && Number.isFinite(confidenceNumber) && confidenceNumber >= 0) {
		const percent = Math.round(Math.min(100, confidenceNumber > 0 && confidenceNumber <= 1 ? confidenceNumber * 100 : confidenceNumber));
		fields.push(`• **${copy.confidence}:** ${percent}%`);
	}

	const levelValue = prediction.level ?? prediction.lvl ?? prediction.signal_level;
	const levelNumber = Number(levelValue);
	if (levelValue != null && Number.isFinite(levelNumber) && levelNumber >= 1) {
		fields.push(`• **${copy.level}:** ${Math.min(9, Math.floor(levelNumber))}`);
	} else {
		const badge = cleanServerText(prediction.badge, 16).match(/\bL(\d+)\b/i);
		if (badge) fields.push(`• **${copy.level}:** ${Math.min(9, Number(badge[1]))}`);
	}

	const trend = cleanServerText(prediction.trend ?? prediction.tr, 80);
	if (trend) fields.push(`• **${copy.trend}:** ${trend}`);
	const playTime = cleanServerText(prediction.playTime ?? prediction.play_time ?? prediction.pt, 40);
	if (playTime) fields.push(`• **${copy.playTime}:** ${playTime}`);

	const stale = payload?.stale === true || prediction?.stale === true;
	const heading = stale ? copy.stale : copy.live;
	const parts = [`**${heading}: ${signalText.toUpperCase()}**`, ...fields];
	let action;
	if (consumeFreeUse) {
		const remainingAfterRaw = payload?.free_pred_remaining;
		const remainingAfterValue = Number(remainingAfterRaw);
		const remainingAfter = remainingAfterRaw != null && Number.isFinite(remainingAfterValue)
			? Math.max(0, Math.floor(remainingAfterValue))
			: Math.max(0, remainingBefore - 1);
		parts.push(`• **${copy.remaining}:** ${remainingAfter}/${freeLimit}`);
		parts.push(copy.used);
		if (remainingAfter <= 0) {
			parts.push(copy.quota);
			action = { href: '/subscription/', label: copy.upgradeAction };
		}
	}
	parts.push(copy.disclaimer);

	return nexusReply(parts.join('\n'), action);
}

const ACCOUNT_COPY = {
	en: {
		session: 'Your DRAGO session is invalid or access is suspended. Please sign in again.',
		unavailable: 'I could not verify your current DRAGO plan right now. Please try again shortly.',
		account: 'Account status',
		freePredictions: 'Free predictions remaining',
		apiHistory: 'Developer API History uses remaining',
		autoBetIncluded: 'Auto Bet access: Included',
		autoBetExcluded: 'Auto Bet access: Not included in this plan',
		profileAction: 'Open Profile'
	},
	hinglish: {
		session: 'Aapka DRAGO session valid nahi hai ya access suspended hai. Dobara sign in karein.',
		unavailable: 'Abhi aapka current DRAGO plan verify nahi ho saka. Thodi der baad try karein.',
		account: 'Account status',
		freePredictions: 'Free predictions baaki',
		apiHistory: 'Developer API History uses baaki',
		autoBetIncluded: 'Auto Bet access: Included',
		autoBetExcluded: 'Auto Bet access: Is plan mein included nahi',
		profileAction: 'Profile kholen'
	},
	hi: {
		session: 'आपका DRAGO session valid नहीं है या access suspended है। कृपया फिर से sign in करें।',
		unavailable: 'अभी आपका current DRAGO plan verify नहीं हो सका। थोड़ी देर बाद फिर try करें।',
		account: 'Account status',
		freePredictions: 'बाकी Free predictions',
		apiHistory: 'Developer API History uses बाकी',
		autoBetIncluded: 'Auto Bet access: Included',
		autoBetExcluded: 'Auto Bet access: इस plan में शामिल नहीं',
		profileAction: 'Profile खोलें'
	}
};

async function getCurrentPlanReply({ fetch, backendUrl, token, language }) {
	const copy = ACCOUNT_COPY[language] || ACCOUNT_COPY.en;
	const options = {
		method: 'GET',
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
		cache: 'no-store',
		signal: AbortSignal.timeout(8_000)
	};

	try {
		let upstream = await fetch(`${backendUrl}/account/entitlements`, options);
		let data = await upstream.json().catch(() => null);
		if (upstream.status === 404) {
			upstream = await fetch(`${backendUrl}/profile`, options);
			data = await upstream.json().catch(() => null);
		}
		if (upstream.status === 401 || upstream.status === 403) return response(copy.session, upstream.status);
		if (!upstream.ok || !data?.success || !data?.user) return response(copy.unavailable, 503);

		const user = data.user;
		const isPro = user.is_pro === true || user.is_pro === 1 || user.is_pro === '1';
		const planLabel = cleanServerText(user.plan_label, 80) || (isPro ? 'Pro' : 'Free');
		const parts = [`**${copy.account}: ${planLabel} (${isPro ? 'PRO' : 'FREE'})**`];
		if (!isPro) {
			const limit = Number(user.free_pred_limit);
			const remaining = Number(user.free_pred_remaining);
			if (Number.isFinite(limit) && limit >= 0 && Number.isFinite(remaining) && remaining >= 0) {
				parts.push(`• **${copy.freePredictions}:** ${Math.floor(remaining)}/${Math.floor(limit)}`);
			}
			const historyLimit = Number(user.api_history_limit);
			const historyUsed = Number(user.api_history_used);
			if (Number.isFinite(historyLimit) && historyLimit >= 0 && Number.isFinite(historyUsed) && historyUsed >= 0) {
				parts.push(`• **${copy.apiHistory}:** ${Math.max(0, Math.floor(historyLimit - historyUsed))}/${Math.floor(historyLimit)}`);
			}
		}
		const autoBet = typeof data.entitlements?.auto_bet === 'boolean'
			? data.entitlements.auto_bet
			: user.auto_bet_allowed === true || (isPro && ['beginners', 'profit'].includes(String(user.pro_plan || '').toLowerCase()));
		parts.push(`• **${autoBet ? copy.autoBetIncluded : copy.autoBetExcluded}**`);
		return nexusReply(parts.join('\n'), { href: '/profile/', label: copy.profileAction }, 'account-plan');
	} catch (_) {
		return response(copy.unavailable, 503);
	}
}

export async function POST({ request, url, fetch }) {
	const origin = request.headers.get('origin');
	if (origin) {
		try {
			if (new URL(origin).origin !== url.origin) return response('Request origin is not allowed.', 403);
		} catch (_) {
			return response('Request origin is not allowed.', 403);
		}
	}

	const authorization = request.headers.get('authorization') || '';
	const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
	if (!token || token.length > 8_192) return response('Please sign in again to use NEXUS Agent.', 401);

	let body;
	try {
		const rawBody = await request.text();
		if (rawBody.length > MAX_BODY_LENGTH) return response('This message is too long. Please shorten it and try again.', 413);
		body = JSON.parse(rawBody);
	} catch (_) {
		return response('Invalid chat request.', 400);
	}

	if (!Array.isArray(body?.messages)) return response('Invalid chat request.', 400);

	const messages = body.messages
		.filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
		.slice(-MAX_MESSAGES)
		.map((item) => ({ role: item.role, content: item.content.trim() }));

	if (!messages.length || messages.at(-1)?.role !== 'user') return response('Send a message to start chatting.', 400);
	if (messages.some((item) => !item.content || item.content.length > MAX_MESSAGE_LENGTH)) {
		return response('A chat message is empty or too long. Please edit it and try again.', 400);
	}
	if (messages.reduce((total, item) => total + item.content.length, 0) > MAX_HISTORY_LENGTH) {
		return response('This conversation is too long to send. Clear the chat and try again.', 413);
	}

	const backendUrl = getBackendUrl();
	if (!backendUrl) return response('Account verification is temporarily unavailable.', 503);

	try {
		const verified = await fetch(`${backendUrl}/verify`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(8_000)
		});
		if (verified.status === 401 || verified.status === 403) {
			return response('Your session has expired. Please sign in again.', 401);
		}
		if (!verified.ok) return response('Account verification is temporarily unavailable.', 503);
	} catch (_) {
		return response('Account verification is temporarily unavailable. Please try again.', 503);
	}

	// Verify before serving any local answer or touching the shared DRAGO prediction API.
	// Explicit live-signal requests use the same backend endpoint as the Prediction/Gameplay pages.
	const latestUserMessage = messages.at(-1).content;
	if (isLivePredictionRequest(latestUserMessage)) {
		return getLivePredictionReply({
			fetch,
			backendUrl,
			token,
			language: detectNexusLanguage(latestUserMessage)
		});
	}

	// A matched FAQ returns without checking or calling the external AI provider.
	const localAnswer = getLocalNexusAnswer(latestUserMessage);
	if (localAnswer?.id === 'current-plan') {
		return getCurrentPlanReply({
			fetch,
			backendUrl,
			token,
			language: detectNexusLanguage(latestUserMessage)
		});
	}
	if (localAnswer) {
		const payload = { reply: localAnswer.reply, source: 'local', intent: localAnswer.id };
		if (localAnswer.action) payload.action = localAnswer.action;
		if (localAnswer.guide === 'api-key') {
			payload.guide = 'api-key';
			payload.language = localAnswer.language;
		}
		return json(payload, { headers: { 'Cache-Control': 'no-store' } });
	}

	const apiKey = env.APINEX_API_KEY?.trim();
	if (!apiKey) return response('NEXUS Agent is not configured yet. Please try again later.', 503);

	const systemMessage = {
		role: 'system',
		content:
			'You are NEXUS, the helpful assistant inside DRAGO Predictor. Reply in the same language and general style as the latest user message, using the conversation history when useful. Write for a mobile chat: concise, direct, professional but friendly. Use Markdown **bold** for important actions, buttons, names, and values; use clean headings or lists only when they improve clarity. Use emojis sparingly. Start with the answer, do not repeat the question, and do not add a greeting to every reply. Do not force numbered steps for ordinary questions. For tutorials, use short numbered steps in the format “01 • Step” and finish with a brief confirmation or note. For plan questions, only state confirmed details: Pro VIP is ₹749 weekly or ₹1,498 monthly; Free/Basic includes 3 regular predictions and 10 Developer API History uses; Pro lists Unlimited Prediction, Floating window in game, Unlimited NEXUS Agent use, and Unlimited DRAGO API access. Checkout is not connected, so never say a purchase or activation was completed. Explain warnings and errors calmly, without blaming the user. Be transparent when information is unavailable. For current RX1 or WinGo 30s signals, use only a result explicitly returned by the DRAGO prediction server; if it is unavailable, say so. Never invent a signal, confidence, period, or outcome, claim an action was completed, or imply access to screens or private account data not explicitly provided. Never ask for passwords, OTPs, session tokens, UPI PINs, or API keys.'
	};

	try {
		const upstream = await fetch(APINEX_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				model: MODEL,
				messages: [systemMessage, ...messages],
				temperature: 0.7
			}),
			signal: AbortSignal.timeout(60_000)
		});

		if (!upstream.ok) {
			return response(upstream.status === 429
				? 'NEXUS Agent is busy right now. Please wait a moment and try again.'
				: 'NEXUS Agent could not answer right now. Please try again shortly.', 502);
		}

		const result = await upstream.json();
		const reply = getMessageText(result?.choices?.[0]?.message?.content);
		if (!reply) return response('NEXUS Agent returned an empty reply. Please try again.', 502);

		return json({ reply, source: 'ai' }, { headers: { 'Cache-Control': 'no-store' } });
	} catch (error) {
		if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
			return response('NEXUS Agent took too long to reply. Please try again.', 504);
		}
		return response('NEXUS Agent could not answer right now. Please try again shortly.', 502);
	}
}
