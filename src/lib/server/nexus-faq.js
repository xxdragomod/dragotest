/*
 * Local-first help library for NEXUS Agent.
 * These answers run on the DRAGO server after the normal account/ban check.
 * Matched FAQs never call the external AI provider; only unmatched questions do.
 */

const ACTIONS = {
	plans: {
		href: '/subscription/',
		labels: { en: 'Open plans', hinglish: 'Plans dekho', hi: 'प्लान देखें' }
	},
	profile: {
		href: '/profile/',
		labels: { en: 'Open Profile', hinglish: 'Profile kholo', hi: 'प्रोफ़ाइल खोलें' }
	},
	prediction: {
		href: '/prediction/',
		labels: { en: 'Open RX1 Prediction', hinglish: 'RX1 Prediction kholo', hi: 'RX1 Prediction खोलें' }
	},
	game: {
		href: '/game/',
		labels: { en: 'Open Games', hinglish: 'Games kholo', hi: 'गेम खोलें' }
	},
	guide: {
		href: '/wingo-game-guide/',
		labels: { en: 'Open the game guide', hinglish: 'Game guide kholo', hi: 'गेम गाइड खोलें' }
	},
	developer: {
		href: '/developer/',
		labels: { en: 'Open Developer API', hinglish: 'Developer API kholo', hi: 'Developer API खोलें' }
	},
	autoBet: {
		href: '/auto-bet/',
		labels: { en: 'Open Auto Bet setup', hinglish: 'Auto Bet setup kholo', hi: 'Auto Bet सेटअप खोलें' }
	},
	status: {
		href: '/status/',
		labels: { en: 'View service status', hinglish: 'Service status dekho', hi: 'सर्विस स्टेटस देखें' }
	},
	notifications: {
		href: '/notifications/',
		labels: { en: 'Open Notifications', hinglish: 'Notifications kholo', hi: 'नोटिफ़िकेशन खोलें' }
	},
	security: {
		href: '/security-lock/',
		labels: { en: 'Open Security Lock', hinglish: 'Security Lock kholo', hi: 'Security Lock खोलें' }
	},
	support: {
		href: 'https://t.me/xx_drago',
		labels: { en: 'Contact DRAGO Support', hinglish: 'DRAGO Support se baat karein', hi: 'DRAGO Support से संपर्क करें' }
	}
};

const FAQS = [
	{
		id: 'thanks',
		triggers: ['thank you', 'thanks', 'thank u', 'thx', 'shukriya', 'dhanyavaad', 'धन्यवाद', 'शुक्रिया', 'bahut helpful', 'you helped me'],
		answers: {
			en: 'You’re welcome! 👋 If you need anything else about DRAGO, just ask.',
			hinglish: 'Aapka welcome! 👋 DRAGO ke baare mein aur kuch poochna ho to bas message karo.',
			hi: 'आपका स्वागत है! 👋 DRAGO के बारे में कुछ और पूछना हो तो लिखें।'
		}
	},
	{
		id: 'goodbye',
		triggers: ['bye', 'goodbye', 'see you', 'talk later', 'good night', 'alvida', 'फिर मिलेंगे', 'बाय'],
		answers: {
			en: 'See you! 👋 I’ll be here whenever you need help with DRAGO.',
			hinglish: 'Phir milte hain! 👋 DRAGO help chahiye ho to kabhi bhi message karna.',
			hi: 'फिर मिलते हैं! 👋 DRAGO में मदद चाहिए हो तो कभी भी पूछें।'
		}
	},
	{
		id: 'wellbeing',
		triggers: ['how are you', 'how r u', 'kaise ho', 'kaisi ho', 'tum kaise ho', 'आप कैसे हैं', 'कैसे हो'],
		answers: {
			en: 'I’m ready to help! 😊 What would you like to know about DRAGO Predictor?',
			hinglish: 'Main help ke liye ready hoon! 😊 DRAGO Predictor ke baare mein kya jaanna hai?',
			hi: 'मैं मदद के लिए तैयार हूँ! 😊 DRAGO Predictor के बारे में क्या जानना चाहेंगे?'
		}
	},
	{
		id: 'identity',
		triggers: ['who are you', 'what is nexus', 'nexus agent', 'nexus drago', 'nexus', 'nexus kya hai', 'nexus क्या है', 'नेक्सस क्या है', 'tum kaun ho', 'आप कौन हैं', 'आप कौन', 'नेक्सस एजेंट', 'drago predictor agent'],
		answers: {
			en: 'I’m the NEXUS DRAGO PREDICTOR Agent. I can guide you through plans, RX1 predictions, the Developer API, Auto Bet setup, your account, and common app issues. I can’t see private account or live game data unless it is shown in the app.',
			hinglish: 'Main NEXUS DRAGO PREDICTOR Agent hoon. Plans, RX1 predictions, Developer API, Auto Bet setup, account aur common app issues mein guide kar sakta hoon. Main aapka private account ya live game data yahan se nahi dekh sakta.',
			hi: 'मैं NEXUS DRAGO PREDICTOR Agent हूँ। मैं plans, RX1 predictions, Developer API, Auto Bet setup, account और आम app समस्याओं में मार्गदर्शन कर सकता हूँ। मैं यहाँ से आपका private account या live game data नहीं देख सकता।'
		}
	},
	{
		id: 'capabilities',
		triggers: ['what can you do', 'what can i ask', 'help topics', 'what do you help with', 'kis cheez mein help', 'kya kya kar sakte ho', 'आप क्या कर सकते हैं', 'किस बारे में मदद'],
		answers: {
			en: 'Ask me about Pro and Free plans, RX1/WinGo 30s, Developer API keys and limits, Auto Bet on Kiwi Browser, account help, notifications, security, or service status. Common DRAGO questions are answered from the built-in help library without an AI-provider call.',
			hinglish: 'Aap Pro/Free plans, RX1/WinGo 30s, Developer API keys aur limits, Kiwi Browser par Auto Bet, account, notifications, security ya service status pooch sakte ho. Common DRAGO sawaalon ka jawab built-in help se milta hai—AI provider call nahi hota.',
			hi: 'आप Pro/Free plans, RX1/WinGo 30s, Developer API keys और limits, Kiwi Browser में Auto Bet, account, notifications, security या service status के बारे में पूछ सकते हैं। आम DRAGO सवालों के जवाब built-in help library से मिलते हैं—AI provider को call नहीं किया जाता।'
		}
	},
	{
		id: 'subscription',
		triggers: ['subscription kaise lu', 'subscription kaise le', 'subscribe kaise karu', 'subscription kaise karu', 'how do i subscribe', 'how can i subscribe', 'how to subscribe', 'how do i get a subscription', 'how can i get pro', 'get a pro plan', 'buy pro', 'purchase pro', 'upgrade to pro', 'become a member', 'membership kaise milegi', 'pro', 'pro vip', 'plan', 'subscription', 'subscribe', 'pro kaise lu', 'pro lena', 'pro kharidna', 'mujhe pro chahiye', 'subscribe karna', 'subscription kaise', 'subscription कैसे', 'मुझे subscription कैसे लेना', 'subscription कैसे लें', 'मुझे plan लेना', 'कैसे लूँ plan', 'कैसे लें plan', 'सब्सक्रिप्शन कैसे', 'प्रो कैसे लें', 'प्रो plan कैसे लें', 'प्लान कैसे खरीदें', 'प्लान कैसे लें', 'get subscription', 'subscribe to drago'],
		answers: {
			en: '**Plans:** Open Profile → Plan & benefits or the Subscription page.\n\n💎 **Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout is not connected, so a purchase cannot be completed in-app yet.',
			hinglish: '**Plans:** Profile → Plan & benefits kholo ya Subscription page par jao.\n\n💎 **Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout abhi connected nahi hai, isliye app mein purchase complete nahi hoti.',
			hi: '**Plans:** Profile → Plan & benefits खोलें या Subscription page पर जाएँ।\n\n💎 **Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout अभी connected नहीं है, इसलिए app में purchase पूरी नहीं हो सकती।'
		},
		action: 'plans'
	},
	{
		id: 'pricing',
		triggers: ['subscription price', 'plan price', 'price of pro', 'pro price', 'price', 'cost', 'how much', 'how much is pro', 'how much does it cost', 'weekly price', 'monthly price', 'weekly plan', 'monthly plan', 'pro plan', '₹749', 'rs 749', '749 rupees', '₹1498', '₹1 498', '1498 rupees', 'kitna price', 'kitne ka plan', 'weekly kitna', 'monthly kitna', 'weekly की कीमत', 'monthly की कीमत', 'weekly कितना', 'monthly कितना', '749 रुपये', '1498 रुपये', 'प्रो की कीमत', 'सब्सक्रिप्शन कीमत', 'साप्ताहिक कीमत', 'मासिक कीमत', 'कितने का है', 'कितना खर्च'],
		answers: {
			en: '💎 **DRAGO Plans**\n\n━━━━━━━━━━━━━━━━\n\n**Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout is not connected yet, so payment cannot be completed in-app.',
			hinglish: '💎 **DRAGO Plans**\n\n━━━━━━━━━━━━━━━━\n\n**Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout abhi connected nahi hai, isliye app mein payment complete nahi hoti.',
			hi: '💎 **DRAGO Plans**\n\n━━━━━━━━━━━━━━━━\n\n**Pro VIP**\n• Weekly — ₹749\n• Monthly — ₹1,498\n\nCheckout अभी connected नहीं है, इसलिए app में payment पूरी नहीं हो सकती।'
		},
		action: 'plans'
	},
	{
		id: 'free-plan',
		triggers: ['free plan', 'free tier', 'basic plan', 'free account', 'free version', 'free', 'what do i get free', 'how many free predictions', 'free prediction limit', '3 predictions', 'three predictions', '10 history uses', 'free api history', 'free mein kya milta', 'free plan mein kya', 'free plan में क्या मिलता', 'free plan में क्या', 'free kitna', 'मुफ़्त प्लान', 'फ्री प्लान', 'फ्री में क्या', 'मुफ्त में कितने prediction', 'मुफ्त में क्या मिलता', 'मुफ्त plan में क्या'],
		answers: {
			en: '**Free/Basic** includes:\n• 3 regular predictions\n• 10 Developer API History uses\n\nFloating in-game window and unlimited NEXUS Agent use are Pro-only.',
			hinglish: '**Free/Basic** mein milte hain:\n• 3 normal predictions\n• Developer API History ke 10 uses\n\nFloating in-game window aur unlimited NEXUS Agent use sirf Pro mein hai.',
			hi: '**Free/Basic** में मिलते हैं:\n• 3 regular predictions\n• Developer API History के 10 uses\n\nFloating in-game window और unlimited NEXUS Agent use केवल Pro में हैं।'
		},
		action: 'plans'
	},
	{
		id: 'pro-features',
		triggers: ['pro features', 'pro benefits', 'what does pro include', 'what is included in pro', 'pro vip features', 'what do i get with pro', 'difference between free and pro', 'free vs pro', 'unlimited predictions', 'unlimited prediction', 'floating window', 'unlimited nexus agent', 'unlimited drago api', 'pro mein kya milta', 'pro ke benefits', 'pro features kya', 'pro में क्या मिलता', 'pro में क्या है', 'प्रो में क्या मिलता', 'प्रो के फायदे', 'free और pro में अंतर', 'फ्री और प्रो में अंतर'],
		answers: {
			en: '💎 **Pro VIP includes:**\n• Unlimited Prediction\n• Floating window in game\n• Unlimited use of NEXUS Agent\n• Unlimited DRAGO API access\n\n**API limit:** 20 requests per minute per key. Checkout is not connected yet.',
			hinglish: '💎 **Pro VIP mein:**\n• Unlimited Prediction\n• Game mein Floating window\n• NEXUS Agent ka unlimited use\n• Unlimited DRAGO API access\n\n**API limit:** Har key par 20 requests per minute. Checkout abhi connected nahi hai.',
			hi: '💎 **Pro VIP में:**\n• Unlimited Prediction\n• Game में Floating window\n• NEXUS Agent का unlimited use\n• Unlimited DRAGO API access\n\n**API limit:** हर key पर 20 requests per minute. Checkout अभी connected नहीं है।'
		},
		action: 'plans'
	},
	{
		id: 'current-plan',
		triggers: ['my current plan', 'check my plan', 'what plan am i on', 'my subscription status', 'mera plan', 'meri plan', 'mera subscription', 'meri subscription', 'मेरा plan', 'मेरी plan', 'मेरा subscription', 'मेरी subscription', 'मेरा प्लान', 'मेरी सदस्यता', 'my plan status', 'current subscription', 'plan details', 'mera plan', 'meri membership', 'मेरा प्लान', 'मेरी सदस्यता'],
		answers: {
			en: 'I can’t inspect private account details in this chat. Open Profile → Plan & benefits to see the plan attached to your DRAGO account. Never send a password, one-time code, or API key here.',
			hinglish: 'Main is chat mein aapke private account details nahi dekh sakta. Apne DRAGO account ka plan dekhne ke liye Profile → Plan & benefits kholo. Password, one-time code ya API key yahan mat bhejna.',
			hi: 'मैं इस chat में आपके private account details नहीं देख सकता। अपने DRAGO account का plan देखने के लिए Profile → Plan & benefits खोलें। Password, one-time code या API key यहाँ न भेजें।'
		},
		action: 'profile'
	},
	{
		id: 'checkout',
		triggers: ['checkout', 'payment', 'payments', 'continue with plan', 'payment button', 'purchase button', 'payment page', 'pay for pro', 'can i pay now', 'is checkout working', 'checkout connected', 'payment available', 'payment link', 'checkout kaam', 'payment ho rahi', 'अभी भुगतान', 'पेमेंट बटन', 'checkout चालू'],
		answers: {
			en: 'The Pro VIP panel currently displays “Checkout isn’t connected yet.” Its Continue with plan button does not process a payment or activate a plan. Please don’t assume a plan is purchased unless DRAGO confirms it; contact Support for current availability.',
			hinglish: 'Pro VIP panel mein abhi “Checkout isn’t connected yet” dikhata hai. Continue with plan button payment process ya plan activate nahi karta. DRAGO confirmation ke bina purchase complete na samjhein; current availability ke liye Support se poochhein.',
			hi: 'Pro VIP panel में अभी “Checkout isn’t connected yet” दिखाई देता है। Continue with plan button payment process या plan activate नहीं करता। DRAGO की confirmation के बिना purchase पूरी न मानें; उपलब्धता के लिए Support से पूछें।'
		},
		action: 'support'
	},
	{
		id: 'payment-problem',
		triggers: ['payment failed', 'payment pending', 'payment stuck', 'charged me', 'money deducted', 'amount deducted', 'payment problem', 'payment issue', 'payment confirmation', 'payment nahi hua', 'paisa kat gaya', 'पैसे कट गए', 'पेमेंट अटक गई', 'रिफंड चाहिए'],
		answers: {
			en: 'The Pro VIP checkout in this app is not connected, so this chat cannot verify or change a payment. If you see a debit from another payment provider, contact that provider and DRAGO Support with the date and transaction reference only—never share your OTP, password, full card details, or UPI PIN.',
			hinglish: 'Is app ka Pro VIP checkout connected nahi hai, isliye main yahan payment verify/change nahi kar sakta. Agar kisi aur payment provider se debit dikhe, us provider aur DRAGO Support ko date aur transaction reference bhejo—OTP, password, full card details ya UPI PIN kabhi share mat karna.',
			hi: 'इस app का Pro VIP checkout connected नहीं है, इसलिए मैं यहाँ payment verify या change नहीं कर सकता। यदि किसी अन्य payment provider से debit दिखे, तो उस provider और DRAGO Support को date और transaction reference दें—OTP, password, card details या UPI PIN कभी साझा न करें।'
		},
		action: 'support'
	},
	{
		id: 'refund',
		triggers: ['refund', 'refund payment', 'payment refund', 'money back', 'cancel subscription', 'cancel my plan', 'subscription cancel', 'refund policy', 'refund kaise', 'paise wapas', 'पैसे वापस', 'रिफंड नीति', 'सदस्यता रद्द'],
		answers: {
			en: 'I can’t issue, promise, or check refunds from chat. The Pro VIP checkout is not connected in this panel. If you made a payment through a separate provider, contact that provider and DRAGO Support with the transaction reference; don’t send secret payment credentials.',
			hinglish: 'Main chat se refund issue, promise ya check nahi kar sakta. Pro VIP panel ka checkout connected nahi hai. Agar aapne alag provider se payment ki hai, transaction reference ke saath us provider aur DRAGO Support se contact karo; secret payment details mat bhejo.',
			hi: 'मैं chat से refund जारी, वादा या check नहीं कर सकता। Pro VIP panel का checkout connected नहीं है। यदि आपने किसी अलग provider से payment की है, तो transaction reference के साथ उस provider और DRAGO Support से संपर्क करें; secret payment details साझा न करें।'
		},
		action: 'support'
	},
	{
		id: 'rx1-model',
		triggers: ['what is rx1', 'rx1 model', 'rx1', 'prediction', 'predictions', 'rx1 kya hai', 'rx1 क्या है', 'rx1 क्या होता है', 'about rx1', 'rx1 meaning', 'drago prediction model', 'आरएक्स1', 'आर एक्स वन', 'rx1 मॉडल'],
		answers: {
			en: 'RX1 is DRAGO’s prediction feature for the supported WinGo 30s flow. Open the Prediction page to see the current signal and period. Predictions are informational estimates, not guaranteed results.',
			hinglish: 'RX1 DRAGO ka supported WinGo 30s flow ke liye prediction feature hai. Current signal aur period dekhne ke liye Prediction page kholo. Prediction estimate hoti hai, guaranteed result nahi.',
			hi: 'RX1, supported WinGo 30s flow के लिए DRAGO का prediction feature है। Current signal और period देखने के लिए Prediction page खोलें। Prediction एक अनुमान है, guaranteed result नहीं।'
		},
		action: 'prediction'
	},
	{
		id: 'use-prediction',
		triggers: ['how to use rx1', 'how do i use prediction', 'how to get prediction', 'open prediction', 'where are predictions', 'use rx1 prediction', 'rx1 kaise use', 'prediction kaise dekhu', 'signal kaise dekhe', 'prediction chahiye', 'prediction कैसे देखें', 'prediction कैसे लें', 'signal कैसे देखें', 'प्रेडिक्शन कैसे देखें', 'आरएक्स1 कैसे चलाएं', 'सिग्नल कहाँ है'],
		answers: {
			en: 'Open Prediction from the centre navigation/crown or use the RX1 Prediction page. Check that the displayed period matches the game period before acting. I can’t read a live signal from your account inside chat.',
			hinglish: 'Centre navigation/crown se Prediction kholo ya RX1 Prediction page par jao. Koi action lene se pehle displayed period ko game ke period se match kar lo. Main chat se aapka live signal nahi dekh sakta.',
			hi: 'Centre navigation/crown से Prediction खोलें या RX1 Prediction page पर जाएँ। कोई कदम लेने से पहले displayed period को game period से मिलाएँ। मैं chat से आपका live signal नहीं देख सकता।'
		},
		action: 'prediction'
	},
	{
		id: 'prediction-terms',
		triggers: ['big small skip', 'what does big mean', 'what does small mean', 'what is skip', 'prediction level', 'confidence meaning', 'signal ka matlab', 'big small kya hai', 'skip ka matlab', 'big का मतलब', 'small का मतलब', 'skip का मतलब', 'बिग स्मॉल का मतलब', 'स्किप का मतलब', 'confidence क्या है'],
		answers: {
			en: 'BIG and SMALL are signal labels shown by RX1; SKIP means the model is not offering a signal for that period. Confidence/level are model indicators, not a promise that a result will win. Always confirm the period in the app.',
			hinglish: 'BIG aur SMALL RX1 ke signal labels hain; SKIP ka matlab hai us period ke liye model signal nahi de raha. Confidence/level sirf model indicators hain—jeet ki guarantee nahi. Period app mein confirm karna.',
			hi: 'BIG और SMALL, RX1 के signal labels हैं; SKIP का अर्थ है कि उस period के लिए model signal नहीं दे रहा। Confidence/level केवल model indicators हैं—जीत की guarantee नहीं। App में period ज़रूर मिलाएँ।'
		},
		action: 'prediction'
	},
	{
		id: 'accuracy-risk',
		triggers: ['prediction accuracy', 'is it accurate', 'guaranteed win', 'guarantee profit', 'can i win every time', 'sure shot prediction', '100 percent prediction', 'safe bet', 'win guarantee', 'accuracy kitni', 'pakka jeet', 'sure shot hai', 'क्या जीत की गारंटी', 'गारंटी से जीत', 'कितनी accuracy'],
		answers: {
			en: 'No prediction can guarantee a win or profit. RX1 signals are informational estimates and results can differ. Only make decisions you can afford, follow the game’s rules, and never chase losses.',
			hinglish: 'Koi bhi prediction jeet ya profit guarantee nahi kar sakti. RX1 signals sirf estimates hain aur result alag ho sakta hai. Sirf utna risk lo jitna afford kar sako; loss chase mat karo.',
			hi: 'कोई भी prediction जीत या profit की guarantee नहीं दे सकती। RX1 signals केवल अनुमान हैं और result अलग हो सकता है। उतना ही risk लें जितना आप सह सकें; नुकसान का पीछा न करें।'
		}
	},
	{
		id: 'live-signal',
		triggers: ['live prediction', 'current signal', 'next prediction', 'tell me next result', 'predict next number', 'live result', 'what is the signal now', 'aaj ka signal', 'abhi ka signal', 'next period prediction', 'अभी का prediction', 'अगला सिग्नल', 'अगला नंबर बताओ'],
		answers: {
			en: 'I can’t fetch or verify live game results from chat. Open the RX1 Prediction page and check its latest period directly; make sure it matches the period in the game. Never treat a chat answer as a live betting signal.',
			hinglish: 'Main chat se live game result fetch ya verify nahi kar sakta. RX1 Prediction page kholo aur latest period wahin check karo; game ke period se match zaroor karna. Chat answer ko live betting signal mat samjho.',
			hi: 'मैं chat से live game result fetch या verify नहीं कर सकता। RX1 Prediction page खोलकर latest period वहीं देखें और game period से मिलाएँ। Chat के जवाब को live betting signal न मानें।'
		},
		action: 'prediction'
	},
	{
		id: 'history-results',
		triggers: ['prediction history', 'game history', 'result history', 'past results', 'previous draw', 'last result', 'old results', 'history kaise dekhu', 'pichla result', 'पुराने परिणाम', 'पिछला रिजल्ट', 'गेम हिस्ट्री'],
		answers: {
			en: 'For recent game results, check the game/history area or the WinGo game guide. The Developer API also has a History example on its page. I can’t retrieve a private or live result from this chat.',
			hinglish: 'Recent game results ke liye game/history area ya WinGo game guide dekho. Developer API page par History ka example bhi hai. Main is chat se private ya live result retrieve nahi kar sakta.',
			hi: 'हाल के game results के लिए game/history area या WinGo game guide देखें। Developer API page पर History का example भी है। मैं इस chat से private या live result नहीं निकाल सकता।'
		},
		action: 'guide'
	},
	{
		id: 'supported-game',
		triggers: ['which game is supported', 'supported game', 'games', 'game', 'wingo 30s', 'win go 30', '30 second game', 'game supported', 'which period', 'kaunsa game support', 'कौन सा गेम supported', 'विंगो 30 सेकंड'],
		answers: {
			en: 'DRAGO’s RX1 and Auto Bet guidance here is for the supported WinGo 30s flow. Open Games to choose the embedded game, and use the guide if you need help understanding the game screen.',
			hinglish: 'DRAGO ka RX1 aur Auto Bet guide supported WinGo 30s flow ke liye hai. Embedded game kholne ke liye Games par jao; game screen samajhne ke liye guide dekh lo.',
			hi: 'यहाँ DRAGO का RX1 और Auto Bet guide supported WinGo 30s flow के लिए है। Embedded game खोलने के लिए Games पर जाएँ; game screen समझने के लिए guide देखें।'
		},
		action: 'game'
	},
	{
		id: 'game-loading',
		triggers: ['game not loading', 'game loading', 'game load nahi', 'game loading nahi', 'auto bet game loading', 'game is blank', 'game not opening', 'game frozen', 'game stuck', 'game error', 'game load nahi', 'game blank hai', 'गेम नहीं खुल रहा', 'गेम लोड नहीं हो रहा', 'गेम अटक गया'],
		answers: {
			en: 'Try reopening Games and check your connection. If the problem continues, open Status to see whether a service issue is reported, then contact Support with the page name and approximate time. Don’t send passwords or account tokens.',
			hinglish: 'Games dobara kholo aur internet connection check karo. Issue rahe to Status page dekho; phir page ka naam aur approx time bata kar Support se contact karo. Password ya account token mat bhejna.',
			hi: 'Games दोबारा खोलें और internet connection जाँचें। समस्या बनी रहे तो Status page देखें; फिर page का नाम और लगभग समय बताकर Support से संपर्क करें। Password या account token न भेजें।'
		},
		action: 'status'
	},
	{
		id: 'floating-window',
		triggers: ['floating window', 'floating prediction', 'prediction overlay', 'overlay in game', 'game window', 'floating kaise', 'फ्लोटिंग विंडो', 'गेम में prediction window'],
		answers: {
			en: 'The floating in-game window is listed as a Pro VIP feature. Open the game and prediction pages after your account has the eligible plan. I can’t change or verify your plan from this chat.',
			hinglish: 'Game ke andar floating window Pro VIP feature mein listed hai. Eligible plan wale account se game aur prediction pages kholo. Main chat se aapka plan verify ya change nahi kar sakta.',
			hi: 'Game के अंदर floating window, Pro VIP feature में listed है। Eligible plan वाले account से game और prediction pages खोलें। मैं chat से आपका plan verify या बदल नहीं सकता।'
		},
		action: 'plans'
	},
	{
		id: 'developer-api',
		triggers: ['developer api', 'drago api', 'api', 'api access', 'what is developer api', 'api kaise use', 'api kya hai', 'developer page', 'api documentation', 'डेवलपर एपीआई', 'एपीआई क्या है'],
		answers: {
			en: 'The Developer page lets you create/manage DRAGO API keys, review usage, and copy ready-made Prediction and History examples. Open it for the current base URL and code snippets. Keep API keys private.',
			hinglish: 'Developer page par DRAGO API keys create/manage, usage check aur Prediction/History ke ready examples milte hain. Current base URL aur code snippets ke liye page kholo. API key private rakho.',
			hi: 'Developer page पर DRAGO API keys create/manage करने, usage देखने और Prediction/History के ready examples पाने की सुविधा है। Current base URL और code snippets के लिए page खोलें। API key private रखें।'
		},
		action: 'developer'
	},
	{
		id: 'create-api-key',
		triggers: ['create api key', 'how to create an api key', 'how do i create api key', 'show me how to create api key', 'make an api key', 'how do i make api key', 'new api key', 'generate api key', 'how to generate api key', 'api key setup', 'developer api key setup', 'api key kaise banau', 'nayi api key kaise banau', 'api key kaise create karte', 'api key कैसे', 'api key', 'api key banana', 'key kaise create', 'api key create', 'api key कैसे बनाएं', 'api key कैसे बनाऊँ', 'एपीआई key बनाएं', 'एपीआई key बनाना', 'एपीआई key कैसे बनाएं', 'एपीआई key कैसे बनाऊँ', 'नई एपीआई key', 'नई key कैसे बनाएं'],
		answers: {
			en: 'Follow the guide below to create and securely copy a DRAGO API key. Copy the full key as soon as it appears; some keys are shown in full only once.',
			hinglish: 'Neeche diye gaye steps follow karke DRAGO API key banao aur securely copy karo. Full key dikhte hi copy kar lo; kuch keys sirf ek baar poori dikh sakti hain.',
			hi: 'नीचे दिए गए steps follow करके DRAGO API key बनाएँ और सुरक्षित रूप से copy करें। पूरी key दिखाई देते ही copy करें; कुछ keys केवल एक बार पूरी दिखाई देती हैं।'
		},
		action: 'developer',
		guide: 'api-key'
	},

	{
		id: 'api-key-safety',
		triggers: ['api key exposed', 'api key leaked', 'lost api key', 'lost my api key', 'forgot api key', 'forgot my api key', 'api key lost', 'share api key', 'can i share api key', 'show api key', 'api key safe', 'api key private', 'api key is private', 'api key is safe', 'key private', 'api key bheju', 'key leak ho gayi', 'एपीआई key leak', 'key सुरक्षित'],
		answers: {
			en: 'Never paste an API key, password, OTP, or token into chat or a public post. If a key may be exposed, delete/revoke it from Developer and create a replacement. The app may show only a masked key after creation.',
			hinglish: 'API key, password, OTP ya token kabhi chat/public post mein mat bhejo. Key leak hui ho sakti hai to Developer page se delete/revoke karke nayi key banao. Baad mein app key ko masked dikha sakta hai.',
			hi: 'API key, password, OTP या token कभी chat या public post में न भेजें। Key leak होने की आशंका हो तो Developer page से उसे delete/revoke करके नई key बनाएँ। बाद में app key को masked दिखा सकता है।'
		},
		action: 'developer'
	},
	{
		id: 'api-endpoints',
		triggers: ['prediction api endpoint', 'history api endpoint', 'api endpoint', 'api url', 'api example', 'api code', 'api code example', 'fetch prediction api', 'history api kaise', 'api ka code', 'endpoint कहाँ', 'एपीआई endpoint', 'एपीआई example'],
		answers: {
			en: 'Open Developer → Prediction or History. Each panel shows the current endpoint, sample response, language snippets, and copy controls. Use your own API key in requests and don’t share it.',
			hinglish: 'Developer → Prediction ya History kholo. Har panel mein current endpoint, sample response, language snippets aur copy controls milte hain. Request mein apni API key use karo aur kisi ko share mat karo.',
			hi: 'Developer → Prediction या History खोलें। हर panel में current endpoint, sample response, language snippets और copy controls मिलेंगे। Request में अपनी API key इस्तेमाल करें और किसी को share न करें।'
		},
		action: 'developer'
	},
	{
		id: 'api-rate-limit',
		triggers: ['api rate limit', 'requests per minute', '20 requests', '20 per minute', 'rate limit', 'api limit', 'too many requests api', 'api limit kitna', 'rate limit kya', 'एपीआई rate limit', 'बीस requests'],
		answers: {
			en: 'The Developer page lists a limit of 20 requests per minute per API key. If you receive a rate-limit response, slow down and retry after the window resets; avoid sending repeated requests in a tight loop.',
			hinglish: 'Developer page par har API key ke liye 20 requests per minute limit listed hai. Rate-limit response aaye to requests slow karo aur window reset ke baad retry karo; baar-baar tight loop mein request mat bhejo.',
			hi: 'Developer page पर हर API key के लिए 20 requests per minute की limit दी गई है। Rate-limit response मिले तो requests धीमी करें और window reset होने के बाद retry करें; लगातार loop में request न भेजें।'
		},
		action: 'developer'
	},
	{
		id: 'free-api-history',
		triggers: ['10 developer api history uses', '10 api history', 'free history api limit', 'history uses limit', 'history api quota', 'free api limit', 'api history free', 'history fetches', '10 history', 'api history khatam', 'इतने history requests', 'history limit'],
		answers: {
			en: 'Free access includes 10 Developer API History uses. The Developer page shows usage and the plan/upgrade message if the allowance is exhausted. Prediction and History limits can differ, so check the page for the current details.',
			hinglish: 'Free access mein Developer API History ke 10 uses milte hain. Limit khatam ho to Developer page usage aur plan/upgrade message dikhata hai. Prediction aur History limits alag ho sakti hain—current detail page par dekho.',
			hi: 'Free access में Developer API History के 10 uses हैं। Limit पूरी होने पर Developer page usage और plan/upgrade message दिखाता है। Prediction और History की limits अलग हो सकती हैं—current जानकारी page पर देखें।'
		},
		action: 'developer'
	},
	{
		id: 'api-auth-error',
		triggers: ['api unauthorized', 'api 401', 'api 403', 'invalid api key', 'api key not working', 'api authentication failed', 'api access denied', 'api error key', 'api key kaam nahi', 'key invalid hai', 'एपीआई key काम नहीं', 'api access नहीं'],
		answers: {
			en: 'Check that you copied the correct key, included it in the authentication header exactly as shown on Developer, and haven’t revoked it. Never include the key in a screenshot or chat. If it still fails, contact Support with the endpoint and HTTP status only.',
			hinglish: 'Sahi key copy hui hai, Developer page ke format mein auth header laga hai, aur key revoke nahi hui—ye check karo. Screenshot/chat mein key mat dikhana. Phir bhi issue ho to endpoint aur HTTP status ke saath Support ko message karo.',
			hi: 'सही key copy हुई है, Developer page के बताए format में auth header लगाया है और key revoke नहीं हुई—यह जाँचें। Screenshot/chat में key न दिखाएँ। फिर भी समस्या हो तो endpoint और HTTP status के साथ Support को message करें।'
		},
		action: 'support'
	},
	{
		id: 'service-status',
		triggers: ['service status', 'server status', 'status', 'is drago down', 'server down', 'is api down', 'status page', 'site outage', 'server slow', 'status check', 'server चालू', 'सर्वर down', 'वेबसाइट बंद'],
		answers: {
			en: 'Open the Status page for the latest service indicators and last-checked information. I can’t see live server telemetry from this chat. If the issue persists, send Support the page and approximate time.',
			hinglish: 'Latest service indicators aur last-checked info ke liye Status page kholo. Main chat se live server telemetry nahi dekh sakta. Issue rahe to page ka naam aur approx time Support ko bhejo.',
			hi: 'Latest service indicators और last-checked जानकारी के लिए Status page खोलें। मैं chat से live server telemetry नहीं देख सकता। समस्या बनी रहे तो page का नाम और लगभग समय Support को भेजें।'
		},
		action: 'status'
	},
	{
		id: 'nexus-local-help',
		triggers: ['do you use ai', 'ai api usage', 'api credits', 'ai credits', 'does this use tokens', 'token usage', 'no ai call', 'local answers', 'built in faq', 'built in help', 'do faq use tokens', 'local faq api usage', 'ai credits used', '1000 tokens', '1k tokens', '4000 tokens', '4k tokens', 'nexus agent usage', 'nexus agent limit', 'free chat limit', 'free ai usage', 'how many chat messages', 'ai usage kaise', 'token katte', 'nexus ai use', 'क्या ai इस्तेमाल', 'tokens खर्च', 'एआई का उपयोग'],
		answers: {
			en: 'Common DRAGO help questions are matched against the built-in local FAQ after your account is verified, so those replies do not call the AI provider. If a question does not match the help library, NEXUS may use the server-side AI fallback. The app does not publish a numeric 1K/4K token allowance, so I can’t confirm one. Pro VIP lists unlimited NEXUS Agent use; checkout is not connected yet.',
			hinglish: 'Common DRAGO help sawaal account verify hone ke baad built-in FAQ se match hote hain, isliye un replies par AI provider call nahi hota. Jo sawaal library mein match nahi hote, unke liye NEXUS server-side AI fallback use kar sakta hai. App mein 1K/4K token allowance ka numeric limit listed nahi hai, isliye main koi number confirm nahi kar sakta. Pro VIP mein unlimited NEXUS Agent listed hai; checkout abhi connected nahi hai.',
			hi: 'आम DRAGO help सवाल account verify होने के बाद built-in FAQ से match होते हैं, इसलिए उन जवाबों के लिए AI provider call नहीं होता। जो सवाल library से match नहीं होते, उनके लिए NEXUS server-side AI fallback इस्तेमाल कर सकता है। App में 1K/4K token allowance की numeric limit नहीं दी गई है, इसलिए मैं कोई संख्या confirm नहीं कर सकता। Pro VIP में unlimited NEXUS Agent listed है; checkout अभी connected नहीं है।'
		},
		action: 'plans'
	},
	{
		id: 'language',
		triggers: ['which language', 'language support', 'speak hindi', 'reply in hindi', 'reply in english', 'hinglish', 'same language', 'hindi mein jawab', 'hindi bol sakte', 'मेरी भाषा में', 'हिंदी में जवाब', 'अंग्रेज़ी में जवाब'],
		answers: {
			en: 'Yes—write in English, Hindi, or Hinglish and I’ll try to reply in the same language. For local FAQs, the answer language is selected from your message.',
			hinglish: 'Haan—English, Hindi ya Hinglish mein likho; main same language mein reply karne ki koshish karunga. Local FAQs mein aapke message ke hisaab se language select hoti hai.',
			hi: 'हाँ—English, Hindi या Hinglish में लिखें; मैं उसी भाषा में जवाब देने की कोशिश करूँगा। Local FAQs में आपके message के अनुसार भाषा चुनी जाती है।'
		}
	},
	{
		id: 'clear-chat',
		triggers: ['clear chat', 'delete chat', 'erase conversation', 'remove messages', 'chat history delete', 'clear messages', 'chat saaf', 'chat delete kaise', 'messages hatao', 'चैट साफ़', 'चैट हटाएं', 'conversation मिटाएं'],
		answers: {
			en: 'Tap Clear in the chat header to remove the conversation saved in this browser session. Clearing chat does not delete DRAGO account records or change your plan.',
			hinglish: 'Chat header mein Clear dabao—isse is browser session mein saved conversation remove ho jayegi. Chat clear karne se DRAGO account records ya plan change nahi hota.',
			hi: 'Chat header में Clear दबाएँ—इससे इस browser session में saved conversation हट जाएगी। Chat clear करने से DRAGO account records या plan नहीं बदलता।'
		}
	},
	{
		id: 'chat-privacy',
		triggers: ['is chat private', 'chat privacy', 'are messages saved', 'where chat saved', 'chat data stored', 'who can see my chat', 'messages private', 'chat सुरक्षित', 'chat save hoti', 'meri chat kaun dekhega', 'क्या chat private', 'संदेश सुरक्षित'],
		answers: {
			en: 'This chat keeps a limited conversation in browser session storage so it can survive navigation in the current session; Clear removes it. Your message is sent to DRAGO’s server for account verification and FAQ matching. If a question is unmatched, recent conversation context may also be sent to the server-side AI provider. Don’t share passwords, OTPs, or API keys.',
			hinglish: 'Chat current browser session mein limited conversation save karti hai; Clear se remove ho jaati hai. Aapka message account verification aur FAQ matching ke liye DRAGO server ko jaata hai. Sawaal match na ho to recent conversation context bhi server-side AI provider tak ja sakta hai. Password, OTP ya API key share mat karo.',
			hi: 'यह chat current browser session में सीमित conversation रखती है; Clear से हट जाती है। आपका message account verification और FAQ matching के लिए DRAGO server पर जाता है। सवाल match न हो तो recent conversation context भी server-side AI provider तक जा सकता है। Password, OTP या API key साझा न करें।'
		}
	},
	{
		id: 'signin',
		triggers: ['how to sign in', 'how do i login', 'login help', 'sign in help', 'login with google', 'google login', 'account login', 'login kaise', 'sign in kaise', 'लॉगिन कैसे करें', 'साइन इन मदद', 'google से login'],
		answers: {
			en: 'Use the sign-in option on the DRAGO login page and choose the same sign-in provider/account you originally used. I can’t reset or view credentials in chat. Never share a password or one-time code here.',
			hinglish: 'DRAGO login page ka sign-in option use karo aur wahi provider/account chuno jisse pehle sign in kiya tha. Main chat mein credentials dekh ya reset nahi kar sakta. Password ya one-time code yahan share mat karna.',
			hi: 'DRAGO login page का sign-in option इस्तेमाल करें और वही provider/account चुनें जिसका पहले उपयोग किया था। मैं chat में credentials देख या reset नहीं कर सकता। Password या one-time code यहाँ साझा न करें।'
		},
		action: 'profile'
	},
	{
		id: 'session-expired',
		triggers: ['session expired', 'logged out', 'login expired', 'token expired', 'why logged out', 'sign in again', 'session timeout', 'login dubara', 'session khatam', 'लॉगआउट हो गया', 'session expire'],
		answers: {
			en: 'Your sign-in session may have expired. Return to the DRAGO login page and sign in again with your usual provider. If the issue repeats, check your device time and contact Support; don’t send your session token.',
			hinglish: 'Aapka sign-in session expire ho sakta hai. DRAGO login page par jaakar apne usual provider se dobara sign in karo. Issue repeat ho to device time check karke Support se contact karo; session token mat bhejna.',
			hi: 'आपका sign-in session expire हो सकता है। DRAGO login page पर जाकर अपने usual provider से दोबारा sign in करें। समस्या दोहराए तो device time जाँचें और Support से संपर्क करें; session token न भेजें।'
		},
		action: 'support'
	},
	{
		id: 'account-profile',
		triggers: ['profile details', 'account details', 'my account', 'where is profile', 'profile information', 'account info', 'profile kaise dekhu', 'account details kaha', 'प्रोफ़ाइल जानकारी', 'खाता विवरण', 'मेरा account'],
		answers: {
			en: 'Open Profile to review your DRAGO account details, sign-in method, plan status, and account/support shortcuts. This chat cannot modify your account or reveal private details.',
			hinglish: 'DRAGO account details, sign-in method, plan status aur shortcuts ke liye Profile kholo. Main chat se account edit ya private details reveal nahi kar sakta.',
			hi: 'DRAGO account details, sign-in method, plan status और shortcuts देखने के लिए Profile खोलें। मैं chat से account edit या private details नहीं बता सकता।'
		},
		action: 'profile'
	},
	{
		id: 'forgot-password',
		triggers: ['forgot password', 'reset password', 'password reset', 'password bhool', 'password change', 'पासवर्ड भूल गया', 'पासवर्ड reset', 'password kaise badle'],
		answers: {
			en: 'Use the password/account recovery flow of the sign-in provider you originally used. DRAGO Support cannot ask for or use your password or OTP in chat. If you used Google sign-in, recover access through Google’s official account recovery.',
			hinglish: 'Jis sign-in provider ka pehle use kiya tha, usi ka password/account recovery flow use karo. DRAGO Support chat mein password ya OTP nahi maangega. Google sign-in tha to Google ke official account recovery se access wapas lo.',
			hi: 'जिस sign-in provider का पहले उपयोग किया था, उसी का password/account recovery flow इस्तेमाल करें। DRAGO Support chat में password या OTP नहीं माँगेगा। Google sign-in था तो Google के official account recovery से access वापस पाएँ।'
		},
		action: 'support'
	},
	{
		id: 'security-lock',
		triggers: ['security lock', 'account lock', 'lock screen', 'security page', 'locked out account', 'security lock help', 'security lock kaise', 'लॉक स्क्रीन', 'security lock मदद', 'account लॉक'],
		answers: {
			en: 'Open the Security Lock page if your DRAGO flow asks for it, and follow the on-screen verification instructions. Never send a lock code, password, one-time code, or token to anyone in chat.',
			hinglish: 'Agar DRAGO flow Security Lock maange to Security Lock page kholo aur on-screen verification follow karo. Lock code, password, one-time code ya token chat mein kisi ko mat bhejna.',
			hi: 'यदि DRAGO flow Security Lock माँगे तो Security Lock page खोलकर on-screen verification का पालन करें। Lock code, password, one-time code या token chat में किसी को न भेजें।'
		},
		action: 'security'
	},
	{
		id: 'notifications',
		triggers: ['notifications', 'notification bell', 'bell', 'announcements', 'where are notifications', 'notification history', 'bell messages', 'bell ka kya', 'notification kaha', 'नोटिफिकेशन', 'घंटी वाले संदेश', 'announcements कहाँ'],
		answers: {
			en: 'Tap the bell in the DRAGO header to open the dedicated Notifications area. It contains announcements and account updates when available.',
			hinglish: 'DRAGO header ka bell tap karke dedicated Notifications area kholo. Wahan available announcements aur account updates dikhenge.',
			hi: 'DRAGO header में bell tap करके dedicated Notifications area खोलें। वहाँ उपलब्ध announcements और account updates दिखाई देंगे।'
		},
		action: 'notifications'
	},
	{
		id: 'auto-bet-overview',
		triggers: ['what is auto bet', 'auto bet', 'autobet', 'auto bet pro', 'auto betting', 'autobet kya hai', 'auto bet kaise kaam', 'auto bet tool', 'ऑटो बेट क्या है', 'auto bet सुविधा'],
		answers: {
			en: 'Auto Bet Pro is an optional userscript tool for supported WinGo 30s gameplay. The DRAGO page has the Kiwi Browser installation guide. You remain responsible for checking the signal, period, balance, and stake before manually choosing START or STOP.',
			hinglish: 'Auto Bet Pro supported WinGo 30s gameplay ke liye optional userscript tool hai. DRAGO page par Kiwi Browser install guide hai. START/STOP se pehle signal, period, balance aur stake khud check karna aapki responsibility hai.',
			hi: 'Auto Bet Pro supported WinGo 30s gameplay के लिए optional userscript tool है। DRAGO page पर Kiwi Browser की installation guide है। START/STOP से पहले signal, period, balance और stake जाँचना आपकी ज़िम्मेदारी है।'
		},
		action: 'autoBet'
	},
	{
		id: 'auto-bet-install',
		triggers: ['install auto bet', 'setup auto bet', 'how to install auto bet', 'kiwi extensions', 'developer mode kiwi', 'user js install', 'userscript install', 'auto bet download script', 'auto bet kiwi mein install', 'auto bet install कैसे', 'auto bet कैसे install', 'kiwi mein kaise add', 'ऑटो बेट install', 'ऑटो बेट कैसे install', 'ऑटो बेट कैसे लगाएं', 'कीवी ब्राउज़र सेटअप'],
		answers: {
			en: 'Open Auto Bet in Kiwi Browser. In Kiwi, tap ⋮ → Extensions, turn Developer mode on, return to DRAGO and download the script, then use + (from .zip/.crx/.user.js) on Extensions to select the downloaded .user.js file. Confirm installation and enable Auto Bet Pro. The DRAGO page has picture-by-picture steps.',
			hinglish: 'Kiwi Browser mein Auto Bet kholo. ⋮ → Extensions par jao, Developer mode ON karo, DRAGO par wapas aakar script download karo; phir Extensions page ke + (from .zip/.crx/.user.js) se downloaded .user.js file select karo. Install confirm karke Auto Bet Pro ON karo. DRAGO page par photo guide hai.',
			hi: 'Kiwi Browser में Auto Bet खोलें। ⋮ → Extensions जाएँ, Developer mode ON करें, DRAGO पर लौटकर script download करें; फिर Extensions page के + (from .zip/.crx/.user.js) से downloaded .user.js file चुनें। Installation confirm करके Auto Bet Pro ON करें। DRAGO page पर photo guide है।'
		},
		action: 'autoBet'
	},
	{
		id: 'auto-bet-access',
		triggers: ['auto bet pro required', 'auto bet locked', 'auto bet plan', 'auto bet eligibility', 'auto bet unlock', 'who can use auto bet', 'auto bet access', 'auto bet pro plan', 'auto bet nahi khul', 'auto bet locked hai', 'ऑटो बेट locked', 'ऑटो बेट किस plan में'],
		answers: {
			en: 'Auto Bet Pro checks your DRAGO account and requires an eligible Pro plan. The page shows the access state and offers View plans if your current plan is not eligible. I can’t verify your private plan from this chat.',
			hinglish: 'Auto Bet Pro DRAGO account verify karta hai aur eligible Pro plan maangta hai. Plan eligible na ho to page access status aur View plans dikhata hai. Main chat se aapka private plan verify nahi kar sakta.',
			hi: 'Auto Bet Pro आपके DRAGO account को verify करता है और eligible Pro plan माँगता है। Plan eligible न हो तो page access status और View plans दिखाता है। मैं chat से आपका private plan verify नहीं कर सकता।'
		},
		action: 'autoBet'
	},
	{
		id: 'auto-bet-safety',
		triggers: ['auto bet safe', 'auto bet risk', 'auto bet stop', 'how to stop auto bet', 'auto bet start', 'auto bet loss', 'auto bet stake', 'auto bet real money', 'auto bet mein loss', 'auto bet ka risk', 'ऑटो बेट सुरक्षित', 'ऑटो बेट रोकें'],
		answers: {
			en: 'Auto Bet can interact with a real game and cannot guarantee a win. Check the game, current period, signal, balance, and stake before START; use STOP when you want it to stop. Never risk money you can’t afford to lose.',
			hinglish: 'Auto Bet real game ke saath interact kar sakta hai aur jeet guarantee nahi karta. START se pehle game, current period, signal, balance aur stake check karo; rokna ho to STOP dabao. Jitna lose afford na ho, utna risk mat lo.',
			hi: 'Auto Bet real game के साथ interact कर सकता है और जीत की guarantee नहीं देता। START से पहले game, current period, signal, balance और stake जाँचें; रोकने के लिए STOP दबाएँ। उतना risk न लें जितना खोना सहन न हो।'
		},
		action: 'autoBet'
	},
	{
		id: 'kiwi-safety',
		triggers: ['kiwi browser safe', 'kiwi browser archived', 'kiwi discontinued', 'kiwi no updates', 'kiwi security updates', 'kiwi browser warning', 'kiwi safe to use', 'kiwi browser बंद', 'कीवी browser सुरक्षित', 'kiwi archived'],
		answers: {
			en: 'The Auto Bet guide notes that Kiwi Browser is archived and no longer maintained. If you choose to use it, follow the guide’s official-source warning and download only from the official Kiwi release page; an unmaintained browser may carry security risks.',
			hinglish: 'Auto Bet guide mein note hai ki Kiwi Browser archived hai aur maintain nahi ho raha. Use karna choose karo to official-source warning follow karo aur sirf official Kiwi release se download karo; unmaintained browser mein security risk ho sakta hai.',
			hi: 'Auto Bet guide में बताया गया है कि Kiwi Browser archived है और maintained नहीं है। इस्तेमाल करना चुनें तो official-source warning मानें और केवल official Kiwi release से download करें; unmaintained browser में security risk हो सकता है।'
		},
		action: 'autoBet'
	},
	{
		id: 'game-guide',
		triggers: ['game guide', 'wingo guide', 'how to play wingo', 'how does wingo work', 'rules of wingo', 'game instructions', 'win go guide', 'गेम कैसे खेलें', 'विंगो गाइड', 'गेम के नियम'],
		answers: {
			en: 'The WinGo game guide explains the game screen and basic terms. Open it before playing, and remember that DRAGO predictions are not guaranteed outcomes.',
			hinglish: 'WinGo game guide mein game screen aur basic terms samjhaye gaye hain. Khelne se pehle guide dekh lo; DRAGO predictions guaranteed result nahi hain.',
			hi: 'WinGo game guide में game screen और basic terms समझाए गए हैं। खेलने से पहले guide देखें; DRAGO predictions guaranteed result नहीं हैं।'
		},
		action: 'guide'
	},
	{
		id: 'support-contact',
		triggers: ['contact support', 'drago support', 'support', 'help', 'support telegram', 'support link', 'talk to support', 'customer support', 'support se baat', 'help team contact', 'support kaise milega', 'मदद से संपर्क', 'support से बात', 'सपोर्ट से बात', 'सपोर्ट से संपर्क'],
		answers: {
			en: 'You can contact DRAGO Support on Telegram at t.me/xx_drago. Describe the page and issue, and include an approximate time or non-sensitive error code. Never send your password, OTP, UPI PIN, session token, or full API key.',
			hinglish: 'DRAGO Support se Telegram par t.me/xx_drago par contact kar sakte ho. Page, issue aur approx time ya non-sensitive error code batao. Password, OTP, UPI PIN, session token ya full API key kabhi mat bhejna.',
			hi: 'DRAGO Support से Telegram पर t.me/xx_drago के जरिए संपर्क करें। Page, समस्या और लगभग समय या non-sensitive error code बताएँ। Password, OTP, UPI PIN, session token या पूरी API key कभी न भेजें।'
		},
		action: 'support'
	},
	{
		id: 'report-issue',
		triggers: ['report a bug', 'report issue', 'something is wrong', 'send feedback', 'bug report', 'app issue report', 'error report', 'issue report kaise', 'bug kaise bataye', 'समस्या report', 'bug की शिकायत'],
		answers: {
			en: 'To report an issue, tell Support which page you were on, what you expected, what happened, and roughly when. A screenshot is fine if it hides private data. Don’t include passwords, OTPs, tokens, payment secrets, or API keys.',
			hinglish: 'Issue report karne ke liye Support ko page ka naam, aap kya expect kar rahe the, kya hua, aur approx time batao. Screenshot bhejo to private data hide karna. Password, OTP, token, payment secret ya API key mat bhejna.',
			hi: 'समस्या report करने के लिए Support को page का नाम, आप क्या expect कर रहे थे, क्या हुआ और लगभग समय बताएँ। Screenshot भेजें तो private data छिपाएँ। Password, OTP, token, payment secret या API key न भेजें।'
		},
		action: 'support'
	},
	{
		id: 'app-loading',
		triggers: ['app not loading', 'site not opening', 'blank screen', 'page is blank', 'app is slow', 'website not working', 'login page stuck', 'app error', 'app slow hai', 'page blank hai', 'app nahi chal raha', 'ऐप नहीं खुल रहा', 'खाली screen'],
		answers: {
			en: 'Check your internet, then refresh once. If only one feature fails, open Status and try that page again later. For persistent errors, contact Support with the page name and approximate time—never send login tokens or credentials.',
			hinglish: 'Internet check karke page ek baar refresh karo. Sirf ek feature fail ho to Status dekho aur thodi der baad try karo. Error rahe to page ka naam aur approx time Support ko batao—login token ya credentials mat bhejna.',
			hi: 'Internet जाँचकर page एक बार refresh करें। केवल एक feature fail हो तो Status देखें और थोड़ी देर बाद retry करें। Error बना रहे तो page का नाम और लगभग समय Support को बताएँ—login token या credentials न भेजें।'
		},
		action: 'status'
	},
	{
		id: 'wallet-balance',
		triggers: ['wallet balance', 'drago wallet', 'wallet address', 'wallet', 'balance', 'deposit', 'withdraw', 'deposit money', 'withdraw money', 'cash out', 'withdrawal', 'deposit in drago', 'balance in drago', 'wallet ka paisa', 'paisa withdraw', 'वॉलेट balance', 'पैसे निकालना', 'withdrawal कैसे'],
		answers: {
			en: 'DRAGO Predictor does not provide or claim to hold wallet balances or wallet addresses. Check balances and deposits only with the official game/payment provider. Never share a wallet seed phrase, UPI PIN, OTP, or password in chat.',
			hinglish: 'DRAGO Predictor wallet balance ya wallet address provide/hold karne ka claim nahi karta. Balance/deposit ke liye sirf official game/payment provider check karo. Wallet seed phrase, UPI PIN, OTP ya password chat mein kabhi share mat karo.',
			hi: 'DRAGO Predictor wallet balance या wallet address देने/रखने का दावा नहीं करता। Balance/deposit के लिए केवल official game/payment provider देखें। Wallet seed phrase, UPI PIN, OTP या password chat में कभी साझा न करें।'
		}
	},
	{
		id: 'preferences',
		triggers: ['app preferences', 'change settings', 'app settings', 'notification settings', 'preferences page', 'settings kaha', 'settings kaise badle', 'ऐप settings', 'प्राथमिकताएं'],
		answers: {
			en: 'Open Profile → Preferences to review the settings currently available for your account. I can’t change settings on your behalf from chat.',
			hinglish: 'Available account settings dekhne ke liye Profile → Preferences kholo. Main chat se aapke behalf par settings change nahi kar sakta.',
			hi: 'आपके account के उपलब्ध settings देखने के लिए Profile → Preferences खोलें। मैं chat से आपकी ओर से settings नहीं बदल सकता।'
		},
		action: 'profile'
	},
	{
		id: 'activity-history',
		triggers: ['daily activity', 'visit history', 'app activity', 'daily visits', 'dashboard activity', 'activity chart', 'activity data kaha', 'daily visits kaha', 'मेरी activity', 'दैनिक visits'],
		answers: {
			en: 'The Dashboard Activity card tracks page visits on this device from the time tracking starts. It is local device activity, not a record of game results or wallet transactions.',
			hinglish: 'Dashboard Activity card is device par tracking start hone ke baad page visits count karta hai. Ye local device activity hai—game results ya wallet transaction history nahi.',
			hi: 'Dashboard Activity card इस device पर tracking शुरू होने के बाद page visits गिनता है। यह local device activity है—game results या wallet transaction history नहीं।'
		},
			action: 'profile'
	},
	{
		id: 'prediction-limit',
		triggers: ['prediction limit', 'free prediction used', 'no predictions left', 'prediction quota', 'prediction count', '3 prediction limit', 'prediction khatam', 'free prediction nahi', 'prediction limit kya', 'prediction खत्म', 'तीन prediction'],
		answers: {
			en: 'Free/Basic access is shown with 3 normal predictions. Pro VIP lists unlimited predictions. Check Profile → Plan & benefits for your account’s current access; the chat cannot change a plan.',
			hinglish: 'Free/Basic access mein 3 normal predictions listed hain; Pro VIP mein unlimited predictions. Apne account ka access Profile → Plan & benefits mein check karo. Chat se plan change nahi hota.',
			hi: 'Free/Basic access में 3 सामान्य predictions listed हैं; Pro VIP में unlimited predictions हैं। अपने account का access Profile → Plan & benefits में देखें। Chat से plan नहीं बदला जा सकता।'
		},
		action: 'plans'
	},
	{
		id: 'service-contact-hours',
		triggers: ['support hours', 'support available 24 7', '24x7 support', 'support open', 'when support reply', 'support timing', '24 hours support', 'support kab reply', 'क्या support 24 घंटे', 'support का समय'],
		answers: {
			en: 'The plan panel displays a 24×7 Support badge, but I can’t promise a specific reply time. Contact the DRAGO Support channel and include a concise description of your issue.',
			hinglish: 'Plan panel par 24×7 Support badge hai, lekin main exact reply time promise nahi kar sakta. DRAGO Support channel par issue ka short description bhejo.',
			hi: 'Plan panel पर 24×7 Support badge है, लेकिन मैं exact reply time का वादा नहीं कर सकता। DRAGO Support channel पर समस्या का संक्षिप्त विवरण भेजें।'
		},
		action: 'support'
	},
	{
		id: 'logout',
		triggers: ['how to logout', 'sign out', 'log out', 'logout account', 'logout kaise', 'sign out kaise', 'लॉगआउट कैसे', 'साइन आउट'],
		answers: {
			en: 'Open Profile and tap Logout. If you are on a shared device, sign out when finished and don’t save your credentials in the browser.',
			hinglish: 'Profile kholo aur Logout tap karo. Shared device use kar rahe ho to kaam ke baad sign out karo aur browser mein credentials save mat rakho.',
			hi: 'Profile खोलें और Logout tap करें। Shared device हो तो काम के बाद sign out करें और browser में credentials save न करें।'
		},
		action: 'profile'
	}
];

function normalizeText(value) {
	return String(value || '')
		.normalize('NFKC')
		.toLocaleLowerCase('en-IN')
		.replace(/[_-]+/gu, ' ')
		.replace(/[^\p{L}\p{N}₹]+/gu, ' ')
		.replace(/\s+/gu, ' ')
		.trim();
}

function containsPhrase(question, phrase) {
	const needle = normalizeText(phrase);
	return Boolean(needle) && (` ${question} `).includes(` ${needle} `);
}

function chooseLanguage(question) {
	if (/[\u0900-\u097f]/u.test(question)) return 'hi';
	if (/(^|\s)(kaise|kya|kyu|kyon|hai|hain|hoon|hu|ho|karu|karo|kare|mujhe|mera|meri|aap|tum|batao|chahiye|nahi|nahin|mein|ka|ki|ke|ko|se|par|kahan|kitna|kitne|lu|lo|dekho|kholo|banao|namaste|namaskar|alvida|shukriya|dhanyavaad)(?=\s|$)/u.test(question)) {
		return 'hinglish';
	}
	return 'en';
}

export function detectNexusLanguage(message) {
	return chooseLanguage(normalizeText(message));
}

/** Match explicit requests for a live RX1 / WinGo signal, not general questions about the model. */
export function isLivePredictionRequest(message) {
	const question = normalizeText(message);
	if (!question) return false;

	const hasTopic = ['prediction', 'predictions', 'predict', 'signal', 'सिग्नल', 'संकेत', 'भविष्यवाणी', 'rx1', 'wingo', 'win go']
		.some((term) => containsPhrase(question, term));
	if (!hasTopic) return false;

	const timeCues = [
		'current', 'live', 'latest', 'now', 'right now', 'today', 'today s', 'next',
		'abhi', 'aaj', 'filhaal', 'filhal', 'is waqt', 'iss waqt',
		'अभी', 'आज', 'अगला', 'अगली', 'वर्तमान', 'ताज़ा', 'ताजा', 'इस समय'
	];
	if (timeCues.some((term) => containsPhrase(question, term))) return true;

	const directRequests = new Set(['prediction', 'predictions', 'signal', 'rx1 signal', 'rx1 prediction', 'win go prediction', 'wingo prediction']);
	if (directRequests.has(question)) return true;
	if (/^what(?: s| is)\s+(?:the\s+)?(?:current\s+|latest\s+|live\s+)?(?:prediction|signal)$/u.test(question)) return true;

	const asksHowToOrConcept = /(^|\s)(how|kaise|कैसे|what|meaning|explain|about|works|work|help|support|setup|steps|instructions)(?=\s|$)/u.test(question);
	if (asksHowToOrConcept) return false;

	const requestCues = [
		'show', 'show me', 'give', 'give me', 'tell me', 'get', 'fetch', 'check', 'send me', 'want', 'need',
		'mujhe', 'batao', 'bata', 'dikhao', 'dikhana', 'bhejo', 'de do', 'chahiye',
		'बताओ', 'बताइए', 'दिखाओ', 'दिखाइए', 'भेजो', 'दे दो', 'चाहिए'
	];
	return requestCues.some((term) => containsPhrase(question, term));
}

function isGreeting(question) {
	if (['good morning', 'good afternoon', 'good evening'].includes(question)) return true;
	const words = question.split(' ').filter(Boolean);
	if (!words.length || words.length > 7) return false;
	const openers = new Set(['hi', 'hii', 'hiii', 'hello', 'helloo', 'hey', 'heyy', 'heyyy', 'namaste', 'namaskar', 'salaam', 'सलाम', 'नमस्ते', 'नमस्कार']);
	if (!openers.has(words[0])) return false;
	const allowedAfter = new Set(['there', 'nexus', 'drago', 'predictor', 'agent', 'please', 'pls', '🙏', '👋']);
	return words.slice(1).every((word) => allowedAfter.has(word));
}

function scoreFaq(question, faq) {
	const matched = faq.triggers.filter((trigger) => containsPhrase(question, trigger));
	if (!matched.length) return 0;
	const longest = Math.max(...matched.map((trigger) => {
		const normalized = normalizeText(trigger);
		const words = normalized.split(' ').length;
		return words * 1.35 + Math.min(normalized.length, 64) / 80;
	}));
	return longest + (faq.boost || 0);
}

/** Return a localized built-in answer, or null so the caller can use AI fallback. */
export function getLocalNexusAnswer(message) {
	const question = normalizeText(message);
	if (!question) return null;

	const language = chooseLanguage(question);
	if (isGreeting(question)) {
		const greetings = {
			en: 'Hello 👋 I am NEXUS DRAGO PREDICTOR Agent. How can I help you?',
			hinglish: 'Hello 👋 Main NEXUS DRAGO PREDICTOR Agent hoon. Main aapki kaise help kar sakta hoon?',
			hi: 'Hello 👋 मैं NEXUS DRAGO PREDICTOR Agent हूँ। मैं आपकी कैसे मदद कर सकता हूँ?'
		};
		return { id: 'greeting', reply: greetings[language], source: 'local', language };
	}

	let bestFaq = null;
	let bestScore = 0;
	for (const faq of FAQS) {
		const score = scoreFaq(question, faq);
		if (score > bestScore) {
			bestFaq = faq;
			bestScore = score;
		}
	}

	if (!bestFaq) return null;
	const result = { id: bestFaq.id, reply: bestFaq.answers[language], source: 'local' };
	if (bestFaq.action && ACTIONS[bestFaq.action]) {
		const action = ACTIONS[bestFaq.action];
		result.action = { href: action.href, label: action.labels[language] };
	}
	if (bestFaq.guide) {
		result.guide = bestFaq.guide;
		result.language = language;
	}
	return result;
}

export const localNexusFaqCount = FAQS.length;
