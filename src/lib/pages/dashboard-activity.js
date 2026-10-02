const ACTIVITY_STORAGE_KEY = "drago_dashboard_activity_v1";
const ACTIVITY_UPDATED_EVENT = "drago:activity-updated";

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readStoredActivity() {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(ACTIVITY_STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_) {
    return {};
  }
}

function safeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(0, Math.min(999, Math.trunc(count))) : 0;
}

/** Record an authenticated app-page visit, grouped by the browser's local day. */
export function recordActivityPageVisit() {
  if (typeof window === "undefined") return;

  try {
    const token = window.sessionStorage.getItem("drago_token");
    const expiry = window.sessionStorage.getItem("drago_token_expiry");
    if (!token || (expiry && Number(expiry) < Date.now())) return;

    const activity = readStoredActivity();
    const today = localDateKey(new Date());
    activity[today] = Math.min(999, safeCount(activity[today]) + 1);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    const earliestKeptDay = localDateKey(cutoff);
    for (const day of Object.keys(activity)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day < earliestKeptDay) {
        delete activity[day];
      } else {
        activity[day] = safeCount(activity[day]);
      }
    }

    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity));
    window.dispatchEvent(new Event(ACTIVITY_UPDATED_EVENT));
  } catch (_) {
    // Activity tracking is optional; storage restrictions should never block navigation.
  }
}

/** Return the current local day and previous six days, oldest first. */
export function readLastSevenDaysActivity() {
  const activity = readStoredActivity();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = localDateKey(date);
    const count = safeCount(activity[key]);
    days.push({
      key,
      count,
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      fullLabel: date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short"
      }),
      isToday: offset === 0
    });
  }

  const maxCount = Math.max(1, ...days.map((day) => day.count));
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return {
    total,
    days: days.map((day) => ({
      ...day,
      height: day.count ? Math.max(14, Math.round((day.count / maxCount) * 100)) : 6
    }))
  };
}

export function activityUpdatedEventName() {
  return ACTIVITY_UPDATED_EVENT;
}
