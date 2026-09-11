/* =========================================================
   자산 시뮬레이터 (2026년 기준)
   - 초기 투자금: FV_lump = P0 * (1 + i)^N
   - 매월 적립금(월초 납입 가정, annuity-due): FV_rec = PMT * [(1+i)^N - 1]/i * (1+i)
     i = 연수익률/12, N = 개월수 — 둘 다 매월 복리로 고정
   - 이자소득세 15.4%(이자소득세 14% + 지방소득세 1.4%) 반영해 세전/세후 함께 표시
   ========================================================= */

var TAX_RATE = 0.154;
var MAX_MONTHS = 1200; // 100년 — 이보다 긴 기간은 계산이 비현실적으로 커질 수 있어 상한을 둠

function simulate(initial, monthlyPayment, annualRatePercent, months) {
  months = Math.round(months);
  if (!(months > 0)) return { valid: false, reason: 'invalid-months' };
  if (!(initial > 0) && !(monthlyPayment > 0)) return { valid: false, reason: 'no-input' };

  var i = annualRatePercent / 100 / 12;

  var fvLump = initial > 0 ? (i === 0 ? initial : initial * Math.pow(1 + i, months)) : 0;
  var fvRec = monthlyPayment > 0
    ? (i === 0 ? monthlyPayment * months : monthlyPayment * (Math.pow(1 + i, months) - 1) / i * (1 + i))
    : 0;

  var totalPrincipal = (initial > 0 ? initial : 0) + (monthlyPayment > 0 ? monthlyPayment * months : 0);
  var preTaxTotal = fvLump + fvRec;
  var preTaxInterest = preTaxTotal - totalPrincipal;
  var afterTaxInterest = preTaxInterest * (1 - TAX_RATE);

  return {
    valid: true,
    initial: initial > 0 ? initial : 0,
    totalContribution: monthlyPayment > 0 ? monthlyPayment * months : 0,
    principal: totalPrincipal,
    preTaxInterest: preTaxInterest,
    preTaxTotal: preTaxTotal,
    tax: preTaxInterest - afterTaxInterest,
    afterTaxInterest: afterTaxInterest,
    afterTaxTotal: totalPrincipal + afterTaxInterest
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
  initial: $('initial'), monthly: $('monthly'), rate: $('rate'), months: $('months'),
  warn: $('warn'),
  headline: $('headline'), headSub: $('head-sub'),
  cInitial: $('c-initial'), cContribution: $('c-contribution'), cPrincipal: $('c-principal'),
  cPretaxInterest: $('c-pretax-interest'), cPretaxTotal: $('c-pretax-total'), cTax: $('c-tax'),
  cAftertaxInterest: $('c-aftertax-interest'), cAftertaxTotal: $('c-aftertax-total')
};

function render() {
  var initial = readMoney(el.initial);
  var monthly = readMoney(el.monthly);
  var rate = readDecimal(el.rate);
  var months = readMoney(el.months);

  var warnParts = [];
  if (!(initial > 0) && !(monthly > 0)) {
    warnParts.push('초기 투자금 또는 월 적립금 중 하나는 입력해주세요.');
  }
  if (!(months > 0)) warnParts.push('투자 기간을 1개월 이상 입력해주세요.');
  if (months > MAX_MONTHS) warnParts.push('투자 기간은 ' + comma(MAX_MONTHS) + '개월(100년) 이하로 입력해주세요.');

  var r = (months > 0 && months <= MAX_MONTHS) ? simulate(initial, monthly, rate, months) : { valid: false };

  if (r && r.valid && (!isFinite(r.afterTaxTotal) || r.afterTaxTotal > 1e15)) {
    warnParts.push('입력값이 너무 커서 계산할 수 없습니다. 금액·수익률·기간을 확인해주세요.');
    r = { valid: false };
  }

  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  if (!r || !r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
    el.cInitial.textContent = '-';
    el.cContribution.textContent = '-';
    el.cPrincipal.textContent = '-';
    el.cPretaxInterest.textContent = '-';
    el.cPretaxTotal.textContent = '-';
    el.cTax.textContent = '-';
    el.cAftertaxInterest.textContent = '-';
    el.cAftertaxTotal.textContent = '-';
    return;
  }

  el.headline.textContent = formatWon(r.afterTaxTotal);
  el.headSub.textContent = '총 원금 ' + formatWon(r.principal) + ' + 세후 수익 ' + formatWon(r.afterTaxInterest);

  el.cInitial.textContent = formatWon(r.initial);
  el.cContribution.textContent = formatWon(r.totalContribution);
  el.cPrincipal.textContent = formatWon(r.principal);
  el.cPretaxInterest.textContent = formatWon(r.preTaxInterest);
  el.cPretaxTotal.textContent = formatWon(r.preTaxTotal);
  el.cTax.textContent = formatWon(r.tax);
  el.cAftertaxInterest.textContent = formatWon(r.afterTaxInterest);
  el.cAftertaxTotal.textContent = formatWon(r.afterTaxTotal);
}

/* ---------- 초기화 ---------- */
attachMoneyFormat(el.initial, render);
attachMoneyFormat(el.monthly, render);
attachDecimalFormat(el.rate, render);
attachMoneyFormat(el.months, render);

render();
