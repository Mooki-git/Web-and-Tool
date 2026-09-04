/* =========================================================
   실업급여(구직급여) 계산기 (2026년 기준)
   - 1일 구직급여액 = 평균임금 × 60% (하한 66,048원 / 상한 68,100원)
   - 총 수급액 = 1일 구직급여액 × 소정급여일수(연령·가입기간별, 고용보험법 별표1)
   - 평균임금 계산은 퇴직금 계산기와 동일 (근로기준법 제2조, 상여·연차수당 3/12 산입,
     평균임금 < 통상임금이면 통상임금 적용)
   ========================================================= */

var LOWER = 66048;
var UPPER = 68100;

/* ---------- 날짜 ---------- */
function parseDate(s) {
  if (!s) return null;
  var p = s.split('-');
  if (p.length !== 3) return null;
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function serviceDays(j, l) { return (j && l) ? daysBetween(j, l) : 0; }
function avgPeriodDays(l) {
  if (!l) return 0;
  var start = new Date(l.getFullYear(), l.getMonth() - 3, l.getDate());
  return daysBetween(start, l);
}

/* 소정급여일수 — 고용보험법 별표1 (2019.8.27 개정) */
function benefitDays(age, totalInsuredDays) {
  var senior = age >= 50;
  if (totalInsuredDays < 365)  return 120;
  if (totalInsuredDays < 1095) return senior ? 180 : 150;
  if (totalInsuredDays < 1825) return senior ? 210 : 180;
  if (totalInsuredDays < 3650) return senior ? 240 : 210;
  return senior ? 270 : 240;
}

/* ---------- 메인 ---------- */
function calculate(o) {
  var j = parseDate(o.join), l = parseDate(o.leave);
  var days = serviceDays(j, l);
  var periodDays = avgPeriodDays(l);
  var valid = !!(j && l) && days > 0;

  var wageSum = o.monthlyPay * 3 + o.bonus * 3 / 12 + o.annualLeavePay * 3 / 12;
  var avgDaily = periodDays > 0 ? wageSum / periodDays : 0;

  var ordinaryDaily = o.ordinaryDaily || 0;
  var usedOrdinary = ordinaryDaily > avgDaily;
  var baseDaily = usedOrdinary ? ordinaryDaily : avgDaily;

  var priorDays = Math.round((o.priorYears || 0) * 365);
  var totalInsuredDays = days + priorDays;
  var insufficientPeriod = valid && totalInsuredDays < 180;

  var dailyRaw = baseDaily * 0.6;
  var dailyBenefit = baseDaily > 0 ? Math.floor(Math.min(UPPER, Math.max(LOWER, dailyRaw))) : 0;

  var age = o.age || 0;
  var days2 = valid ? benefitDays(age, totalInsuredDays) : 0;
  var totalBenefit = dailyBenefit * days2;

  return {
    valid: valid, days: days, periodDays: periodDays,
    wageSum: wageSum, avgDaily: avgDaily, usedOrdinary: usedOrdinary, baseDaily: baseDaily,
    priorDays: priorDays, totalInsuredDays: totalInsuredDays, insufficientPeriod: insufficientPeriod,
    dailyRaw: dailyRaw, dailyBenefit: dailyBenefit,
    benefitDays: days2, totalBenefit: totalBenefit,
    voluntary: !!o.voluntary
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

var el = {
  age: $('age'), ageChips: document.querySelectorAll('.chips.age-chips .chip'),
  join: $('join'), leave: $('leave'),
  priorYears: $('prior-years'),
  reason: document.querySelectorAll('input[name="reason"]'),

  pay: $('pay'), payEcho: $('pay-echo'),
  payChips: document.querySelectorAll('.chips.pay-chips .chip'),
  bonus: $('bonus'), leavePay: $('leave-pay'),
  ordinary: $('ordinary'),

  headline: $('headline'), headSub: $('head-sub'),
  warn: $('warn'),

  dDays: $('d-days'), dInsured: $('d-insured'), dBenefitDays: $('d-benefitdays'),
  dOrdinaryNote: $('d-ordinary-note'), capNote: $('cap-note'),

  rAvgDaily: $('r-avgdaily'), rDailyBenefit: $('r-dailybenefit'),
  rBenefitDays: $('r-benefitdays'), rTotal: $('r-total'),

  tAvgDaily: $('t-avgdaily'), tRaw: $('t-raw')
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
function currentReason() {
  var checked = document.querySelector('input[name="reason"]:checked');
  return checked ? checked.value : 'involuntary';
}

function render() {
  var monthlyPay = readMoney(el.pay);
  var age = readPlainNumber(el.age);
  var priorYears = readPlainNumber(el.priorYears);
  var voluntary = currentReason() === 'voluntary';

  var r = calculate({
    join: el.join.value, leave: el.leave.value,
    monthlyPay: monthlyPay,
    bonus: readMoney(el.bonus),
    annualLeavePay: readMoney(el.leavePay),
    ordinaryDaily: readMoney(el.ordinary),
    priorYears: priorYears, age: age, voluntary: voluntary
  });

  el.payEcho.innerHTML = monthlyPay > 0 ? '<strong>' + readable(monthlyPay) + '</strong>' : '';

  var warnParts = [];
  if (!r.valid) {
    warnParts.push('입사일과 퇴사일을 모두 넣어주세요. 퇴사일은 마지막 근무일의 다음 날입니다.');
  } else {
    if (r.insufficientPeriod) {
      warnParts.push('합산 가입기간이 <strong>180일 미만</strong>이면 원칙적으로 수급 자격이 되지 않습니다.');
    }
    if (r.voluntary) {
      warnParts.push('<strong>자발적 이직</strong>은 원칙적으로 수급 대상이 아닙니다. 다만 권고사직성 퇴사, 임금체불 등 정당한 사유가 있다면 예외적으로 인정될 수 있으니 고용센터에 확인해보세요.');
    }
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  if (!r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
  } else {
    el.headline.textContent = comma(r.totalBenefit) + '원';
    el.headSub.textContent = '1일 ' + comma(r.dailyBenefit) + '원 × ' + r.benefitDays + '일';
  }

  el.dDays.textContent = r.valid ? comma(r.days) + '일' : '-';
  el.dInsured.textContent = r.valid ? (r.totalInsuredDays / 365).toFixed(1) + '년' : '-';
  el.dBenefitDays.textContent = r.valid ? r.benefitDays + '일' : '-';
  el.dOrdinaryNote.hidden = !r.usedOrdinary;

  el.rAvgDaily.textContent = comma(Math.round(r.baseDaily));
  el.rDailyBenefit.textContent = comma(r.dailyBenefit);
  el.rBenefitDays.textContent = r.benefitDays;
  el.rTotal.textContent = comma(r.totalBenefit);

  var capNote = '';
  if (r.valid && r.dailyBenefit > 0) {
    if (r.dailyRaw < LOWER) capNote = '평균임금의 60%(' + comma(Math.round(r.dailyRaw)) + '원)가 하한액보다 적어 하한액이 적용됐습니다.';
    else if (r.dailyRaw > UPPER) capNote = '평균임금의 60%(' + comma(Math.round(r.dailyRaw)) + '원)가 상한액보다 많아 상한액이 적용됐습니다.';
  }
  el.capNote.textContent = capNote;

  el.tAvgDaily.textContent = comma(Math.round(r.baseDaily));
  el.tRaw.textContent = comma(Math.round(r.dailyRaw));
}

/* ---------- 시작 ---------- */
attachMoneyFormat(el.pay, render);
attachMoneyFormat(el.bonus, render);
attachMoneyFormat(el.leavePay, render);
attachMoneyFormat(el.ordinary, render);
el.join.addEventListener('change', render);
el.leave.addEventListener('change', render);
el.join.addEventListener('input', render);
el.leave.addEventListener('input', render);

el.age.addEventListener('input', render);
el.priorYears.addEventListener('input', render);
Array.prototype.forEach.call(el.reason, function (radio) {
  radio.addEventListener('change', render);
});

function wireChips(chips, target, render) {
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      target.value = chip.dataset.amount;
      Array.prototype.forEach.call(chips, function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      render();
    });
  });
}
wireChips(el.ageChips, el.age, render);
Array.prototype.forEach.call(el.payChips, function (chip) {
  chip.addEventListener('click', function () {
    el.pay.value = comma(chip.dataset.amount);
    Array.prototype.forEach.call(el.payChips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

render();
