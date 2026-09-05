/* =========================================================
   날짜 계산기
   - 모드 A: 두 날짜 사이 일수 계산
   - 모드 B: 특정일로부터 N일 후/전 날짜 계산
   ========================================================= */

var WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function isValidDate(y, m, d) {
  var dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function weekdayOf(y, m, d) { return WEEKDAY_KO[new Date(y, m - 1, d).getDay()]; }

function daysDiff(y1, m1, d1, y2, m2, d2) {
  if (!isValidDate(y1, m1, d1) || !isValidDate(y2, m2, d2)) return { valid: false };
  var a = new Date(y1, m1 - 1, d1);
  var b = new Date(y2, m2 - 1, d2);
  var diff = daysBetween(a, b);
  var abs = Math.abs(diff);
  return {
    valid: true, diffDays: diff, absDays: abs,
    weeks: Math.floor(abs / 7), remDays: abs % 7, isSameDay: diff === 0,
    startWeekday: weekdayOf(y1, m1, d1), endWeekday: weekdayOf(y2, m2, d2)
  };
}

function addDays(y, m, d, n) {
  if (!isValidDate(y, m, d)) return { valid: false };
  var date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return { valid: true, year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), weekday: WEEKDAY_KO[date.getDay()] };
}

/* ---------- 숫자 포맷 ---------- */
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }

var $ = function (id) { return document.getElementById(id); };

var el = {
  modeRadios: document.querySelectorAll('input[name="mode"]'),
  panelDiff: $('panel-diff'), panelAdd: $('panel-add'),
  diffStartY: $('diff-start-y'), diffStartM: $('diff-start-m'), diffStartD: $('diff-start-d'),
  diffEndY: $('diff-end-y'), diffEndM: $('diff-end-m'), diffEndD: $('diff-end-d'),
  addBaseY: $('add-base-y'), addBaseM: $('add-base-m'), addBaseD: $('add-base-d'),
  directionRadios: document.querySelectorAll('input[name="direction"]'),
  addN: $('add-n'), addChips: document.querySelectorAll('#panel-add .chips .chip'),
  warn: $('warn'),
  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'),
  detailCard: $('detail-card'), detailTitle: $('detail-title'),
  factsDiff: $('facts-diff'), fStartWeekday: $('f-start-weekday'), fEndWeekday: $('f-end-weekday'),
  dWeeks: $('d-weeks')
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

function currentMode() {
  var checked = document.querySelector('input[name="mode"]:checked');
  return checked ? checked.value : 'diff';
}
function currentDirection() {
  var checked = document.querySelector('input[name="direction"]:checked');
  return checked ? checked.value : 'after';
}
function readN() {
  var d = onlyDigits(el.addN.value);
  var n = d ? Number(d) : 0;
  return Math.max(0, Math.min(99999, n));
}

function formatDate(y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }

function renderDiff() {
  var y1 = +el.diffStartY.value, m1 = +el.diffStartM.value, d1 = +el.diffStartD.value;
  var y2 = +el.diffEndY.value, m2 = +el.diffEndM.value, d2 = +el.diffEndD.value;
  var r = daysDiff(y1, m1, d1, y2, m2, d2);

  el.warn.hidden = true;
  el.detailCard.hidden = false;
  el.factsDiff.hidden = false;
  el.detailTitle.textContent = '상세 정보';

  el.headLabel.textContent = '일수 차이';
  if (r.isSameDay) {
    el.headline.textContent = '같은 날짜';
    el.headSub.textContent = formatDate(y1, m1, d1) + ' (' + r.startWeekday + ')';
  } else {
    el.headline.textContent = comma(r.absDays) + '일';
    var earlier = r.diffDays > 0 ? formatDate(y1, m1, d1) : formatDate(y2, m2, d2);
    var later = r.diffDays > 0 ? formatDate(y2, m2, d2) : formatDate(y1, m1, d1);
    el.headSub.textContent = earlier + ' → ' + later;
  }

  el.fStartWeekday.textContent = r.startWeekday + '요일';
  el.fEndWeekday.textContent = r.endWeekday + '요일';
  el.dWeeks.textContent = r.weeks + '주 ' + r.remDays + '일';
}

function renderAdd() {
  var y = +el.addBaseY.value, m = +el.addBaseM.value, d = +el.addBaseD.value;
  var n = readN();
  var direction = currentDirection();
  var signedN = direction === 'before' ? -n : n;
  var r = addDays(y, m, d, signedN);

  el.warn.hidden = true;
  el.detailCard.hidden = true;

  el.headLabel.textContent = direction === 'after' ? (comma(n) + '일 후') : (comma(n) + '일 전');
  el.headline.textContent = formatDate(r.year, r.month, r.day) + ' (' + r.weekday + ')';
  el.headSub.textContent = formatDate(y, m, d) + ' 기준';
}

function render() {
  if (currentMode() === 'diff') renderDiff();
  else renderAdd();
}

function updatePanels() {
  var mode = currentMode();
  el.panelDiff.hidden = mode !== 'diff';
  el.panelAdd.hidden = mode !== 'add';
}

/* ---------- 시작 ---------- */
var today = new Date();
var YEAR_MIN = today.getFullYear() - 100, YEAR_MAX = today.getFullYear() + 20;

populateYearSelect(el.diffStartY, YEAR_MIN, YEAR_MAX, today.getFullYear());
populateMonthSelect(el.diffStartM, today.getMonth() + 1);
populateDaySelect(el.diffStartD, daysInMonth(today.getFullYear(), today.getMonth() + 1), today.getDate());

var in100Days = new Date(today.getTime() + 100 * 86400000);
populateYearSelect(el.diffEndY, YEAR_MIN, YEAR_MAX, in100Days.getFullYear());
populateMonthSelect(el.diffEndM, in100Days.getMonth() + 1);
populateDaySelect(el.diffEndD, daysInMonth(in100Days.getFullYear(), in100Days.getMonth() + 1), in100Days.getDate());

populateYearSelect(el.addBaseY, YEAR_MIN, YEAR_MAX, today.getFullYear());
populateMonthSelect(el.addBaseM, today.getMonth() + 1);
populateDaySelect(el.addBaseD, daysInMonth(today.getFullYear(), today.getMonth() + 1), today.getDate());

wireDateField(el.diffStartY, el.diffStartM, el.diffStartD, render);
wireDateField(el.diffEndY, el.diffEndM, el.diffEndD, render);
wireDateField(el.addBaseY, el.addBaseM, el.addBaseD, render);

Array.prototype.forEach.call(el.modeRadios, function (radio) {
  radio.addEventListener('change', function () { updatePanels(); render(); });
});
Array.prototype.forEach.call(el.directionRadios, function (radio) {
  radio.addEventListener('change', render);
});

el.addN.addEventListener('input', function () {
  var digits = onlyDigits(el.addN.value);
  el.addN.value = digits;
  Array.prototype.forEach.call(el.addChips, function (c) { c.classList.remove('is-active'); });
  render();
});
Array.prototype.forEach.call(el.addChips, function (chip) {
  chip.addEventListener('click', function () {
    el.addN.value = chip.dataset.amount;
    Array.prototype.forEach.call(el.addChips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

updatePanels();
render();
