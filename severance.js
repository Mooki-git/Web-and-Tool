/* =========================================================
   퇴직금 계산기 (2026년 기준)
   - 퇴직금 = 1일 평균임금 × 30일 × (재직일수 ÷ 365)
   - 평균임금 = 3개월 임금총액 ÷ 그 기간의 실제 일수
     (연간 상여금·전년도 연차수당은 3/12만 산입)
   - 평균임금 < 통상임금이면 통상임금 적용 (근로기준법 제2조 ②)
   - 퇴직소득세: 근속연수공제 → 환산급여(÷연수×12) → 환산급여공제
     → 과세표준 × 기본세율 ÷12 × 근속연수
   ========================================================= */

/* 부동소수점 오차 제거 후 절사 (연봉·4대보험 계산기와 동일 방식) */
function floorTo(n, unit) { return Math.floor(Math.round(n * 1000) / 1000 / unit) * unit; }

/* ---------- 날짜 ---------- */
function parseDate(s) {
  if (!s) return null;
  var p = s.split('-');
  if (p.length !== 3) return null;
  var d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d.getTime()) ? null : d;
}
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

/* 재직일수 — 퇴사일 당일은 포함하지 않음 */
function serviceDays(j, l) { return (j && l) ? daysBetween(j, l) : 0; }

/* 근속연수(소득세법 제48조) — 1월 미만 일수는 1월로, 1년 미만 월수는 1년으로 올림 */
function serviceYears(j, l) {
  if (!j || !l) return 0;
  var months = (l.getFullYear() - j.getFullYear()) * 12 + (l.getMonth() - j.getMonth());
  if (l.getDate() > j.getDate()) months += 1;
  if (months < 1) months = 1;
  return Math.max(1, Math.ceil(months / 12));
}

/* 평균임금 산정기간(퇴사일 직전 3개월)의 실제 일수 — 89~92일 */
function avgPeriodDays(l) {
  if (!l) return 0;
  var start = new Date(l.getFullYear(), l.getMonth() - 3, l.getDate());
  return daysBetween(start, l);
}

/* ---------- 퇴직소득세 공제표 ---------- */
function serviceDeduction(years) {
  if (years <= 5)  return 1000000 * years;
  if (years <= 10) return 5000000  + 2000000 * (years - 5);
  if (years <= 20) return 15000000 + 2500000 * (years - 10);
  return 40000000 + 3000000 * (years - 20);
}
function convertedDeduction(v) {
  if (v <= 8000000)   return v;
  if (v <= 70000000)  return 8000000   + (v - 8000000)   * 0.6;
  if (v <= 100000000) return 45200000  + (v - 70000000)  * 0.55;
  if (v <= 300000000) return 61700000  + (v - 100000000) * 0.45;
  return 151700000 + (v - 300000000) * 0.35;
}
/* 기본세율 8구간 (연봉 계산기와 동일한 표) */
function progressiveTax(base) {
  var B = [
    [14000000,   0.06, 0],        [50000000,   0.15, 1260000],
    [88000000,   0.24, 5760000],  [150000000,  0.35, 15440000],
    [300000000,  0.38, 19940000], [500000000,  0.40, 25940000],
    [1000000000, 0.42, 35940000], [Infinity,   0.45, 65940000]
  ];
  for (var i = 0; i < B.length; i++) if (base <= B[i][0]) return Math.max(0, base * B[i][1] - B[i][2]);
  return 0;
}

/* ---------- 메인 ---------- */
function calculate(o) {
  var j = parseDate(o.join), l = parseDate(o.leave);
  var days = serviceDays(j, l);
  var years = serviceYears(j, l);
  var periodDays = avgPeriodDays(l);
  var valid = !!(j && l) && days > 0;

  var wageSum = o.monthlyPay * 3 + o.bonus * 3 / 12 + o.annualLeavePay * 3 / 12;
  var avgDaily = periodDays > 0 ? wageSum / periodDays : 0;

  var ordinaryDaily = o.ordinaryDaily || 0;
  var usedOrdinary = ordinaryDaily > avgDaily;
  var baseDaily = usedOrdinary ? ordinaryDaily : avgDaily;

  var eligible = days >= 365;
  var severance = eligible ? Math.floor(baseDaily * 30 * (days / 365)) : 0;

  var sDeduct = serviceDeduction(years);
  var converted = severance > 0 ? Math.max(0, severance - sDeduct) / years * 12 : 0;
  var cDeduct = convertedDeduction(converted);
  var taxBase = Math.max(0, converted - cDeduct);
  var incomeTax = floorTo(progressiveTax(taxBase) / 12 * years, 1);
  var localTax = floorTo(incomeTax * 0.1, 1);
  var totalTax = incomeTax + localTax;

  return {
    valid: valid, days: days, years: years, periodDays: periodDays,
    wageSum: wageSum, avgDaily: avgDaily, usedOrdinary: usedOrdinary, baseDaily: baseDaily,
    eligible: eligible, severance: severance,
    sDeduct: sDeduct, converted: converted, cDeduct: cDeduct, taxBase: taxBase,
    incomeTax: incomeTax, localTax: localTax, totalTax: totalTax,
    netSeverance: severance - totalTax,
    effectiveRate: severance > 0 ? totalTax / severance : 0
  };
}

/* =========================================================
   화면
   ========================================================= */
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
  join: $('join'), leave: $('leave'),
  pay: $('pay'), payEcho: $('pay-echo'),
  chips: document.querySelectorAll('.chips .chip'),
  bonus: $('bonus'), leavePay: $('leave-pay'),
  ordinary: $('ordinary'),

  headline: $('headline'), headSub: $('head-sub'),
  warn: $('warn'),

  dDays: $('d-days'), dYears: $('d-years'), dPeriod: $('d-period'),
  dWageSum: $('d-wagesum'), dAvgDaily: $('d-avgdaily'), dOrdinaryNote: $('d-ordinary-note'),

  rSeverance: $('r-severance'), rIncomeTax: $('r-incometax'),
  rLocalTax: $('r-localtax'), rNet: $('r-net'), rRate: $('r-rate'),

  tSDeduct: $('t-sdeduct'), tConverted: $('t-converted'),
  tCDeduct: $('t-cdeduct'), tBase: $('t-base')
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

function render() {
  var monthlyPay = readMoney(el.pay);
  var r = calculate({
    join: el.join.value, leave: el.leave.value,
    monthlyPay: monthlyPay,
    bonus: readMoney(el.bonus),
    annualLeavePay: readMoney(el.leavePay),
    ordinaryDaily: readMoney(el.ordinary)
  });

  el.payEcho.innerHTML = monthlyPay > 0 ? '<strong>' + readable(monthlyPay) + '</strong>' : '';

  // 안내 문구
  var warn = '';
  if (!r.valid) warn = '입사일과 퇴사일을 모두 넣어주세요. 퇴사일은 마지막 근무일의 다음 날입니다.';
  else if (!r.eligible) warn = '재직일수가 ' + comma(r.days) + '일입니다. 퇴직금은 <strong>1년(365일) 이상</strong> 근무해야 지급 대상이 됩니다.';
  el.warn.innerHTML = warn;
  el.warn.hidden = !warn;

  if (!r.valid || !r.eligible) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
  } else {
    el.headline.textContent = comma(r.netSeverance) + '원';
    el.headSub.textContent = '퇴직금 ' + readable(r.severance) + ' · 세금 ' + readable(r.totalTax) + ' 공제 후';
  }

  el.dDays.textContent   = r.valid ? comma(r.days) + '일' : '-';
  el.dYears.textContent  = r.valid ? r.years + '년' : '-';
  el.dPeriod.textContent = r.valid ? r.periodDays + '일' : '-';
  el.dWageSum.textContent  = comma(Math.round(r.wageSum));
  el.dAvgDaily.textContent = comma(Math.round(r.baseDaily));
  el.dOrdinaryNote.hidden = !r.usedOrdinary;

  el.rSeverance.textContent = comma(r.severance);
  el.rIncomeTax.textContent = '-' + comma(r.incomeTax);
  el.rLocalTax.textContent  = '-' + comma(r.localTax);
  el.rNet.textContent       = comma(r.netSeverance);
  el.rRate.textContent      = (r.effectiveRate * 100).toFixed(2) + '%';

  el.tSDeduct.textContent   = comma(r.sDeduct);
  el.tConverted.textContent = comma(Math.round(r.converted));
  el.tCDeduct.textContent   = comma(Math.round(r.cDeduct));
  el.tBase.textContent      = comma(Math.round(r.taxBase));
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

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.pay.value = comma(chip.dataset.amount);
    Array.prototype.forEach.call(el.chips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

render();
