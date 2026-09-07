/* =========================================================
   배란일·가임기 계산기
   - 배란일 = 생리 시작일 + (생리주기 - 14일)  [황체기는 대부분 14일로 고정]
   - 가임기 = 배란일 5일 전 ~ 배란일 1일 후 (정자 생존 최대 5일 + 난자 생존 ~1일 반영)
   - 다음 생리 예정일 = 생리 시작일 + 생리주기
   - 이번 주기 포함 3주기(향후 2개월) 예측
   ========================================================= */

var CYCLE_MIN = 15, CYCLE_MAX = 45;
var NORMAL_MIN = 21, NORMAL_MAX = 35;
var LUTEAL = 14;
var FERTILE_BEFORE = 5, FERTILE_AFTER = 1;

function addDays(date, n) { return new Date(date.getTime() + n * 86400000); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function calculate(o) {
  var lmpY = o.lmpY, lmpM = o.lmpM, lmpD = o.lmpD;
  var cycleLength = o.cycleLength;
  var today = o.today || new Date(o.todayY, o.todayM - 1, o.todayD);

  var lmp = new Date(lmpY, lmpM - 1, lmpD);
  var lmpValid = lmp.getFullYear() === lmpY && lmp.getMonth() === lmpM - 1 && lmp.getDate() === lmpD;
  var isFuture = lmp.getTime() > today.getTime();

  if (!lmpValid || isFuture || !(cycleLength >= CYCLE_MIN && cycleLength <= CYCLE_MAX)) {
    return { valid: false, lmpValid: lmpValid, isFuture: isFuture };
  }

  var cycles = [];
  for (var k = 0; k < 3; k++) {
    var periodStart = addDays(lmp, k * cycleLength);
    var ovulation = addDays(periodStart, cycleLength - LUTEAL);
    var fertileStart = addDays(ovulation, -FERTILE_BEFORE);
    var fertileEnd = addDays(ovulation, FERTILE_AFTER);
    var nextPeriod = addDays(periodStart, cycleLength);
    cycles.push({
      periodStart: periodStart, ovulation: ovulation,
      fertileStart: fertileStart, fertileEnd: fertileEnd,
      nextPeriod: nextPeriod
    });
  }

  // 오늘과 가장 가까운(지나지 않은) 배란일 찾기. 셋 다 지났으면 마지막(3번째) 주기를 기준으로.
  var nearestIndex = cycles.length - 1;
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].ovulation.getTime() >= today.getTime()) { nearestIndex = i; break; }
  }
  var daysToNearest = daysBetween(today, cycles[nearestIndex].ovulation);
  var allPast = cycles[cycles.length - 1].ovulation.getTime() < today.getTime();

  var irregularCycle = cycleLength < NORMAL_MIN || cycleLength > NORMAL_MAX;

  return {
    valid: true, cycles: cycles,
    nearestIndex: nearestIndex, daysToNearest: daysToNearest, allPast: allPast,
    irregularCycle: irregularCycle
  };
}

/* ---------- 숫자·날짜 포맷 ---------- */
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function formatDate(d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
function formatDateFull(d) { return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; }
function formatRange(a, b) { return formatDate(a) + ' ~ ' + formatDate(b); }

var $ = function (id) { return document.getElementById(id); };

var el = {
  lmpY: $('lmp-y'), lmpM: $('lmp-m'), lmpD: $('lmp-d'),
  cycle: $('cycle'), cycleChips: document.querySelectorAll('.chips .chip'),
  warn: $('warn'),
  headline: $('headline'), headSub: $('head-sub'),
  rows: $('cycle-rows')
};

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

function readCycleRaw() {
  var d = onlyDigits(el.cycle.value);
  return d ? Number(d) : 28;
}

function render() {
  var lmpY = +el.lmpY.value, lmpM = +el.lmpM.value, lmpD = +el.lmpD.value;
  var rawCycle = readCycleRaw();
  var cycleLength = Math.max(CYCLE_MIN, Math.min(CYCLE_MAX, rawCycle));
  var today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  var result = calculate({ lmpY: lmpY, lmpM: lmpM, lmpD: lmpD, cycleLength: cycleLength, today: today });

  if (!result.valid) {
    var msg = result.isFuture
      ? '마지막 생리 시작일은 오늘보다 미래일 수 없습니다.'
      : '입력한 날짜를 확인해주세요.';
    el.warn.innerHTML = '<p>' + msg + '</p>';
    el.warn.hidden = false;
    el.headline.textContent = '-';
    el.headSub.textContent = '-';
    el.rows.innerHTML = '';
    return;
  }

  var warnParts = [];
  if (rawCycle !== cycleLength) {
    warnParts.push('생리주기는 ' + CYCLE_MIN + '~' + CYCLE_MAX + '일 범위로만 계산할 수 있어, <strong>' + cycleLength + '일</strong> 기준으로 계산했습니다.');
  } else if (result.irregularCycle) {
    warnParts.push('생리주기가 21~35일 범위를 벗어나 <strong>불규칙한 주기</strong>입니다. 이런 경우 계산의 정확도가 낮아질 수 있어, 산부인과 진료나 배란테스트기로 확인하는 것이 좋습니다.');
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  var nearest = result.cycles[result.nearestIndex];
  el.headline.textContent = formatDateFull(nearest.ovulation);
  if (result.allPast) {
    el.headSub.textContent = '이미 지난 예상일입니다 (최근 생리 시작일을 다시 확인해보세요)';
  } else if (result.daysToNearest === 0) {
    el.headSub.textContent = '오늘이 예상 배란일입니다';
  } else {
    el.headSub.textContent = 'D-' + comma(result.daysToNearest) + '일 · 가임기 ' + formatRange(nearest.fertileStart, nearest.fertileEnd);
  }

  el.rows.innerHTML = result.cycles.map(function (c) {
    return '<tr><td>' + formatDate(c.periodStart) + '</td><td class="hi">' + formatDate(c.ovulation) + '</td><td>' + formatRange(c.fertileStart, c.fertileEnd) + '</td><td>' + formatDate(c.nextPeriod) + '</td></tr>';
  }).join('');
}

/* ---------- 시작 ---------- */
var today0 = new Date();
var defaultLMP = new Date(today0.getTime() - 10 * 86400000); // 데모용 기본값: 오늘로부터 10일 전

var YEAR_MIN = today0.getFullYear() - 2, YEAR_MAX = today0.getFullYear() + 2;

populateYearSelect(el.lmpY, YEAR_MIN, YEAR_MAX, defaultLMP.getFullYear());
populateMonthSelect(el.lmpM, defaultLMP.getMonth() + 1);
populateDaySelect(el.lmpD, daysInMonth(defaultLMP.getFullYear(), defaultLMP.getMonth() + 1), defaultLMP.getDate());

wireDateField(el.lmpY, el.lmpM, el.lmpD, render);

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
