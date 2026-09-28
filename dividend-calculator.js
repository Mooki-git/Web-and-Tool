/* =========================================================
   배당금 계산기 (2026년 기준)
   - 재투자 시뮬레이션: 주가는 변동 없다고 가정(보수적)하고, 매월 초 납입 +
     매달 발생하는 배당금을 재투자할지 여부만 반영. 배당수익률은 연 배당성장률만큼
     매년 복리로 늘어난다고 가정(예: SCHD처럼 주당 배당금이 매년 성장하는 경우).
   - 목표 배당금 역산: 목표 월 배당금(세후)을 세전으로 환산한 뒤 배당수익률로 나눠
     필요한 투자원금을 계산.
   - 해외 ETF 배당 기준 미국 원천징수 15%를 가정해 세전/세후를 함께 표시.
   ========================================================= */

var US_WITHHOLDING = 0.15;
var MAX_MONTHS = 480; // 40년 — 배당성장률을 장기간 복리로 적용하면 비현실적으로 커질 수 있어 상한을 둠

function simulateReinvest(initial, monthly, yieldPercent, growthPercent, months, reinvest) {
  months = Math.round(months);
  if (!(months > 0)) return { valid: false };
  if (!(initial > 0) && !(monthly > 0)) return { valid: false };

  var balance = initial > 0 ? initial : 0;
  var cashDividends = 0;
  var schedule = [];

  for (var m = 1; m <= months; m++) {
    if (monthly > 0) balance += monthly;

    var yearIndex = Math.floor((m - 1) / 12);
    var effectiveAnnualYield = (yieldPercent / 100) * Math.pow(1 + growthPercent / 100, yearIndex);
    var monthlyDividend = balance * (effectiveAnnualYield / 12);

    if (reinvest) {
      balance += monthlyDividend;
    } else {
      cashDividends += monthlyDividend;
    }

    if (m % 12 === 0 || m === months) {
      schedule.push({
        year: Math.ceil(m / 12),
        months: m,
        principal: (initial > 0 ? initial : 0) + monthly * m,
        balance: balance,
        cashDividends: cashDividends,
        annualYieldPercent: effectiveAnnualYield * 100
      });
    }
  }

  var totalPrincipal = (initial > 0 ? initial : 0) + monthly * months;
  var finalYearIndex = Math.floor((months - 1) / 12);
  var finalEffectiveAnnualYield = (yieldPercent / 100) * Math.pow(1 + growthPercent / 100, finalYearIndex);
  var annualDividendPreTax = balance * finalEffectiveAnnualYield;
  var monthlyDividendPreTax = annualDividendPreTax / 12;

  return {
    valid: true,
    totalPrincipal: totalPrincipal,
    finalBalance: balance,
    reinvestedGrowth: reinvest ? balance - totalPrincipal : 0,
    cashDividends: reinvest ? 0 : cashDividends,
    annualDividendPreTax: annualDividendPreTax,
    annualDividendAfterTax: annualDividendPreTax * (1 - US_WITHHOLDING),
    monthlyDividendPreTax: monthlyDividendPreTax,
    monthlyDividendAfterTax: monthlyDividendPreTax * (1 - US_WITHHOLDING),
    finalYieldPercent: finalEffectiveAnnualYield * 100,
    schedule: schedule
  };
}

function reverseTarget(targetMonthlyAfterTax, yieldPercent) {
  if (!(targetMonthlyAfterTax > 0) || !(yieldPercent > 0)) return { valid: false };
  var targetAnnualAfterTax = targetMonthlyAfterTax * 12;
  var targetAnnualPreTax = targetAnnualAfterTax / (1 - US_WITHHOLDING);
  var requiredPrincipal = targetAnnualPreTax / (yieldPercent / 100);
  return {
    valid: true,
    targetAnnualAfterTax: targetAnnualAfterTax,
    targetAnnualPreTax: targetAnnualPreTax,
    requiredPrincipal: requiredPrincipal
  };
}

/* ---------- 숫자 포맷/입력 ---------- */
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function onlyDecimal(s) {
  s = String(s).replace(/[^0-9.]/g, '');
  var firstDot = s.indexOf('.');
  if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  return s;
}
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function formatWon(n) { return comma(Math.round(n)) + '원'; }
function formatPercent(n) { return (Math.round(n * 10) / 10).toLocaleString('ko-KR') + '%'; }

function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caretFromEnd = input.value.length - input.selectionStart;
    var digits = onlyDigits(input.value);
    input.value = digits ? comma(digits) : '';
    var pos = Math.max(0, input.value.length - caretFromEnd);
    input.setSelectionRange(pos, pos);
    onChange();
  });
}
function attachDecimalFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caretFromEnd = input.value.length - input.selectionStart;
    input.value = onlyDecimal(input.value);
    var pos = Math.max(0, input.value.length - caretFromEnd);
    input.setSelectionRange(pos, pos);
    onChange();
  });
}
function readMoney(input) { var d = onlyDigits(input.value); return d ? Number(d) : 0; }
function readDecimal(input) { var v = parseFloat(onlyDecimal(input.value)); return isNaN(v) ? 0 : v; }

/* ---------- DOM ---------- */
var $ = function (id) { return document.getElementById(id); };

var el = {
  modeRadios: document.querySelectorAll('input[name="mode"]'),
  panelReinvest: $('panel-reinvest'), panelTarget: $('panel-target'),

  initial: $('initial'), monthly: $('monthly'), yieldRate: $('yield-rate'),
  growthRate: $('growth-rate'), months: $('months'),
  reinvestRadios: document.querySelectorAll('input[name="reinvest"]'),

  targetMonthly: $('target-monthly'), targetYield: $('target-yield'),
  chips: document.querySelectorAll('.chips .chip'),

  warn: $('warn'),
  headline: $('headline'), headLabel: $('head-label'), headSub: $('head-sub'),

  resultReinvest: $('result-reinvest'),
  cPrincipal: $('c-principal'), cBalance: $('c-balance'), cGrowth: $('c-growth'),
  cAnnualPre: $('c-annual-pre'), cAnnualAfter: $('c-annual-after'),
  cMonthlyPre: $('c-monthly-pre'), cMonthlyAfter: $('c-monthly-after'),
  cFinalYield: $('c-final-yield'),
  scheduleBody: $('schedule-body'),

  resultTarget: $('result-target'),
  tAnnualAfter: $('t-annual-after'), tAnnualPre: $('t-annual-pre'), tPrincipal: $('t-principal')
};

function currentMode() {
  var checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 'reinvest';
}
function currentReinvest() {
  var checked = document.querySelector('input[name="reinvest"]:checked');
  return checked ? checked.value === 'yes' : true;
}

function renderSchedule(schedule) {
  if (!el.scheduleBody) return;
  el.scheduleBody.innerHTML = schedule.map(function (row) {
    return '<tr>' +
      '<td>' + row.year + '년차</td>' +
      '<td>' + formatWon(row.principal) + '</td>' +
      '<td>' + formatWon(row.balance) + '</td>' +
      '<td>' + formatPercent(row.annualYieldPercent) + '</td>' +
      '</tr>';
  }).join('');
}

function render() {
  var mode = currentMode();
  el.panelReinvest.hidden = mode !== 'reinvest';
  el.panelTarget.hidden = mode !== 'target';
  el.resultReinvest.hidden = mode !== 'reinvest';
  el.resultTarget.hidden = mode !== 'target';

  var warnParts = [];

  if (mode === 'reinvest') {
    var initial = readMoney(el.initial);
    var monthly = readMoney(el.monthly);
    var yieldRate = readDecimal(el.yieldRate);
    var growthRate = readDecimal(el.growthRate);
    var months = readMoney(el.months);
    var reinvest = currentReinvest();

    if (!(initial > 0) && !(monthly > 0)) warnParts.push('초기 투자금 또는 월 투자금 중 하나는 입력해주세요.');
    if (!(yieldRate > 0)) warnParts.push('배당수익률을 입력해주세요.');
    if (!(months > 0)) warnParts.push('투자 기간을 1개월 이상 입력해주세요.');
    if (months > MAX_MONTHS) warnParts.push('투자 기간은 ' + comma(MAX_MONTHS) + '개월(40년) 이하로 입력해주세요.');

    var r = (yieldRate > 0 && months > 0 && months <= MAX_MONTHS)
      ? simulateReinvest(initial, monthly, yieldRate, growthRate, months, reinvest)
      : { valid: false };

    if (r && r.valid && (!isFinite(r.finalBalance) || r.finalBalance > 1e15)) {
      warnParts.push('입력값이 너무 커서 계산할 수 없습니다. 금액·수익률·기간을 확인해주세요.');
      r = { valid: false };
    }

    el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
    el.warn.hidden = warnParts.length === 0;

    if (!r || !r.valid) {
      el.headLabel.textContent = '예상 월배당금 (세후, 마지막 달 기준)';
      el.headline.textContent = '0원';
      el.headSub.textContent = '-';
      el.cPrincipal.textContent = '-'; el.cBalance.textContent = '-'; el.cGrowth.textContent = '-';
      el.cAnnualPre.textContent = '-'; el.cAnnualAfter.textContent = '-';
      el.cMonthlyPre.textContent = '-'; el.cMonthlyAfter.textContent = '-';
      el.cFinalYield.textContent = '-';
      if (el.scheduleBody) el.scheduleBody.innerHTML = '';
      return;
    }

    el.headLabel.textContent = '예상 월배당금 (세후, 마지막 달 기준)';
    el.headline.textContent = formatWon(r.monthlyDividendAfterTax);
    el.headSub.textContent = reinvest
      ? ('총 평가금액 ' + formatWon(r.finalBalance) + ' (원금 ' + formatWon(r.totalPrincipal) + ' + 재투자 성장분 ' + formatWon(r.reinvestedGrowth) + ')')
      : ('투자원금 ' + formatWon(r.totalPrincipal) + ' + 재투자 안 한 누적 배당금(세전) ' + formatWon(r.cashDividends));

    el.cPrincipal.textContent = formatWon(r.totalPrincipal);
    el.cBalance.textContent = formatWon(r.finalBalance);
    el.cGrowth.textContent = reinvest ? formatWon(r.reinvestedGrowth) : formatWon(r.cashDividends);
    el.cAnnualPre.textContent = formatWon(r.annualDividendPreTax);
    el.cAnnualAfter.textContent = formatWon(r.annualDividendAfterTax);
    el.cMonthlyPre.textContent = formatWon(r.monthlyDividendPreTax);
    el.cMonthlyAfter.textContent = formatWon(r.monthlyDividendAfterTax);
    el.cFinalYield.textContent = formatPercent(r.finalYieldPercent);
    renderSchedule(r.schedule);
  } else {
    var targetMonthly = readMoney(el.targetMonthly);
    var targetYield = readDecimal(el.targetYield);

    if (!(targetMonthly > 0)) warnParts.push('목표 월 배당금을 입력해주세요.');
    if (!(targetYield > 0)) warnParts.push('배당수익률을 입력해주세요.');

    var t = (targetMonthly > 0 && targetYield > 0) ? reverseTarget(targetMonthly, targetYield) : { valid: false };

    if (t && t.valid && (!isFinite(t.requiredPrincipal) || t.requiredPrincipal > 1e15)) {
      warnParts.push('입력값이 너무 커서 계산할 수 없습니다. 목표 배당금·수익률을 확인해주세요.');
      t = { valid: false };
    }

    el.warn.innerHTML = warnParts.map(function (x) { return '<p>' + x + '</p>'; }).join('');
    el.warn.hidden = warnParts.length === 0;

    if (!t || !t.valid) {
      el.headLabel.textContent = '필요한 투자원금';
      el.headline.textContent = '0원';
      el.headSub.textContent = '-';
      el.tAnnualAfter.textContent = '-'; el.tAnnualPre.textContent = '-'; el.tPrincipal.textContent = '-';
      return;
    }

    el.headLabel.textContent = '필요한 투자원금';
    el.headline.textContent = formatWon(t.requiredPrincipal);
    el.headSub.textContent = '세전 연배당금 ' + formatWon(t.targetAnnualPreTax) + ' 기준';

    el.tAnnualAfter.textContent = formatWon(t.targetAnnualAfter);
    el.tAnnualPre.textContent = formatWon(t.targetAnnualPre);
    el.tPrincipal.textContent = formatWon(t.requiredPrincipal);
  }
}

/* ---------- 초기화 ---------- */
attachMoneyFormat(el.initial, render);
attachMoneyFormat(el.monthly, render);
attachDecimalFormat(el.yieldRate, render);
attachDecimalFormat(el.growthRate, render);
attachMoneyFormat(el.months, render);
attachMoneyFormat(el.targetMonthly, render);
attachDecimalFormat(el.targetYield, render);

Array.prototype.forEach.call(el.modeRadios, function (radio) { radio.addEventListener('change', render); });
Array.prototype.forEach.call(el.reinvestRadios, function (radio) { radio.addEventListener('change', render); });
Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.targetMonthly.value = comma(chip.dataset.amount);
    Array.prototype.forEach.call(el.chips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

render();
