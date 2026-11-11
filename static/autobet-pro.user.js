// ==UserScript==
// @name         DRAGO Auto Bet Pro
// @namespace    http://tampermonkey.net/
// @version      7.3.0
// @description  WinGo 30s auto-bet widget for games opened inside DRAGO Gameplay. Requires an eligible DRAGO Pro plan.
// @downloadURL  https://dragotest.vercel.app/autobet-pro.user.js
// @updateURL    https://dragotest.vercel.app/autobet-pro.user.js
// @match        https://*/*
// @exclude      https://dragotest.vercel.app/*
// @exclude      https://dragopredictor.vercel.app/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
 
(function () {
  'use strict';

   
   
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

   
   
   
  let abpUserId = localStorage.getItem('abp_user_id');
  if (!abpUserId) {
    abpUserId = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    localStorage.setItem('abp_user_id', abpUserId);
  }

   
   
   
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

   
  let maxLevelUser = parseInt(localStorage.getItem('abp_max_level') || '9', 10);
  if (!(maxLevelUser >= 1 && maxLevelUser <= 9)) maxLevelUser = 9;
  let shadow              = null;

   
  let latestPrediction    = null;
  let predictionAnalysing = false;
  let predFetchInterval   = null;

   
  let keyState   = 'none';  
  let keyMessage = '';

   
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
      if (d.analysing === true) {
        latestPrediction = null;
        predictionAnalysing = true;
        if (activeTab === 'predict') renderPredictTab();
        return;
      }
      if (signal !== 'BIG' && signal !== 'SMALL') {
        latestPrediction = null;
        predictionAnalysing = false;
        if (activeTab === 'predict') renderPredictTab();
        return;
      }
      predictionAnalysing = false;
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

  let lastPredictionRefreshRequest = 0;

  function requestPredictionRefresh() {
    if (Date.now() - lastPredictionRefreshRequest < 450) return;
    lastPredictionRefreshRequest = Date.now();
    try {
      if (window.parent && window.parent !== window && appParentOrigin) {
        window.parent.postMessage(
          { drago: 'refresh', v: 7, nonce: bridgeNonce },
          appParentOrigin
        );
      }
    } catch (e) {}
  }

  function fetchPrediction(onDone) {
    if (keyState !== 'ok') { if (onDone) onDone(null); return; }
     
     
    requestPredictionRefresh();
    if (latestPrediction && activeTab === 'predict') renderPredictTab();
    if (onDone) onDone(latestPrediction);
  }

  function startPredictionPolling() {
    if (keyState !== 'ok') return;
    bridgeHello();
    if (predFetchInterval) clearInterval(predFetchInterval);
     
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

   
   
   
  let scheduledTriggerAt    = null;
  let triggerFiredThisCycle = false;

  function pickRandomTriggerSecond() {
    return 20;  
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
    } else {
      const waitingText = predictionAnalysing ? 'ANALYSING...' : 'WAITING...';
      const predValue = sGet('abp-pred-value');
      const compactPred = sGet('abp-c-pred');
      if (predValue) {
        predValue.textContent = waitingText;
        predValue.style.color = HX('b58918');
      }
      if (compactPred) compactPred.textContent = waitingText;
      if (predictionAnalysing) {
        if (sGet('abp-pred-level-badge')) sGet('abp-pred-level-badge').textContent = 'NEW DRAW';
        if (sGet('abp-pred-playtime')) sGet('abp-pred-playtime').textContent = 'Please wait';
      }
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
    const slider = sGet('abp-level-slider');
    const label = sGet('abp-level-value');
    if (slider) {
      slider.value = String(maxLevelUser);
      slider.style.setProperty('--level-fill', ((maxLevelUser - 1) / 8 * 100) + '%');
      slider.setAttribute('aria-valuetext', 'Level ' + maxLevelUser);
    }
    if (label) label.textContent = 'Lv ' + maxLevelUser;
    const color = maxLevelUser < 3 ? '#d45b58' : maxLevelUser <= 5 ? '#d8ad35' : maxLevelUser <= 7 ? '#a8afb9' : '#269c69';
    if (slider) {
      slider.parentElement.style.setProperty('--level-color', color);
      slider.parentElement.style.setProperty('--ruler-offset', (-(maxLevelUser - 1) * 30) + 'px');
      slider.closest('.lvl-wrap').style.setProperty('--level-color', color);
      slider.parentElement.querySelectorAll('.abp-level-ticks i').forEach((tick, i) => tick.classList.toggle('active', i <= (maxLevelUser - 1) * 5));
    }
  }

  function updateToggleBtn() {
    const quick = sGet('abp-compact-toggle');
    if (quick) {
      quick.textContent = isRunning ? '■ OFF' : '► ON';
      quick.classList.toggle('running', isRunning);
      quick.setAttribute('aria-pressed', String(isRunning));
      quick.setAttribute('aria-label', isRunning ? 'Turn auto bet off' : 'Turn auto bet on');
    }
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

   
   
   
  function makeDraggable(el, handle, storeKey) {
    if(!el||!handle)return;
     
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

   
   
   
  function createWidget() {
    if (document.getElementById('abp-root-host')) return;

    if (typeof FontFace === 'function' && document.fonts) {
      { const face = new FontFace('Lilita One', "url(data:font/ttf;base64,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ABUAFgAXABgAGQAaABsAHAAdAB4AHwAgACEAIgAjACQAJQAmACcAKAApACoAKwAsAC0ALgAvADAAMQAyADMANAA1ADYANwA4ADkAOgA7ADwAPQA+AD8AQABBAEIAQwBEAEUARgBHAEgASQBKAEsATABNAE4ATwBQAFEAUgBTAFQAVQBWAFcAWABZAFoAWwBcAF0AXgBfAGAAYQCjAIQAhQC9AJYA6ACGAI4AiwCdAKkApAEDAIoAgwCTAPIA8wCNAJcAiADDAN4A8QCeAKoA9QD0APYAogCtAMkAxwCuAGIAYwCQAGQAywBlAMgAygDPAMwAzQDOAOkAZgDTANAA0QCvAGcA8ACRANYA1ADVAGgA6wDtAIkAagBpAGsAbQBsAG4AoABvAHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6ANcA4gDjALAAsQDkAOUAuwDmAOcApgDYAOEA3QDZALIAswC2ALcAxAC0ALUAxQCCAMIAhwCrAMYAvgC/ALwBBACMAO8AwADBB3VuaTAwMjUHdW5pMDBBRARFdXJvAAABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAAAQAIAAEAJgAEAAAADgIAAcoBwAGyAawBegF0ATIBCADyAKgAcgBMAEYAAQAOACQAKQAuAC8AMAAzADQANwA5ADoAPABJAE4AXAABAEb/8QAJAET/8QBG//EASP/nAFL/5wBU/+cAVv/sAFf/5wBZ/+wAXP/dAA0ARP/iAEb/5wBH//EASP/nAEr/7ABS/+cAVP/sAFb/7ABX/+IAWP/nAFn/7ABa/+wAW//xABIAJP/OAC3/2AAw/+wANP/sAET/4gBG/9gAR//YAEj/2ABK/9gAUP/dAFH/3QBS/9gAVP/YAFX/4gBW/9gAW//iAFz/3QBd//EABQAk/90ALf/sADL/7ABE/+wASP/nAAoAJP/YAC3/7ABE/90ARv/dAEf/3QBI/90ASv/dAFL/3QBU/90AXP/nABAAJP/nAC3/3QBE/+cARv/dAEj/3QBK/+cAUP/sAFH/7ABS/90AVP/dAFX/8QBW/+cAWP/dAFn/4gBa/+IAXP/sAAEAPP/iAAwAJP/EAC3/0wA5/90APP/dAD3/8QBE/+cARv/sAEj/7ABK/+cAUv/nAFT/5wBW/+cAAQA8/+wAAwA3/90AOf/sADz/3QACAFn/8QBc//EADQAk/9MARP/dAEj/3QBQ/+wAUf/sAFL/3QBU/+IAVf/nAFb/5wBY/+cAW//dAFz/3QBd/+IABgA3/+cAOf/YADr/3QA8/9gAWf/xAFz/8QAAAMcAAAAAAAABTQAAALwAAAEfAC0BzABBA0EAWgITACIDHgAjApsALAEtAEYBrgBfAaYAXwItAFECWgAlATEANQINACMA5QAUAj0AAAJ/ACMBlgAPAg0AKwIQABQCVgAJAgwAKwI/ACMB9AAYAjoAGwI1ACgBFQA6ARUADQHkADQCRABDAcIAMwJIAEIDYwAnAo8ADwJSAD0CMQAeAmgAMgHtADIB2AAtAm0AHgKEADIBrQARAc4ACQJsADIBswAoA4sAMgKIADICuAAeAjoALgLCAB4CTgAyAhMAHQH2AAUCdAAeApUACwO5ABUCqwASAmf/9QIzACUBgQBQAksAEQGBAB4CrwAsAnwALwFeAEcCBQAOAggAMgGoABoCNQAaAeYAGgF3ABQCBAAaAfUALQERAC0BD/+KAhMALQEQAC0DFAATAicAFAIBABoCKwATAf8AGgGMABQBwgAZAXAAEwIgACgCCQAGAvAACwItAA8CGQAKAcYAGQFqAB4CdAD9AWoAUAHLABUBHwAtAhAAIwHqAB0C2ABXApMAAAGfAJkCaQAoAckAJgK1AFQB+gBQAwUAWQJlAEMBxgAvAr0AVAGCACgCUwBDAWAANwExAB0BZQBHAjwAKAMMAB4BNQA6AZIAZAEbACkBbgAoAtwAWQNHAFEDUABTA2QARQJIAEECjwAOAo8ADgKPAA4CjwAOAo8ADgKPAA4DlQAiAiIADwHoAC0B6AAtAegALQHoAC0BsAASAbAAEgGwABIBsAASAmz/8wKRACsCuAAeArgAHgK4AB4CuAAeArgAHgJiAGUCuAAeAnQAHgJ0AB4CdAAeAnQAHgJn//UCUwAuAqAAUgIFAA4CBQAOAgUADgIFAA4CBQAOAgUADgKtAA4BqAAaAeYAGgHmABoB5gAaAeYAGgELABYBCwAVAQv/2QEL/8sCPgAoAicAFAIBABoCAQAaAgEAGgIBABoCAQAaAmMAJgIBABoCIAAoAiAAKAIgACgCIAAoAhkACgJ0AFwCDAAK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)", { weight: '400', display: 'swap' }); document.fonts.add(face); face.load().catch(() => {}); }
      { const face = new FontFace('Luckiest Guy', "url(data:font/ttf;base64,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AKEApwBeAAcAhAECAKsAjwCQAKAAsACxAJ0AngCWAIUA7QDuAOkA6gDiAOMAiACXAJgAowDXAIYAiQCKAIsAjACpAKoAogC8AMAAwQAjAAgACQAiAPQA9QDxAPYA8wDyAMYA5ADlAOsA7ADmAOcAugC7AK0ArgCvAMcAyADJAMoAywDMAM0AzgDPANAA0QDTANQA1QDWAGIAYwBkAGUAZgBnAGgAaQBqAGsAbABtAG4AbwBwAHEAcgBzAHQAdQB2AHcAeAB5AHoAewB8AH0AfgB/AIAAgQEDAL0BBAEFAQYBBwEIAQkBCgELAQwBDQEOAQ8A/QD+ARABEQESARMA/wEAARQBFQEWAQEBFwEYARkBGgEbARwBHQEeAR8BIAEhASIA+AD5ASMBJAElASYBJwEoASkBKgErASwBLQEuAS8BMAExATIBMwD6ATQBNQE2ATcBOAE5AToBOwE8AT0BPgE/AUABQQFCAUMBRAFFAUYBRwFIAUkBSgFLAUwBTQFOAU8BUAFRAVIBUwFUAVUBVgFXAVgBWQFaAVsBXAD7APwBXQFeAV8BYAFhAWIBYwFkAWUBZgFnAWgBaQFqAWsBbAFtAW4BbwFwAXEBcgFzAXQBdQF2AXcBeAF5AXoBewF8AX0BfgCsAAoABAAFBEV1cm8IZG90bGVzc2oHdW5pMDBBRAd1bmkwMzEyB3VuaTAzMTUHdW5pMDMyNgdBRWFjdXRlB2FlYWN1dGUHQW1hY3JvbgdhbWFjcm9uBkFicmV2ZQZhYnJldmUHQW9nb25lawdhb2dvbmVrC0NjaXJjdW1mbGV4C2NjaXJjdW1mbGV4CkNkb3RhY2NlbnQKY2RvdGFjY2VudAZEY2Fyb24GZGNhcm9uBkRjcm9hdAdFbWFjcm9uB2VtYWNyb24GRWJyZXZlBmVicmV2ZQpFZG90YWNjZW50CmVkb3RhY2NlbnQHRW9nb25lawdlb2dvbmVrBkVjYXJvbgZlY2Fyb24LR2NpcmN1bWZsZXgLZ2NpcmN1bWZsZXgKR2RvdGFjY2VudApnZG90YWNjZW50DEdjb21tYWFjY2VudAxnY29tbWFhY2NlbnQLSGNpcmN1bWZsZXgLaGNpcmN1bWZsZXgESGJhcgRoYmFyDGtjb21tYWFjY2VudAZJdGlsZGUGaXRpbGRlB0ltYWNyb24HaW1hY3JvbgZJYnJldmUGaWJyZXZlB0lvZ29uZWsHaW9nb25lawJJSgJpagtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAxLY29tbWFhY2NlbnQMa2dyZWVubGFuZGljBkxhY3V0ZQZsYWN1dGUMTGNvbW1hYWNjZW50DGxjb21tYWFjY2VudAZMY2Fyb24GbGNhcm9uBExkb3QKbGRvdGFjY2VudAZOYWN1dGUGbmFjdXRlDE5jb21tYWFjY2VudAxuY29tbWFhY2NlbnQGTmNhcm9uBm5jYXJvbgtuYXBvc3Ryb3BoZQNFbmcDZW5nB09tYWNyb24Hb21hY3JvbgZPYnJldmUGb2JyZXZlDU9odW5nYXJ1bWxhdXQNb2h1bmdhcnVtbGF1dAtPc2xhc2hhY3V0ZQtvc2xhc2hhY3V0ZQZSYWN1dGUGcmFjdXRlDFJjb21tYWFjY2VudAxyY29tbWFhY2NlbnQGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4BllncmF2ZQZ5Z3JhdmUGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgMVGNvbW1hYWNjZW50DHRjb21tYWFjY2VudAZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMAAAABAAAACgAeACwAAWxhdG4ACAAEAAAAAP//AAEAAAABa2VybgAIAAAAAQAAAAEABAACAAAABEvqQ64ZLAAOAAITMAAEAAAWXhOaADAAMwAA/9v/3gAkAAr/6P+G/9//iv+1/5L/hP/k/+b/5//m/83/2v/c/4X/uf+SACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//QAAAAAAAAAAAAAAAAAAAAA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/9EBT//LAVD/0QFR/6sBUv+1AWX/1AFm/9QBZ//UAWj/1AFp/9QBav/UAWv/1AFs/9QA0AAQ/4oAEf/XABL/2wAT/9sAFP+NABX/3QAW/9AAGP/bABn/0QAa/9UAG//bABz/hAAd/9YAH//aACD/zgAh/4gAIv+TACP/YwAk/4UAJf/bACb/bAAn/9UAKv+MACv/1AAs/44ALf/bAC7/jAAv/90AMP/GADL/2wAz/9cANf/iADb/gwA4/4gAOf/aADr/zgA7/4gAPP+JAD3/ZQA+/4AAP//WAED/YgBB/8oAev+EAHv/gwCF/4QAhv+DAI3/1wCO/4MAj//RAJD/1wCV/8YArP/OAK3/zgCu/2wAr/9iALD/1QCx/8oAsv9iALP/bAC2/4QAuP/bALr/2wC7/9sAvP/QAL3/0AC+/9AAv//QAMD/hADB/4QAwv+EAMP/kwDE/5MAxf+TAMj/igDJ/9sAyv/bAMv/hADM/5MA0/+MANT/jgDV/44A1v+OANf/jgDY/8YA2f/GANr/xgDb/8YA3P/iAN3/gwDe/4MA3/+DAOD/gwDh/4MA4v+JAOP/iQDk/4kA5f+JAPT/igD1/4wA9v+KAPf/jAD4/4oA+f+MAPr/igD7/4wA/P/XAP3/1AD+/9cBAP/bAQH/jgEC/9sBA/+OAQT/2wEF/44BBv/bAQf/jgEI/9sBCf+OAQr/jQEL/4wBDP+NAQ3/jAEO/40BD/+MARD/jQER/4wBEv/dARP/3QEU/90BFf/dARb/2wEX/9ABGP/GARn/0AEa/8YBG//QARz/xgEd/9ABHv/GAR//0AEk/9sBJf/bASb/0QEn/9cBKP/RASn/1wEu/9sBL//iATD/2wEx/+IBMv/bATP/4gE1/9sBNv/iATf/hAE4/4MBOf+EATr/gwE7/4QBPP+DAT3/hAE+/4MBP//aAUD/2gFB/9oBQv/aAUP/2gFE/9oBRf/OAUb/zgFH/84BSP/OAUn/zgFK/84BS/9sAUz/YgFN/9UBTv/KAU//1QFQ/8oBUf9sAVL/YgFT/4gBVP+IAVX/iAFX/4gBWP+IAVn/kwFa/4kBW/+TAVz/iQFd/5MBXv+JAV//kwFg/4kBYf+TAWL/iQFj/5MBZP+JAWX/hQFm/4ABZ/+FAWj/gAFp/4UBav+AAWv/hQFs/4AAUQAO/9wAEP/qABf/4AAc/+UAJv/sACj/3AAq/+sALP/rADH/4AA2/+kAev/lAHv/6QCD/9wAhP/cAIX/5QCG/+kAjv/pAK7/7ACz/+wAtP/cALX/3AC2/+UAt//cALn/3ADA/+UAwf/lAML/5QDG/9wAx//cAMj/6gDL/+UAzf/cAM7/3ADP/9wA0P/cANH/3ADS/9wA0//rANT/6wDV/+sA1v/rANf/6wDd/+kA3v/pAN//6QDg/+kA4f/pAOb/4ADs/9wA7f/cAO7/3ADv/9wA8P/cAPH/3ADy/9wA8//cAPT/6gD1/+sA9v/qAPf/6wD4/+oA+f/rAPr/6gD7/+sBAf/rAQP/6wEF/+sBB//rAQn/6wEi/+ABI//gATf/5QE4/+kBOf/lATr/6QE7/+UBPP/pAT3/5QE+/+kBS//sAVH/7ACNAA7/vAAS/+sAE//rABX/6gAW/+wAF//NABj/6wAa/+wAG//rAB//7AAg/+sAIf/lACP/vQAk/8sAJf+0ACb/ogAn/8sAKP+8AC3/6wAv/+oAMP/sADH/zQAy/+sAM//rADX/6QA5/+wAO//rAD3/wAA+/8sAP/+zAED/qwBB/8wAg/+8AIT/vACQ/+sAlf/sAKz/6wCu/6IAr/+rALD/ywCx/8wAsv+rALP/ogC0/7wAtf+8ALf/vAC4/+sAuf+8ALr/6wC7/+sAvP/sAL3/7AC+/+wAv//sAMb/vADH/7wAyf/rAMr/6wDN/7wAzv+8AM//vADQ/7wA0f+8ANL/vADY/+wA2f/sANr/7ADb/+wA3P/pAOb/zQDs/7wA7f+8AO7/vADv/7wA8P+8APH/vADy/7wA8/+8AQD/6wEC/+sBBP/rAQb/6wEI/+sBEv/qARP/6gEU/+oBFf/qARb/6wEX/+wBGP/sARn/7AEa/+wBG//sARz/7AEd/+wBHv/sAR//7AEi/80BI//NAST/6wEl/+sBJ//rASn/6wEu/+sBL//pATD/6wEx/+kBMv/rATP/6QE1/+sBNv/pAT//7AFA/+wBQf/sAUL/7AFD/+wBRP/sAUX/6wFH/+sBSf/rAUv/ogFM/6sBTf/LAU7/zAFP/8sBUP/MAVH/ogFS/6sBU//lAVT/6wFV/+UBV//lAVj/6wFl/8sBZv/LAWf/ywFo/8sBaf/LAWr/ywFr/8sBbP/LADwADv/zACH/6gAj/+4AJP/nACX/4wAm/9EAKP/zADr/9gA7/+gAPf/uAD7/5QA//+QAQP/vAIP/8wCE//MArf/2AK7/0QCv/+8Asv/vALP/0QC0//MAtf/zALf/8wC5//MAxv/zAMf/8wDN//MAzv/zAM//8wDQ//MA0f/zANL/8wDs//MA7f/zAO7/8wDv//MA8P/zAPH/8wDy//MA8//zAUb/9gFI//YBSv/2AUv/0QFM/+8BUf/RAVL/7wFT/+oBVP/oAVX/6gFX/+oBWP/oAWX/5wFm/+UBZ//nAWj/5QFp/+cBav/lAWv/5wFs/+UAGAAj/80AJP/dACUADgAm/7gAPf/QAD7/3QA/AAwAQP/BAK7/uACv/8EAsv/BALP/uAFL/7gBTP/BAVH/uAFS/8EBZf/dAWb/3QFn/90BaP/dAWn/3QFq/90Ba//dAWz/3QB4ABD/sQAU/7MAGAAMABz/pwAg/+kAIQAyACMAWQAkAC4AJQAtACYADAAnAB0AKv+wACz/tQAu/7EANv+rADj/rgA6/+EAOwAqADz/5AA9AD8APgAbAD8AFwBAAEAAQQAdAHr/pwB7/6sAhf+nAIb/qwCO/6sArP/pAK3/4QCuAAwArwBAALAAHQCxAB0AsgBAALMADAC2/6cAwP+nAMH/pwDC/6cAyP+xAMv/pwDT/7AA1P+1ANX/tQDW/7UA1/+1AN3/qwDe/6sA3/+rAOD/qwDh/6sA4v/kAOP/5ADk/+QA5f/kAPT/sQD1/7AA9v+xAPf/sAD4/7EA+f+wAPr/sQD7/7ABAf+1AQP/tQEF/7UBB/+1AQn/tQEK/7MBC/+xAQz/swEN/7EBDv+zAQ//sQEQ/7MBEf+xASQADAE3/6cBOP+rATn/pwE6/6sBO/+nATz/qwE9/6cBPv+rAUX/6QFG/+EBR//pAUj/4QFJ/+kBSv/hAUsADAFMAEABTQAdAU4AHQFPAB0BUAAdAVEADAFSAEABUwAyAVQAKgFVADIBVwAyAVgAKgFa/+QBXP/kAV7/5AFg/+QBYv/kAWT/5AFlAC4BZgAbAWcALgFoABsBaQAuAWoAGwFrAC4BbAAbAAIAJQARAD8ADQDmAA7/kAAQ/9IAEf/TABL/0gAT/9IAFP/VABX/0QAW/9YAF/9xABj/0gAZ/9MAGv/UABv/0gAc/9EAHf/VAB//0wAg/+MAIv/jACP/zwAk/9AAJf++ACb/uQAn/8oAKP+QACr/0wAr/9MALP/VAC3/0gAu/9QAL//RADD/3AAx/3EAMv/SADP/0gA1/8wANv/WADj/2QA5/9MAOv/eADz/3AA9/9MAPv/SAD//wgBA/8sAQf/XAHr/0QB7/9YAg/+QAIT/kACF/9EAhv/WAI3/0wCO/9YAj//TAJD/0gCV/9wArP/jAK3/3gCu/7kAr//LALD/ygCx/9cAsv/LALP/uQC0/5AAtf+QALb/0QC3/5AAuP/SALn/kAC6/9IAu//SALz/1gC9/9YAvv/WAL//1gDA/9EAwf/RAML/0QDD/+MAxP/jAMX/4wDG/5AAx/+QAMj/0gDJ/9IAyv/SAMv/0QDM/+MAzf+QAM7/kADP/5AA0P+QANH/kADS/5AA0//TANT/1QDV/9UA1v/VANf/1QDY/9wA2f/cANr/3ADb/9wA3P/MAN3/1gDe/9YA3//WAOD/1gDh/9YA4v/cAOP/3ADk/9wA5f/cAOb/cQDs/5AA7f+QAO7/kADv/5AA8P+QAPH/kADy/5AA8/+QAPT/0gD1/9MA9v/SAPf/0wD4/9IA+f/TAPr/0gD7/9MA/P/TAP3/0wD+/9MBAP/SAQH/1QEC/9IBA//VAQT/0gEF/9UBBv/SAQf/1QEI/9IBCf/VAQr/1QEL/9QBDP/VAQ3/1AEO/9UBD//UARD/1QER/9QBEv/RARP/0QEU/9EBFf/RARb/0gEX/9YBGP/cARn/1gEa/9wBG//WARz/3AEd/9YBHv/cAR//1gEi/3EBI/9xAST/0gEl/9IBJv/TASf/0gEo/9MBKf/SAS7/0gEv/8wBMP/SATH/zAEy/9IBM//MATX/0gE2/8wBN//RATj/1gE5/9EBOv/WATv/0QE8/9YBPf/RAT7/1gE//9MBQP/TAUH/0wFC/9MBQ//TAUT/0wFF/+MBRv/eAUf/4wFI/94BSf/jAUr/3gFL/7kBTP/LAU3/ygFO/9cBT//KAVD/1wFR/7kBUv/LAVn/4wFa/9wBW//jAVz/3AFd/+MBXv/cAV//4wFg/9wBYf/jAWL/3AFj/+MBZP/cAWX/0AFm/9IBZ//QAWj/0gFp/9ABav/SAWv/0AFs/9IAdgAOACMAFwAkABz/4wAh/6UAIv/tACP/nwAk/8sAJQBBACb/qgAoACMALP/wADEAJAA2/9YAOP/eADv/mQA8/+sAPf+dAD7/ywA/ADoAQP+hAHr/4wB7/9YAgwAjAIQAIwCF/+MAhv/WAI7/1gCu/6oAr/+hALL/oQCz/6oAtAAjALUAIwC2/+MAtwAjALkAIwDA/+MAwf/jAML/4wDD/+0AxP/tAMX/7QDGACMAxwAjAMv/4wDM/+0AzQAjAM4AIwDPACMA0AAjANEAIwDSACMA1P/wANX/8ADW//AA1//wAN3/1gDe/9YA3//WAOD/1gDh/9YA4v/rAOP/6wDk/+sA5f/rAOYAJADsACMA7QAjAO4AIwDvACMA8AAjAPEAIwDyACMA8wAjAQH/8AED//ABBf/wAQf/8AEJ//ABIgAkASMAJAE3/+MBOP/WATn/4wE6/9YBO//jATz/1gE9/+MBPv/WAUv/qgFM/6EBUf+qAVL/oQFT/6UBVP+ZAVX/pQFX/6UBWP+ZAVn/7QFa/+sBW//tAVz/6wFd/+0BXv/rAV//7QFg/+sBYf/tAWL/6wFj/+0BZP/rAWX/ywFm/8sBZ//LAWj/ywFp/8sBav/LAWv/ywFs/8sA2wAO/2EAEP+YABH/zwAS/9EAE//RABT/mwAV/84AFv/WABf/RQAY/9EAGf/RABr/0wAb/9EAHP+SAB3/1gAf/9EAIP+8ACL/zQAjACUAJQAMACb/7AAn/94AKP9hACr/mAAr/80ALP+fAC3/0QAu/5gAL//OADD/5AAx/0UAMv/RADP/0gA1/8gANv+dADj/nQA5/9EAOv+zADz/xQA9AB0AQAAeAEH/6wB6/5IAe/+dAIP/YQCE/2EAhf+SAIb/nQCN/88Ajv+dAI//0QCQ/9IAlf/kAKz/vACt/7MArv/sAK8AHgCw/94Asf/rALIAHgCz/+wAtP9hALX/YQC2/5IAt/9hALj/0QC5/2EAuv/RALv/0QC8/9YAvf/WAL7/1gC//9YAwP+SAMH/kgDC/5IAw//NAMT/zQDF/80Axv9hAMf/YQDI/5gAyf/RAMr/0QDL/5IAzP/NAM3/YQDO/2EAz/9hAND/YQDR/2EA0v9hANP/mADU/58A1f+fANb/nwDX/58A2P/kANn/5ADa/+QA2//kANz/yADd/50A3v+dAN//nQDg/50A4f+dAOL/xQDj/8UA5P/FAOX/xQDm/0UA7P9hAO3/YQDu/2EA7/9hAPD/YQDx/2EA8v9hAPP/YQD0/5gA9f+YAPb/mAD3/5gA+P+YAPn/mAD6/5gA+/+YAPz/zwD9/80A/v/PAQD/0QEB/58BAv/RAQP/nwEE/9EBBf+fAQb/0QEH/58BCP/RAQn/nwEK/5sBC/+YAQz/mwEN/5gBDv+bAQ//mAEQ/5sBEf+YARL/zgET/84BFP/OARX/zgEW/9EBF//WARj/5AEZ/9YBGv/kARv/1gEc/+QBHf/WAR7/5AEf/9YBIv9FASP/RQEk/9EBJf/RASb/0QEn/9IBKP/RASn/0gEu/9EBL//IATD/0QEx/8gBMv/RATP/yAE1/9EBNv/IATf/kgE4/50BOf+SATr/nQE7/5IBPP+dAT3/kgE+/50BP//RAUD/0QFB/9EBQv/RAUP/0QFE/9EBRf+8AUb/swFH/7wBSP+zAUn/vAFK/7MBS//sAUwAHgFN/94BTv/rAU//3gFQ/+sBUf/sAVIAHgFZ/80BWv/FAVv/zQFc/8UBXf/NAV7/xQFf/80BYP/FAWH/zQFi/8UBY//NAWT/xQDgAA4AJQAQ/6cAEf/kABL/5AAT/+QAFP+pABX/5gAW/9gAGP/kABn/3wAa/+IAG//kABz/nAAd/98AH//lACD/4gAh/2gAIv+lACP/VwAk/4sAJv9rACf/5QAoACUAKv+oACv/4gAs/6cALf/kAC7/qAAv/+YAMP/OADL/5AAz/+QANv+QADj/mgA5/+UAOv/hADv/XgA8/6AAPf9UAD7/hgBA/18AQf/UAHr/nAB7/5AAgwAlAIQAJQCF/5wAhv+QAI3/5ACO/5AAj//fAJD/5ACV/84ArP/iAK3/4QCu/2sAr/9fALD/5QCx/9QAsv9fALP/awC0ACUAtQAlALb/nAC3ACUAuP/kALkAJQC6/+QAu//kALz/2AC9/9gAvv/YAL//2ADA/5wAwf+cAML/nADD/6UAxP+lAMX/pQDGACUAxwAlAMj/pwDJ/+QAyv/kAMv/nADM/6UAzQAlAM4AJQDPACUA0AAlANEAJQDSACUA0/+oANT/pwDV/6cA1v+nANf/pwDY/84A2f/OANr/zgDb/84A3f+QAN7/kADf/5AA4P+QAOH/kADi/6AA4/+gAOT/oADl/6AA7AAlAO0AJQDuACUA7wAlAPAAJQDxACUA8gAlAPMAJQD0/6cA9f+oAPb/pwD3/6gA+P+nAPn/qAD6/6cA+/+oAPz/5AD9/+IA/v/kAQD/5AEB/6cBAv/kAQP/pwEE/+QBBf+nAQb/5AEH/6cBCP/kAQn/pwEK/6kBC/+oAQz/qQEN/6gBDv+pAQ//qAEQ/6kBEf+oARL/5gET/+YBFP/mARX/5gEW/+QBF//YARj/zgEZ/9gBGv/OARv/2AEc/84BHf/YAR7/zgEf/9gBJP/kASX/5AEm/98BJ//kASj/3wEp/+QBLv/kATD/5AEy/+QBNf/kATf/nAE4/5ABOf+cATr/kAE7/5wBPP+QAT3/nAE+/5ABP//lAUD/5QFB/+UBQv/lAUP/5QFE/+UBRf/iAUb/4QFH/+IBSP/hAUn/4gFK/+EBS/9rAUz/XwFN/+UBTv/UAU//5QFQ/9QBUf9rAVL/XwFT/2gBVP9eAVX/aAFX/2gBWP9eAVn/pQFa/6ABW/+lAVz/oAFd/6UBXv+gAV//pQFg/6ABYf+lAWL/oAFj/6UBZP+gAWX/iwFm/4YBZ/+LAWj/hgFp/4sBav+GAWv/iwFs/4YAgQAOAC4AEP+qABT/rgAXABwAHP+aACEAFwAjAEsAJAAhACUANQAmABMAKAAuACr/qwAs/7MALv+qADEAHAA2/54AOP+iADsAFAA8/+YAPQBEAD4AHAA/ADAAQABHAHr/mgB7/54AgwAuAIQALgCF/5oAhv+eAI7/ngCuABMArwBHALIARwCzABMAtAAuALUALgC2/5oAtwAuALkALgDA/5oAwf+aAML/mgDGAC4AxwAuAMj/qgDL/5oAzQAuAM4ALgDPAC4A0AAuANEALgDSAC4A0/+rANT/swDV/7MA1v+zANf/swDd/54A3v+eAN//ngDg/54A4f+eAOL/5gDj/+YA5P/mAOX/5gDmABwA7AAuAO0ALgDuAC4A7wAuAPAALgDxAC4A8gAuAPMALgD0/6oA9f+rAPb/qgD3/6sA+P+qAPn/qwD6/6oA+/+rAQH/swED/7MBBf+zAQf/swEJ/7MBCv+uAQv/qgEM/64BDf+qAQ7/rgEP/6oBEP+uARH/qgEiABwBIwAcATf/mgE4/54BOf+aATr/ngE7/5oBPP+eAT3/mgE+/54BSwATAUwARwFRABMBUgBHAVMAFwFUABQBVQAXAVcAFwFYABQBWv/mAVz/5gFe/+YBYP/mAWL/5gFk/+YBZQAhAWYAHAFnACEBaAAcAWkAIQFqABwBawAhAWwAHACuAA7/6QAQ/5YAFP+ZABYAEAAX/+AAGgAWABz/iAAdABcAIP/OACEAQQAi/+cAIwB5ACQATgAlADUAJwAdACj/6QAq/5UALP+eAC7/lgAwACQAMf/gADb/jgA4/5EAOv/HADsAPgA8/9kAPQA+AD4AJABAADoAQQAuAHr/iAB7/44Ag//pAIT/6QCF/4gAhv+OAI7/jgCVACQArP/OAK3/xwCvADoAsAAdALEALgCyADoAtP/pALX/6QC2/4gAt//pALn/6QC8ABAAvQAQAL4AEAC/ABAAwP+IAMH/iADC/4gAw//nAMT/5wDF/+cAxv/pAMf/6QDI/5YAy/+IAMz/5wDN/+kAzv/pAM//6QDQ/+kA0f/pANL/6QDT/5UA1P+eANX/ngDW/54A1/+eANgAJADZACQA2gAkANsAJADd/44A3v+OAN//jgDg/44A4f+OAOL/2QDj/9kA5P/ZAOX/2QDm/+AA7P/pAO3/6QDu/+kA7//pAPD/6QDx/+kA8v/pAPP/6QD0/5YA9f+VAPb/lgD3/5UA+P+WAPn/lQD6/5YA+/+VAQH/ngED/54BBf+eAQf/ngEJ/54BCv+ZAQv/lgEM/5kBDf+WAQ7/mQEP/5YBEP+ZARH/lgEXABABGAAkARkAEAEaACQBGwAQARwAJAEdABABHgAkAR8AEAEi/+ABI//gATf/iAE4/44BOf+IATr/jgE7/4gBPP+OAT3/iAE+/44BRf/OAUb/xwFH/84BSP/HAUn/zgFK/8cBTAA6AU0AHQFOAC4BTwAdAVAALgFSADoBUwBBAVQAPgFVAEEBVwBBAVgAPgFZ/+cBWv/ZAVv/5wFc/9kBXf/nAV7/2QFf/+cBYP/ZAWH/5wFi/9kBY//nAWT/2QFlAE4BZgAkAWcATgFoACQBaQBOAWoAJAFrAE4BbAAkAD0ADv/OABf/7AAj/8gAJP/fACX/twAm/6wAJ//SACj/zgAx/+wAPf/LAD7/3wA//7YAQP+xAEH/zwCD/84AhP/OAK7/rACv/7EAsP/SALH/zwCy/7EAs/+sALT/zgC1/84At//OALn/zgDG/84Ax//OAM3/zgDO/84Az//OAND/zgDR/84A0v/OAOb/7ADs/84A7f/OAO7/zgDv/84A8P/OAPH/zgDy/84A8//OASL/7AEj/+wBS/+sAUz/sQFN/9IBTv/PAU//0gFQ/88BUf+sAVL/sQFl/98BZv/fAWf/3wFo/98Baf/fAWr/3wFr/98BbP/fADQADv/UACP/xQAk/9EAJf/UACb/rAAo/9QAPf/IAD7/0QA//9EAQP+4AEH/6QCD/9QAhP/UAK7/rACv/7gAsf/pALL/uACz/6wAtP/UALX/1AC3/9QAuf/UAMb/1ADH/9QAzf/UAM7/1ADP/9QA0P/UANH/1ADS/9QA7P/UAO3/1ADu/9QA7//UAPD/1ADx/9QA8v/UAPP/1AFL/6wBTP+4AU7/6QFQ/+kBUf+sAVL/uAFl/9EBZv/RAWf/0QFo/9EBaf/RAWr/0QFr/9EBbP/RAIwADgArABD/3gAU/+AAFwAmABz/1gAh/6UAIv/fACP/lwAk/8gAJQBAACb/qgAoACsAKv/fACz/3wAu/94AMQAmADb/yAA4/9EAO/+XADz/2wA9/5UAPv/GAD8AOQBA/6EAev/WAHv/yACDACsAhAArAIX/1gCG/8gAjv/IAK7/qgCv/6EAsv+hALP/qgC0ACsAtQArALb/1gC3ACsAuQArAMD/1gDB/9YAwv/WAMP/3wDE/98Axf/fAMYAKwDHACsAyP/eAMv/1gDM/98AzQArAM4AKwDPACsA0AArANEAKwDSACsA0//fANT/3wDV/98A1v/fANf/3wDd/8gA3v/IAN//yADg/8gA4f/IAOL/2wDj/9sA5P/bAOX/2wDmACYA7AArAO0AKwDuACsA7wArAPAAKwDxACsA8gArAPMAKwD0/94A9f/fAPb/3gD3/98A+P/eAPn/3wD6/94A+//fAQH/3wED/98BBf/fAQf/3wEJ/98BCv/gAQv/3gEM/+ABDf/eAQ7/4AEP/94BEP/gARH/3gEiACYBIwAmATf/1gE4/8gBOf/WATr/yAE7/9YBPP/IAT3/1gE+/8gBS/+qAUz/oQFR/6oBUv+hAVP/pQFU/5cBVf+lAVf/pQFY/5cBWf/fAVr/2wFb/98BXP/bAV3/3wFe/9sBX//fAWD/2wFh/98BYv/bAWP/3wFk/9sBZf/IAWb/xgFn/8gBaP/GAWn/yAFq/8YBa//IAWz/xgB5AA7/qwAQ/9sAFP/cABf/TwAc/9gAIQAcACMAMwAkABAAJQAlACYADQAo/6sAKv/bACz/4gAu/9sAMf9PADb/5AA4/+IAOwAYAD0AQgA+ABQAPwAiAEAAQQBE/+gAaf7OAGr+1wB6/9gAe//kAIP/qwCE/6sAhf/YAIb/5ACO/+QArgANAK8AQQCyAEEAswANALT/qwC1/6sAtv/YALf/qwC5/6sAwP/YAMH/2ADC/9gAxv+rAMf/qwDI/9sAy//YAM3/qwDO/6sAz/+rAND/qwDR/6sA0v+rANP/2wDU/+IA1f/iANb/4gDX/+IA3f/kAN7/5ADf/+QA4P/kAOH/5ADm/08A7P+rAO3/qwDu/6sA7/+rAPD/qwDx/6sA8v+rAPP/qwD0/9sA9f/bAPb/2wD3/9sA+P/bAPn/2wD6/9sA+//bAQH/4gED/+IBBf/iAQf/4gEJ/+IBCv/cAQv/2wEM/9wBDf/bAQ7/3AEP/9sBEP/cARH/2wEi/08BI/9PATf/2AE4/+QBOf/YATr/5AE7/9gBPP/kAT3/2AE+/+QBSwANAUwAQQFRAA0BUgBBAVMAHAFUABgBVQAcAVcAHAFYABgBZQAQAWYAFAFnABABaAAUAWkAEAFqABQBawAQAWwAFAAmAA7/ugAX/0kAIQAcACj/ugAx/0kAOwAbAGn+8gBq/voAg/+6AIT/ugC0/7oAtf+6ALf/ugC5/7oAxv+6AMf/ugDN/7oAzv+6AM//ugDQ/7oA0f+6ANL/ugDm/0kA7P+6AO3/ugDu/7oA7/+6APD/ugDx/7oA8v+6APP/ugEi/0kBI/9JAVMAHAFUABsBVQAcAVcAHAFYABsAPAAO/90AIf+xACP/1AAk/+kAJf/IACb/vgAn/9kAKP/dAD3/1wA+/+wAP//HAED/vwBB/9UAg//dAIT/3QCu/74Ar/+/ALD/2QCx/9UAsv+/ALP/vgC0/90Atf/dALf/3QC5/90Axv/dAMf/3QDN/90Azv/dAM//3QDQ/90A0f/dANL/3QDs/90A7f/dAO7/3QDv/90A8P/dAPH/3QDy/90A8//dAUv/vgFM/78BTf/ZAU7/1QFP/9kBUP/VAVH/vgFS/78BU/+xAVX/sQFX/7EBZf/pAWb/7AFn/+kBaP/sAWn/6QFq/+wBa//pAWz/7AA6AA7/pAAX/3sAI//zACT/9gAl/7YAJv/ZACf/8QAo/6QAMf97AD7/9gA//8IAQP/uAGn/VwBq/2oAg/+kAIT/pACu/9kAr//uALD/8QCy/+4As//ZALT/pAC1/6QAt/+kALn/pADG/6QAx/+kAM3/pADO/6QAz/+kAND/pADR/6QA0v+kAOb/ewDs/6QA7f+kAO7/pADv/6QA8P+kAPH/pADy/6QA8/+kASL/ewEj/3sBS//ZAUz/7gFN//EBT//xAVH/2QFS/+4BZf/2AWb/9gFn//YBaP/2AWn/9gFq//YBa//2AWz/9gAWACP/4AAk/+kAJv/AAD3/5QA+/+kAQP/cAK7/wACv/9wAsv/cALP/wAFL/8ABTP/cAVH/wAFS/9wBZf/pAWb/6QFn/+kBaP/pAWn/6QFq/+kBa//pAWz/6QBdABD/8AAU//EAHP/tACD/9AAj/+UAJP/qACX/8AAm/8IAKv/vACz/7QAu//AANv/pADj/7QA6//QAPf/qAD7/6gA//+8AQP/eAGoADwB6/+0Ae//pAIX/7QCG/+kAjv/pAKz/9ACt//QArv/CAK//3gCy/94As//CALb/7QDA/+0Awf/tAML/7QDI//AAy//tANP/7wDU/+0A1f/tANb/7QDX/+0A3f/pAN7/6QDf/+kA4P/pAOH/6QD0//AA9f/vAPb/8AD3/+8A+P/wAPn/7wD6//AA+//vAQH/7QED/+0BBf/tAQf/7QEJ/+0BCv/xAQv/8AEM//EBDf/wAQ7/8QEP//ABEP/xARH/8AE3/+0BOP/pATn/7QE6/+kBO//tATz/6QE9/+0BPv/pAUX/9AFG//QBR//0AUj/9AFJ//QBSv/0AUv/wgFM/94BUf/CAVL/3gFl/+oBZv/qAWf/6gFo/+oBaf/qAWr/6gFr/+oBbP/qAD8ADv/kABf/6gAj/9IAJP/iACX/wwAm/7IAJ//qACj/5AAx/+oAPf/WAD7/4gA//74AQP+9AEH/6QBp/+QAav/mAIP/5ACE/+QArv+yAK//vQCw/+oAsf/pALL/vQCz/7IAtP/kALX/5AC3/+QAuf/kAMb/5ADH/+QAzf/kAM7/5ADP/+QA0P/kANH/5ADS/+QA5v/qAOz/5ADt/+QA7v/kAO//5ADw/+QA8f/kAPL/5ADz/+QBIv/qASP/6gFL/7IBTP+9AU3/6gFO/+kBT//qAVD/6QFR/7IBUv+9AWX/4gFm/+IBZ//iAWj/4gFp/+IBav/iAWv/4gFs/+IAHwA2/+kAOP/tADr/9AA9/+oAPv/qAD//7wBA/94Ae//pAIb/6QCO/+kArf/0AK//3gCy/94A3f/pAN7/6QDf/+kA4P/pAOH/6QE4/+kBOv/pATz/6QE+/+kBRv/0AUj/9AFK//QBTP/eAVL/3gFm/+oBaP/qAWr/6gFs/+oAAQAkAAQAAAANB3IHVAc2ByAGqgY0BaoD+AOeAuwB8gBAAEAAAgAEAAQADQAAAA8ADwAKAW4BbgALAXABcAAMAGwADv+mABD/1wAU/9gAF/9QABz/1QAhAAsAIwA3ACQAEwAlABsAKP+mACr/2AAs/90ALv/YADH/UAA2/+AAOP/eAD0AKgA/AAsAQAAsAET/5gBp/sgAav7RAHr/1QB7/+AAg/+mAIT/pgCF/9UAhv/gAI7/4ACvACwAsgAsALT/pgC1/6YAtv/VALf/pgC5/6YAwP/VAMH/1QDC/9UAxv+mAMf/pgDI/9cAy//VAM3/pgDO/6YAz/+mAND/pgDR/6YA0v+mANP/2ADU/90A1f/dANb/3QDX/90A3f/gAN7/4ADf/+AA4P/gAOH/4ADm/1AA7P+mAO3/pgDu/6YA7/+mAPD/pgDx/6YA8v+mAPP/pgD0/9cA9f/YAPb/1wD3/9gA+P/XAPn/2AD6/9cA+//YAQH/3QED/90BBf/dAQf/3QEJ/90BCv/YAQv/2AEM/9gBDf/YAQ7/2AEP/9gBEP/YARH/2AEi/1ABI/9QATf/1QE4/+ABOf/VATr/4AE7/9UBPP/gAT3/1QE+/+ABTAAsAVIALAFTAAsBVQALAVcACwFlABMBZwATAWkAEwFrABMAPgAQ//AAFP/xABz/7QAg//QAI//lACT/6gAl//AAJv/CACr/7wAs/+0ALv/wAGoADwB6/+0Ahf/tAKz/9ACu/8IAs//CALb/7QDA/+0Awf/tAML/7QDI//AAy//tANP/7wDU/+0A1f/tANb/7QDX/+0A9P/wAPX/7wD2//AA9//vAPj/8AD5/+8A+v/wAPv/7wEB/+0BA//tAQX/7QEH/+0BCf/tAQr/8QEL//ABDP/xAQ3/8AEO//EBD//wARD/8QER//ABN//tATn/7QE7/+0BPf/tAUX/9AFH//QBSf/0AUv/wgFR/8IBZf/qAWf/6gFp/+oBa//qACwADv/RABf/5gAj/+cAJf/fACb/ygAo/9EAMf/mAD//3wBA/90Aaf/fAGr/5ACD/9EAhP/RAK7/ygCv/90Asv/dALP/ygC0/9EAtf/RALf/0QC5/9EAxv/RAMf/0QDN/9EAzv/RAM//0QDQ/9EA0f/RANL/0QDm/+YA7P/RAO3/0QDu/9EA7//RAPD/0QDx/9EA8v/RAPP/0QEi/+YBI//mAUv/ygFM/90BUf/KAVL/3QAWACP/5AAk/+gAJv/LAD3/6gA+/+gAQP/iAK7/ywCv/+IAsv/iALP/ywFL/8sBTP/iAVH/ywFS/+IBZf/oAWb/6AFn/+gBaP/oAWn/6AFq/+gBa//oAWz/6ABsAA7/nAAQ/9sAFP/hABf/kQAc/9YAIQALACMANQAkAAwAJQAbACj/nAAq/9wALP/mAC7/3gAx/5EANv/mADj/5gA9ADMAPwAUAEAANwBE/+MAaf+vAGr/sgB6/9YAe//mAIP/nACE/5wAhf/WAIb/5gCO/+YArwA3ALIANwC0/5wAtf+cALb/1gC3/5wAuf+cAMD/1gDB/9YAwv/WAMb/nADH/5wAyP/bAMv/1gDN/5wAzv+cAM//nADQ/5wA0f+cANL/nADT/9wA1P/mANX/5gDW/+YA1//mAN3/5gDe/+YA3//mAOD/5gDh/+YA5v+RAOz/nADt/5wA7v+cAO//nADw/5wA8f+cAPL/nADz/5wA9P/bAPX/3AD2/9sA9//cAPj/2wD5/9wA+v/bAPv/3AEB/+YBA//mAQX/5gEH/+YBCf/mAQr/4QEL/94BDP/hAQ3/3gEO/+EBD//eARD/4QER/94BIv+RASP/kQE3/9YBOP/mATn/1gE6/+YBO//WATz/5gE9/9YBPv/mAUwANwFSADcBUwALAVUACwFXAAsBZQAMAWcADAFpAAwBawAMACIAFAALACH/1QAj/+AAJP/dACb/xAA7/9QAPf/eAD7/2wBA/94Arv/EAK//3gCy/94As//EAQoACwEMAAsBDgALARAACwFL/8QBTP/eAVH/xAFS/94BU//VAVT/1AFV/9UBV//VAVj/1AFl/90BZv/bAWf/3QFo/9sBaf/dAWr/2wFr/90BbP/bAB0AIf/nACP/6AAk/+QAJv/KADv/5QA9/+gAPv/jAED/5wCu/8oAr//nALL/5wCz/8oBS//KAUz/5wFR/8oBUv/nAVP/5wFU/+UBVf/nAVf/5wFY/+UBZf/kAWb/4wFn/+QBaP/jAWn/5AFq/+MBa//kAWz/4wAdAA7/7AAm/+QAKP/sAIP/7ACE/+wArv/kALP/5AC0/+wAtf/sALf/7AC5/+wAxv/sAMf/7ADN/+wAzv/sAM//7ADQ/+wA0f/sANL/7ADs/+wA7f/sAO7/7ADv/+wA8P/sAPH/7ADy/+wA8//sAUv/5AFR/+QABQAm/90Arv/dALP/3QFL/90BUf/dAAcAJQAQACb/1AA/AA0Arv/UALP/1AFL/9QBUf/UAAcAIwAhAD0AHABAAB8ArwAfALIAHwFMAB8BUgAfADIADv/WACP/0QAk/+MAJf/ZACb/uAAo/9YAPf/UAD7/4wA//9cAQP/EAGn/5gBq/+wAg//WAIT/1gCu/7gAr//EALL/xACz/7gAtP/WALX/1gC3/9YAuf/WAMb/1gDH/9YAzf/WAM7/1gDP/9YA0P/WANH/1gDS/9YA7P/WAO3/1gDu/9YA7//WAPD/1gDx/9YA8v/WAPP/1gFL/7gBTP/EAVH/uAFS/8QBZf/jAWb/4wFn/+MBaP/jAWn/4wFq/+MBa//jAWz/4wABAjwABAAAARkUZhRUFEoUNBQqFBAT5hOgE4YTZBLaEqQSghJQEe4RjBFOESwRChDkEGoQIBAKD/QPpg9cDw4O/A7GDmgOOg24DUIMvAwqC/AS2hKkC8oLmAtiCwQKvgqcCoIQ5An0CaYJjAluCSgI1g8ODvwIqAhOCBAHhgcQBoYF6AWuBZQFlAWUBY4FXAWOBVwFRgVGBTwFMgUcBPIE2ASWBFgELgQIA/oD4APWA8wPpgkoA6oDnBJQCSgQIAmmCoIIqAOGA4AFPAUyA2YDVANGAyQOxgioDCoF6AvwBa4F6AwqEtoS2g+mEtoR7hLaEe4R7hEKEQoRChEKD6YPpg+mDjoOOg46EtoS2hKCEe4P9A+mDjoS2hLaEtoS2hLaEtoLygtiC2ILYgtiCoIKggqCCoIJbgkoCSgJKAkoCSgIEAgQCBAIEBDkEtoS2hLaEtoS2hLaEoILyhKCC8oSggvKEoILyhJQC5gSUBHuC2IR7gtiEe4LYhHuC2IR7gtiEU4KvhFOCr4RTgq+EU4KvhEsCpwRLAqcCfQRCgqCEQoKghEKCoIRCgqCEQoQ5BDkEGoJ9BAgCaYQIAmmD/QJbg/0CW4P9AluD/QJbg+mCSgPpgkoD6YJKA+mCSgO/A78DvwO/A78DvwOxgioDsYIqA7GCKgMKgXoC/AFrgvwBa4MKgXo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)", { weight: '400', display: 'swap' }); document.fonts.add(face); face.load().catch(() => {}); }
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
      :host { color-scheme: light !important; --abp-ink:#2c3340; --abp-muted:#87909d; --abp-gold:#b39543; }
      * { font-family:'Lilita One','Trebuchet MS',system-ui,sans-serif !important; font-weight:400 !important; }
      .abp-title,.g-title,.val-pred,.ap-signal-val,.btn-start,.btn-gold { font-family:'Luckiest Guy','Lilita One',cursive !important; font-weight:400 !important; }
      #abp-widget-container { padding-top:24px !important; }
      #abp-widget { width:min(242px,calc(100vw - 24px)) !important; background:#fff !important; border:1px solid #e6ddc6 !important; border-radius:20px !important; box-shadow:0 14px 48px #17233424,0 2px 9px #17233412 !important; }
      #abp-widget.expanded { width:min(310px,calc(100vw - 24px)) !important; max-height:calc(100dvh - 36px) !important; }
      .abp-header { padding:12px 11px !important; gap:7px !important; background:linear-gradient(125deg,#fff,#fffdf6) !important; border-bottom:1px solid #f0ece2 !important; }
      .abp-header>div:first-child { gap:7px !important; flex:1 !important; }
      .abp-brand { display:flex !important; gap:1px !important; align-items:center !important; min-width:0 !important; }
      .abp-brand>img { width:24px !important; height:28px !important; object-fit:contain !important; pointer-events:none !important; }
      .abp-title { color:#343b47 !important; font-size:16px !important; font-weight:850 !important; letter-spacing:-.7px !important; line-height:1 !important; }
      .abp-brand-sub { display:block !important; color:#9b936f !important; font-size:6px !important; letter-spacing:1.1px !important; font-weight:750 !important; margin-top:4px !important; }
      #abp-head-btns { gap:4px !important; }
      .abp-close-btn,.abp-exp-btn { width:28px !important; height:28px !important; border:1px solid #e9e7e1 !important; border-radius:9px !important; color:#7d8794 !important; background:#fff !important; box-shadow:none !important; font-weight:500 !important; }
      .abp-exp-btn svg { width:12px !important; height:12px !important; }
      .ap-live-pill,#abp-widget.compact .ap-live-pill { display:inline-flex !important; font-size:7px !important; letter-spacing:.5px !important; padding:4px 5px !important; gap:3px !important; border-color:#ece8df !important; background:#f8f8f6 !important; }
      .dot-indicator { width:5px !important; height:5px !important; }
      .ap-live-pill.on { background:#edf9f1 !important; color:#278553 !important; border-color:#d7edde !important; }
      .ap-body { align-items:stretch !important; padding:12px !important; gap:9px !important; }
      .ap-kicker { display:flex !important; justify-content:space-between !important; font-size:7px !important; letter-spacing:1px !important; font-weight:750 !important; color:#a08a45 !important; }
      .ap-drag-hint { color:#b1b6bd !important; letter-spacing:.7px !important; }
      .ap-period { background:#f8f9fb !important; border:1px solid #eef0f4 !important; padding:10px !important; border-radius:11px !important; }
      .ap-period-val { font-size:11px !important; font-weight:650 !important; color:#596576 !important; letter-spacing:.3px !important; font-variant-numeric:tabular-nums !important; margin-top:4px !important; }
      .ap-label { font-size:7px !important; letter-spacing:1.2px !important; color:#929aa5 !important; }
      .ap-signal { position:relative !important; border:1px solid #ecdfb9 !important; background:linear-gradient(135deg,#fffdf4,#fff) !important; border-radius:13px !important; padding:13px !important; box-shadow:none !important; }
      .ap-signal-val { font-size:31px !important; font-weight:800 !important; letter-spacing:-.8px !important; color:#a18332 !important; margin-top:7px !important; line-height:1.2 !important; }
      .ap-amount { display:flex !important; align-items:center !important; justify-content:space-between !important; padding:10px !important; border:1px solid #edf0f3 !important; background:#fff !important; border-radius:10px !important; }
      .ap-amount-val { color:#3d4958 !important; font-weight:750 !important; font-size:14px !important; margin:0 !important; font-variant-numeric:tabular-nums !important; }
      .ap-quick-actions { display:grid !important; grid-template-columns:1fr 70px !important; gap:7px !important; }
      .ap-quick-actions button { min-height:32px !important; border:1px solid #e6e8ec !important; border-radius:9px !important; background:#f9fafb !important; color:#6c7888 !important; font-size:9px !important; font-weight:650 !important; cursor:pointer !important; }
      .ap-quick-actions #abp-compact-stop { color:#b75650 !important; border-color:#f1e0dd !important; background:#fff9f8 !important; }
      #abp-main { overflow-y:auto !important; padding:12px !important; gap:10px !important; overscroll-behavior:contain !important; touch-action:pan-y !important; }
      .abp-card { border:1px solid #eaecef !important; border-radius:13px !important; background:#fff !important; box-shadow:none !important; padding:12px !important; gap:10px !important; flex-shrink:0 !important; }
      #abp-main>.abp-card:first-child { border-color:#ebdfb8 !important; background:linear-gradient(135deg,#fffdf6,#fff) !important; }
      .abp-label-sm { color:#8f99a7 !important; font-size:8px !important; font-weight:650 !important; letter-spacing:.7px !important; }
      .abp-period-val { color:#717d8b !important; font-size:10px !important; letter-spacing:.1px !important; font-weight:650 !important; }
      .val-pred { font-size:28px !important; line-height:1.2 !important; color:#a08332 !important; font-weight:800 !important; letter-spacing:-.6px !important; }
      .val-timer { color:#475364 !important; font-size:18px !important; font-weight:750 !important; font-variant-numeric:tabular-nums !important; }
      .sig-badge,.sig-badge.max { font-size:8px !important; font-weight:650 !important; border-radius:5px !important; background:#f6f3e9 !important; color:#9c853e !important; border:1px solid #eae2c8 !important; }
      .val-bold { color:#3d4958 !important; font-size:15px !important; font-weight:750 !important; font-variant-numeric:tabular-nums !important; }
      #abp-target-input { width:84px !important; flex-shrink:0 !important; }
      .abp-flex-row>.abp-label-sm { flex-shrink:0 !important; white-space:nowrap !important; }
      .abp-input-help { font-size:9px !important; color:#a1a8b2 !important; line-height:1.5 !important; }
      .lvl-row { gap:4px !important; }
      .lvl-chip { padding:7px 0 !important; background:#fafbfc !important; border:1px solid #e9ebee !important; border-radius:7px !important; color:#8a94a2 !important; font-size:10px !important; font-weight:700 !important; }
      .lvl-chip.on { color:#866a22 !important; background:#fff6d7 !important; border-color:#e5cc7c !important; box-shadow:none !important; }
      .abp-input { padding:8px !important; background:#f9fafb !important; border:1px solid #e8ebef !important; color:#465365 !important; font-size:11px !important; border-radius:8px !important; }
      .abp-controls { position:sticky !important; bottom:0 !important; background:#fff !important; padding-top:2px !important; flex-shrink:0 !important; }
      .btn-start,.btn-gold { font-weight:750 !important; font-size:11px !important; letter-spacing:.3px !important; border-radius:10px !important; background:linear-gradient(120deg,#b99a42,#94742b) !important; box-shadow:0 4px 12px #ac8b3526 !important; color:#fff !important; }
      .btn-start.running { background:#fff8e4 !important; border:1px solid #e6d69e !important; color:#987a2d !important; box-shadow:none !important; }
      .btn-stop { background:#fff8f7 !important; border:1px solid #eed9d5 !important; color:#ba5f54 !important; border-radius:10px !important; }
      #abp-gate { margin:12px !important; padding:16px 12px !important; gap:12px !important; border:1px solid #eee4c7 !important; border-radius:14px !important; background:linear-gradient(140deg,#fffdf5,#fff) !important; }
      .g-icon { width:38px !important; height:38px !important; margin:0 auto !important; display:grid !important; place-items:center !important; border:1px solid #ebdca9 !important; border-radius:12px !important; color:#ad8d32 !important; background:#fff8df !important; }
      .g-title { color:#485262 !important; font-size:12px !important; line-height:1.4 !important; font-weight:750 !important; letter-spacing:-.2px !important; }
      .g-sub { color:#939ba7 !important; font-size:9px !important; line-height:1.65 !important; font-weight:450 !important; }
      #abp-ball { width:48px !important; height:48px !important; background:#fff !important; border:1px solid #dfca88 !important; box-shadow:0 6px 24px #24304326,0 0 0 4px #c3a34719 !important; }
      #abp-ball img { animation:none !important; width:27px !important; height:30px !important; border-radius:0 !important; }
      button:focus-visible,input:focus-visible { outline:2px solid #b99a42 !important; outline-offset:2px !important; }
      @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } }
      #abp-widget { border-radius:16px !important; box-shadow:0 12px 32px #17233422,0 0 0 3px #c6a3480b !important; animation:abp-reveal .32s cubic-bezier(.16,1,.3,1) both !important; }
      .abp-header { padding:8px 10px !important; background:linear-gradient(110deg,#fff,#fff9e9,#fff) !important; background-size:200% 100% !important; }
      .abp-title { font-size:14px !important; }
      .abp-brand>img { width:21px !important; height:24px !important; }
      .abp-brand-sub { font-size:5.5px !important; margin-top:3px !important; }
      .ap-body { display:grid !important; grid-template-columns:minmax(0,1.45fr) minmax(0,1fr) !important; padding:9px !important; gap:6px !important; }
      .ap-kicker { display:none !important; }
      .ap-period { grid-column:1/-1 !important; display:flex !important; align-items:center !important; justify-content:space-between !important; padding:6px 8px !important; border:none !important; background:#f5f6f8 !important; border-radius:6px !important; }
      .ap-period-val { margin:0 !important; font-size:9px !important; letter-spacing:0 !important; }
      .ap-label { font-size:6px !important; letter-spacing:1px !important; }
      .ap-signal { padding:9px 6px !important; border-radius:10px !important; overflow:hidden !important; background:linear-gradient(125deg,#fff4ce,#fffdfa 70%) !important; }
      .ap-signal::after { content:'' !important; position:absolute !important; inset:0 !important; background:linear-gradient(110deg,transparent 35%,#ffffffa0 48%,transparent 61%) !important; transform:translateX(-120%); animation:abp-sheen 5s ease-in-out infinite !important; pointer-events:none !important; }
      .ap-signal-val { font-size:21px !important; margin-top:4px !important; letter-spacing:-.7px !important; }
      .ap-amount { display:flex !important; flex-direction:column !important; justify-content:center !important; gap:7px !important; padding:8px 5px !important; border-radius:10px !important; background:#f8f9fb !important; }
      .ap-amount-val { font-size:14px !important; max-width:100% !important; overflow-wrap:anywhere !important; }
      .ap-quick-actions { grid-column:1/-1 !important; grid-template-columns:1fr 65px !important; gap:6px !important; }
      .ap-quick-actions button { min-height:28px !important; font-size:8px !important; border-radius:7px !important; transition:background .18s ease,transform .18s ease !important; }
      #abp-widget.expanded { width:min(290px,calc(100vw - 24px)) !important; }
      #abp-main { padding:8px !important; gap:6px !important; animation:abp-reveal .24s ease both !important; }
      .abp-card { padding:9px !important; gap:6px !important; border-radius:10px !important; }
      .val-pred { font-size:23px !important; }
      .val-timer { font-size:15px !important; }
      .abp-label-sm { font-size:7px !important; }
      .lvl-wrap { gap:5px !important; }
      .abp-input-help { font-size:8px !important; line-height:1.2 !important; }
      .lvl-chip { padding:5px 0 !important; font-size:9px !important; border-radius:5px !important; transition:background .18s ease,box-shadow .18s ease,transform .18s ease !important; }
      .lvl-chip.on { box-shadow:0 2px 7px #b99a4224 !important; }
      .abp-input { padding:5px 7px !important; }
      .btn-start,.btn-gold { padding:10px 0 !important; font-size:10px !important; }
      .btn-stop { width:34px !important; }
      .abp-controls { gap:6px !important; }
      .abp-card>div[style] { font-size:8px !important; line-height:1.35 !important; }
      #abp-ball { animation:abp-orbit 3s ease-in-out infinite !important; }
      @media(hover:hover) { button:hover { filter:brightness(.97) !important; } .lvl-chip:hover { transform:translateY(-1px) !important; } }
      button:active { transform:scale(.97) !important; }
      @keyframes abp-reveal { from { opacity:0; translate:0 7px; } to { opacity:1; translate:0 0; } }
      @keyframes abp-sheen { 0%,65% { transform:translateX(-120%); } 100% { transform:translateX(120%); } }
      @keyframes abp-orbit { 0%,100% { box-shadow:0 6px 24px #24304326,0 0 0 3px #c3a34712; } 50% { box-shadow:0 6px 24px #24304326,0 0 0 6px #c3a34726; } }
      @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } }
      #abp-widget * { font-weight:400 !important; }
      #abp-widget .abp-title,#abp-widget .val-pred,#abp-widget .ap-signal-val { letter-spacing:.035em !important; }
      #abp-widget.compact .ap-live-pill { display:none !important; }
      #abp-compact-toggle { color:#fff !important; background:linear-gradient(125deg,#c1a347,#98742b) !important; border-color:#b89b43 !important; }
      #abp-compact-toggle.running { color:#b75650 !important; background:#fff4ef !important; border-color:#edcec5 !important; }
      .abp-level-heading { display:flex !important; align-items:center !important; justify-content:space-between !important; color:#9c9b92 !important; font-size:9px !important; }
      #abp-level-value { color:#a1802e !important; font-size:12px !important; }
      #abp-level-slider { appearance:none !important; -webkit-appearance:none !important; display:block !important; width:100% !important; height:22px !important; margin:0 !important; background:transparent !important; cursor:pointer !important; touch-action:pan-y !important; --level-fill:100%; }
      #abp-level-slider::-webkit-slider-runnable-track { height:5px; border-radius:9px; background:linear-gradient(to right,#b99a42 var(--level-fill),#edeef0 var(--level-fill)); }
      #abp-level-slider::-moz-range-track { height:5px; border-radius:9px; background:linear-gradient(to right,#b99a42 var(--level-fill),#edeef0 var(--level-fill)); }
      #abp-level-slider::-webkit-slider-thumb { appearance:none; -webkit-appearance:none; width:16px; height:16px; margin-top:-5.5px; border-radius:50%; background:#fff; border:3px solid #b99a42; box-shadow:0 1px 5px #a0803033; }
      #abp-level-slider::-moz-range-thumb { width:10px; height:10px; border-radius:50%; background:#fff; border:3px solid #b99a42; box-shadow:0 1px 5px #a0803033; }
      .abp-brand>img { transform:translateY(-3px) !important; }
      #abp-widget.expanded { width:min(280px,calc(100vw - 24px)) !important; }
      .abp-stake-card { display:grid !important; grid-template-columns:minmax(0,1fr) 70px !important; align-items:center !important; gap:3px 10px !important; width:calc(100% - 8px) !important; align-self:center !important; padding:6px 8px !important; }
      .abp-stake-card>.abp-flex-row:first-child { grid-column:1/-1 !important; }
      .abp-stake-card .lvl-wrap { gap:0 !important; min-width:0 !important; }
      .abp-stake-card .abp-input-help,.abp-stake-card .lvl-wrap>.abp-label-sm { display:none !important; }
      .abp-stake-card>.abp-flex-row:last-child { flex-direction:column !important; align-items:flex-end !important; gap:3px !important; }
      .abp-stake-card #abp-target-input { width:68px !important; height:24px !important; padding:3px 6px !important; }
      .abp-stake-card #abp-level-slider { height:22px !important; }
      .abp-stake-card #abp-level-value { font-size:10px !important; }
      #abp-widget.expanded { width:min(284px,calc(100vw - 24px)) !important; border-radius:17px !important; }
      #abp-main { background:linear-gradient(165deg,#fffdf6 0%,#f7f8fa 65%) !important; padding:9px !important; gap:8px !important; }
      .abp-signal-card { display:grid !important; grid-template-columns:minmax(0,1fr) 64px !important; gap:8px !important; background:#fff !important; border:1px solid #eadfbf !important; padding:10px !important; box-shadow:0 3px 12px #9b803409 !important; }
      .abp-signal-card>.abp-flex-row:first-child { grid-column:1/-1 !important; padding-bottom:6px !important; border-bottom:1px dashed #ede5d1 !important; }
      .abp-signal-card .sig-mid { flex-wrap:wrap !important; justify-content:flex-start !important; gap:5px !important; }
      .abp-signal-card .val-pred { font-size:21px !important; }
      .abp-signal-card>.abp-flex-row:last-child { flex-direction:column !important; justify-content:center !important; gap:4px !important; border-left:1px solid #f0ede5 !important; }
      .abp-signal-card .val-timer { font-size:16px !important; }
      .abp-signal-card .abp-period-val { font-size:9px !important; }
      .abp-stake-card { width:100% !important; grid-template-columns:minmax(0,1fr) 66px !important; padding:8px 10px !important; gap:5px 12px !important; border:1px solid #e6e8ec !important; background:#fff !important; border-radius:11px !important; }
      .abp-stake-card>.abp-flex-row:first-child { padding-bottom:4px !important; border-bottom:1px solid #f2f3f5 !important; }
      .abp-stake-card #abp-target-input { width:66px !important; border-color:#e8e3d4 !important; background:#fffdf6 !important; }
      .abp-level-heading { font-size:7px !important; line-height:12px !important; }
      #abp-level-value { color:var(--level-color,#299566) !important; }
      .abp-level-track { position:relative !important; height:30px !important; width:100% !important; --level-color:#299566; }
      .abp-level-ticks { position:absolute !important; inset:5px 6px !important; display:flex !important; align-items:center !important; justify-content:space-between !important; pointer-events:none !important; }
      .abp-level-ticks i { display:block !important; width:2px !important; height:13px !important; background:var(--tick-color) !important; opacity:.27 !important; border-radius:1px !important; transition:opacity .18s ease !important; }
      .abp-level-ticks i:nth-child(5n+1) { height:19px !important; }
      .abp-level-ticks i.active { opacity:1 !important; }
      .abp-stake-card #abp-level-slider { position:absolute !important; inset:0 !important; height:30px !important; z-index:1 !important; }
      #abp-level-slider::-webkit-slider-runnable-track { height:24px; background:transparent; border:none; }
      #abp-level-slider::-moz-range-track { height:24px; background:transparent; border:none; }
      #abp-level-slider::-webkit-slider-thumb { width:12px; height:26px; margin-top:-1px; border:2px solid var(--level-color); border-radius:4px; background:#fffdf6; box-shadow:0 2px 6px #24304326; }
      #abp-level-slider::-moz-range-thumb { width:8px; height:22px; border:2px solid var(--level-color); border-radius:4px; background:#fffdf6; box-shadow:0 2px 6px #24304326; }
      .abp-controls { background:transparent !important; gap:7px !important; }
      .btn-start { height:34px !important; border-radius:9px !important; box-shadow:0 3px 8px #b99a4224 !important; }
      .btn-stop { height:34px !important; width:34px !important; border-radius:9px !important; }
      .abp-brand>img { transform:translateY(-10px) !important; }
      .abp-level-track { overflow:hidden !important; touch-action:none !important; cursor:grab !important; }
      .abp-level-track.dragging { cursor:grabbing !important; }
      .abp-level-ticks { inset:auto !important; top:5px !important; left:50% !important; width:240px !important; height:20px !important; transform:translateX(calc(var(--ruler-offset, -240px) - 1px)) !important; transition:transform .12s ease-out !important; }
      .abp-level-ticks i { flex:0 0 2px !important; }
      .abp-ruler-marker { position:absolute !important; left:50% !important; top:2px !important; width:14px !important; height:26px !important; transform:translateX(-50%) !important; border-left:2px solid var(--level-color) !important; border-right:2px solid var(--level-color) !important; border-radius:4px !important; background:#fffdf644 !important; z-index:2 !important; pointer-events:none !important; }
      .abp-stake-card #abp-level-slider { opacity:0 !important; pointer-events:none !important; }
      .abp-level-track:focus-within .abp-ruler-marker { outline:1px solid #b99a4266 !important; outline-offset:2px !important; }
      @media(prefers-reduced-motion:reduce) { .abp-level-ticks { transition:none !important; } }
      @media(max-height:480px) { #abp-widget-container { padding-top:8px !important; } #abp-widget { max-height:calc(100dvh - 20px) !important; } #abp-widget.expanded { max-height:calc(100dvh - 20px) !important; } }
    `;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.id = 'abp-widget-container';
        container.innerHTML = `
      <div id="abp-widget">
        <div class="abp-header" id="abp-header">
          <div style="display:flex; align-items:center; gap:8px; min-width:0;">
            <div class="abp-brand"><img src="data:image/png;base64,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" width="24" height="28" alt=""/><div><div class="abp-title">RAGO</div><span class="abp-brand-sub">AUTO BET PRO</span></div></div>
            <span class="ap-live-pill" id="abp-live-pill"><span id="abp-status-dot" class="dot-indicator dot-off"></span><span id="abp-live-text">OFF</span></span>
          </div>
          <div id="abp-head-btns">
            <button class="abp-exp-btn" id="abp-expand" aria-label="Expand or collapse controls" title="Expand"><svg viewBox="0 0 24 24" fill="none" stroke="#2a2116" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg></button>
            <button class="abp-close-btn" id="abp-minimize" aria-label="Minimize panel" title="Minimize">−</button>
          </div>
        </div>

        <div id="abp-compact">
          <div class="ap-body"><div class="ap-kicker"><span>GAME ASSISTANT</span><span class="ap-drag-hint">⠿ DRAG</span></div>
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
            <div class="ap-quick-actions"><button id="abp-compact-details" type="button">Controls <span aria-hidden="true">↗</span></button><button id="abp-compact-toggle" type="button" aria-label="Turn auto bet on" aria-pressed="false">► ON</button></div>
          </div>
        </div>

        <div id="abp-gate">
          <div class="g-icon">⌁</div>
          <div class="g-title">Connect your DRAGO account</div>
          <div class="g-sub">Open this game from DRAGO Gameplay. Your Pro access is checked securely; no key is needed.</div>
          <button class="btn-gold" id="abp-gate-btn">🔄 RETRY CHECK</button>
          <span class="abp-label-sm" id="abp-gate-status" style="font-size:10px;">🔐 App me PRO login hona chahiye</span>
        </div>

        <div id="abp-main">
          <div class="abp-card abp-signal-card">
            <div class="abp-flex-row">
              <span class="abp-label-sm">SIGNAL</span>
              <span class="abp-period-val" id="abp-pred-period">---</span>
            </div>
            <div class="sig-mid">
              <span class="val-pred" id="abp-pred-value">WAIT...</span>
              <span class="sig-badges"><span class="sig-badge" id="abp-pred-level-badge">Lv 1</span></span>
            </div>
            <div class="abp-flex-row">
              <span class="abp-label-sm">TIME LEFT</span>
              <span class="val-timer" id="abp-timer">00:--</span>
            </div>
          </div>

          <div class="abp-card abp-stake-card">
            <div class="abp-flex-row"><span class="abp-label-sm">BALANCE</span><span class="val-bold" id="abp-balance">₹0.00</span></div>
            <div class="lvl-wrap">
              <span class="abp-label-sm">STAKE LEVELS</span><span class="abp-input-help">Balance is split across the selected levels.</span>
              <div class="abp-level-heading"><span>1</span><output id="abp-level-value" for="abp-level-slider">Lv 9</output><span>9</span></div>
              <div class="abp-level-track"><div class="abp-level-ticks" aria-hidden="true"><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d45b58"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#d8ad35"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#a8afb9"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i><i style="--tick-color:#269c69"></i></div><span class="abp-ruler-marker" aria-hidden="true"></span><input id="abp-level-slider" type="range" min="1" max="9" step="1" value="9" aria-label="Stake level" /></div>
            </div>
            <div class="abp-flex-row"><span class="abp-label-sm">TARGET ₹</span><input class="abp-input" id="abp-target-input" type="number" min="10" value="500" style="width:84px;text-align:right;" /></div>
          </div>

          <div class="abp-controls">
            <button class="btn-start" id="abp-toggle">► START</button>
            <button class="btn-stop" id="abp-stop-btn" aria-label="Stop auto bet" title="Stop">■</button>
          </div>

        </div>

      </div>
    `;
    shadow.appendChild(container);

    const ball = document.createElement('div');
    ball.id = 'abp-ball';
    ball.innerHTML = '<img src="data:image/png;base64,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" alt="Open DRAGO panel" />'; 
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
    sGet('abp-compact-toggle').addEventListener('click', () => { sGet('abp-toggle').click(); });
    sGet('abp-compact-details').addEventListener('click', () => { sGet('abp-expand').click(); });

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

    const levelSlider = sGet('abp-level-slider');
    ['mousedown','touchstart','pointerdown'].forEach(ev => levelSlider.addEventListener(ev, e => e.stopPropagation()));
    levelSlider.addEventListener('input', function (e) {
      e.stopPropagation();
      const n = Number(levelSlider.value);
      if (Number.isInteger(n) && n >= 1 && n <= 9) {
        maxLevelUser = n;
        localStorage.setItem('abp_max_level', String(n));
        renderLevelChips();
      }
    });
    const levelTrack = levelSlider.parentElement;
    let rulerDrag = null;
    ['mousedown','touchstart'].forEach(ev => levelTrack.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
    levelTrack.addEventListener('pointerdown', function (e) {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.stopPropagation();
      e.preventDefault();
      levelSlider.focus({ preventScroll: true });
      rulerDrag = { id: e.pointerId, x: e.clientX, level: maxLevelUser };
      levelTrack.setPointerCapture(e.pointerId);
      levelTrack.classList.add('dragging');
    });
    levelTrack.addEventListener('pointermove', function (e) {
      if (!rulerDrag || e.pointerId !== rulerDrag.id) return;
      e.stopPropagation();
      const n = Math.max(1, Math.min(9, Math.round(rulerDrag.level - (e.clientX - rulerDrag.x) / 30)));
      if (n === maxLevelUser) return;
      levelSlider.value = String(n);
      levelSlider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    function endRulerDrag(e) {
      if (!rulerDrag || e.pointerId !== rulerDrag.id) return;
      rulerDrag = null;
      levelTrack.classList.remove('dragging');
      if (levelTrack.hasPointerCapture(e.pointerId)) levelTrack.releasePointerCapture(e.pointerId);
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev => levelTrack.addEventListener(ev, endRulerDrag));
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
       
      if (helloTimer) clearInterval(helloTimer);
      helloTimer = setInterval(function () {
        if (keyState !== 'ok') { bridgeHello(); } else { clearInterval(helloTimer); helloTimer = null; }
      }, 3000);
    });
  }

  if (document.readyState==='complete'||document.readyState==='interactive') createWidget();
  else window.addEventListener('DOMContentLoaded', createWidget);
})();
