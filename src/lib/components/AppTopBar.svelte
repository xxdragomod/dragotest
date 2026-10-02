<script>
	export let brandHref = '/dashboard/';
	export let headerClass = '';
</script>

<header class={`dash-top app-topbar ${headerClass}`.trim()}>
	<slot name="leading" />

	<a class="app-topbar-brand" href={brandHref} aria-label="DRAGO Predictor home">
		<img
			class="app-topbar-mark"
			src="/assets/nav/dashboard-brand-mark.png"
			alt=""
			aria-hidden="true"
		/>
		<span class="app-topbar-name">RAGO PREDICTOR</span>
	</a>

	<div class="app-topbar-actions">
		<slot name="actions" />
		<a
			class="dashboard-notification-icon app-topbar-bell"
			href="/notifications/"
			aria-label="Open notifications"
			title="Notifications"
		>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
				<path d="M10 21h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
			</svg>
		</a>
	</div>
</header>

<style>
	.app-topbar {
		position: sticky;
		top: 0;
		z-index: 80;
		width: 100vw;
		max-width: 100vw;
		min-height: clamp(39px, 13.5vw, 54px);
		margin-left: calc(50% - 50vw);
		margin-right: calc(50% - 50vw);
		padding: clamp(5px, 1.65vw, 6.75px) clamp(12px, 4.5vw, 15px);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: clamp(5px, 1.65vw, 6.75px);
		background: #fff;
		border-bottom: 1px solid #eee;
		color: #2a2116;
	}

	.app-topbar.gameplay-top {
		min-height: 2.85rem;
		padding: 0.12rem 0.65rem 0.12rem 0.45rem;
		gap: 0.35rem;
	}

	.app-topbar-brand {
		display: flex;
		flex: 1 1 auto;
		min-width: 0;
		align-items: center;
		gap: 0;
		color: inherit;
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
	}

	.app-topbar-mark {
		display: block;
		flex: 0 0 clamp(27px, 7.3vw, 31px);
		width: clamp(27px, 7.3vw, 31px);
		height: clamp(34px, 9vw, 38px);
		margin-right: -1px;
		object-fit: contain;
	}

	.app-topbar-name {
		position: relative;
		top: 8px;
		min-width: 0;
		color: #2a2116;
		font-family: 'Luckiest Guy', 'Arial Rounded MT Bold', cursive, sans-serif;
		font-size: clamp(1.06rem, 4.8vw, 1.25rem);
		font-weight: 400;
		letter-spacing: 0.05em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
	}

	.app-topbar-actions {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		margin-left: auto;
	}

	.app-topbar-bell {
		position: relative;
		display: grid;
		flex: 0 0 36px;
		place-items: center;
		width: 36px;
		height: 36px;
		margin-left: 0;
		border: 1px solid rgba(195, 151, 42, 0.38);
		border-radius: 50%;
		background: linear-gradient(145deg, #fffdf8 8%, #fff2c9 100%);
		color: #79570d;
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
		box-shadow: 0 3px 11px rgba(147, 107, 18, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.95);
		transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
	}

	.app-topbar-bell:active {
		transform: scale(0.94);
	}

	.app-topbar-bell:focus-visible,
	.app-topbar-brand:focus-visible {
		outline: 2px solid #c9a227;
		outline-offset: 3px;
	}

	.app-topbar-bell svg {
		display: block;
		width: 22px;
		height: 22px;
	}

	:global(.app-topbar .history-btn) {
		margin: 0;
	}

	@media (max-width: 360px) {
		.app-topbar-name {
			font-size: 0.96rem;
			letter-spacing: 0.035em;
		}
		.app-topbar-mark {
			flex-basis: 27px;
			width: 27px;
		}
	}
</style>
