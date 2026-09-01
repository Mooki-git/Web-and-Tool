/* =========================================================
   주식 양도소득세 계산기 (국내 대주주 상장주식 + 해외주식)
   계산 기준: 2026.09 소득세법·조세금융신문 등 공개 자료 교차검증
   ========================================================= */

var RULES = {
  DEDUCTION:          2500000,     // 기본공제 (국내 대주주분 + 해외분 합산 연 1회 — 이 계산기는 각 시장 독립 계산)
  OVERSEAS_RATE:      0.22,        // 해외주식 단일세율
  SME_RATE:           0.11,        // 국내 대주주, 중소기업
  GENERAL_RATE_LOW:   0.22,        // 국내 대주주, 그 외 기업, 3억원 이하분
  GENERAL_RATE_HIGH:  0.275,       // 국내 대주주, 그 외 기업, 3억원 초과분
  UNDER1Y_RATE:       0.33,        // 국내 대주주, 그 외 기업, 1년 미만 보유
  BRACKET:            300000000   // 누진 구간 기준 (3억원)
};

var $ = function (id) { return document.getElementById(id); };

var el = {
  domesticProfit:     $('domestic-profit'),
  domesticProfitEcho: $('domestic-profit-echo'),
  overseasProfit:     $('overseas-profit'),
  overseasProfitEcho: $('overseas-profit-echo'),
  chips:              document.querySelectorAll('#panel-overseas .chip'),

  panelDomestic: $('panel-domestic'),
  panelOverseas: $('panel-overseas'),
  majorFields:   $('major-fields'),

  domStateNone:  $('dom-state-none'),
  domStateEmpty: $('dom-state-empty'),
  domStateOk:    $('dom-state-ok'),
  domTaxHeadline:$('dom-tax-headline'),
  domRateLabel:  $('dom-rate-label'),
  domProfitCell: $('dom-profit-cell'),
  domDeductCell: $('dom-deduct-cell'),
  domBaseCell:   $('dom-base-cell'),
  domRateCell:   $('dom-rate-cell'),
  domTaxCell:    $('dom-tax-cell'),

  ovsStateEmpty: $('ovs-state-empty'),
  ovsStateOk:    $('ovs-state-ok'),
  ovsTaxHeadline:$('ovs-tax-headline'),
  ovsProfitCell: $('ovs-profit-cell'),
  ovsDeductCell: $('ovs-deduct-cell'),
  ovsBaseCell:   $('ovs-base-cell'),
  ovsTaxCell:    $('ovs-tax-cell')
};

/* ---------- 숫자 포맷 도우미 ---------- */
function onlyDigits(str) {
  return String(str).replace(/[^0-9]/g, '');
}
function comma(n) {
  return Number(n).toLocaleString('ko-KR');
}
function won(n) {
  return comma(Math.round(n)) + '원';
}
function readable(n) {
  n = Math.round(n);
  if (n === 0) return '0원';
  var eok = Math.floor(n / 100000000);
  var man = Math.floor((n % 100000000) / 10000);
  var rest = n % 10000;
  var out = [];
  if (eok) out.push(comma(eok) + '억');
  if (man) out.push(comma(man) + '만');
  if (rest) out.push(comma(rest));
  return out.join(' ') + '원';
}

/* ---------- 입력창: 콤마 자동 포맷 ---------- */
function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caret = input.selectionStart;
    var before = input.value.slice(0, caret);
    var digitsBefore = onlyDigits(before).length;

    var digits = onlyDigits(input.value).slice(0, 12);
    input.value = digits ? comma(digits) : '';

    var pos = 0, seen = 0;
    while (pos < input.value.length && seen < digitsBefore) {
      if (/[0-9]/.test(input.value[pos])) seen++;
      pos++;
    }
    try { input.setSelectionRange(pos, pos); } catch (e) {}

    onChange();
  });
}
function readMoney(input) {
  var d = onlyDigits(input.value);
  return d ? parseInt(d, 10) : 0;
}

/* =========================================================
   핵심 계산 — 두 시장을 완전히 독립적으로 계산합니다.
   (국내·해외 동시 보유 시 공제 중복 문제는 화면에 안내 문구로 처리)
   ========================================================= */

// 국내 대주주 상장주식
function calculateDomestic(profit, companySize, holdPeriod) {
  var p = Math.max(0, profit);
  var base = Math.max(0, p - RULES.DEDUCTION);

  var tax, rateLabel;
  if (companySize === 'sme') {
    tax = base * RULES.SME_RATE;
    rateLabel = '11%';
  } else if (holdPeriod === 'under1y') {
    tax = base * RULES.UNDER1Y_RATE;
    rateLabel = '33%';
  } else {
    var low = Math.min(base, RULES.BRACKET);
    var high = Math.max(0, base - RULES.BRACKET);
    tax = low * RULES.GENERAL_RATE_LOW + high * RULES.GENERAL_RATE_HIGH;
    rateLabel = high > 0 ? '22% / 27.5%' : '22%';
  }

  return {
    profit: p,
    deduction: Math.min(RULES.DEDUCTION, p),
    base: base,
    tax: Math.round(tax),
    rateLabel: rateLabel
  };
}

// 해외주식
function calculateOverseas(profit) {
  var p = Math.max(0, profit);
  var base = Math.max(0, p - RULES.DEDUCTION);
  var tax = base * RULES.OVERSEAS_RATE;

  return {
    profit: p,
    deduction: Math.min(RULES.DEDUCTION, p),
    base: base,
    tax: Math.round(tax)
  };
}

/* =========================================================
   화면 그리기
   ========================================================= */
function renderMarket() {
  var market = document.querySelector('input[name=market]:checked').value;
  el.panelDomestic.classList.toggle('is-hidden', market !== 'domestic');
  el.panelOverseas.classList.toggle('is-hidden', market !== 'overseas');
}

function renderDomestic() {
  var isMajor = document.querySelector('input[name=isMajor]:checked').value === 'yes';
  el.majorFields.classList.toggle('is-hidden', !isMajor);

  if (!isMajor) {
    el.domStateNone.classList.remove('is-hidden');
    el.domStateEmpty.classList.add('is-hidden');
    el.domStateOk.classList.add('is-hidden');
    return;
  }
  el.domStateNone.classList.add('is-hidden');

  var profit = readMoney(el.domesticProfit);
  el.domesticProfitEcho.innerHTML = profit > 0
    ? '<strong>' + readable(profit) + '</strong>'
    : '금액을 입력하면 결과가 바로 계산됩니다.';

  if (profit <= 0) {
    el.domStateEmpty.classList.remove('is-hidden');
    el.domStateOk.classList.add('is-hidden');
    return;
  }
  el.domStateEmpty.classList.add('is-hidden');
  el.domStateOk.classList.remove('is-hidden');

  var companySize = document.querySelector('input[name=companySize]:checked').value;
  var holdPeriod = document.querySelector('input[name=holdPeriod]:checked').value;
  var r = calculateDomestic(profit, companySize, holdPeriod);

  el.domTaxHeadline.textContent = won(r.tax);
  el.domRateLabel.textContent = (companySize === 'sme' ? '중소기업' : '그 외 기업') + ' · 세율 ' + r.rateLabel;
  el.domProfitCell.textContent = comma(r.profit);
  el.domDeductCell.textContent = '-' + comma(r.deduction);
  el.domBaseCell.textContent = comma(r.base);
  el.domRateCell.textContent = r.rateLabel;
  el.domTaxCell.textContent = comma(r.tax);
}

function renderOverseas() {
  var profit = readMoney(el.overseasProfit);

  el.overseasProfitEcho.innerHTML = profit > 0
    ? '<strong>' + readable(profit) + '</strong>'
    : '금액을 입력하면 결과가 바로 계산됩니다.';

  Array.prototype.forEach.call(el.chips, function (chip) {
    chip.classList.toggle('is-active', Number(chip.dataset.amount) === profit);
  });

  if (profit <= 0) {
    el.ovsStateEmpty.classList.remove('is-hidden');
    el.ovsStateOk.classList.add('is-hidden');
    return;
  }
  el.ovsStateEmpty.classList.add('is-hidden');
  el.ovsStateOk.classList.remove('is-hidden');

  var r = calculateOverseas(profit);
  el.ovsTaxHeadline.textContent = won(r.tax);
  el.ovsProfitCell.textContent = comma(r.profit);
  el.ovsDeductCell.textContent = '-' + comma(r.deduction);
  el.ovsBaseCell.textContent = comma(r.base);
  el.ovsTaxCell.textContent = comma(r.tax);
}

function render() {
  renderMarket();
  renderDomestic();
  renderOverseas();
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.domesticProfit, render);
attachMoneyFormat(el.overseasProfit, render);

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.overseasProfit.value = comma(chip.dataset.amount);
    render();
  });
});

Array.prototype.forEach.call(
  document.querySelectorAll('input[type="radio"]'),
  function (radio) { radio.addEventListener('change', render); }
);

render();
