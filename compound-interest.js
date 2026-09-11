/* =========================================================
   복리 계산기 (2026년 기준)
   - 거치식: A = P * (1 + r/n)^(n*t),  t = 개월/12
   - 적립식(월복리 고정, 매월 초 납입 가정):
     FV = PMT * [(1+i)^N - 1]/i * (1+i),  i = r/12, N = 개월수
   - 이자소득세 15.4%(이자소득세 14% + 지방소득세 1.4%) 반영해 세전/세후 함께 표시
   ========================================================= */

var TAX_RATE = 0.154;

function lumpSum(principal, annualRatePercent, compoundsPerYear, months) {
  if (!(principal > 0) || !(months > 0)) return { valid: false };
  var r = annualRatePercent / 100;
  var t = months / 12;
  var n = compoundsPerYear;
  var finalAmount = r === 0 ? principal : principal * Math.pow(1 + r / n, n * t);
  var interest = finalAmount - principal;
  var afterTaxInterest = interest * (1 - TAX_RATE);

  return {
    valid: true,
    principal: principal,
    preTaxInterest: interest,
    preTaxTotal: finalAmount,
    tax: interest - afterTaxInterest,
    afterTaxInterest: afterTaxInterest,
    afterTaxTotal: principal + afterTaxInterest
  };
}

function recurring(monthlyPayment, annualRatePercent, months) {
  months = Math.round(months);
  if (!(monthlyPayment > 0) || !(months > 0)) return { valid: false };
  var i = annualRatePercent / 100 / 12;
  var principal = monthlyPayment * months;
  var finalAmount = i === 0
    ? principal
    : monthlyPayment * (Math.pow(1 + i, months) - 1) / i * (1 + i);
  var interest = finalAmount - principal;
  var afterTaxInterest = interest * (1 - TAX_RATE);

  return {
    valid: true,
    principal: principal,
    preTaxInterest: interest,
    preTaxTotal: finalAmount,
    tax: interest - afterTaxInterest,
    afterTaxInterest: afterTaxInterest,
    afterTaxTotal: principal + afterTaxInterest
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
  panelLump: $('panel-lump'), panelRecurring: $('panel-recurring'),

  lumpPrincipal: $('lump-principal'), lumpRate: $('lump-rate'),
  lumpCompoundRadios: document.querySelectorAll('input[name="lump-compound"]'),
  lumpMonths: $('lump-months'),

  recPayment: $('rec-payment'), recRate: $('rec-rate'), recMonths: $('rec-months'),

  headline: $('headline'), headSub: $('head-sub'), warn: $('warn'),
  rowPrincipalLabel: $('row-principal-label'),
  cPrincipal: $('c-principal'), cPretaxInterest: $('c-pretax-interest'),
  cPretaxTotal: $('c-pretax-total'), cTax: $('c-tax'),
  cAftertaxInterest: $('c-aftertax-interest'), cAftertaxTotal: $('c-aftertax-total')
};

function currentMode() {
  var checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 'lump';
}
function currentCompound() {
  var checked = document.querySelector('input[name="lump-compound"]:checked');
  return checked ? Number(checked.value) : 12;
}

function render() {
  var mode = currentMode();
  el.panelLump.hidden = mode !== 'lump';
  el.panelRecurring.hidden = mode !== 'recurring';
  el.rowPrincipalLabel.textContent = mode === 'lump' ? '원금' : '총 납입액';

  var r;
  var warnParts = [];

  if (mode === 'lump') {
    var principal = readMoney(el.lumpPrincipal);
    var rate = readDecimal(el.lumpRate);
    var compound = currentCompound();
    var months = readMoney(el.lumpMonths);

    if (!(principal > 0)) warnParts.push('원금을 입력해주세요.');
    if (!(months > 0)) warnParts.push('투자 기간을 1개월 이상 입력해주세요.');

    r = lumpSum(principal, rate, compound, months);
  } else {
    var payment = readMoney(el.recPayment);
    var rate2 = readDecimal(el.recRate);
    var months2 = readMoney(el.recMonths);

    if (!(payment > 0)) warnParts.push('월 적립액을 입력해주세요.');
    if (!(months2 > 0)) warnParts.push('투자 기간을 1개월 이상 입력해주세요.');

    r = recurring(payment, rate2, months2);
  }

  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  if (!r || !r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
    el.cPrincipal.textContent = '-';
    el.cPretaxInterest.textContent = '-';
    el.cPretaxTotal.textContent = '-';
    el.cTax.textContent = '-';
    el.cAftertaxInterest.textContent = '-';
    el.cAftertaxTotal.textContent = '-';
    return;
  }

  el.headline.textContent = formatWon(r.afterTaxTotal);
  el.headSub.textContent = (mode === 'lump' ? '원금' : '총 납입액') + ' ' + formatWon(r.principal) + ' + 세후 이자 ' + formatWon(r.afterTaxInterest);

  el.cPrincipal.textContent = formatWon(r.principal);
  el.cPretaxInterest.textContent = formatWon(r.preTaxInterest);
  el.cPretaxTotal.textContent = formatWon(r.preTaxTotal);
  el.cTax.textContent = formatWon(r.tax);
  el.cAftertaxInterest.textContent = formatWon(r.afterTaxInterest);
  el.cAftertaxTotal.textContent = formatWon(r.afterTaxTotal);
}

/* ---------- 초기화 ---------- */
attachMoneyFormat(el.lumpPrincipal, render);
attachDecimalFormat(el.lumpRate, render);
attachMoneyFormat(el.lumpMonths, render);
attachMoneyFormat(el.recPayment, render);
attachDecimalFormat(el.recRate, render);
attachMoneyFormat(el.recMonths, render);

Array.prototype.forEach.call(el.modeRadios, function (radio) { radio.addEventListener('change', render); });
Array.prototype.forEach.call(el.lumpCompoundRadios, function (radio) { radio.addEventListener('change', render); });

render();
