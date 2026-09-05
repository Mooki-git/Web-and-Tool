/* =========================================================
   만 나이 계산기
   - 만 나이: 출생일 기준, 생일이 지날 때마다 +1 (2023.6.28 시행 "만 나이 통일법" 기준)
   - 연 나이: 기준연도 - 출생연도 (병역법·청소년보호법 등에서 사용)
   - 세는 나이: 기준연도 - 출생연도 + 1 (2023년 이전 관습적 계산법, 법적 효력 없음)
   ========================================================= */

function daysBetween(a, b) { return Math.round((b - a) / 86400000); }

/* 연/월/일 단위로 정밀하게 나이를 쪼갠다 (예: 36년 3개월 21일) */
function preciseAge(birthY, birthM, birthD, refY, refM, refD) {
  var years = refY - birthY;
  var months = refM - birthM;
  var days = refD - birthD;
  if (days < 0) {
    months -= 1;
    var prevMonthLastDay = new Date(refY, refM - 1, 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: years, months: months, days: days };
}

function calculate(o) {
  var birthY = o.birthY, birthM = o.birthM, birthD = o.birthD;
  var refY = o.refY, refM = o.refM, refD = o.refD;

  var birth = new Date(birthY, birthM - 1, birthD);
  var ref = new Date(refY, refM - 1, refD);

  var birthValid = birth.getFullYear() === birthY && birth.getMonth() === birthM - 1 && birth.getDate() === birthD;
  var refValid = ref.getFullYear() === refY && ref.getMonth() === refM - 1 && ref.getDate() === refD;
  var isFuture = birth.getTime() > ref.getTime();

  if (!birthValid || !refValid || isFuture) {
    return { valid: false, birthValid: birthValid, refValid: refValid, isFuture: isFuture };
  }

  var manAge = refY - birthY;
  var hadBirthdayThisYear = (refM > birthM) || (refM === birthM && refD >= birthD);
  if (!hadBirthdayThisYear) manAge -= 1;

  var yeonAge = refY - birthY;
  var senunAge = refY - birthY + 1;

  var nextBirthday = new Date(refY, birthM - 1, birthD);
  if (nextBirthday.getTime() < ref.getTime()) {
    nextBirthday = new Date(refY + 1, birthM - 1, birthD);
  }
  var daysToNextBirthday = daysBetween(ref, nextBirthday);
  var isBirthdayToday = daysToNextBirthday === 0;

  var totalDaysLived = daysBetween(birth, ref);
  var precise = preciseAge(birthY, birthM, birthD, refY, refM, refD);

  return {
    valid: true,
    manAge: manAge, yeonAge: yeonAge, senunAge: senunAge,
    daysToNextBirthday: daysToNextBirthday, isBirthdayToday: isBirthdayToday,
    totalDaysLived: totalDaysLived, precise: precise,
    nextBirthday: nextBirthday
  };
}

/* ---------- 숫자 포맷 ---------- */
function comma(n) { return Number(n).toLocaleString('ko-KR'); }

var $ = function (id) { return document.getElementById(id); };

var el = {
  birth: $('birth'), ref: $('ref'), warn: $('warn'),
  headLabel: $('head-label'), headline: $('headline'), headSub: $('head-sub'),
  fMan: $('f-man'), fYeon: $('f-yeon'), fSenun: $('f-senun'),
  nextBdayLabel: $('next-bday-label'), dNextBday: $('d-nextbday'), dTotalDays: $('d-totaldays')
};

function pad2(n) { return n < 10 ? '0' + n : String(n); }
function todayISODate() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function parseISODate(s) {
  var p = String(s || '').split('-');
  if (p.length !== 3) return null;
  var y = +p[0], m = +p[1], d = +p[2];
  if (!y || !m || !d) return null;
  return { y: y, m: m, d: d };
}
function formatKoreanDate(y, m, d) { return y + '년 ' + m + '월 ' + d + '일'; }

function render() {
  var b = parseISODate(el.birth.value);
  var r = parseISODate(el.ref.value);

  if (!b || !r) {
    el.warn.textContent = '생년월일과 기준일을 모두 입력해주세요.';
    el.warn.hidden = false;
    return;
  }

  var result = calculate({ birthY: b.y, birthM: b.m, birthD: b.d, refY: r.y, refM: r.m, refD: r.d });

  if (!result.valid) {
    var msg = '';
    if (!result.birthValid) msg = '생년월일이 올바르지 않습니다. 날짜를 다시 확인해주세요.';
    else if (!result.refValid) msg = '기준일이 올바르지 않습니다. 날짜를 다시 확인해주세요.';
    else if (result.isFuture) msg = '기준일이 생년월일보다 앞설 수 없습니다.';
    el.warn.textContent = msg;
    el.warn.hidden = false;
    el.headline.textContent = '-';
    el.headSub.textContent = '-';
    el.fMan.textContent = '-'; el.fYeon.textContent = '-'; el.fSenun.textContent = '-';
    el.dNextBday.textContent = '-'; el.dTotalDays.textContent = '-';
    return;
  }

  el.warn.hidden = true;

  el.headline.textContent = result.manAge + '세';
  el.headSub.textContent = '정확히는 ' + result.precise.years + '년 ' + result.precise.months + '개월 ' + result.precise.days + '일';

  el.fMan.textContent = result.manAge + '세';
  el.fYeon.textContent = result.yeonAge + '세';
  el.fSenun.textContent = result.senunAge + '세';

  if (result.isBirthdayToday) {
    el.nextBdayLabel.textContent = '오늘';
    el.dNextBday.textContent = '생일입니다 🎉';
  } else {
    el.nextBdayLabel.textContent = '다음 생일까지';
    el.dNextBday.textContent = 'D-' + comma(result.daysToNextBirthday) + '일 (' +
      formatKoreanDate(result.nextBirthday.getFullYear(), result.nextBirthday.getMonth() + 1, result.nextBirthday.getDate()) + ')';
  }

  el.dTotalDays.textContent = comma(result.totalDaysLived) + '일째';
}

/* ---------- 시작 ---------- */
if (!el.ref.value) el.ref.value = todayISODate();

el.birth.addEventListener('input', render);
el.birth.addEventListener('change', render);
el.ref.addEventListener('input', render);
el.ref.addEventListener('change', render);

render();
