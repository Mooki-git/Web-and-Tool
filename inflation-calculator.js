/* =========================================================
   인플레이션(물가상승률) 계산기 (2026년 기준)
   - 실질가치 = 기준금액 / (1+r)^기간   (오늘 화폐가치로 환산한 N년 후 구매력)
   - 필요한 명목금액 = 기준금액 * (1+r)^기간  (N년 후 구매력 유지에 필요한 금액)
   - 같은 공식을 과거→현재 환산에도 그대로 사용 가능
   ========================================================= */

var MAX_YEARS = 100; // 이보다 긴 기간은 계산이 비현실적으로 커질 수 있어 상한을 둠

function simulate(baseAmount, annualRatePercent, years) {
  if (!(baseAmount > 0) || !(years > 0)) return { valid: false };
  var r = annualRatePercent / 100;
  var factor = Math.pow(1 + r, years);

  var realValue = baseAmount / factor;
  var nominalNeeded = baseAmount * factor;
  var totalInflationPct = (factor - 1) * 100;
  var realValueLossPct = (1 - 1 / factor) * 100;

  return {
    valid: true,
    baseAmount: baseAmount,
    realValue: realValue,
    nominalNeeded: nominalNeeded,
    totalInflationPct: totalInflationPct,
    realValueLossPct: realValueLossPct,
    factor: factor
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
function formatPct(n) {
  var r = Math.round((n + Number.EPSILON) * 100) / 100;
  return r.toFixed(2) + '%';
}

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
  amount: $('amount'), rate: $('rate'), years: $('years'),
  warn: $('warn'),
  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'),
  mNominalLabel: $('m-nominal-label'), mNominal: $('m-nominal'),
  mTotalInflation: $('m-total-inflation'), mLoss: $('m-loss')
};

function render() {
  var amount = readMoney(el.amount);
  var rate = readDecimal(el.rate);
  var years = readMoney(el.years);

  var warnParts = [];
  if (!(amount > 0)) warnParts.push('기준 금액을 입력해주세요.');
  if (!(years > 0)) warnParts.push('기간을 1년 이상 입력해주세요.');
  if (years > MAX_YEARS) warnParts.push('기간은 ' + comma(MAX_YEARS) + '년 이하로 입력해주세요.');

  var r = (years > 0 && years <= MAX_YEARS) ? simulate(amount, rate, years) : { valid: false };

  if (r && r.valid && (!isFinite(r.nominalNeeded) || r.nominalNeeded > 1e15 || !isFinite(r.realValue))) {
    warnParts.push('입력값이 너무 커서 계산할 수 없습니다. 금액·물가상승률·기간을 확인해주세요.');
    r = { valid: false };
  }

  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  var yearsValid = years > 0 && years <= MAX_YEARS;
  el.headLabel.textContent = yearsValid ? years + '년 후 실질가치 (오늘 화폐가치 기준)' : 'N년 후 실질가치 (오늘 화폐가치 기준)';
  el.mNominalLabel.textContent = yearsValid ? years + '년 후 필요한 명목금액' : 'N년 후 필요한 명목금액';

  if (!r || !r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
    el.mNominal.textContent = '-';
    el.mTotalInflation.textContent = '-';
    el.mLoss.textContent = '-';
    return;
  }

  el.headline.textContent = formatWon(r.realValue);
  el.headSub.textContent = '기준 금액 ' + formatWon(r.baseAmount) + ' 대비 -' + formatPct(r.realValueLossPct);

  el.mNominal.textContent = formatWon(r.nominalNeeded);
  el.mTotalInflation.textContent = '+' + formatPct(r.totalInflationPct);
  el.mLoss.textContent = '-' + formatPct(r.realValueLossPct);
}

/* ---------- 초기화 ---------- */
attachMoneyFormat(el.amount, render);
attachDecimalFormat(el.rate, render);
attachMoneyFormat(el.years, render);

render();
