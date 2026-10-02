// ==UserScript==
// @name         AutoBet Pro v6 (Drago)
// @namespace    http://tampermonkey.net/
// @version      7.0.0
// @description  WinGo 30s auto-bet widget for games opened inside DRAGO Gameplay. Requires an eligible DRAGO Pro plan.
// @downloadURL  https://dragotest.vercel.app/autobet-pro.user.js
// @updateURL    https://dragotest.vercel.app/autobet-pro.user.js
// @match        https://*/*
// @exclude      https://dragotest.vercel.app/*
// @exclude      https://dragopredictor.vercel.app/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
/* Adapted from xxdragomod/Auto-bet; UI/engine runs inside the embedded game only. */
(function () {
  'use strict';

  // The userscript may be installed on any HTTPS site because game hosts vary,
  // but it must never run outside a game iframe opened by an approved DRAGO app.
  const APP_ORIGINS = new Set([
    'https://dragotest.vercel.app',
    'https://dragopredictor.vercel.app'
  ]);
  function getTrustedAppParentOrigin() {
    if (window.parent === window) return '';
    try {
      const origins = window.location.ancestorOrigins;
      if (origins && origins.length && APP_ORIGINS.has(origins[0])) return origins[0];
    } catch (e) {}
    try {
      const referrerOrigin = new URL(document.referrer).origin;
      if (APP_ORIGINS.has(referrerOrigin)) return referrerOrigin;
    } catch (e) {}
    return '';
  }
  const appParentOrigin = getTrustedAppParentOrigin();
  if (!appParentOrigin) return;

  function createBridgeNonce() {
    try {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }
  const bridgeNonce = createBridgeNonce();
  const _pc = 37, _hc = 35;
  const PC = String.fromCharCode(_pc);
  const HC = String.fromCharCode(_hc);
  function HX(h){ return HC + h; }
  function mod30(x){ return x - 30 * Math.floor(x / 30); }

  // ═══════════════════════════════════════════════════════════
  //  USER ID (PERSISTENCE)
  // ═══════════════════════════════════════════════════════════
  let abpUserId = localStorage.getItem('abp_user_id');
  if (!abpUserId) {
    abpUserId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    localStorage.setItem('abp_user_id', abpUserId);
  }

  // ═══════════════════════════════════════════════════════════
  //  STATE
  // ═══════════════════════════════════════════════════════════
  let isRunning           = false;
  let executionTimeout    = null;
  let completedCycles     = 0;

  let betAmount           = 1;
  let effectiveBetAmount  = 1;
  let targetProfit        = 500;

  let currentChoice       = 'Big';
  let lastBetCycleNumber  = -1;
  let isExecutingSequence = false;
  let activeTab           = 'predict';

  // User-selected martingale levels (balance inhi me divide hota hai)
  let maxLevelUser = parseInt(localStorage.getItem('abp_max_level') || '9', 10);
  if (!(maxLevelUser >= 1 && maxLevelUser <= 9)) maxLevelUser = 9;
  let shadow              = null;

  // Prediction state
  let latestPrediction    = null;
  let predFetchInterval   = null;

  // Auth state (ab API key nahi — app page se PRO card aata hai)
  let keyState   = 'none'; // none | checking | ok | bad | nopro | err
  let keyMessage = '';

  // History / Win-Loss state
  let historyRows         = [];
  let totalWins           = 0;
  let totalLosses         = 0;
  let netPnL              = 0;
  let pendingBets         = [];

  function getLogicalDate() {
    const d = new Date();
    if (d.getHours() < 1) d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  let lastResetDate = getLogicalDate();

  // ═══════════════════════════════════════════════════════════
  //  SELECTORS & HELPERS
  // ═══════════════════════════════════════════════════════════
  const BIG_SEL       = "body > div > div.winGo3 > div.Betting__C > div.Betting__C-foot > div.Betting__C-foot-b";
  const SMALL_SEL     = "body > div > div.winGo3 > div.Betting__C > div.Betting__C-foot > div.Betting__C-foot-s";
  const CONFIRM_BIG   = "body.van-overflow-hidden > div > div.winGo3 > div.van-popup.van-popup--round.van-popup--bottom > div.lottery-container > div.footer > button.van-button.van-button--default.van-button--normal.bet-amount.n_big";
  const CONFIRM_SMALL = "body.van-overflow-hidden > div > div.winGo3 > div.van-popup.van-popup--round.van-popup--bottom > div.lottery-container > div.footer > button.van-button.van-button--default.van-button--normal.bet-amount.n_small";

  function sGet(id) {
    return shadow ? shadow.getElementById(id) : null;
  }

  function getSTEPS() {
    return [
      { id:"s1", name:"Click "+currentChoice,  type:"click", selector: currentChoice==='Big'?BIG_SEL:SMALL_SEL, repeatCount:1, delayBetweenClicksMs:100, delayAfterMs:500 },
      { id:"s2", name:"Fill Amount",            type:"input", selector: "body.van-overflow-hidden > div > div.winGo3 > div.van-popup.van-popup--round.van-popup--bottom > div.lottery-container > div.content > div.multiplier-section > div.section-header > div.m > input", delayAfterMs:300 },
      { id:"s3", name:"Confirm "+currentChoice, type:"click", selector: currentChoice==='Big'?CONFIRM_BIG:CONFIRM_SMALL, repeatCount:1, delayBetweenClicksMs:100, delayAfterMs:400 }
    ];
  }
  let STEPS = getSTEPS();

  function log(msg) {
    console.log('[AutoBet Pro] ' + msg);
    const el = sGet('abp-status-text');
    if (el) el.textContent = msg;
  }

  function numberToBigSmall(num) {
    const n = parseInt(num, 10);
    if (isNaN(n)) return null;
    return n >= 5 ? 'Big' : 'Small';
  }

  function getPagePeriod() {
    try {
      const el = document.querySelector(HX('copy-btn')) ||
                 document.querySelector('body > div > div.winGo3 > div.TimeLeft__C > div.TimeLeft__C-id');
      if (el) return (el.textContent || el.innerText || '').trim();
    } catch(e) {}
    return null;
  }

  function readBalance() {
    const sels = [
      'body > div > div.winGo3 > div.lottery-info.padding > div > div.Wallet__C > div.Wallet__C-balance',
      '.Wallet__C-balance', '[class*="Wallet__C-balance"]'
    ];
    for (const sel of sels) {
      try {
        const el = document.querySelector(sel);
        if (el) {
          const n = parseFloat((el.innerText||el.textContent||'').replace(/[^0-9.]/g,''));
          if (!isNaN(n)) return n;
        }
      } catch(e) {}
    }
    return null;
  }

  function checkBalanceGuard(requiredAmount) {
    const bal = readBalance();
    if (bal === null) {
      stop();
      log('🛑 Wallet balance unavailable — Auto Bet stopped for safety');
      return false;
    }
    if (bal < requiredAmount) {
      stop();
      log('🛑 Low Balance! Wallet ₹' + bal.toFixed(2) + ' < Bet ₹' + requiredAmount + ' — Auto Bet OFF');
      return false;
    }
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  //  LOCAL STATS (localStorage)
  // ═══════════════════════════════════════════════════════════
  function saveState() {
    try {
      localStorage.setItem('abp_stats_' + abpUserId, JSON.stringify({
        totalWins, totalLosses, netPnL, historyRows, lastResetDate, targetProfit
      }));
    } catch(e) {}
  }

  function loadState(callback) {
    try {
      const raw  = localStorage.getItem('abp_stats_' + abpUserId);
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        totalWins     = data.totalWins || 0;
        totalLosses   = data.totalLosses || 0;
        netPnL        = data.netPnL || 0;
        historyRows   = Array.isArray(data.historyRows) ? data.historyRows.slice(0, 30) : [];
        lastResetDate = data.lastResetDate || getLogicalDate();
        if (data.targetProfit) targetProfit = data.targetProfit;
        if (sGet('abp-target-input')) sGet('abp-target-input').value = targetProfit;
      }
    } catch(e) {}
    checkAutoReset();
    if (activeTab === 'history') renderHistoryTab();
    if (activeTab === 'predict') renderPredictTab();
    if (callback) callback();
  }

  function checkAutoReset() {
    const currentLogicalDate = getLogicalDate();
    if (lastResetDate !== currentLogicalDate) {
      log('🕒 1:00 AM Reset: naya din, naya stats!');
      totalWins = 0; totalLosses = 0; netPnL = 0; historyRows = [];
      lastResetDate = currentLogicalDate;
      saveState();
      if(activeTab === 'history') renderHistoryTab();
      if(activeTab === 'predict') renderPredictTab();
    }
  }
  setInterval(checkAutoReset, 60000);

  // ═══════════════════════════════════════════════════════════
  //  PREDICTION SOURCE: DRAGO GAMEPLAY PAGE (bridge)
  //  Widget me NA server URL hai NA key — app page "hello" ka
  //  jawab "card" (PRO status) aur "pred" (prediction) bhejta hai.
  // ═══════════════════════════════════════════════════════════
  let helloTimer = null;

  let bridgeCardAt = 0;

  function bridgeHello() {
    try {
      if (window.parent && window.parent !== window && appParentOrigin) {
        window.parent.postMessage({ drago: 'hello', v: 7, nonce: bridgeNonce }, appParentOrigin);
      }
    } catch (e) {}
  }

  window.addEventListener('message', function (e) {
    const d = e.data;
    if (e.source !== window.parent || e.origin !== appParentOrigin) return;
    if (!d || typeof d !== 'object' || d.nonce !== bridgeNonce) return;

    if (d.drago === 'card') {
      bridgeCardAt = Date.now();
      if (d.active === true) {
        const first = keyState !== 'ok';
        keyState = 'ok';
        keyMessage = '';
        renderKeyStatus();
        if (first) {
          log('✅ DRAGO Auto Bet Pro verified');
          unlockUI();
          startPredictionPolling();
        }
      } else {
        if (isRunning) stop();
        keyState = 'nopro';
        keyMessage = 'Eligible DRAGO Pro plan required';
        renderKeyStatus();
        showGate();
      }
      return;
    }

    if (d.drago === 'pred') {
      if (keyState !== 'ok') return;
      const signal = String(d.p || '').trim().toUpperCase();
      if (signal !== 'BIG' && signal !== 'SMALL') {
        latestPrediction = null;
        if (activeTab === 'predict') renderPredictTab();
        return;
      }
      latestPrediction = {
        prediction: signal === 'BIG' ? 'Big' : 'Small',
        confidence: d.conf != null ? d.conf : null,
        level: d.lv || 1,
        maxLevelToday: d.ml || 1,
        period: d.per != null ? String(d.per) : null,
        trend: d.tr || null,
        playTime: d.pt || 'N/A',
        raw: d
      };
      if (activeTab === 'predict') renderPredictTab();
    }
  });

  // If the app stops refreshing the verified card, halt automation fail-closed.
  setInterval(function () {
    if (keyState === 'ok' && bridgeCardAt && Date.now() - bridgeCardAt > 65000) {
      if (isRunning) stop();
      keyState = 'checking';
      keyMessage = 'Waiting for a fresh DRAGO access check';
      showGate();
      renderKeyStatus();
      bridgeHello();
    }
  }, 5000);

  function fetchPrediction(onDone) {
    if (keyState !== 'ok') { if (onDone) onDone(null); return; }
    if (latestPrediction && activeTab === 'predict') renderPredictTab();
    if (onDone) onDone(latestPrediction);
  }

  function startPredictionPolling() {
    if (keyState !== 'ok') return;
    bridgeHello();
    if (predFetchInterval) clearInterval(predFetchInterval);
    // handshake fresh rakho — page prediction khud push karta hai
    predFetchInterval = setInterval(function () { if (keyState === 'ok') bridgeHello(); }, 20000);
  }

    function renderKeyStatus() {
    const els = [sGet('abp-key-status'), sGet('abp-gate-status')].filter(Boolean);
    if (!els.length) return;
    let txt, col;
    if (keyState === 'ok')            { txt = '✅ PRO verified — predictions ON'; col = '#15803d'; }
    else if (keyState === 'checking') { txt = '⏳ App page se verify ho raha hai...'; col = '#8a6d3b'; }
    else if (keyState === 'bad')      { txt = '❌ ' + (keyMessage || 'Verification failed'); col = '#dc2626'; }
    else if (keyState === 'nopro')    { txt = '❌ ' + (keyMessage || 'Pro plan required'); col = '#dc2626'; }
    else if (keyState === 'err')      { txt = '⚠️ ' + (keyMessage || 'App page respond nahi kar raha'); col = '#b45309'; }
    else                              { txt = '🔐 App me PRO login hona chahiye'; col = '#8a6d3b'; }
    els.forEach(function (el) { el.textContent = txt; el.style.color = col; });
  }

  function showGate() {
    const g = sGet('abp-gate'); const m = sGet('abp-main'); const w = sGet('abp-widget');
    if (g) g.style.setProperty('display', 'flex', 'important');
    if (m) m.style.setProperty('display', 'none', 'important');
    if (w) { w.classList.remove('expanded'); w.classList.remove('compact'); }
  }

  function unlockUI() {
    const g = sGet('abp-gate'); const m = sGet('abp-main'); const w = sGet('abp-widget');
    if (g) g.style.setProperty('display', 'none', 'important');
    if (m) m.style.setProperty('display', 'flex', 'important');
    if (w) { w.classList.add('unlocked'); if (!w.classList.contains('compact-touched')) setCompact(true); }
  }

  function setCompact(on) {
    const w = sGet('abp-widget'); const m = sGet('abp-main'); const b = sGet('abp-expand');
    if (!w) return;
    w.classList.toggle('compact', !!on);
    w.classList.toggle('expanded', !on);
    if (m) m.style.setProperty('display', on ? 'none' : 'flex', 'important');
    if (b) b.title = on ? 'Expand' : 'Collapse';
  }

function retryCheck() {
    keyState = 'checking';
    renderKeyStatus();
    bridgeHello();
  }

  // ═══════════════════════════════════════════════════════════
  //  HISTORY CHECK RESULTS
  // ═══════════════════════════════════════════════════════════
  function fetchHistoryAndCheckResults() {
    if (pendingBets.length === 0) return;
    fetch('https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json')
      .then(r => r.json())
      .then(data => {
        if (!data || !data.data || !data.data.list) return;
        const list = data.data.list;
        let changed = false;

        pendingBets = pendingBets.filter(pending => {
          const pendingLast4 = String(pending.period).replace(/\D/g, '').slice(-4);
          const found = list.find(item => {
             const itemLast4 = String(item.issueNumber).replace(/\D/g, '').slice(-4);
             return itemLast4 === pendingLast4;
          });
          if (!found) return true;

          const actualResult = numberToBigSmall(found.number);
          const isWin = actualResult === pending.pick;

          if (isWin) { totalWins++;  netPnL += pending.betAmt; }
          else       { totalLosses++; netPnL -= pending.betAmt; }

          historyRows.unshift({
            period  : pending.period,
            ourPick : pending.pick,
            actual  : actualResult,
            number  : found.number,
            isWin   : isWin,
            betAmt  : pending.betAmt,
            pnl     : isWin ? '+₹'+pending.betAmt : '-₹'+pending.betAmt
          });
          if (historyRows.length > 30) historyRows.pop();

          log(isWin ? '✅ WIN! Period '+pending.period : '❌ LOSS! Period '+pending.period);
          changed = true;
          return false;
        });

        if (changed) {
          saveState();
          if (activeTab === 'history') renderHistoryTab();
          if (activeTab === 'predict') renderPredictTab();

          if (isRunning && targetProfit > 0 && netPnL >= targetProfit) {
            stop();
            log('🎯 Target Reached! (Profit: ₹' + netPnL + ') Bot stopped.');
            alert('🎉 Congratulations! Target Profit (₹' + targetProfit + ') pura ho gaya!');
          }
        }
      })
      .catch(() => {});
  }
  setInterval(fetchHistoryAndCheckResults, 10000);

  // ═══════════════════════════════════════════════════════════
  //  STRICT PERIOD MATCH & SMART POLLING BET
  // ═══════════════════════════════════════════════════════════
  let periodMatchRetryTimer = null;
  let currentCyclePeriod    = null;

  function cancelPeriodMatchRetry() {
    if (periodMatchRetryTimer) {
      clearTimeout(periodMatchRetryTimer);
      periodMatchRetryTimer = null;
    }
  }

  function fetchPredictionAndBet() {
    if (!isRunning) { isExecutingSequence = false; cancelPeriodMatchRetry(); return; }

    const left = 30 - mod30(new Date().getSeconds());

    if (left <= 8) {
      log('⏳ Red Zone! Bet skipped (server late tha).');
      isExecutingSequence = false;
      cancelPeriodMatchRetry();
      return;
    }

    const pagePeriod = getPagePeriod();

    if (!currentCyclePeriod && pagePeriod) {
      currentCyclePeriod = String(pagePeriod).replace(/\D/g, '');
    }

    if (!pagePeriod) {
      log('🔄 Page period nahi mila, retry...');
      periodMatchRetryTimer = setTimeout(() => fetchPredictionAndBet(), 500);
      return;
    }

    fetchPrediction(data => {
      if (!isRunning) { isExecutingSequence = false; cancelPeriodMatchRetry(); return; }

      if (!data) {
        log('⚠️ ' + (keyMessage || 'Prediction server error') + ' — retry...');
        periodMatchRetryTimer = setTimeout(() => fetchPredictionAndBet(), 600);
        return;
      }

      const leftNow = 30 - mod30(new Date().getSeconds());
      if (leftNow <= 8) {
        log('⏳ Red Zone (fetch ke baad)! Bet skipped.');
        isExecutingSequence = false;
        cancelPeriodMatchRetry();
        return;
      }

      const apiPeriod = data.period ? String(data.period).trim() : null;

      if (!apiPeriod) {
        log('🔄 Server period empty, retry...');
        periodMatchRetryTimer = setTimeout(() => fetchPredictionAndBet(), 500);
        return;
      }

      const pageStr = String(pagePeriod).trim();

      if (apiPeriod !== pageStr) {
        const leftCheck = 30 - mod30(new Date().getSeconds());
        if (leftCheck <= 8) {
          log('⛔ Red Zone — period match nahi hua, bet skip!');
          isExecutingSequence = false;
          cancelPeriodMatchRetry();
          return;
        }
        log('⏳ Mismatch — Page: ' + pageStr + ' | Server: ' + apiPeriod + ' | Waiting...');
        periodMatchRetryTimer = setTimeout(() => fetchPredictionAndBet(), 500);
        return;
      }

      cancelPeriodMatchRetry();
      currentCyclePeriod = null;

      const pred = (data.prediction || '').toUpperCase();
      currentChoice = pred === 'BIG' ? 'Big' : 'Small';
      const level = data.level || 1;

      effectiveBetAmount = betAmount * Math.pow(2, Math.min(level, maxLevelUser) - 1);

      if (!checkBalanceGuard(effectiveBetAmount)) { isExecutingSequence = false; return; }

      pendingBets.push({ period: pagePeriod, pick: currentChoice, betAmt: effectiveBetAmount });
      STEPS = getSTEPS();
      log('✅ Match! 🎯 ' + currentChoice + ' | Lv' + Math.min(level, maxLevelUser) + ' | ₹' + effectiveBetAmount + ' | Period: ' + pageStr);
      executeStep(0);
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  FIXED CYCLE TRIGGER — no randomized/stealth timing
  // ═══════════════════════════════════════════════════════════
  let scheduledTriggerAt    = null;
  let triggerFiredThisCycle = false;

  function pickRandomTriggerSecond() {
    return 20; // check at 20 seconds remaining; skip late/red-zone bets
  }

  function updateTimer() {
    const left    = 30 - mod30(new Date().getSeconds());
    const timerEl = sGet('abp-timer');
    if (timerEl) {
      const sec = left < 10 ? '0'+left : ''+left;
      timerEl.textContent = '00:' + sec;
      timerEl.style.color = left <= 5 ? HX('dc2626') : HX('1f2937');
    }

    if (left === 30) {
      lastBetCycleNumber    = -1;
      currentCyclePeriod    = null;
      triggerFiredThisCycle = false;
      cancelPeriodMatchRetry();

      scheduledTriggerAt = pickRandomTriggerSecond();
      log('⏱ Next bet check at: ' + scheduledTriggerAt + 's remaining');
    }

    if (
      isRunning &&
      scheduledTriggerAt !== null &&
      left === scheduledTriggerAt &&
      !triggerFiredThisCycle &&
      !isExecutingSequence
    ) {
      triggerFiredThisCycle = true;
      lastBetCycleNumber    = 1;
      isExecutingSequence   = true;
      currentCyclePeriod    = null;
      log('🔮 Bet trigger at ' + scheduledTriggerAt + 's remaining — period match check...');
      fetchPredictionAndBet();
    }
  }
  setInterval(updateTimer, 100);

  // ═══════════════════════════════════════════════════════════
  //  CLICK SIMULATOR
  // ═══════════════════════════════════════════════════════════
  function triggerFullClick(el) {
    if (!el) return;
    try { el.focus(); } catch(e) {}
    ['pointerdown','mousedown','pointerup','mouseup','click'].forEach(ev => {
      try { el.dispatchEvent(new (ev.indexOf('pointer')===0?PointerEvent:MouseEvent)(ev,{bubbles:true,cancelable:true,composed:true,view:window})); } catch(e) {}
    });
    try { el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true})); el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true})); } catch(e) {}
  }

  function findEl(sel) {
    try { const e=document.querySelector(sel); if(e) return e; } catch(e) {}
    if (sel.indexOf('Betting__C-foot-b')!==-1)  return document.querySelector('.Betting__C-foot-b,[class*="Big"]');
    if (sel.indexOf('Betting__C-foot-s')!==-1)  return document.querySelector('.Betting__C-foot-s,[class*="Small"]');
    if (sel.indexOf('bet-amount')!==-1)         return document.querySelector('button.bet-amount,.van-popup .footer button');
    if (sel.indexOf('multiplier-section')!==-1) return document.querySelector('.van-popup input[type="number"],.van-popup input');
    return null;
  }

  function executeStep(index) {
    if (!isRunning) { isExecutingSequence=false; return; }
    const left = 30-mod30(new Date().getSeconds());
    if (left<=5) { log('⛔ Red Zone – stopped!'); isExecutingSequence=false; return; }
    if (index>=STEPS.length) {
      completedCycles++;
      log('✅ Bet placed! Cycle #'+completedCycles);
      isExecutingSequence=false;
      return;
    }
    const step=STEPS[index];
    const el=findEl(step.selector);
    if (!el) { executionTimeout=setTimeout(()=>executeStep(index),200); return; }

    if (step.type==='input') {
      try {
        el.focus();
        const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
        if(setter) setter.call(el,String(effectiveBetAmount)); else el.value=String(effectiveBetAmount);
        ['input','change','blur'].forEach(ev=>el.dispatchEvent(new Event(ev,{bubbles:true})));
        executionTimeout=setTimeout(()=>executeStep(index+1),Math.max(50,step.delayAfterMs||300));
      } catch(err){log('❌ '+err.message);stop();}
      return;
    }

    let done=0; const total=Math.max(1,step.repeatCount||1);
    function doClick(){
      if(!isRunning)return;
      const t=findEl(step.selector);
      if(!t){executionTimeout=setTimeout(()=>executeStep(index+1),300);return;}
      t.style.outline='2px solid rgba(167,139,250,0.9)';
      setTimeout(()=>{if(t)t.style.outline='';},160);
      triggerFullClick(t); done++;
      if(done<total) executionTimeout=setTimeout(doClick,Math.max(20,step.delayBetweenClicksMs||100));
      else executionTimeout=setTimeout(()=>executeStep(index+1),Math.max(50,step.delayAfterMs||300));
    }
    doClick();
  }

  // ═══════════════════════════════════════════════════════════
  //  START / STOP (9-LEVEL CHECKER)
  // ═══════════════════════════════════════════════════════════
  function start() {
    if(isRunning) return;

    if (keyState !== 'ok') {
      retryCheck();
      log('🔐 App ke gameplay page me PRO login chahiye — widget wahin se verify hota hai.');
      return;
    }

    if (targetProfit > 0 && netPnL >= targetProfit) {
      log('🎯 Target already reached! Target badhayein ya History reset karein.');
      alert('Aapka Target pura ho chuka hai, chalu rakhne ke liye Target badhayein ya History reset karein.');
      return;
    }

    const bal = readBalance();
    if (bal === null) {
      log('⏳ Balance fetch ho raha hai, wait karein...');
      return;
    }

    const need = Math.pow(2, maxLevelUser) - 1;
    if (bal < need) {
      log('🛑 ' + maxLevelUser + ' level ke liye minimum ₹' + need + ' chahiye.');
      alert('Amount abhi pura nahi hai, ' + maxLevelUser + ' level maintain karne ke liye wallet me kam se kam ₹' + need + ' hone chahiye.');
      return;
    }

    betAmount = Math.floor(bal / need);

    if (!window.confirm('Auto Bet will place real bets using the game wallet. Losses are possible and DRAGO does not control the game balance. Start Auto Bet?')) {
      log('⏸ Start cancelled');
      return;
    }

    if (scheduledTriggerAt === null) {
      scheduledTriggerAt    = pickRandomTriggerSecond();
      triggerFiredThisCycle = false;
      log('⏱ First bet check at: ' + scheduledTriggerAt + 's remaining');
    }

    isRunning = true;
    updateToggleBtn();
    log('🟢 Auto Bet Active! Base Bet: ₹' + betAmount);
  }

  function stop() {
    isRunning              = false;
    isExecutingSequence    = false;
    scheduledTriggerAt     = null;
    triggerFiredThisCycle  = false;
    if(executionTimeout) clearTimeout(executionTimeout);
    cancelPeriodMatchRetry();
    currentCyclePeriod    = null;
    updateToggleBtn();
    log('⏹ Stopped');
  }

  // ═══════════════════════════════════════════════════════════
  //  UI RENDERING
  // ═══════════════════════════════════════════════════════════
  function renderPredictTab() {
    if (latestPrediction) {
      const p     = latestPrediction;
      const isBig = (p.prediction||'').toUpperCase()==='BIG';

      if(sGet('abp-pred-value')){
        const pct = p.confidence ? (p.confidence > 1 ? Math.round(p.confidence) : Math.round(p.confidence*100)) : 60;
        sGet('abp-pred-value').textContent = (isBig ? 'BIG' : 'SMALL') + ' ' + pct + PC;
        sGet('abp-pred-value').style.color = isBig ? HX('4338ca') : HX('db2777');
        const cp = sGet('abp-c-pred');
        if (cp) cp.textContent = (isBig ? 'BIG' : 'SMALL') + ' ' + pct + PC;
        const cper = sGet('abp-c-period');
        if (cper) cper.textContent = p.period || '---';
      }

      if(sGet('abp-pred-period')) sGet('abp-pred-period').textContent = p.period || '---';
      if(sGet('abp-pred-level-badge')) sGet('abp-pred-level-badge').textContent = 'Lv ' + (p.level || 1);
      if(sGet('abp-pred-max-badge'))   sGet('abp-pred-max-badge').textContent   = 'MAX Lv ' + (p.maxLevelToday || 1);

      if(sGet('abp-pred-playtime')) sGet('abp-pred-playtime').textContent = p.playTime || 'N/A';
    }

    const tot = totalWins + totalLosses;
    if(sGet('abp-stat-total'))  sGet('abp-stat-total').textContent  = tot;
    if(sGet('abp-stat-wins'))   sGet('abp-stat-wins').textContent   = totalWins;
    if(sGet('abp-stat-losses')) sGet('abp-stat-losses').textContent = totalLosses;
    if(sGet('abp-stat-pnl')){
      const sign = netPnL >= 0 ? '₹' : '-₹';
      sGet('abp-stat-pnl').textContent = sign + Math.abs(netPnL).toFixed(0);
      sGet('abp-stat-pnl').style.color = netPnL >= 0 ? HX('15803d') : HX('dc2626');
    }
  }

  function renderHistoryTab() {
    const total = totalWins + totalLosses;

    if(sGet('abp-hist-total'))  sGet('abp-hist-total').textContent  = total;
    if(sGet('abp-hist-wins'))   sGet('abp-hist-wins').textContent   = totalWins;
    if(sGet('abp-hist-losses')) sGet('abp-hist-losses').textContent = totalLosses;
    if(sGet('abp-hist-pnl')){
      const sign = netPnL >= 0 ? '₹' : '-₹';
      sGet('abp-hist-pnl').textContent = sign + Math.abs(netPnL).toFixed(2);
      sGet('abp-hist-pnl').style.color = netPnL >= 0 ? HX('15803d') : HX('dc2626');
    }

    const list = sGet('abp-history-list');
    if(!list) return;
    if(historyRows.length === 0){
      list.innerHTML = '<div style="text-align:center;padding:15px;color:' + HX('9ca3af') + ';font-size:11px;">No bets yet</div>';
      return;
    }
    list.innerHTML = '';
    historyRows.forEach(row => {
      const div = document.createElement('div');
      const period = document.createElement('span');
      const pick = document.createElement('span');
      const result = document.createElement('span');
      const won = !!(row && row.isWin);
      div.className = 'history-row';
      period.className = 'h-period';
      period.textContent = String(row && row.period != null ? row.period : '');
      pick.className = 'h-type';
      pick.textContent = String(row && row.ourPick != null ? row.ourPick : '').toUpperCase();
      result.className = won ? 'badge-win' : 'badge-loss';
      result.textContent = won ? 'WIN' : 'LOSS';
      div.append(period, pick, result);
      list.appendChild(div);
    });
  }

  function renderLevelChips() {
    const row = sGet('abp-lvl-row');
    if (!row) return;
    row.querySelectorAll('.lvl-chip').forEach(function (c) {
      c.classList.toggle('on', parseInt(c.getAttribute('data-lvl'), 10) === maxLevelUser);
    });
  }

  function updateToggleBtn() {
    const btn = sGet('abp-toggle');
    const dot = sGet('abp-status-dot');
    const pill = sGet('abp-live-pill');
    const ptxt = sGet('abp-live-text');
    if(isRunning){
      if(btn){ btn.innerHTML = '⏸ PAUSE'; btn.classList.add('running'); }
      if(dot){ dot.className = 'dot-indicator dot-on'; dot.title = 'Auto Bet ON'; }
      if(pill){ pill.classList.add('on'); }
      if(ptxt){ ptxt.textContent = 'LIVE'; }
    } else {
      if(btn){ btn.innerHTML = '► START'; btn.classList.remove('running'); }
      if(dot){ dot.className = 'dot-indicator dot-off'; dot.title = 'Auto Bet OFF'; }
      if(pill){ pill.classList.remove('on'); }
      if(ptxt){ ptxt.textContent = 'OFF'; }
    }
  }

  function updateBalanceDisplay() {
    const bal = readBalance();
    const el  = sGet('abp-balance');
    if(el) el.textContent = bal !== null ? '₹' + bal.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—';
    const cel = sGet('abp-c-balance');
    if(cel) cel.textContent = bal !== null ? '₹' + bal.toLocaleString('en-IN', {minimumFractionDigits: 2}) : '—';
  }

  // ═══════════════════════════════════════════════════════════
  //  DRAGGABLE
  // ═══════════════════════════════════════════════════════════
  function makeDraggable(el, handle, storeKey) {
    if(!el||!handle)return;
    // saved position restore (ball/box kahin bhi chhodo, wahi rahenge)
    if (storeKey) {
      try {
        const p = JSON.parse(localStorage.getItem(storeKey) || 'null');
        if (p && typeof p.l === 'number' && typeof p.t === 'number') {
          const maxL = Math.max(0, window.innerWidth - el.offsetWidth);
          const maxT = Math.max(0, window.innerHeight - el.offsetHeight);
          el.style.setProperty('position', 'fixed', 'important');
          el.style.setProperty('margin', '0', 'important');
          el.style.setProperty('left', Math.max(0, Math.min(maxL, p.l)) + 'px', 'important');
          el.style.setProperty('top',  Math.max(0, Math.min(maxT, p.t)) + 'px', 'important');
          el.style.setProperty('right',  'auto', 'important');
          el.style.setProperty('bottom', 'auto', 'important');
        }
      } catch (e) {}
    }
    function savePos() {
      if (!storeKey) return;
      try {
        const r = el.getBoundingClientRect();
        localStorage.setItem(storeKey, JSON.stringify({ l: Math.round(r.left), t: Math.round(r.top) }));
      } catch (e) {}
    }
    function skipTarget(t) {
      return !!(t && t.closest && t.closest('button,input,select,textarea,a,.history-list'));
    }
    // smooth drag: transform + requestAnimationFrame (layout thrash nahi)
    let startX=0, startY=0, elStartL=0, elStartT=0, pendX=0, pendY=0, raf=0;
    function applyFrame() {
      raf = 0;
      el.style.setProperty('transform', 'translate(' + pendX + 'px,' + pendY + 'px)', 'important');
    }
    function startDrag(cx, cy) {
      el._abpDragged = false;
      const rect = el.getBoundingClientRect();
      elStartL = rect.left; elStartT = rect.top;
      startX = cx; startY = cy; pendX = 0; pendY = 0;
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('margin', '0', 'important');
      el.style.setProperty('left',   elStartL + 'px', 'important');
      el.style.setProperty('top',    elStartT + 'px', 'important');
      el.style.setProperty('right',  'auto', 'important');
      el.style.setProperty('bottom', 'auto', 'important');
      el.style.setProperty('transform', 'translate(0,0)', 'important');
      el.style.setProperty('will-change', 'transform', 'important');
      el.classList.add('abp-dragging');
    }
    function doMove(cx, cy) {
      const dx = cx - startX, dy = cy - startY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) el._abpDragged = true;
      const maxL = Math.max(0, window.innerWidth - el.offsetWidth);
      const maxT = Math.max(0, window.innerHeight - el.offsetHeight);
      const nL = Math.max(0, Math.min(maxL, elStartL + dx));
      const nT = Math.max(0, Math.min(maxT, elStartT + dy));
      pendX = nL - elStartL; pendY = nT - elStartT;
      if (!raf) raf = (el.ownerDocument.defaultView || window).requestAnimationFrame(applyFrame);
    }
    function endDrag() {
      if (raf) { ((el.ownerDocument.defaultView || window).cancelAnimationFrame(raf)); raf = 0; }
      const nL = elStartL + pendX, nT = elStartT + pendY;
      el.style.setProperty('left', nL + 'px', 'important');
      el.style.setProperty('top',  nT + 'px', 'important');
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('will-change', 'auto', 'important');
      el.classList.remove('abp-dragging');
      savePos();
    }
    handle.addEventListener('mousedown', e => {
      if(skipTarget(e.target)) return;
      e.preventDefault(); startDrag(e.clientX, e.clientY);
      const up = () => { endDrag(); document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
      const mv = e2 => doMove(e2.clientX, e2.clientY);
      document.addEventListener('mousemove', mv);
      document.addEventListener('mouseup', up);
    });
    handle.addEventListener('touchstart', e => {
      if(skipTarget(e.target)) return;
      const t = e.touches[0]; startDrag(t.clientX, t.clientY);
      const up = () => { endDrag(); document.removeEventListener('touchmove', mv); document.removeEventListener('touchend', up); document.removeEventListener('touchcancel', up); };
      const mv = e2 => { if (e2.cancelable) e2.preventDefault(); const t2 = e2.touches[0]; if (t2) doMove(t2.clientX, t2.clientY); };
      document.addEventListener('touchmove', mv, {passive:false});
      document.addEventListener('touchend', up);
      document.addEventListener('touchcancel', up);
    }, {passive:false});
  }

  // ═══════════════════════════════════════════════════════════
  //  CREATE WIDGET
  // ═══════════════════════════════════════════════════════════
  function createWidget() {
    if (document.getElementById('abp-root-host')) return;

    if (!document.getElementById('abp-fonts')) {
      const fl = document.createElement('link');
      fl.id = 'abp-fonts';
      fl.rel = 'stylesheet';
      fl.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Lilita+One&display=swap';
      (document.head || document.documentElement).appendChild(fl);
    }

    const host = document.createElement('div');
    host.id = 'abp-root-host';
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
        style.textContent = `
      * { box-sizing: border-box !important; margin: 0 !important; padding: 0 !important; font-family: 'Lilita One','Luckiest Guy','Trebuchet MS',system-ui,sans-serif !important; font-style: normal !important; }
      #abp-widget-container { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 9999999 !important; display: flex !important; align-items: flex-start !important; justify-content: center !important; pointer-events: none !important; padding: 12px !important; padding-top: 35px !important; }
      #abp-widget { pointer-events: auto !important; width: min(228px, calc(100vw - 20px)) !important; max-height: 82vh !important; background: #fffaf2 !important; border-radius: 18px !important; border: 1.5px solid #e4d6bf !important; box-shadow: 0 14px 40px rgba(42,33,22,0.2), 0 3px 10px rgba(42,33,22,0.07) !important; padding: 0 !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; transition: width 0.22s cubic-bezier(0.22,1,0.36,1) !important; }
      #abp-widget.expanded { width: min(315px, 90vw) !important; max-height: 76vh !important; }
      .abp-header { display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 6px !important; cursor: move !important; user-select: none !important; padding: 8px 10px 7px !important; border-bottom: 1px solid #efe4d4 !important; background: linear-gradient(180deg, #fffaf2 0%, #faf3e8 100%) !important; flex-shrink: 0 !important; }
      .abp-title { font-family: 'Luckiest Guy', cursive !important; font-size: 14.5px !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #2a2116 !important; line-height: 1.15 !important; white-space: nowrap !important; }
      .dot-indicator { width: 7px !important; height: 7px !important; border-radius: 50% !important; display: inline-block !important; }
      .dot-off { background: #dc2626 !important; }
      .dot-on { background: #2ecc8f !important; animation: pulse 1.5s infinite !important; }
      @keyframes pulse { 0% { transform: scale(0.95); } 70% { transform: scale(1.15); } 100% { transform: scale(0.95); } }
      .ap-live-pill { display: inline-flex !important; align-items: center !important; gap: 4px !important; padding: 3px 7px !important; border-radius: 999px !important; background: rgba(42,33,22,0.05) !important; border: 1px solid #efe4d4 !important; font-size: 9px !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; color: rgba(42,33,22,0.55) !important; line-height: 1 !important; flex-shrink: 0 !important; }
      .ap-live-pill.on { background: rgba(46,204,143,0.12) !important; border-color: rgba(46,204,143,0.28) !important; color: #1a9a68 !important; }
      #abp-widget.compact .ap-live-pill { display: none !important; }
      #abp-head-btns { display: flex !important; gap: 6px !important; align-items: center !important; flex-shrink: 0 !important; }
      .abp-close-btn, .abp-exp-btn { background: #fff !important; color: #2a2116 !important; border: 1.5px solid #e4d6bf !important; border-radius: 10px !important; width: 26px !important; height: 26px !important; cursor: pointer !important; align-items: center !important; justify-content: center !important; padding: 0 !important; font-size: 14px !important; font-weight: 800 !important; box-shadow: 0 2px 8px rgba(60,40,15,0.06) !important; }
      .abp-close-btn { display: flex !important; }
      .abp-exp-btn { display: none !important; }
      #abp-widget.unlocked .abp-exp-btn { display: flex !important; }
      .abp-exp-btn svg { width: 14px !important; height: 14px !important; display: block !important; }
      #abp-gate { display: flex !important; flex-direction: column !important; gap: 7px !important; background: #fff !important; border: 1.5px solid #e4d6bf !important; border-radius: 14px !important; padding: 10px 10px !important; text-align: center !important; margin: 8px !important; }
      .g-icon { font-size: 20px !important; line-height: 1 !important; }
      .g-title { font-family: 'Luckiest Guy', cursive !important; font-size: 13px !important; color: #2a2116 !important; letter-spacing: 0.04em !important; }
      .g-sub { font-size: 8.5px !important; color: rgba(42,33,22,0.55) !important; font-weight: 700 !important; line-height: 1.25 !important; }
      #abp-main { display: none !important; flex-direction: column !important; gap: 8px !important; flex: 1 !important; overflow: hidden !important; padding: 10px !important; }
      .abp-nav { display: flex !important; gap: 4px !important; background: rgba(42,33,22,0.04) !important; padding: 3px !important; border-radius: 12px !important; border: 1px solid #efe4d4 !important; }
      .abp-nav-btn { flex: 1 !important; padding: 7px 0 !important; border: none !important; border-radius: 9px !important; font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.05em !important; color: rgba(42,33,22,0.55) !important; background: transparent !important; cursor: pointer !important; text-align: center !important; }
      .abp-nav-btn.active { background: linear-gradient(135deg, #2a2116 0%, #3d3225 100%) !important; color: #fffaf2 !important; box-shadow: 0 4px 12px rgba(42,33,22,0.28) !important; }
      .abp-tab { display: none !important; flex-direction: column !important; gap: 8px !important; flex: 1 !important; overflow: hidden !important; }
      .abp-tab.visible { display: flex !important; }
      .abp-period-row { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 0 2px !important; }
      .abp-label-sm { font-size: 9px !important; font-weight: 700 !important; color: rgba(42,33,22,0.42) !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; }
      .abp-period-val { font-family: 'Lilita One', cursive !important; font-size: 12px !important; color: #2a2116 !important; letter-spacing: 0.03em !important; }
      .abp-card { background: #fff !important; border-radius: 12px !important; padding: 10px 12px !important; border: 1.5px solid #e4d6bf !important; display: flex !important; flex-direction: column !important; gap: 4px !important; box-shadow: 0 3px 10px rgba(60,40,15,0.05) !important; }
      .abp-row-space { display: flex !important; justify-content: space-between !important; align-items: flex-end !important; }
      .val-pred { font-family: 'Luckiest Guy', cursive !important; font-size: 21px !important; color: #2a2116 !important; letter-spacing: 0.04em !important; text-transform: uppercase !important; margin-top: 1px !important; }
      .val-timer { font-family: 'Lilita One', cursive !important; font-size: 22px !important; color: #2a2116 !important; margin-top: 1px !important; }
      .abp-stats-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 2px !important; text-align: center !important; }
      .stat-v { font-family: 'Lilita One', cursive !important; font-size: 15px !important; color: #2a2116 !important; }
      .stat-l { font-size: 8px !important; font-weight: 700 !important; color: rgba(42,33,22,0.42) !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; margin-top: 1px !important; }
      .abp-flex-row { display: flex !important; justify-content: space-between !important; align-items: center !important; }
      .val-bold { font-family: 'Lilita One', cursive !important; font-size: 14px !important; color: #2a2116 !important; }
      .abp-input { background: #fff !important; border: 1.5px solid #e4d6bf !important; border-radius: 10px !important; padding: 8px 10px !important; font-size: 12px !important; font-weight: 700 !important; color: #2a2116 !important; width: 100% !important; outline: none !important; text-align: center !important; }
      .btn-gold { width: 100% !important; padding: 11px !important; border: none !important; border-radius: 12px !important; background: linear-gradient(135deg, #2a2116 0%, #3d3225 100%) !important; color: #fffaf2 !important; font-family: 'Luckiest Guy', cursive !important; font-size: 12px !important; letter-spacing: 0.05em !important; cursor: pointer !important; box-shadow: 0 4px 12px rgba(42,33,22,0.28) !important; }
      .abp-controls { display: flex !important; gap: 8px !important; margin-top: auto !important; }
      .btn-start { flex: 1 !important; height: 40px !important; background: linear-gradient(135deg, #2a2116 0%, #3d3225 100%) !important; color: #fffaf2 !important; border: none !important; border-radius: 12px !important; font-family: 'Luckiest Guy', cursive !important; font-size: 13px !important; letter-spacing: 0.05em !important; cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important; box-shadow: 0 4px 12px rgba(42,33,22,0.28) !important; }
      .btn-start.running { background: #fff !important; color: #2a2116 !important; border: 1.5px solid #e4d6bf !important; box-shadow: 0 2px 8px rgba(60,40,15,0.06) !important; }
      .btn-stop { width: 40px !important; height: 40px !important; background: #fff !important; border: 1.5px solid rgba(220,38,38,0.35) !important; border-radius: 12px !important; color: #b91c1c !important; font-size: 14px !important; cursor: pointer !important; }
      .hist-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
      .hist-card { background: #fff !important; border-radius: 12px !important; padding: 8px 10px !important; border: 1.5px solid #e4d6bf !important; }
      .hist-val { font-family: 'Lilita One', cursive !important; font-size: 15px !important; margin-top: 2px !important; color: #2a2116 !important; }
      .history-list { flex: 1 !important; overflow-y: auto !important; padding-right: 2px !important; }
      .history-row { display: flex !important; justify-content: space-between !important; align-items: center !important; padding: 6px 4px !important; border-bottom: 1px solid #efe4d4 !important; }
      .badge-win { background: rgba(46,204,143,0.14) !important; color: #1a9a68 !important; padding: 2px 7px !important; border-radius: 6px !important; font-size: 9px !important; font-weight: 800 !important; }
      .badge-loss { background: #fee2e2 !important; color: #dc2626 !important; padding: 2px 7px !important; border-radius: 6px !important; font-size: 9px !important; font-weight: 800 !important; }
      .btn-reset { width: 100% !important; padding: 9px !important; border: 1.5px solid #e4d6bf !important; background: #fff !important; color: #2a2116 !important; border-radius: 12px !important; font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.05em !important; cursor: pointer !important; }
      .setting-card { background: #fff !important; border-radius: 14px !important; padding: 10px 12px !important; border: 1.5px solid #e4d6bf !important; display: flex !important; flex-direction: column !important; gap: 8px !important; }
      #abp-compact { display: none !important; }
      #abp-widget.compact #abp-compact { display: flex !important; flex-direction: column !important; }
      .ap-body { display: flex !important; flex-direction: column !important; align-items: center !important; gap: 6px !important; padding: 8px 10px 10px !important; }
      .ap-period { width: 100% !important; text-align: center !important; padding: 5px 8px !important; border-radius: 10px !important; background: rgba(42,33,22,0.04) !important; border: 1px solid #efe4d4 !important; }
      .ap-period-val { font-family: 'Lilita One', cursive !important; font-size: 13px !important; color: #2a2116 !important; letter-spacing: 0.03em !important; word-break: break-all !important; line-height: 1.2 !important; margin-top: 2px !important; }
      .ap-signal { width: 100% !important; text-align: center !important; padding: 8px 10px 7px !important; border-radius: 12px !important; background: #fff !important; border: 1.5px solid #e4d6bf !important; box-shadow: 0 3px 10px rgba(60,40,15,0.05) !important; }
      .ap-signal-val { font-family: 'Luckiest Guy', cursive !important; font-size: 26px !important; letter-spacing: 0.06em !important; text-transform: uppercase !important; color: #2a2116 !important; line-height: 1 !important; margin-top: 3px !important; }
      .ap-amount { width: 100% !important; text-align: center !important; padding: 5px 8px !important; border-radius: 10px !important; background: rgba(42,33,22,0.04) !important; border: 1px solid #efe4d4 !important; }
      .ap-amount-val { font-family: 'Lilita One', cursive !important; font-size: 15px !important; color: #1a9a68 !important; line-height: 1.2 !important; margin-top: 2px !important; }
      .ap-label { font-size: 9px !important; font-weight: 700 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; color: rgba(42,33,22,0.42) !important; }
      #abp-ball img { width: 32px !important; height: 32px !important; object-fit: contain !important; border-radius: 50% !important; pointer-events: none !important; animation: abp-breath 2.8s ease-in-out infinite !important; }
      @keyframes abp-breath { 0%, 100% { transform: translateY(0) !important; } 50% { transform: translateY(-4px) !important; } } .abp-dragging { transition: none !important; } .abp-dragging img { animation-play-state: paused !important; } .abp-header, .abp-compact { touch-action: none !important; } #abp-widget { touch-action: none !important; } .history-list { touch-action: pan-y !important; }
      #abp-ball { position: fixed !important; bottom: 24px !important; right: 20px !important; z-index: 99999999 !important; width: 50px !important; height: 50px !important; border-radius: 50% !important; background: linear-gradient(145deg, #fffaf2 0%, #f5ebe0 100%) !important; color: #2a2116 !important; display: none !important; align-items: center !important; justify-content: center !important; font-size: 20px !important; cursor: pointer !important; box-shadow: 0 8px 24px rgba(60,40,15,0.22), 0 0 0 4px rgba(201,162,39,0.12) !important; pointer-events: auto !important; border: 2px solid #e4d6bf !important; touch-action: none !important; -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }
      .sig-mid { display: flex !important; justify-content: space-between !important; align-items: center !important; gap: 6px !important; margin: 2px 0 !important; }
      .sig-badges { display: flex !important; gap: 4px !important; flex-shrink: 0 !important; }
      .sig-badge { background: rgba(42,33,22,0.05) !important; color: #4a3413 !important; border: 1px solid #efe4d4 !important; padding: 3px 6px !important; border-radius: 6px !important; font-size: 9px !important; font-weight: 800 !important; font-family: 'Lilita One', cursive !important; }
      .sig-badge.max { background: rgba(46,204,143,0.12) !important; color: #1a9a68 !important; border-color: rgba(46,204,143,0.28) !important; }
      .abp-stats-grid { gap: 6px !important; }
      .stat-cell { background: #fff !important; border: 1.5px solid #e4d6bf !important; border-radius: 10px !important; padding: 6px 2px !important; }
      .hist-head { display: flex !important; justify-content: space-between !important; align-items: center !important; }
      .btn-reset { width: auto !important; padding: 6px 10px !important; }
      .history-list { max-height: 120px !important; background: #fff !important; border: 1.5px solid #e4d6bf !important; border-radius: 10px !important; padding: 4px 8px !important; }
      .set-row { display: flex !important; gap: 6px !important; align-items: center !important; }
      .btn-key { background: linear-gradient(135deg, #2a2116 0%, #3d3225 100%) !important; color: #fffaf2 !important; border: none !important; border-radius: 10px !important; padding: 9px 12px !important; font-size: 10px !important; font-weight: 800 !important; cursor: pointer !important; white-space: nowrap !important; box-shadow: 0 4px 12px rgba(42,33,22,0.28) !important; }
      .lvl-wrap { display: flex !important; flex-direction: column !important; gap: 6px !important; }
      .lvl-row { display: flex !important; gap: 4px !important; }
      .lvl-chip { flex: 1 !important; padding: 6px 0 !important; border: 1.5px solid #e4d6bf !important; background: #fff !important; color: rgba(42,33,22,0.6) !important; border-radius: 8px !important; font-family: 'Lilita One', cursive !important; font-size: 12px !important; cursor: pointer !important; }
      .lvl-chip.on { background: linear-gradient(135deg, #2a2116 0%, #3d3225 100%) !important; color: #fffaf2 !important; border-color: #2a2116 !important; box-shadow: 0 3px 10px rgba(42,33,22,0.28) !important; }
      #abp-status-text { display: none !important; }
    `;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.id = 'abp-widget-container';
        container.innerHTML = `
      <div id="abp-widget">
        <div class="abp-header" id="abp-header">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <div class="abp-title">AUTO BET PRO</div>
            <span class="ap-live-pill" id="abp-live-pill"><span id="abp-status-dot" class="dot-indicator dot-off"></span><span id="abp-live-text">OFF</span></span>
          </div>
          <div id="abp-head-btns">
            <button class="abp-exp-btn" id="abp-expand" title="Expand"><svg viewBox="0 0 24 24" fill="none" stroke="#2a2116" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
            <button class="abp-close-btn" id="abp-minimize">✕</button>
          </div>
        </div>

        <div id="abp-compact">
          <div class="ap-body">
            <div class="ap-period">
              <p class="ap-label">PERIOD</p>
              <p class="ap-period-val" id="abp-c-period">—</p>
            </div>
            <div class="ap-signal">
              <p class="ap-label">SIGNAL</p>
              <p class="ap-signal-val" id="abp-c-pred">—</p>
            </div>
            <div class="ap-amount">
              <p class="ap-label">AMOUNT</p>
              <p class="ap-amount-val" id="abp-c-balance">—</p>
            </div>
          </div>
        </div>

        <div id="abp-gate">
          <div class="g-icon">🔐</div>
          <div class="g-title">DRAGO PRO CHECK</div>
          <div class="g-sub">App ke gameplay page se PRO status verify hota hai — koi key nahi chahiye</div>
          <button class="btn-gold" id="abp-gate-btn">🔄 RETRY CHECK</button>
          <span class="abp-label-sm" id="abp-gate-status" style="font-size:10px;">🔐 App me PRO login hona chahiye</span>
        </div>

        <div id="abp-main">
          <div class="abp-card">
            <div class="abp-flex-row">
              <span class="abp-label-sm">SIGNAL</span>
              <span class="abp-period-val" id="abp-pred-period">---</span>
            </div>
            <div class="sig-mid">
              <span class="val-pred" id="abp-pred-value">WAIT...</span>
              <span class="sig-badges"><span class="sig-badge" id="abp-pred-level-badge">Lv 1</span><span class="sig-badge max" id="abp-pred-max-badge">MAX 1</span></span>
            </div>
            <div class="abp-flex-row">
              <span class="abp-label-sm">⏳ TIME LEFT</span>
              <span class="val-timer" id="abp-timer">00:--</span>
            </div>
          </div>

          <div class="abp-card">
            <div class="abp-flex-row"><span class="abp-label-sm">💼 BALANCE</span><span class="val-bold" id="abp-balance">₹0.00</span></div>
            <div class="lvl-wrap">
              <span class="abp-label-sm">🎚 LEVEL SELECT (balance isi me divide hoga)</span>
              <div class="lvl-row" id="abp-lvl-row">
                <button class="lvl-chip" data-lvl="1">1</button><button class="lvl-chip" data-lvl="2">2</button><button class="lvl-chip" data-lvl="3">3</button><button class="lvl-chip" data-lvl="4">4</button><button class="lvl-chip" data-lvl="5">5</button><button class="lvl-chip" data-lvl="6">6</button><button class="lvl-chip" data-lvl="7">7</button><button class="lvl-chip" data-lvl="8">8</button><button class="lvl-chip" data-lvl="9">9</button>
              </div>
            </div>
            <div class="abp-flex-row"><span class="abp-label-sm">🎯 TARGET ₹</span><input class="abp-input" id="abp-target-input" type="number" min="10" value="500" style="width:84px;text-align:right;" /></div>
            <div style="font:600 9px/1.35 system-ui,sans-serif;color:#9a5b16">Higher signal levels multiply the stake. Review the amount before starting.</div>
          </div>

          <div class="abp-controls">
            <button class="btn-start" id="abp-toggle">► START</button>
            <button class="btn-stop" id="abp-stop-btn">■</button>
          </div>

        </div>

      </div>
    `;
    shadow.appendChild(container);

    const ball = document.createElement('div');
    ball.id = 'abp-ball';
    ball.innerHTML = '<img src="https://dragotest.vercel.app/assets/images/predictionlogo.png" alt="" />'; 
    shadow.appendChild(ball);

    function toggleToBall(e) { if(e) { e.stopPropagation(); e.preventDefault(); } sGet('abp-widget-container').style.setProperty('display', 'none', 'important'); ball.style.setProperty('display', 'flex', 'important'); }
    function toggleToWidget(e) { if(e) { e.stopPropagation(); e.preventDefault(); } if (ball._abpDragged) { ball._abpDragged = false; return; } sGet('abp-widget-container').style.setProperty('display', 'flex', 'important'); ball.style.setProperty('display', 'none', 'important'); }

    sGet('abp-minimize').addEventListener('click', toggleToBall);
    sGet('abp-minimize').addEventListener('touchend', toggleToBall);

    const expBtn = sGet('abp-expand');
    if (expBtn) {
      expBtn.addEventListener('mousedown', function (e) { e.stopPropagation(); });
      expBtn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
      expBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const w = sGet('abp-widget');
        if (!w) return;
        w.classList.add('compact-touched');
        setCompact(!w.classList.contains('compact'));
      });
    }
    ball.addEventListener('click', toggleToWidget);
    ball.addEventListener('touchend', toggleToWidget);

    shadow.querySelectorAll('.abp-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        shadow.querySelectorAll('.abp-nav-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        shadow.querySelectorAll('.abp-tab').forEach(t=>t.classList.remove('visible'));
        sGet('tab-'+activeTab).classList.add('visible');
        if(activeTab==='history') renderHistoryTab();
        if(activeTab==='predict') renderPredictTab();
        if(activeTab==='setting') { renderKeyStatus(); }
      });
    });

    sGet('abp-toggle').addEventListener('click', () => { if(isRunning) stop(); else start(); });
    sGet('abp-stop-btn').addEventListener('click', () => { stop(); });

    sGet('abp-gate-btn').addEventListener('click', () => { retryCheck(); });

    const targetInput = sGet('abp-target-input');
    targetInput.addEventListener('input', () => {
      const v = parseInt(targetInput.value, 10);
      if(!isNaN(v) && v >= 1) {
        targetProfit = v;
        saveState();
      }
    });
    ['mousedown','touchstart'].forEach(ev => targetInput.addEventListener(ev, e=>e.stopPropagation()));

    const lvlRow = sGet('abp-lvl-row');
    if (lvlRow) {
      lvlRow.querySelectorAll('.lvl-chip').forEach(function (c) {
        ['mousedown','touchstart'].forEach(function (ev) { c.addEventListener(ev, function (e) { e.stopPropagation(); }); });
        c.addEventListener('click', function (e) {
          e.stopPropagation();
          const n = parseInt(c.getAttribute('data-lvl'), 10);
          if (n >= 1 && n <= 9) {
            maxLevelUser = n;
            localStorage.setItem('abp_max_level', String(n));
            renderLevelChips();
            log('🎚 Level set: ' + n + ' — balance ' + n + ' levels me divide hoga (min ₹' + (Math.pow(2, n) - 1) + ')');
          }
        });
      });
    }
    renderLevelChips();

    makeDraggable(sGet('abp-widget'), sGet('abp-widget'), 'abp_pos_widget');
    makeDraggable(sGet('abp-widget'), sGet('abp-compact'));
    makeDraggable(ball, ball, 'abp_pos_ball');

    updateBalanceDisplay();
    setInterval(updateBalanceDisplay, 5000);

    loadState(() => {
      keyState = 'checking';
      showGate();
      renderKeyStatus();
      bridgeHello();
      // jab tak PRO card nahi aata, har 3s me hello retry
      if (helloTimer) clearInterval(helloTimer);
      helloTimer = setInterval(function () {
        if (keyState !== 'ok') { bridgeHello(); } else { clearInterval(helloTimer); helloTimer = null; }
      }, 3000);
    });
  }

  if (document.readyState==='complete'||document.readyState==='interactive') createWidget();
  else window.addEventListener('DOMContentLoaded', createWidget);
})();
