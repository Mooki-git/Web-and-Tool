/* =========================================================
   전역일 계산기
   - 입영일 + 복무기간(개월) - 1일 = 전역(소집해제) 예정일
   - 복무기간: 육군·해병대 18개월, 해군 20개월, 공군 21개월,
     사회복무요원 21개월, 대체복무요원 36개월
   ========================================================= */

var SERVICE_MONTHS = {
  army: 18,       // 육군·해병대
  navy: 20,       // 해군
  airforce: 21,   // 공군
  social: 21,     // 사회복무요원
  alternative: 36 // 대체복무요원
};
var USES_DISCHARGE_LABEL = { army: true, navy: true, airforce: true, social: false, alternative: false };

function isValidDate(y, m, d) {
  var dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

function addMonthsClamped(y, m, d, n) {
  var total = (m - 1) + n;
  var newY = y + Math.floor(total / 12);
  var newM = ((total % 12) + 12) % 12 + 1;
  var maxDay = daysInMonth(newY, newM);
  var newD = Math.min(d, maxDay);
  return { y: newY, m: newM, d: newD };
}
function addDaysToYMD(y, m, d, n) {
  var dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

function calculate(enlistY, enlistM, enlistD, serviceType, todayY, todayM, todayD) {
  if (!isValidDate(enlistY, enlistM, enlistD)) return { valid: false };
  var months = SERVICE_MONTHS[serviceType];
  if (!months) return { valid: false };

  var plusMonths = addMonthsClamped(enlistY, enlistM, enlistD, months);
  var discharge = addDaysToYMD(plusMonths.y, plusMonths.m, plusMonths.d, -1);

  var enlistDate = new Date(enlistY, enlistM - 1, enlistD);
  var dischargeDate = new Date(discharge.y, discharge.m - 1, discharge.d);
  var todayDate = new Date(todayY, todayM - 1, todayD);

  var totalDays = daysBetween(enlistDate, dischargeDate) + 1;
  var elapsedDaysRaw = daysBetween(enlistDate, todayDate) + 1;
  var elapsedDays = Math.max(0, Math.min(totalDays, elapsedDaysRaw));
  var progressPct = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
  var dDay = daysBetween(todayDate, dischargeDate);

  return {
    valid: true, months: months, discharge: discharge,
    totalDays: totalDays, elapsedDays: elapsedDays, progressPct: progressPct,
    dDay: dDay, isDischarged: dDay < 0, isToday: dDay === 0
  };
}

/* ---------- 숫자 포맷 ---------- */
function comma(n) { return Number(n).toLocaleString('ko-KR'); }

var $ = function (id) { return document.getElementById(id); };

var el = {
  enlistY: $('enlist-y'), enlistM: $('enlist-m'), enlistD: $('enlist-d'),
  serviceRadios: document.querySelectorAll('input[name="service"]'),
  warn: $('warn'),
  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'),
  progressFill: $('progress-fill'), progressPct: $('progress-pct'),
  fMonths: $('f-months'), fElapsed: $('f-elapsed'), fRemain: $('f-remain')
};

function populateYearSelect(select, min, max, selected) {
  var html = '';
  for (var y = max; y >= min; y--) {
    html += '<option value="' + y + '"' + (y === selected ? ' selected' : '') + '>' + y + '</option>';
  }
  select.innerHTML = html;
}
function buildOptions(from, to, selected) {
  var html = '';
  for (var v = from; v <= to; v++) {
    html += '<option value="' + v + '"' + (v === selected ? ' selected' : '') + '>' + v + '</option>';
  }
  return html;
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

function currentService() {
  var checked = document.querySelector('input[name="service"]:checked');
  return checked ? checked.value : 'army';
}

function formatDate(y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }

function render() {
  var y = +el.enlistY.value, m = +el.enlistM.value, d = +el.enlistD.value;
  var service = currentService();
  var today = new Date();
  var r = calculate(y, m, d, service, today.getFullYear(), today.getMonth() + 1, today.getDate());

  el.warn.hidden = true;

  var isMilitary = USES_DISCHARGE_LABEL[service];
  var label = isMilitary ? '전역' : '소집해제';
  el.headLabel.textContent = label + ' 예정일';
  el.headline.textContent = formatDate(r.discharge.y, r.discharge.m, r.discharge.d);

  if (r.isDischarged) {
    el.headSub.textContent = label + '한 지 ' + comma(Math.abs(r.dDay)) + '일 지났습니다';
  } else if (r.isToday) {
    el.headSub.textContent = '오늘이 ' + label + '일입니다';
  } else {
    el.headSub.textContent = label + '까지 D-' + comma(r.dDay);
  }

  var pct = Math.max(0, Math.min(100, r.progressPct));
  el.progressFill.style.width = pct.toFixed(1) + '%';
  el.progressPct.textContent = pct.toFixed(1) + '%';

  el.fMonths.textContent = r.months + '개월';
  el.fElapsed.textContent = comma(r.elapsedDays) + '일';
  el.fRemain.textContent = comma(Math.max(0, r.totalDays - r.elapsedDays)) + '일';
}

/* ---------- 시작 ---------- */
var today = new Date();
var YEAR_MIN = today.getFullYear() - 5, YEAR_MAX = today.getFullYear() + 1;

populateYearSelect(el.enlistY, YEAR_MIN, YEAR_MAX, today.getFullYear());
populateMonthSelect(el.enlistM, today.getMonth() + 1);
populateDaySelect(el.enlistD, daysInMonth(today.getFullYear(), today.getMonth() + 1), today.getDate());

wireDateField(el.enlistY, el.enlistM, el.enlistD, render);

Array.prototype.forEach.call(el.serviceRadios, function (radio) {
  radio.addEventListener('change', render);
});

render();
