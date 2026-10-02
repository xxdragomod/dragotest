<svelte:head>
	<title>DRAGO • NEXUS Agent</title>
	<meta name="robots" content="noindex, nofollow" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
	<script src="/assets/js/drago-security.js"></script>
	<script src="/assets/js/drago-guard.js" defer></script>
</svelte:head>

<AppTopBar />

<main class="agent-main">
	<section class="agent-chat-card" aria-label="NEXUS Agent chat">
		<header class="agent-chat-header">
			<div class="agent-chat-identity">
				<div class="agent-avatar">
					<img src="/assets/nav/dashboard-nexus-mark.png" alt="" aria-hidden="true" />
				</div>
				<div class="agent-identity-copy">
					<h1>NEXUS Agent</h1>
					<p><i aria-hidden="true"></i> DRAGO Help <span>·</span> Local + AI fallback</p>
				</div>
			</div>
			<div class="agent-header-actions">
				<button class="agent-clear-chat" type="button" onclick={clearChat} aria-label="Clear chat" title="Clear chat">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
					<span>Clear</span>
				</button>
			</div>
		</header>

		<div class="agent-messages" bind:this={messageList} role="log" aria-label="Chat messages" aria-live="polite" aria-relevant="additions text">
			{#each messages as message (message.id)}
				{@const action = safeAction(message)}
				{@const guide = guideFor(message)}
				<div class="agent-message-row" class:agent-user-row={message.role === 'user'} class:agent-guide-row={Boolean(guide)}>
					{#if message.role === 'assistant'}
						<div class="agent-message-avatar">
							<img src="/assets/nav/dashboard-nexus-mark.png" alt="" aria-hidden="true" />
						</div>
					{/if}
					<div class="agent-message-stack">
						<span class="agent-message-name">{message.role === 'assistant' ? 'NEXUS Agent' : 'You'}</span>
						<div class="agent-bubble" class:agent-user-bubble={message.role === 'user'} class:agent-guide-bubble={Boolean(guide)}>
							{#if guide}
								<article class="agent-api-guide" aria-label={guide.title}>
									<header class="agent-guide-intro">
										<span class="agent-guide-eyebrow">{guide.eyebrow}</span>
										<h2>{guide.title}</h2>
										<p>{guide.intro}</p>
									</header>
									{#each guide.steps as step, index}
										<section class="agent-guide-step">
											<button
												class="agent-guide-image-button"
												type="button"
												aria-label={guide.zoomLabel}
												aria-haspopup="dialog"
												onclick={(event) => openGuideImage(step.image, step.alt, step.title, guide, event)}
											>
												<img src={step.image} alt={step.alt} loading="lazy" decoding="async" />
												<span class="agent-guide-zoom-hint" aria-hidden="true">
													<svg viewBox="0 0 24 24" fill="none"><path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
													{guide.zoomHint}
												</span>
											</button>
											<div class="agent-guide-step-copy">
												<h3><span class="agent-guide-step-index">{String(index + 1).padStart(2, '0')} •</span> {step.title}</h3>
												<p>{step.text}</p>
											</div>
										</section>
										{#if index < guide.steps.length - 1}
											<div class="agent-guide-arrow" aria-hidden="true"><span>↓</span></div>
										{/if}
									{/each}
									<div class="agent-guide-success">
										<span class="agent-guide-success-icon" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none"><path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg>
										</span>
										<div><h3>{guide.successTitle}</h3><p>{guide.successText}</p></div>
									</div>
									<div class="agent-guide-security">
										<span class="agent-guide-security-icon" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 19 6v5c0 4.5-3 7.6-7 10-4-2.4-7-5.5-7-10V6l7-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path d="M9.5 12.2 11.2 14l3.7-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
										</span>
										<div><h3>{guide.securityTitle}</h3><p>{guide.securityText}</p></div>
									</div>
								</article>
							{:else}
								<div class="agent-rich-text">
									{#each richBlocks(message.text, message.source === 'local') as block}
										{#if block.type === 'heading'}
											<h2 class="agent-rich-heading">
												{#each block.parts as part}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}
											</h2>
										{:else if block.type === 'list'}
											<ul class:agent-rich-ordered={block.ordered}>
												{#each block.items as item}
													<li>{#each item as part}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</li>
												{/each}
											</ul>
										{:else}
											<p>
												{#each block.lines as line, lineIndex}
													{#if lineIndex > 0}<br />{/if}
													{#each line as part}{#if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}
												{/each}
											</p>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
						{#if action}
							<a class="agent-action-link" href={action.href} target={action.external ? '_blank' : undefined} rel={action.external ? 'noopener noreferrer' : undefined}>
								{action.label}<span aria-hidden="true">↗</span>
							</a>
						{/if}
						{#if message.role === 'assistant' && message.source === 'local'}
							<span class="agent-local-source">⚡ Instant DRAGO guide · no AI API call</span>
						{/if}
						<time class="agent-message-time">{message.time}</time>
					</div>
				</div>
			{/each}

			{#if messages.length === 1 && !isTyping}
				<div class="agent-suggestions" aria-label="Suggested questions">
					<span class="agent-suggestions-label">INSTANT HELP · TRY ASKING</span>
					{#each starterPrompts as prompt (prompt)}
						<button type="button" class="agent-suggestion" onclick={() => sendMessage(prompt)}>{prompt}</button>
					{/each}
				</div>
			{/if}

			{#if isTyping}
				<div class="agent-message-row" aria-label="NEXUS Agent is typing">
					<div class="agent-message-avatar">
						<img src="/assets/nav/dashboard-nexus-mark.png" alt="" aria-hidden="true" />
					</div>
					<div class="agent-typing-bubble"><span></span><span></span><span></span></div>
				</div>
			{/if}
		</div>

		<footer class="agent-composer-area">
			<form class="agent-composer" onsubmit={handleSubmit}>
				<textarea
					bind:this={composer}
					bind:value={draft}
					rows="1"
					maxlength="1000"
					placeholder="Message NEXUS Agent…"
					aria-label="Write a message to NEXUS Agent"
					onkeydown={handleComposerKeydown}
					oninput={resizeComposer}
				></textarea>
				<button type="submit" class="agent-send-button" disabled={!draft.trim() || isTyping} aria-label="Send message" title="Send message">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M5 12h13M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</form>
		</footer>
	</section>
</main>

{#if activeGuideImage}
	<div class="agent-lightbox" role="dialog" aria-modal="true" aria-label={activeGuideImage.title} tabindex="-1" onkeydown={handleLightboxKeydown}>
		<div class="agent-lightbox-panel">
			<header class="agent-lightbox-header">
				<span>{activeGuideImage.title}</span>
				<button class="agent-lightbox-close" type="button" onclick={closeGuideImage} aria-label={activeGuideImage.closeLabel}>
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
				</button>
			</header>
			<div class="agent-lightbox-image-wrap">
				<img class="agent-lightbox-image" src={activeGuideImage.image} alt={activeGuideImage.alt} />
			</div>
			<p class="agent-lightbox-caption">{activeGuideImage.lightboxHint}</p>
		</div>
	</div>
{/if}

<script>
	import { onMount, tick } from 'svelte';
	import AppTopBar from '$lib/components/AppTopBar.svelte';

	const CHAT_STORAGE_KEY = 'drago_nexus_chat_v2';
	const starterPrompts = [
		'How do I get a subscription?',
		'Free plan mein kya milta hai?',
		'RX1 kaise use karun?',
		'Auto Bet Kiwi mein kaise install karun?',
		'Developer API key kaise banau?'
	];

	const API_KEY_GUIDES = {
		en: {
			eyebrow: 'SECURE SETUP · 3 STEPS',
			zoomHint: 'Tap to enlarge',
			zoomLabel: 'Open screenshot full size',
			closeLabel: 'Close image',
			lightboxHint: 'Close or press Esc to return.',
			title: 'Create a DRAGO API key',
			intro: 'Follow the screenshots in order. The red arrows show where to tap.',
			steps: [
				{
					image: '/assets/images/nexus-guide/home-developer-full.webp',
					alt: 'Full DRAGO Home screenshot with the red arrow pointing to Developer.',
					title: 'Open Developer',
					text: 'From Home, tap Developer in the shortcuts row.'
				},
				{
					image: '/assets/images/nexus-guide/developer-create-full.webp',
					alt: 'Full DRAGO Developer API screenshot with masked key prefixes hidden.',
					title: 'Create a key',
					text: 'Tap + CREATE, enter a short label, then confirm. Copy the full key as soon as it appears; some keys are shown in full only once.'
				},
				{
					image: '/assets/images/nexus-guide/developer-copy-full.webp',
					alt: 'Full DRAGO Developer API screenshot with the copy icon circled in gold and masked key prefixes hidden.',
					title: 'Copy your new key',
					text: 'In Your Keys, tap the copy icon (two overlapping squares) beside the new key. Paste it only into your own app or secure server.',
					highlight: 'copy'
				}
			],
			successTitle: 'Done — your key is ready',
			successText: 'Use it with the Prediction or History examples on the Developer page.',
			securityTitle: 'Keep your key private',
			securityText: 'Never share the full key in chat, screenshots, or public posts. If exposed, revoke it on Developer and create a replacement.'
		},
		hinglish: {
			eyebrow: 'SECURE SETUP · 3 STEPS',
			zoomHint: 'Bada dekhne ke liye tap karein',
			zoomLabel: 'Screenshot ko full size mein kholen',
			closeLabel: 'Image band karein',
			lightboxHint: 'Band karein ya wapas jaane ke liye Esc dabayein.',
			title: 'DRAGO API key kaise banayein',
			intro: 'Screenshots ko isi order mein follow karein. Red arrows batate hain kahan tap karna hai.',
			steps: [
				{
					image: '/assets/images/nexus-guide/home-developer-full.webp',
					alt: 'DRAGO Home ka full screenshot, red arrow Developer ko point karta hai.',
					title: 'Developer kholen',
					text: 'Home se shortcuts row mein Developer par tap karein.'
				},
				{
					image: '/assets/images/nexus-guide/developer-create-full.webp',
					alt: 'Developer API ka full screenshot; masked key prefixes hide kiye gaye hain.',
					title: 'Nayi key create karein',
					text: '+ CREATE par tap karein, key ka short label likhein aur confirm karein. Full key dikhte hi copy karein; kuch keys sirf ek baar poori dikh sakti hain.'
				},
				{
					image: '/assets/images/nexus-guide/developer-copy-full.webp',
					alt: 'Developer API ka full screenshot; copy icon gold circle se highlight hai aur masked prefixes hide hain.',
					title: 'Nayi key copy karein',
					text: 'Your Keys mein nayi key ke saamne copy icon (do overlapping squares) tap karein. Key sirf apne app ya secure server mein paste karein.',
					highlight: 'copy'
				}
			],
			successTitle: 'Ho gaya — key ready hai',
			successText: 'Developer page ke Prediction ya History examples ke saath iska use karein.',
			securityTitle: 'Key private rakhein',
			securityText: 'Full key chat, screenshot ya public post mein share na karein. Leak ho jaaye to Developer page se revoke karke replacement banayein.'
		},
		hi: {
			eyebrow: 'सुरक्षित सेटअप · 3 चरण',
			zoomHint: 'बड़ा देखने के लिए टैप करें',
			zoomLabel: 'Screenshot को full size में खोलें',
			closeLabel: 'Image बंद करें',
			lightboxHint: 'बंद करें या वापस जाने के लिए Esc दबाएँ।',
			title: 'DRAGO API key बनाएँ',
			intro: 'Screenshots को क्रम से follow करें। लाल arrows बताते हैं कि कहाँ tap करना है।',
			steps: [
				{
					image: '/assets/images/nexus-guide/home-developer-full.webp',
					alt: 'DRAGO Home का पूरा screenshot, जिसमें लाल arrow Developer को दिखाता है।',
					title: 'Developer खोलें',
					text: 'Home से shortcuts row में Developer पर tap करें।'
				},
				{
					image: '/assets/images/nexus-guide/developer-create-full.webp',
					alt: 'Developer API का पूरा screenshot; masked key prefixes छिपाए गए हैं।',
					title: 'नई key बनाएँ',
					text: '+ CREATE पर tap करें, key का छोटा label लिखें और confirm करें। पूरी key दिखते ही copy करें; कुछ keys केवल एक बार पूरी दिखाई देती हैं।'
				},
				{
					image: '/assets/images/nexus-guide/developer-copy-full.webp',
					alt: 'Developer API का पूरा screenshot; copy icon gold circle से highlight है और masked prefixes छिपाए गए हैं।',
					title: 'नई key copy करें',
					text: 'Your Keys में नई key के सामने copy icon (दो overlapping squares) tap करें। इसे केवल अपने app या secure server में paste करें।',
					highlight: 'copy'
				}
			],
			successTitle: 'हो गया — आपकी key तैयार है',
			successText: 'Developer page के Prediction या History examples के साथ इसका उपयोग करें।',
			securityTitle: 'Key निजी रखें',
			securityText: 'पूरी key chat, screenshot या public post में share न करें। Leak होने पर Developer page से revoke करके नई key बनाएँ।'
		}
	};

	const initialMessage = {
		id: 'nexus-welcome',
		role: 'assistant',
		text: 'Hello 👋 I am NEXUS DRAGO PREDICTOR Agent. How can I help you?',
		time: 'Just now',
		source: 'local'
	};

	let messages = [initialMessage];
	let draft = '';
	let isTyping = false;
	let messageList;
	let composer;
	let activeRequest;
	let activeGuideImage = null;
	let guideImageTrigger;

	const SAFE_CHAT_PATHS = new Set([
		'/subscription/', '/profile/', '/prediction/', '/game/', '/wingo-game-guide/',
		'/developer/', '/auto-bet/', '/status/', '/notifications/', '/security-lock/'
	]);

	function safeAction(message) {
		const action = message?.action;
		if (!action || typeof action.label !== 'string' || typeof action.href !== 'string') return null;
		const label = action.label.trim().slice(0, 56);
		if (!label) return null;
		if (SAFE_CHAT_PATHS.has(action.href)) return { href: action.href, label, external: false };
		if (action.href === 'https://t.me/xx_drago') return { href: action.href, label, external: true };
		return null;
	}

	function guideFor(message) {
		if (message?.role !== 'assistant' || message.guide !== 'api-key') return null;
		const language = ['en', 'hinglish', 'hi'].includes(message.language) ? message.language : 'en';
		return API_KEY_GUIDES[language];
	}

	async function openGuideImage(image, alt, title, guide, event) {
		if (typeof image !== 'string' || !image.startsWith('/assets/images/nexus-guide/')) return;
		guideImageTrigger = event?.currentTarget;
		activeGuideImage = {
			image,
			alt: String(alt || 'Screenshot preview'),
			title: String(title || guide?.lightboxTitle || 'Screenshot'),
			closeLabel: guide?.closeLabel || 'Close image',
			lightboxHint: guide?.lightboxHint || 'Press Esc to return.'
		};
		await tick();
		document.querySelector('.agent-lightbox-close')?.focus();
	}

	function closeGuideImage() {
		activeGuideImage = null;
		tick().then(() => guideImageTrigger?.focus());
	}

	function handleLightboxKeydown(event) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeGuideImage();
			return;
		}
		if (event.key === 'Tab') {
			event.preventDefault();
			document.querySelector('.agent-lightbox-close')?.focus();
		}
	}

	function inlineParts(value, emphasizeLead = false) {
		const text = String(value || '');
		if (emphasizeLead && !text.includes('**')) {
			const lead = text.match(/^(.+?[.!?])(?=\s|$)/u);
			if (lead && lead[1].length <= 180) {
				return [
					{ text: lead[1], bold: true },
					...inlineParts(text.slice(lead[1].length), false)
				];
			}
		}

		const parts = [];
		const boldPattern = /\*\*(.+?)\*\*/gu;
		let cursor = 0;
		let match;
		while ((match = boldPattern.exec(text)) !== null) {
			if (match.index > cursor) parts.push({ text: text.slice(cursor, match.index), bold: false });
			parts.push({ text: match[1], bold: true });
			cursor = boldPattern.lastIndex;
		}
		if (cursor < text.length) parts.push({ text: text.slice(cursor), bold: false });
		if (!parts.length) parts.push({ text, bold: false });
		return parts;
	}

	function richBlocks(value, emphasizeLead = false) {
		const blocks = [];
		const lines = String(value || '').replace(/\r\n?/gu, '\n').split('\n');
		let paragraph = [];
		let list = null;
		let leadUsed = false;

		const flushParagraph = () => {
			if (!paragraph.length) return;
			blocks.push({
				type: 'paragraph',
				lines: paragraph.map((line) => inlineParts(line.text, line.emphasize))
			});
			paragraph = [];
		};
		const flushList = () => {
			if (!list) return;
			blocks.push(list);
			list = null;
		};

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line) {
				flushParagraph();
				flushList();
				continue;
			}

			const heading = line.match(/^#{1,3}\s+(.+)$/u);
			if (heading) {
				flushParagraph();
				flushList();
				blocks.push({ type: 'heading', parts: inlineParts(heading[1]) });
				leadUsed = true;
				continue;
			}

			const listItem = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/u);
			if (listItem) {
				flushParagraph();
				const ordered = /^\d+[.)]/u.test(line);
				if (list && list.ordered !== ordered) flushList();
				if (!list) list = { type: 'list', ordered, items: [] };
				list.items.push(inlineParts(listItem[1], emphasizeLead && !leadUsed));
				leadUsed = true;
				continue;
			}

			flushList();
			paragraph.push({ text: rawLine, emphasize: emphasizeLead && !leadUsed });
			leadUsed = true;
		}

		flushParagraph();
		flushList();
		return blocks;
	}

	function clockTime() {
		return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date());
	}

	function makeMessageId() {
		return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	}

	function saveConversation() {
		try {
			window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-80)));
		} catch (_) {
			// Conversation remains usable if browser storage is unavailable.
		}
	}

	function scrollToLatest() {
		tick().then(() => {
			if (messageList) messageList.scrollTop = messageList.scrollHeight;
		});
	}

	async function sendMessage(text = draft) {
		if (isTyping) return;
		const cleanText = String(text || '').trim();
		if (!cleanText) return;

		messages = [...messages, { id: makeMessageId(), role: 'user', text: cleanText, time: clockTime() }];
		draft = '';
		if (composer) composer.style.height = 'auto';
		isTyping = true;
		saveConversation();
		scrollToLatest();

		const controller = new AbortController();
		activeRequest = controller;
		try {
			const token = window.sessionStorage.getItem('drago_token') || '';
			if (!token) throw new Error('Session expired. Please sign in again.');

			const conversation = messages
				.slice(-18)
				.map((item) => ({ role: item.role, content: item.text }));
			const response = await fetch('/api/nexus-chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ messages: conversation }),
				signal: controller.signal
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.message || 'Agent se connection nahi ho paaya. Thodi der baad try karo.');

			const reply = String(data.reply || '').trim();
			if (!reply) throw new Error('NEXUS Agent se reply nahi mila. Dobara try karo.');
			const assistantMessage = {
				id: makeMessageId(),
				role: 'assistant',
				text: reply,
				time: clockTime(),
				source: ['local', 'server'].includes(data.source) ? data.source : 'ai'
			};
			if (data.guide === 'api-key') {
				assistantMessage.guide = 'api-key';
				assistantMessage.language = ['en', 'hinglish', 'hi'].includes(data.language) ? data.language : 'en';
			}
			const action = safeAction({ action: data.action });
			if (action) assistantMessage.action = { href: action.href, label: action.label };
			messages = [...messages, assistantMessage];
			saveConversation();
			scrollToLatest();
		} catch (error) {
			if (error?.name !== 'AbortError') {
				messages = [...messages, {
					id: makeMessageId(),
					role: 'assistant',
					text: error?.message || 'Agent se connection nahi ho paaya. Thodi der baad try karo.',
					time: clockTime()
				}];
				saveConversation();
				scrollToLatest();
			}
		} finally {
			if (activeRequest === controller) {
				activeRequest = null;
				isTyping = false;
			}
		}
	}

	function handleSubmit(event) {
		event.preventDefault();
		sendMessage();
	}

	function handleComposerKeydown(event) {
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			sendMessage();
		}
	}

	function resizeComposer() {
		if (!composer) return;
		composer.style.height = 'auto';
		composer.style.height = `${Math.min(composer.scrollHeight, 104)}px`;
	}

	function clearChat() {
		activeRequest?.abort();
		activeRequest = null;
		isTyping = false;
		messages = [{ ...initialMessage, time: clockTime() }];
		draft = '';
		if (composer) composer.style.height = 'auto';
		try {
			window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
		} catch (_) {}
		scrollToLatest();
		composer?.focus();
	}

	onMount(() => {
		try {
			const savedMessages = JSON.parse(window.sessionStorage.getItem(CHAT_STORAGE_KEY) || 'null');
			if (Array.isArray(savedMessages)) {
				const safeMessages = savedMessages
					.filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.text === 'string' && typeof item.time === 'string')
					.slice(-80);
				if (safeMessages.length) {
					messages = safeMessages.map((item) => item.id === 'nexus-welcome'
						? { ...item, text: initialMessage.text, source: 'local' }
						: item);
				}
			}
		} catch (_) {}

		scrollToLatest();
		import('$lib/pages/dashboard__dashboard.js').catch((error) => {
			console.error('[DRAGO] NEXUS chat session check failed:', error);
		});

		return () => {
			activeRequest?.abort();
		};
	});
</script>

<style>
	:global(body.page-chat) {
		align-items: stretch;
		justify-content: flex-start;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		max-height: 100dvh;
		padding: 0 0 calc(78px + env(safe-area-inset-bottom, 0px)) !important;
		overflow: hidden;
		background: #fff !important;
	}

	.agent-main {
		--drago-gold: #c9a050;
		--drago-gold-dark: #ad8015;
		--drago-tint: #fffaf2;
		--drago-line: #eee5d0;
		flex: 0 0 auto;
		width: 100%;
		height: calc(100dvh - clamp(39px, 13.5vw, 54px) - 78px - env(safe-area-inset-bottom, 0px));
		min-height: 0;
		margin: 0;
		padding: 0;
		color: #2a2116;
		font-family: 'Outfit', 'Inter', sans-serif;
		background: #fff;
		isolation: isolate;
	}

	.agent-chat-card {
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-height: 0;
		border: 0;
		border-radius: 0;
		background: #fff;
		box-shadow: none;
		overflow: hidden;
	}

	.agent-chat-header {
		z-index: 1;
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 70px;
		padding: 10px clamp(16px, 3.2vw, 36px);
		border-bottom: 1px solid var(--drago-line);
		background: #fff;
		box-shadow: 0 4px 14px rgba(60, 40, 15, 0.045);
	}

	.agent-chat-identity {
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.agent-avatar {
		flex: 0 0 46px;
		display: grid;
		place-items: center;
		width: 46px;
		height: 46px;
		border: 1px solid #efdfb3;
		border-radius: 15px;
		background: var(--drago-tint);
	}

	.agent-avatar img {
		display: block;
		width: 34px;
		height: 34px;
		object-fit: contain;
	}

	.agent-identity-copy {
		min-width: 0;
	}

	.agent-identity-copy h1 {
		margin: 0;
		color: #2a2116;
		font-size: 1.02rem;
		font-weight: 700;
		letter-spacing: -0.015em;
		line-height: 1.2;
	}

	.agent-identity-copy p {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 4px 0 0;
		color: #80651d;
		font-size: 0.76rem;
		line-height: 1.15;
	}

	.agent-identity-copy p i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #35ae67;
		box-shadow: 0 0 0 3px rgba(53, 174, 103, 0.14);
	}

	.agent-header-actions {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 10px;
	}


	.agent-clear-chat {
		flex: 0 0 auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		min-height: 40px;
		padding: 0 13px;
		border: 1px solid #efdfb3;
		border-radius: 12px;
		background: #fff;
		color: var(--drago-gold-dark);
		font: inherit;
		font-size: 0.81rem;
		font-weight: 650;
		white-space: nowrap;
		cursor: pointer;
		transition: background 140ms ease, transform 140ms ease;
	}

	.agent-clear-chat:hover {
		background: #fff9e8;
	}

	.agent-clear-chat:active {
		transform: scale(0.96);
	}

	.agent-clear-chat svg {
		width: 16px;
		height: 16px;
	}

	.agent-messages {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 18px;
		padding: clamp(20px, 3.5vh, 34px) clamp(18px, 5.5vw, 72px);
		background: #fff;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: #d8c9a2 transparent;
	}

	.agent-message-row {
		max-width: min(880px, 88%);
		display: flex;
		align-items: flex-end;
		gap: 9px;
	}

	.agent-user-row {
		align-self: flex-end;
	}

	.agent-message-avatar {
		flex: 0 0 30px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		margin-bottom: 19px;
		border: 1px solid #efdfb3;
		border-radius: 10px;
		background: var(--drago-tint);
	}

	.agent-message-avatar img {
		display: block;
		width: 22px;
		height: 22px;
		object-fit: contain;
	}

	.agent-message-stack {
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.agent-user-row .agent-message-stack {
		align-items: flex-end;
	}

	.agent-message-name {
		margin: 0 4px 5px;
		color: #80651d;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.agent-bubble {
		max-width: 100%;
		padding: 12px 15px;
		border: 1px solid #eadcbe;
		border-radius: 5px 17px 17px 17px;
		background: #fffaf2;
		color: #37332d;
		font-size: 0.91rem;
		line-height: 1.58;
		overflow-wrap: anywhere;
		box-shadow: 0 4px 14px rgba(60, 40, 15, 0.035);
	}

	.agent-rich-text p {
		margin: 0;
		white-space: pre-wrap;
	}

	.agent-rich-text p + p {
		margin-top: 9px;
	}

	.agent-rich-text strong {
		color: #2a2116;
		font-weight: 750;
	}

	.agent-rich-heading {
		margin: 0 0 7px;
		color: #2a2116;
		font-size: 0.98rem;
		font-weight: 750;
		line-height: 1.3;
	}

	.agent-rich-text ul {
		margin: 2px 0 0;
		padding-left: 1.25rem;
		list-style: disc;
	}

	.agent-rich-text li + li {
		margin-top: 5px;
	}

	.agent-rich-text ul.agent-rich-ordered {
		list-style: decimal;
	}

	.agent-guide-row {
		width: min(880px, 94%);
		max-width: min(880px, 94%);
		align-items: flex-start;
	}

	.agent-guide-row .agent-message-stack {
		width: calc(100% - 39px);
	}

	.agent-guide-bubble {
		box-sizing: border-box;
		width: 100%;
		padding: 0;
		border-color: #e8d9b6;
		background: #fff;
		box-shadow: 0 9px 24px rgba(52, 40, 17, 0.07);
		overflow: hidden;
	}

	.agent-api-guide {
		padding: 14px;
		background: #fff;
	}

	.agent-guide-intro {
		margin: 0 0 14px;
	}

	.agent-guide-eyebrow {
		display: inline-flex;
		align-items: center;
		min-height: 24px;
		padding: 0 9px;
		border: 1px solid #eee1c1;
		border-radius: 999px;
		background: #fffaf0;
		color: #8e6e20;
		font-size: 0.61rem;
		font-weight: 800;
		letter-spacing: 0.09em;
	}

	.agent-guide-intro h2 {
		margin: 9px 0 4px;
		color: #2a2116;
		font-size: 1.08rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.agent-guide-intro p,
	.agent-guide-step-copy p,
	.agent-guide-success p,
	.agent-guide-security p {
		margin: 0;
		font-size: 0.82rem;
		line-height: 1.45;
		white-space: normal;
	}

	.agent-guide-intro p {
		color: #746b5d;
	}

	.agent-guide-step {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.agent-guide-image-button {
		position: relative;
		flex: 0 0 auto;
		width: min(100%, 250px);
		display: block;
		margin: 0 auto;
		padding: 0;
		border: 1px solid #dcd8d0;
		border-radius: 12px;
		background: #111;
		color: #fff;
		cursor: zoom-in;
		box-shadow: 0 4px 12px rgba(30, 26, 18, 0.1);
		transition: transform 140ms ease, box-shadow 140ms ease;
	}

	.agent-guide-image-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 7px 18px rgba(30, 26, 18, 0.16);
	}

	.agent-guide-image-button:focus-visible {
		outline: 2px solid #b78a2a;
		outline-offset: 3px;
	}

	.agent-guide-image-button img {
		display: block;
		width: 100%;
		height: auto;
		object-fit: contain;
	}

	.agent-guide-zoom-hint {
		position: absolute;
		right: 7px;
		bottom: 7px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		max-width: calc(100% - 14px);
		padding: 5px 8px;
		border: 1px solid rgba(255, 255, 255, 0.24);
		border-radius: 999px;
		background: rgba(31, 27, 21, 0.86);
		color: #fff;
		font-size: 0.59rem;
		font-weight: 650;
		line-height: 1.1;
		pointer-events: none;
		backdrop-filter: blur(4px);
	}

	.agent-guide-zoom-hint svg {
		flex: 0 0 13px;
		width: 13px;
		height: 13px;
	}

	.agent-guide-step-copy {
		padding: 0 2px;
	}

	.agent-guide-step-index {
		display: inline;
		color: #94721f;
		font-size: 0.91rem;
		font-weight: 800;
		letter-spacing: 0;
	}

	.agent-guide-step-copy h3,
	.agent-guide-success h3,
	.agent-guide-security h3 {
		margin: 0 0 3px;
		font-size: 0.88rem;
		font-weight: 750;
		line-height: 1.3;
	}

	.agent-guide-step-copy h3 {
		color: #2a2116;
	}

	.agent-guide-step-copy p {
		color: #5f594d;
	}

	.agent-guide-arrow {
		display: flex;
		justify-content: center;
		margin: 7px 0;
	}

	.agent-guide-arrow span {
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border: 1px solid #eadbb7;
		border-radius: 50%;
		background: #fffaf0;
		color: #a87d20;
		font-size: 1.22rem;
		font-weight: 700;
		line-height: 1;
	}

	.agent-guide-success,
	.agent-guide-security {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin-top: 13px;
		padding: 11px;
		border: 1px solid;
		border-radius: 13px;
	}

	.agent-guide-success {
		border-color: #cae6d2;
		background: #f2faf4;
		color: #235e38;
	}

	.agent-guide-security {
		border-color: #eadab6;
		background: #fffaf0;
		color: #624d21;
	}

	.agent-guide-success-icon,
	.agent-guide-security-icon {
		flex: 0 0 28px;
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		border-radius: 9px;
		background: rgba(41, 111, 66, 0.1);
	}

	.agent-guide-success-icon svg,
	.agent-guide-security-icon svg {
		width: 18px;
		height: 18px;
	}

	.agent-guide-security-icon {
		background: rgba(166, 126, 31, 0.11);
	}

	.agent-guide-success h3,
	.agent-guide-security h3 {
		color: inherit;
	}

	.agent-guide-success p {
		color: #426b4f;
	}

	.agent-guide-security p {
		color: #75633a;
	}

	.agent-lightbox {
		position: fixed;
		z-index: 999999;
		inset: 0;
		box-sizing: border-box;
		display: grid;
		place-items: center;
		padding: max(12px, env(safe-area-inset-top, 0px)) max(12px, env(safe-area-inset-right, 0px)) max(12px, env(safe-area-inset-bottom, 0px)) max(12px, env(safe-area-inset-left, 0px));
		background: rgba(17, 15, 12, 0.86);
		backdrop-filter: blur(5px);
	}

	.agent-lightbox:focus {
		outline: none;
	}

	.agent-lightbox-panel {
		box-sizing: border-box;
		width: min(94vw, 620px);
		max-height: calc(100dvh - 24px);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 10px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 17px;
		background: #1e1b16;
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.36);
	}

	.agent-lightbox-header {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 40px;
		padding: 0 2px 7px 5px;
		color: #fff;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.agent-lightbox-close {
		flex: 0 0 34px;
		width: 34px;
		height: 34px;
		display: grid;
		place-items: center;
		padding: 0;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 11px;
		background: rgba(255, 255, 255, 0.09);
		color: #fff;
		cursor: pointer;
	}

	.agent-lightbox-close:hover {
		background: rgba(255, 255, 255, 0.17);
	}

	.agent-lightbox-close:focus-visible {
		outline: 2px solid #e6c06b;
		outline-offset: 2px;
	}

	.agent-lightbox-close svg {
		width: 17px;
		height: 17px;
	}

	.agent-lightbox-image-wrap {
		flex: 1 1 auto;
		min-height: 0;
		width: 100%;
		display: grid;
		place-items: center;
		overflow: auto;
	}

	.agent-lightbox-image {
		display: block;
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: calc(100dvh - 114px);
		object-fit: contain;
	}

	.agent-lightbox-caption {
		flex: 0 0 auto;
		margin: 7px 0 0;
		color: #cfc9be;
		font-size: 0.65rem;
		line-height: 1.2;
		text-align: center;
	}

	.agent-lightbox-close,
	.agent-guide-image-button {
		-webkit-tap-highlight-color: transparent;
	}

	.agent-user-bubble {
		border-color: transparent;
		border-radius: 17px 5px 17px 17px;
		background: linear-gradient(135deg, #3d3225, #2a2116);
		color: #fff;
	}

	.agent-message-time {
		margin: 5px 4px 0;
		color: #928771;
		font-size: 0.66rem;
		line-height: 1;
	}

	.agent-local-source {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin: 7px 4px 0;
		padding: 5px 8px;
		border: 1px solid #dbeada;
		border-radius: 999px;
		background: #f4faf3;
		color: #55714f;
		font-size: 0.62rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.agent-action-link {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		gap: 9px;
		max-width: 100%;
		margin: 8px 1px 0;
		padding: 8px 12px;
		border: 1px solid #e9d8ac;
		border-radius: 999px;
		background: #fff;
		color: #86620e;
		font-size: 0.76rem;
		font-weight: 650;
		line-height: 1.2;
		text-decoration: none;
		transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
	}

	.agent-action-link:hover {
		border-color: #d1ad56;
		background: #fff9e8;
	}

	.agent-action-link:active {
		transform: scale(0.98);
	}

	.agent-action-link span {
		font-size: 0.7rem;
	}

	.agent-user-row .agent-message-time {
		text-align: right;
	}

	.agent-suggestions {
		max-width: 880px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 9px;
		margin: -5px 0 0 39px;
	}

	.agent-suggestions-label {
		flex: 0 0 100%;
		color: #80651d;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
	}

	.agent-suggestion {
		max-width: 100%;
		padding: 9px 13px;
		border: 1px solid #efdfb3;
		border-radius: 999px;
		background: #fff;
		color: #655d4f;
		font: inherit;
		font-size: 0.78rem;
		line-height: 1.25;
		text-align: left;
		cursor: pointer;
		transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
	}

	.agent-suggestion:hover {
		border-color: #e6c070;
		background: #fff9e8;
		color: var(--drago-gold-dark);
	}

	.agent-typing-bubble {
		align-self: flex-end;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-height: 34px;
		padding: 0 13px;
		border: 1px solid #efdfb3;
		border-radius: 5px 16px 16px 16px;
		background: #fffaf2;
	}

	.agent-typing-bubble span {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #c9a227;
		animation: agent-dot 1s ease-in-out infinite;
	}

	.agent-typing-bubble span:nth-child(2) { animation-delay: 120ms; }
	.agent-typing-bubble span:nth-child(3) { animation-delay: 240ms; }

	@keyframes agent-dot {
		0%, 60%, 100% { transform: translateY(0); opacity: 0.55; }
		30% { transform: translateY(-3px); opacity: 1; }
	}

	.agent-composer-area {
		flex: 0 0 auto;
		padding: 12px clamp(14px, 5.5vw, 72px) 10px;
		border-top: 1px solid var(--drago-line);
		background: #fff;
	}

	.agent-composer {
		max-width: 1040px;
		margin: 0 auto;
		display: flex;
		align-items: flex-end;
		gap: 9px;
		padding: 7px 8px 7px 15px;
		border: 1px solid #e4d6bf;
		border-radius: 18px;
		background: #fff;
		box-shadow: 0 3px 12px rgba(60, 40, 15, 0.045);
		transition: border-color 150ms ease, box-shadow 150ms ease;
	}

	.agent-composer:focus-within {
		border-color: #c9a227;
		box-shadow: 0 0 0 3px rgba(201, 162, 39, 0.13);
	}

	.agent-composer textarea {
		flex: 1 1 auto;
		min-width: 0;
		min-height: 40px;
		max-height: 104px;
		padding: 9px 0 7px;
		border: 0;
		outline: 0;
		resize: none;
		background: transparent;
		color: #2a2116;
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.4;
		overflow-y: auto;
	}

	.agent-composer textarea::placeholder {
		color: #928771;
	}

	.agent-composer textarea:focus-visible {
		outline: none;
	}

	.agent-send-button {
		flex: 0 0 40px;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border: 0;
		border-radius: 13px;
		background: linear-gradient(145deg, #e8c070, #c9a050);
		color: #2a2116;
		cursor: pointer;
		transition: filter 140ms ease, transform 140ms ease, opacity 140ms ease;
	}

	.agent-send-button:hover:not(:disabled) {
		filter: brightness(1.07);
	}

	.agent-send-button:active:not(:disabled) {
		transform: scale(0.94);
	}

	.agent-send-button:disabled {
		cursor: not-allowed;
		opacity: 0.42;
	}

	.agent-send-button svg {
		width: 19px;
		height: 19px;
	}


	.agent-clear-chat:focus-visible,
	.agent-suggestion:focus-visible,
	.agent-action-link:focus-visible,
	.agent-composer textarea:focus-visible,
	.agent-send-button:focus-visible {
		outline: 2px solid #c9a227;
		outline-offset: 3px;
	}

	@media (max-width: 560px) {
		.agent-chat-header {
			min-height: 64px;
			gap: 8px;
			padding: 8px 12px;
		}

		.agent-chat-identity {
			gap: 9px;
		}

		.agent-avatar {
			flex-basis: 41px;
			width: 41px;
			height: 41px;
			border-radius: 13px;
		}

		.agent-avatar img {
			width: 30px;
			height: 30px;
		}

		.agent-identity-copy h1 {
			font-size: 0.95rem;
		}

		.agent-identity-copy p {
			gap: 5px;
			font-size: 0.68rem;
		}

		.agent-header-actions {
			gap: 7px;
		}


		.agent-clear-chat {
			min-height: 38px;
			padding: 0 10px;
			font-size: 0.75rem;
		}

		.agent-messages {
			gap: 15px;
			padding: 18px 13px;
		}

		.agent-message-row {
			max-width: 96%;
		}

		.agent-bubble {
			padding: 10px 12px;
			font-size: 0.85rem;
		}

		.agent-suggestions {
			gap: 7px;
			margin-left: 37px;
		}

		.agent-suggestion {
			padding: 8px 10px;
			font-size: 0.72rem;
		}

		.agent-composer-area {
			padding: 9px 11px 9px;
		}

		.agent-composer {
			gap: 7px;
			padding-left: 12px;
		}

			.agent-composer textarea {
				font-size: 0.86rem;
			}

			.agent-guide-row {
				width: 96%;
				max-width: 96%;
			}

			.agent-api-guide {
				padding: 11px;
			}

			.agent-guide-intro h2 {
				font-size: 1rem;
			}

			.agent-guide-intro p,
			.agent-guide-step-copy p,
			.agent-guide-success p,
			.agent-guide-security p {
				font-size: 0.77rem;
			}

			.agent-guide-success,
			.agent-guide-security {
				gap: 8px;
				padding: 9px;
			}

		}

	@media (max-width: 390px) {
		.agent-clear-chat {
			min-height: 36px;
			gap: 5px;
			padding: 0 9px;
			font-size: 0.73rem;
		}

		.agent-clear-chat svg {
			width: 14px;
			height: 14px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.agent-typing-bubble span {
			animation: none;
		}
	}
</style>
