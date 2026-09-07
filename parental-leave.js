/* =========================================================
   육아휴직급여 계산기 (2026년 기준)
   기준: 2025.1.1. 이후 육아휴직 개시자부터 적용된 개편(사후지급금 폐지)
   - 일반 육아휴직급여: 1~3개월 100%(상한 250만), 4~6개월 100%(상한 200만),
     7개월~ 80%(상한 160만), 하한액 70만원(전 구간 공통)
   - 6+6 부모육아휴직제: 첫 6개월 100%, 상한액 계단식(250/250/300/350/400/450만),
     7개월차부터는 일반 규정으로 전환
   ========================================================= */

var LOWER_LIMIT = 700000;
var MAX_MONTHS = 12;

function generalTier(monthIndex) {
  if (monthIndex <= 3) return { rate: 1.0, cap: 2500000 };
  if (monthIndex <= 6) return { rate: 1.0, cap: 2000000 };
  return { rate: 0.8, cap: 1600000 };
}

var SIXSIX_CAPS = [2500000, 2500000, 3000000, 3500000, 4000000, 4500000];
function sixSixTier(monthIndex) {
  if (monthIndex <= 6) return { rate: 1.0, cap: SIXSIX_CAPS[monthIndex - 1] };
  return generalTier(monthIndex);
}

function monthlyPay(wage, tier) {
  var raw = wage * tier.rate;
  var capped = Math.min(raw, tier.cap);
  var withFloor = Math.max(capped, Math.min(LOWER_LIMIT, wage)); // 통상임금 자체가 하한보다 낮으면 통상임금 전액
  return Math.floor(withFloor);
}

function calculate(wage, months, type) {
  if (!(wage > 0) || !(months >= 1) || (type !== 'general' && type !== 'sixsix')) {
    return { valid: false };
  }
  var tierFn = type === 'sixsix' ? sixSixTier : generalTier;
  var rows = [];
  var total = 0;
  for (var m = 1; m <= months; m++) {
    var tier = tierFn(m);
    var pay = monthlyPay(wage, tier);
    rows.push({ month: m, rate: tier.rate, cap: tier.cap, pay: pay });
    total += pay;
  }
  return { valid: true, rows: rows, total: total };
}

/* ---------- 숫자 포맷 ---------- */
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
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

var $ = function (id) { return document.getElementById(id); };

var el = {
  type: document.querySelectorAll('input[name="type"]'),
  typeHelp: $('type-help'),
  wage: $('wage'), wageEcho: $('wage-echo'),
  wageChips: document.querySelectorAll('.chips[role="group"][aria-label="빠른 금액 선택"] .chip'),
  months: $('months'),
  monthsChips: document.querySelectorAll('.chips[role="group"][aria-label="빠른 기간 선택"] .chip'),
  warn: $('warn'),
  headline: $('headline'), headSub: $('head-sub'),
  rows: $('month-rows')
};

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
function readMoney(input) {
  var d = onlyDigits(input.value);
  return d ? Number(d) : 0;
}
function readMonths(input) {
  var d = onlyDigits(input.value);
  return d ? Number(d) : 0;
}
function currentType() {
  var checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : 'general';
}

function render() {
  var wage = readMoney(el.wage);
  var monthsRaw = readMonths(el.months);
  var type = currentType();

  el.typeHelp.style.display = type === 'sixsix' ? 'block' : 'none';

  el.wageEcho.innerHTML = wage > 0 ? '<strong>' + readable(wage) + '</strong>' : '';

  var warnParts = [];
  var months = monthsRaw;
  if (monthsRaw > MAX_MONTHS) {
    months = MAX_MONTHS;
    warnParts.push('육아휴직급여는 자녀 1인당 최대 <strong>12개월</strong>까지 지급됩니다. 12개월 기준으로 계산했습니다.');
  }

  var r = calculate(wage, months, type);

  if (!r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
    el.rows.innerHTML = '';
  } else {
    el.headline.textContent = comma(r.total) + '원';
    el.headSub.textContent = comma(Math.round(r.total / months)) + '원 평균 · 총 ' + months + '개월분';

    el.rows.innerHTML = r.rows.map(function (row) {
      return '<tr><td>' + row.month + '개월차</td><td>' + Math.round(row.rate * 100) + '%</td><td class="pay">' + comma(row.pay) + '원</td></tr>';
    }).join('') + '<tr class="sum"><th scope="row">합계</th><td></td><td class="pay">' + comma(r.total) + '원</td></tr>';
  }

  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;
}

/* ---------- 시작 ---------- */
attachMoneyFormat(el.wage, render);
el.months.addEventListener('input', render);
Array.prototype.forEach.call(el.type, function (radio) {
  radio.addEventListener('change', render);
});

Array.prototype.forEach.call(el.wageChips, function (chip) {
  chip.addEventListener('click', function () {
    el.wage.value = comma(chip.dataset.amount);
    Array.prototype.forEach.call(el.wageChips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});
Array.prototype.forEach.call(el.monthsChips, function (chip) {
  chip.addEventListener('click', function () {
    el.months.value = chip.dataset.months;
    Array.prototype.forEach.call(el.monthsChips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

render();
