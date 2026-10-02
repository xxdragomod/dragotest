<script>
	// Shared styles and navigation for all signed-in app routes.
	import '$lib/css/app.css';
	import { afterNavigate } from '$app/navigation';
	import BottomNavigation from '$lib/components/BottomNavigation.svelte';
	import { recordActivityPageVisit } from '$lib/pages/dashboard-activity.js';

	afterNavigate(() => recordActivityPageVisit());
</script>

<slot />
<BottomNavigation />
