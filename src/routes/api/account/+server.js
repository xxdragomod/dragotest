import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export const prerender = false;

const NO_STORE = {
	'Cache-Control': 'private, no-store, max-age=0',
	Pragma: 'no-cache',
	Vary: 'Authorization'
};

function reply(body, status = 200) {
	return json(body, { status, headers: NO_STORE });
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

function cleanText(value, maxLength = 100) {
	if (typeof value !== 'string' && typeof value !== 'number') return '';
	return String(value).replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, maxLength);
}

function nonNegativeInt(value) {
	const number = Number(value);
	return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : null;
}

function normalizeUser(user, entitlements = {}) {
	if (!user || typeof user !== 'object') return null;
	const isPro = user.is_pro === true || user.is_pro === 1 || user.is_pro === '1';
	const plan = isPro ? cleanText(user.pro_plan, 32).toLowerCase() : '';
	const safePlan = ['test', 'beginners', 'profit'].includes(plan) ? plan : null;
	const freeLimit = nonNegativeInt(user.free_pred_limit);
	const freeUsed = nonNegativeInt(user.free_pred_used);
	const freeRemaining = user.free_pred_remaining == null
		? null
		: nonNegativeInt(user.free_pred_remaining);
	const apiHistoryLimit = user.api_history_limit == null ? null : nonNegativeInt(user.api_history_limit);
	const apiHistoryUsed = nonNegativeInt(user.api_history_used);
	const autoBetAllowed = typeof entitlements.auto_bet === 'boolean'
		? entitlements.auto_bet
		: isPro && ['beginners', 'profit'].includes(safePlan);

	return {
		is_pro: isPro,
		pro_plan: safePlan,
		plan_label: cleanText(user.plan_label, 80) || (isPro ? 'Pro' : 'Free'),
		pro_expires_at: isPro ? cleanText(user.pro_expires_at, 80) || null : null,
		free_pred_used: freeUsed,
		free_pred_limit: freeLimit,
		free_pred_remaining: isPro ? null : freeRemaining,
		api_history_used: apiHistoryUsed,
		api_history_limit: isPro ? null : apiHistoryLimit,
		auto_bet_allowed: autoBetAllowed
	};
}

export async function GET({ request, url, fetch }) {
	const origin = request.headers.get('origin');
	if (origin) {
		try {
			if (new URL(origin).origin !== url.origin) return reply({ success: false, message: 'Request origin is not allowed.' }, 403);
		} catch (_) {
			return reply({ success: false, message: 'Request origin is not allowed.' }, 403);
		}
	}

	const authorization = request.headers.get('authorization') || '';
	const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
	if (!token || token.length > 8_192) return reply({ success: false, message: 'Please sign in again.' }, 401);

	const backendUrl = getBackendUrl();
	if (!backendUrl) return reply({ success: false, message: 'Account service is not configured.' }, 503);

	const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
	const options = { method: 'GET', headers, cache: 'no-store', signal: AbortSignal.timeout(8_000) };

	try {
		let upstream = await fetch(`${backendUrl}/account/entitlements`, options);
		let data = await upstream.json().catch(() => null);

		// Rollout-safe: older Render deployment has /profile but may not yet have
		// /account/entitlements. Both routes validate JWT + ban state server-side.
		if (upstream.status === 404) {
			upstream = await fetch(`${backendUrl}/profile`, options);
			data = await upstream.json().catch(() => null);
		}

		if (upstream.status === 401 || upstream.status === 403) {
			return reply({ success: false, message: 'Your DRAGO session is invalid or access is suspended.' }, upstream.status);
		}
		if (!upstream.ok || !data?.success) return reply({ success: false, message: 'Could not verify your DRAGO account right now.' }, upstream.status >= 500 ? 503 : 502);

		const safeUser = normalizeUser(data.user, data.entitlements || {});
		if (!safeUser) return reply({ success: false, message: 'DRAGO returned an invalid account status.' }, 502);

		return reply({
			success: true,
			user: safeUser,
			entitlements: {
				auto_bet: safeUser.auto_bet_allowed,
				regular_prediction: safeUser.is_pro || (safeUser.free_pred_remaining != null && safeUser.free_pred_remaining > 0),
				developer_prediction_api: safeUser.is_pro && safeUser.pro_plan === 'profit'
			}
		});
	} catch (_) {
		return reply({ success: false, message: 'Account service is temporarily unavailable.' }, 503);
	}
}
