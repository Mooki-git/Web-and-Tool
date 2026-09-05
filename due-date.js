/* =========================================================
   출산예정일 계산기
   - 네겔레 법칙(Naegele's Rule): 예정일 = 마지막 생리 시작일(LMP) + 280일(40주)
   - 생리주기가 28일이 아니면 그 차이만큼 보정: 보정LMP = LMP + (주기 - 28)일
   - 임신주수는 보정LMP를 기준으로 계산 (그래야 예정일 당일 = 정확히 40주0일)
   ========================================================= */

function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function calculate(o) {
  var lmpY = o.lmpY, lmpM = o.lmpM, lmpD = o.lmpD;
  var cycleLength = o.cycleLength || 28;
  var refY = o.refY, refM = o.refM, refD = o.refD;

  var lmp = new Date(lmpY, lmpM - 1, lmpD);
  var ref = new Date(refY, refM - 1, refD);

  var lmpValid = lmp.getFullYear() === lmpY && lmp.getMonth() === lmpM - 1 && lmp.getDate() === lmpD;
  var refValid = ref.getFullYear() === refY && ref.getMonth() === refM - 1 && ref.getDate() === refD;
  var isFuture = lmp.getTime() > ref.getTime();

  if (!lmpValid || !refValid || isFuture) {
    return { valid: false, lmpValid: lmpValid, refValid: refValid, isFuture: isFuture };
  }

  var cycleAdj = cycleLength - 28;
  var effectiveLMP = new Date(lmp.getTime() + cycleAdj * 86400000);

  var edd = new Date(effectiveLMP.getTime() + 280 * 86400000);

  var daysSinceLMP = daysBetween(effectiveLMP, ref);
  var gestWeeks = Math.floor(daysSinceLMP / 7);
  var gestDays = daysSinceLMP % 7;

  var daysToEDD = daysBetween(ref, edd);
  var isPastDue = daysToEDD < 0;

  var trimester = gestWeeks <= 13 ? 1 : (gestWeeks <= 27 ? 2 : 3);

  var trimester2Start = new Date(effectiveLMP.getTime() + 14 * 7 * 86400000);
  var trimester3Start = new Date(effectiveLMP.getTime() + 28 * 7 * 86400000);

  var overdue = gestWeeks > 42;
  var irregularCycle = cycleLength < 21 || cycleLength > 35;

  return {
    valid: true,
    edd: edd, effectiveLMP: effectiveLMP,
    gestWeeks: gestWeeks, gestDays: gestDays, daysSinceLMP: daysSinceLMP,
    daysToEDD: daysToEDD, isPastDue: isPastDue,
    trimester: trimester,
    trimester2Start: trimester2Start, trimester3Start: trimester3Start,
    overdue: overdue, irregularCycle: irregularCycle
  };
}

/* ---------- 숫자 포맷 ---------- */
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function formatDate(y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }

var $ = function (id) { return document.getElementById(id); };

var el = {
  lmpY: $('lmp-y'), lmpM: $('lmp-m'), lmpD: $('lmp-d'),
  refY: $('ref-y'), refM: $('ref-m'), refD: $('ref-d'),
  cycle: $('cycle'), cycleChips: document.querySelectorAll('.chips .chip'),
  warn: $('warn'),
  headline: $('headline'), headSub: $('head-sub'),
  fWeek: $('f-week'), fTrimester: $('f-trimester'),
  dTrimester2: $('d-trimester2'), dTrimester3: $('d-trimester3')
};

var TRIMESTER_NAMES = { 1: '초기 (1분기)', 2: '중기 (2분기)', 3: '후기 (3분기)' };

function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function buildOptions(from, to, selected) {
  var html = '';
  for (var v = from; v <= to; v++) {
    html += '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + v + '</option>';
  }
  return html;
}
function populateYearSelect(select, min, max, selected) {
  var html = '';
  for (var y = max; y >= min; y--) {
    html += '<option value="' + y + '"' + (y === selected ? ' selected' : '') + '>' + y + '</option>';
  }
  select.innerHTML = html;
}
function populateMonthSelect(select, selected) { select.innerHTML = buildOptions(1, 12, selected); }
function populateDaySelect(select, maxDay, selected) { select.innerHTML = buildOptions(1, maxDay, selected); }

function wireDateField(ySel, mSel, dSel, onChange) {
  function syncDays() {
    var y = +ySel.value, m = +mSel.value;
    var max = daysInMonth(y, m);
    var wanted = Math.min(+dSel.value || 1, max);
    populateDaySelect(dSel, max, wanted);
  }
  ySel.addEventListener('change', function () { syncDays(); onChange(); });
  mSel.addEventListener('change', function () { syncDays(); onChange(); });
  dSel.addEventListener('change', onChange);
}

function readCycle() {
  var d = onlyDigits(el.cycle.value);
  var n = d ? Number(d) : 28;
  return Math.max(15, Math.min(45, n));
}

function render() {
  var lmpY = +el.lmpY.value, lmpM = +el.lmpM.value, lmpD = +el.lmpD.value;
  var refY = +el.refY.value, refM = +el.refM.value, refD = +el.refD.value;
  var cycleLength = readCycle();

  var result = calculate({ lmpY: lmpY, lmpM: lmpM, lmpD: lmpD, cycleLength: cycleLength, refY: refY, refM: refM, refD: refD });

  if (!result.valid) {
    var msg = result.isFuture
      ? '기준일이 마지막 생리 시작일보다 앞설 수 없습니다.'
      : '입력한 날짜를 확인해주세요.';
    el.warn.innerHTML = '<p>' + msg + '</p>';
    el.warn.hidden = false;
    el.headline.textContent = '-';
    el.headSub.textContent = '-';
    el.fWeek.textContent = '-'; el.fTrimester.textContent = '-';
    el.dTrimester2.textContent = '-'; el.dTrimester3.textContent = '-';
    return;
  }

  var warnParts = [];
  if (result.irregularCycle) {
    warnParts.push('생리주기가 21~35일 범위를 벗어나 <strong>불규칙한 주기</strong>입니다. 이런 경우 마지막 생리일 기준 계산의 정확도가 낮아질 수 있어, 산부인과 초음파로 확인한 예정일을 우선하는 것이 좋습니다.');
  }
  if (result.overdue) {
    warnParts.push('임신 42주를 넘겼습니다. 날짜를 다시 확인해보시고, 실제로 42주를 넘겼다면 반드시 병원에서 확인받으세요.');
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  el.headline.textContent = formatDate(result.edd.getFullYear(), result.edd.getMonth() + 1, result.edd.getDate());
  if (result.isPastDue) {
    el.headSub.textContent = '예정일이 ' + comma(-result.daysToEDD) + '일 지났습니다';
  } else if (result.daysToEDD === 0) {
    el.headSub.textContent = '오늘이 예정일입니다';
  } else {
    el.headSub.textContent = 'D-' + comma(result.daysToEDD) + '일';
  }

  el.fWeek.textContent = result.gestWeeks + '주 ' + result.gestDays + '일';
  el.fTrimester.textContent = TRIMESTER_NAMES[result.trimester];

  el.dTrimester2.textContent = formatDate(result.trimester2Start.getFullYear(), result.trimester2Start.getMonth() + 1, result.trimester2Start.getDate());
  el.dTrimester3.textContent = formatDate(result.trimester3Start.getFullYear(), result.trimester3Start.getMonth() + 1, result.trimester3Start.getDate());
}

/* ---------- 시작 ---------- */
var today = new Date();
var defaultLMP = new Date(today.getTime() - 84 * 86400000); // 데모용 기본값: 오늘로부터 12주 전

var YEAR_MIN = today.getFullYear() - 2, YEAR_MAX = today.getFullYear() + 2;

populateYearSelect(el.lmpY, YEAR_MIN, YEAR_MAX, defaultLMP.getFullYear());
populateMonthSelect(el.lmpM, defaultLMP.getMonth() + 1);
populateDaySelect(el.lmpD, daysInMonth(defaultLMP.getFullYear(), defaultLMP.getMonth() + 1), defaultLMP.getDate());

populateYearSelect(el.refY, YEAR_MIN, YEAR_MAX, today.getFullYear());
populateMonthSelect(el.refM, today.getMonth() + 1);
populateDaySelect(el.refD, daysInMonth(today.getFullYear(), today.getMonth() + 1), today.getDate());

wireDateField(el.lmpY, el.lmpM, el.lmpD, render);
wireDateField(el.refY, el.refM, el.refD, render);

el.cycle.addEventListener('input', function () {
  var digits = onlyDigits(el.cycle.value);
  el.cycle.value = digits;
  Array.prototype.forEach.call(el.cycleChips, function (c) { c.classList.remove('is-active'); });
  render();
});

Array.prototype.forEach.call(el.cycleChips, function (chip) {
  chip.addEventListener('click', function () {
    el.cycle.value = chip.dataset.amount;
    Array.prototype.forEach.call(el.cycleChips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

render();
