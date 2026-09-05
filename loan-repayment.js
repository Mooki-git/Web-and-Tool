/* =========================================================
   대출 상환 계산기 (2026년 기준)
   - 원리금균등상환: payment = P × r × (1+r)^n / ((1+r)^n − 1)
   - 원금균등상환: 매월 원금 P/n 고정, 이자는 잔액 기준으로 감소
   - 만기일시상환: 매월 이자만 납부, 만기에 원금 전액 상환
   - 거치기간: 거치 중에는 이자만 납부, 원금상환은 거치 종료 후 시작
     (만기일시상환은 원금상환이 이미 만기 1회뿐이라 거치 개념을 적용하지 않음)
   ========================================================= */

function monthlyRate(annualRatePercent) { return annualRatePercent / 100 / 12; }

function equalPayment(principal, annualRate, months, graceMonths) {
  graceMonths = graceMonths || 0;
  var r = monthlyRate(annualRate);
  var repayMonths = months - graceMonths;
  if (repayMonths <= 0) repayMonths = months, graceMonths = 0;

  var payment = r === 0
    ? principal / repayMonths
    : principal * r * Math.pow(1 + r, repayMonths) / (Math.pow(1 + r, repayMonths) - 1);

  var balance = principal;
  var schedule = [];
  var totalInterest = 0;

  for (var m = 1; m <= graceMonths; m++) {
    var interest = balance * r;
    schedule.push({ month: m, payment: interest, principalPaid: 0, interest: interest, balance: balance });
    totalInterest += interest;
  }
  for (var k = 1; k <= repayMonths; k++) {
    var interest2 = balance * r;
    var principalPaid = payment - interest2;
    if (k === repayMonths) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    var pay = principalPaid + interest2;
    schedule.push({ month: graceMonths + k, payment: pay, principalPaid: principalPaid, interest: interest2, balance: balance });
    totalInterest += interest2;
  }

  return {
    method: 'equalPayment', firstPayment: schedule[graceMonths] ? schedule[graceMonths].payment : payment,
    monthlyPayment: payment, schedule: schedule,
    totalInterest: totalInterest, totalPayment: principal + totalInterest
  };
}

function equalPrincipal(principal, annualRate, months, graceMonths) {
  graceMonths = graceMonths || 0;
  var r = monthlyRate(annualRate);
  var repayMonths = months - graceMonths;
  if (repayMonths <= 0) repayMonths = months, graceMonths = 0;

  var principalPerMonth = principal / repayMonths;
  var balance = principal;
  var schedule = [];
  var totalInterest = 0;

  for (var m = 1; m <= graceMonths; m++) {
    var interest = balance * r;
    schedule.push({ month: m, payment: interest, principalPaid: 0, interest: interest, balance: balance });
    totalInterest += interest;
  }
  for (var k = 1; k <= repayMonths; k++) {
    var interest2 = balance * r;
    var pPaid = (k === repayMonths) ? balance : principalPerMonth;
    balance = Math.max(0, balance - pPaid);
    var pay = pPaid + interest2;
    schedule.push({ month: graceMonths + k, payment: pay, principalPaid: pPaid, interest: interest2, balance: balance });
    totalInterest += interest2;
  }

  return {
    method: 'equalPrincipal', firstPayment: schedule[graceMonths] ? schedule[graceMonths].payment : (principalPerMonth + principal * r),
    lastPayment: schedule[schedule.length - 1].payment,
    schedule: schedule, totalInterest: totalInterest, totalPayment: principal + totalInterest
  };
}

function bulletRepayment(principal, annualRate, months) {
  var r = monthlyRate(annualRate);
  var monthlyInterest = principal * r;
  var schedule = [];
  for (var m = 1; m <= months; m++) {
    var isLast = (m === months);
    var principalPaid = isLast ? principal : 0;
    var pay = monthlyInterest + principalPaid;
    schedule.push({ month: m, payment: pay, principalPaid: principalPaid, interest: monthlyInterest, balance: isLast ? 0 : principal });
  }
  var totalInterest = monthlyInterest * months;
  return {
    method: 'bullet', monthlyInterest: monthlyInterest,
    schedule: schedule, totalInterest: totalInterest, totalPayment: principal + totalInterest
  };
}

function yearlySummary(schedule) {
  var years = [];
  for (var i = 0; i < schedule.length; i++) {
    var yearIdx = Math.floor(i / 12);
    if (!years[yearIdx]) years[yearIdx] = { year: yearIdx + 1, principalPaid: 0, interest: 0, endBalance: 0 };
    years[yearIdx].principalPaid += schedule[i].principalPaid;
    years[yearIdx].interest += schedule[i].interest;
    years[yearIdx].endBalance = schedule[i].balance;
  }
  return years;
}

function calculate(o) {
  var principal = Math.max(0, o.principal || 0);
  var annualRate = Math.max(0, o.annualRate || 0);
  var months = Math.max(1, Math.round(o.months || 1));
  var graceMonths = Math.max(0, Math.min(Math.round(o.graceMonths || 0), months - 1));

  var equal = equalPayment(principal, annualRate, months, graceMonths);
  var principalEqual = equalPrincipal(principal, annualRate, months, graceMonths);
  var bullet = bulletRepayment(principal, annualRate, months);

  return {
    principal: principal, annualRate: annualRate, months: months, graceMonths: graceMonths,
    equal: equal, principalEqual: principalEqual, bullet: bullet
  };
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

var principalSection = $('q-principal').closest('section');
var rateSection = $('q-rate').closest('section');

var el = {
  principal: $('principal'), principalEcho: $('principal-echo'),
  principalChips: principalSection.querySelectorAll('.chip[data-amount]'),
  rate: $('rate'), rateChips: rateSection.querySelectorAll('.chip[data-amount]'),
  months: $('months'), monthsChips: rateSection.querySelectorAll('.chip[data-months]'),
  grace: $('grace'), graceChips: rateSection.querySelectorAll('.chip[data-grace]'),

  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'), warn: $('warn'),

  cEqualInterest: $('c-equal-interest'), cEqualTotal: $('c-equal-total'),
  cPrincipalInterest: $('c-principal-interest'), cPrincipalTotal: $('c-principal-total'),
  cBulletInterest: $('c-bullet-interest'), cBulletTotal: $('c-bullet-total'),
  bestNote: $('best-note'),
  rowEqual: $('row-equal'), rowPrincipal: $('row-principal'), rowBullet: $('row-bullet'),

  methodRadios: document.querySelectorAll('input[name="method"]'),
  detailPaymentLabel: $('detail-payment-label'), detailPayment: $('detail-payment'),
  detailInterest: $('detail-interest'), detailTotal: $('detail-total'),
  scheduleBody: $('schedule-body')
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
function readPlainNumber(input) {
  var v = parseFloat(String(input.value).replace(/[^0-9.]/g, ''));
  return isNaN(v) ? 0 : v;
}
function currentMethod() {
  var checked = document.querySelector('input[name="method"]:checked');
  return checked ? checked.value : 'equal';
}
function methodDetail(r, method) {
  if (method === 'principal') {
    return { label: '첫 회차 상환액', payment: r.principalEqual.firstPayment, interest: r.principalEqual.totalInterest, total: r.principalEqual.totalPayment, schedule: r.principalEqual.schedule };
  }
  if (method === 'bullet') {
    return { label: '월 이자(만기 전)', payment: r.bullet.monthlyInterest, interest: r.bullet.totalInterest, total: r.bullet.totalPayment, schedule: r.bullet.schedule };
  }
  return { label: '월 상환액', payment: r.equal.monthlyPayment, interest: r.equal.totalInterest, total: r.equal.totalPayment, schedule: r.equal.schedule };
}

function render() {
  var principal = readMoney(el.principal);
  var annualRate = readPlainNumber(el.rate);
  var monthsInput = Math.max(1, Math.round(readPlainNumber(el.months)));
  var graceInput = Math.max(0, Math.round(readPlainNumber(el.grace)));
  var graceClamped = graceInput >= monthsInput;

  var r = calculate({ principal: principal, annualRate: annualRate, months: monthsInput, graceMonths: graceInput });

  el.principalEcho.innerHTML = principal > 0 ? '<strong>' + readable(principal) + '</strong>' : '';

  var warnParts = [];
  if (graceClamped && principal > 0) {
    warnParts.push('거치기간은 대출기간보다 짧아야 합니다. 거치기간을 ' + (r.graceMonths) + '개월로 조정해서 계산했습니다.');
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  /* 헤드라인 — 원리금균등상환 기준 */
  el.headLabel.textContent = '원리금균등상환 · 월 상환액';
  el.headline.textContent = comma(Math.round(r.equal.monthlyPayment)) + '원';
  el.headSub.textContent = '총이자 ' + comma(Math.round(r.equal.totalInterest)) + '원 · 총상환액 ' + comma(Math.round(r.equal.totalPayment)) + '원';

  /* 3가지 방식 비교표 */
  el.cEqualInterest.textContent = comma(Math.round(r.equal.totalInterest));
  el.cEqualTotal.textContent = comma(Math.round(r.equal.totalPayment));
  el.cPrincipalInterest.textContent = comma(Math.round(r.principalEqual.totalInterest));
  el.cPrincipalTotal.textContent = comma(Math.round(r.principalEqual.totalPayment));
  el.cBulletInterest.textContent = comma(Math.round(r.bullet.totalInterest));
  el.cBulletTotal.textContent = comma(Math.round(r.bullet.totalPayment));

  var rows = [
    { row: el.rowEqual, name: '원리금균등상환', interest: r.equal.totalInterest },
    { row: el.rowPrincipal, name: '원금균등상환', interest: r.principalEqual.totalInterest },
    { row: el.rowBullet, name: '만기일시상환', interest: r.bullet.totalInterest }
  ];
  rows.forEach(function (o) { o.row.classList.remove('is-best'); });
  var best = rows.reduce(function (a, b) { return b.interest < a.interest ? b : a; });
  best.row.classList.add('is-best');
  el.bestNote.textContent = principal > 0 ? '총이자가 가장 적은 방식은 ' + best.name + '입니다.' : '-';

  /* 상환방식별 상세 */
  var method = currentMethod();
  var d = methodDetail(r, method);
  el.detailPaymentLabel.textContent = d.label;
  el.detailPayment.textContent = comma(Math.round(d.payment));
  el.detailInterest.textContent = comma(Math.round(d.interest));
  el.detailTotal.textContent = comma(Math.round(d.total));

  var years = yearlySummary(d.schedule);
  el.scheduleBody.innerHTML = years.map(function (y) {
    return '<tr><th scope="row">' + y.year + '년차</th><td>' + comma(Math.round(y.principalPaid)) + '원</td><td>' + comma(Math.round(y.interest)) + '원</td><td>' + comma(Math.round(y.endBalance)) + '원</td></tr>';
  }).join('');
}

/* ---------- 칩 연결 ---------- */
function wireAmountChips(chips, target, render) {
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      target.value = comma(chip.dataset.amount);
      Array.prototype.forEach.call(chips, function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      render();
    });
  });
}
function wirePlainChips(chips, target, dataKey, render) {
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      target.value = chip.dataset[dataKey];
      Array.prototype.forEach.call(chips, function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      render();
    });
  });
}

/* ---------- 시작 ---------- */
attachMoneyFormat(el.principal, render);
el.rate.addEventListener('input', render);
el.months.addEventListener('input', render);
el.grace.addEventListener('input', render);
Array.prototype.forEach.call(el.methodRadios, function (radio) {
  radio.addEventListener('change', render);
});

wireAmountChips(el.principalChips, el.principal, render);
wirePlainChips(el.rateChips, el.rate, 'amount', render);
wirePlainChips(el.monthsChips, el.months, 'months', render);
wirePlainChips(el.graceChips, el.grace, 'grace', render);

render();
