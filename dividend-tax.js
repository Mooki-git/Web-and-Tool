/* =========================================================
   해외주식 배당소득세 계산기 (미국주식 기준)
   계산 기준: 2026.08 국세청·한미조세조약 공개 자료
   ========================================================= */

var RULES = {
  US_WITHHOLDING_RATE: 0.15,     // 미국 현지 원천징수세율
  FIN_INCOME_LIMIT: 20000000     // 금융소득종합과세 기준 (연 2,000만원)
};

var $ = function (id) { return document.getElementById(id); };

var el = {
  dividend:      $('dividend'),
  dividendEcho:  $('dividend-echo'),
  finincome:     $('finincome'),
  finincomeEcho: $('finincome-echo'),

  stateEmpty: $('div-state-empty'),
  stateOk:    $('div-state-ok'),
  net:        $('div-net'),
  total:      $('div-total'),
  withheld:   $('div-withheld'),
  extra:      $('div-extra'),

  verdictCard: $('div-state-verdict'),
  badge:       $('div-badge'),
  verdictMsg:  $('div-verdict-msg')
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
   핵심 계산
   ========================================================= */
function calculate(dividendAmount, annualFinancialIncome) {
  var withheld = Math.round(dividendAmount * RULES.US_WITHHOLDING_RATE);
  var net = dividendAmount - withheld;
  var overLimit = annualFinancialIncome > RULES.FIN_INCOME_LIMIT;
  return { withheld: withheld, net: net, overLimit: overLimit };
}

/* =========================================================
   화면 그리기
   ========================================================= */
function render() {
  var dividendAmount = readMoney(el.dividend);
  var finincome = readMoney(el.finincome);

  el.dividendEcho.innerHTML = dividendAmount > 0
    ? '<strong>' + readable(dividendAmount) + '</strong>'
    : '금액을 입력하면 실수령액이 바로 계산됩니다.';

  if (dividendAmount <= 0) {
    el.stateEmpty.classList.remove('is-hidden');
    el.stateOk.classList.add('is-hidden');
    return;
  }
  el.stateEmpty.classList.add('is-hidden');
  el.stateOk.classList.remove('is-hidden');

  var r = calculate(dividendAmount, finincome);

  el.net.textContent      = won(r.net);
  el.total.textContent    = comma(dividendAmount);
  el.withheld.textContent = comma(r.withheld);
  el.extra.textContent    = '0';

  // 금융소득 입력에 따른 종합과세 판정
  if (finincome > 0) {
    el.finincomeEcho.innerHTML = '<strong>' + readable(finincome) + '</strong>';
    el.verdictCard.classList.remove('is-hidden');

    if (r.overLimit) {
      el.badge.textContent = '종합과세 대상';
      el.badge.className = 'badge badge-warn';
      el.verdictMsg.textContent =
        '연 2,000만원을 넘으면 종합소득세 신고 대상이에요. 정확한 세액은 근로소득 등 다른 소득까지 합쳐서 ' +
        '계산되니, 국세청 홈택스나 세무사 상담을 권장합니다. (2천만원 초과분과 다른 소득을 합산한 세액과, ' +
        '전체 금융소득에 14%를 적용한 세액을 비교해 더 큰 금액으로 과세돼요.)';
    } else {
      el.badge.textContent = '분리과세 완료';
      el.badge.className = 'badge badge-good';
      el.verdictMsg.textContent =
        '연 2,000만원 이하라 15.4%(소득세 14% + 지방소득세 1.4%) 원천징수로 납세의무가 끝나요. ' +
        '이 배당소득만으로는 별도 신고할 필요가 없습니다.';
    }
  } else {
    el.finincomeEcho.textContent = '금액을 입력하면 종합과세 대상 여부를 알려드립니다.';
    el.verdictCard.classList.add('is-hidden');
  }
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.dividend, render);
attachMoneyFormat(el.finincome, render);

document.querySelectorAll('.is-soon').forEach(function (a) {
  a.addEventListener('click', function (e) { e.preventDefault(); });
});

render();
