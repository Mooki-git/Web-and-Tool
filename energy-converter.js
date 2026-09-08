/* =========================================================
   에너지 환산기
   기준 단위: J (줄)
   - kJ: SI 배수
   - cal/kcal: 열화학 칼로리(thermochemical calorie) 기준, 1cal = 4.184J (정의값)
     * 식품 영양표시에 쓰는 "칼로리(Cal)"는 보통 kcal을 의미함
   - Wh/kWh: 1Wh = 1W × 1시간 = 1J/s × 3600s = 3600J (정의상 정확)
   - BTU: 국제단위표(IT) 기준 1 BTU = 1055.05585262 J (국제 표준)
   ========================================================= */

var UNITS = {
  J:    { label: 'J (줄)', toBase: 1 },
  kJ:   { label: 'kJ (킬로줄)', toBase: 1000 },
  cal:  { label: 'cal (칼로리)', toBase: 4.184 },
  kcal: { label: 'kcal (킬로칼로리)', toBase: 4184 },
  Wh:   { label: 'Wh (와트시)', toBase: 3600 },
  kWh:  { label: 'kWh (킬로와트시)', toBase: 3600000 },
  BTU:  { label: 'BTU (영국 열량 단위)', toBase: 1055.05585262 }
};

var UNIT_ORDER = ['J', 'kJ', 'cal', 'kcal', 'Wh', 'kWh', 'BTU'];

function calculate(value, fromUnit) {
  if (!(value >= 0) || !UNITS[fromUnit]) {
    return { valid: false };
  }
  var joules = value * UNITS[fromUnit].toBase;
  var results = UNIT_ORDER.map(function (key) {
    return { unit: key, label: UNITS[key].label, value: joules / UNITS[key].toBase };
  });
  return { valid: true, joules: joules, results: results };
}

/* ---------- 숫자 포맷 ---------- */
function onlyDecimal(s) {
  var cleaned = String(s).replace(/[^0-9.]/g, '');
  var firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
  }
  return cleaned;
}
function formatNumber(n) {
  if (!isFinite(n)) return '-';
  var rounded = Math.round(n * 1e6) / 1e6;
  var isNeg = rounded < 0;
  rounded = Math.abs(rounded);
  var parts = rounded.toString().split('.');
  var out = Number(parts[0]).toLocaleString('ko-KR');
  if (parts[1]) out += '.' + parts[1];
  return (isNeg ? '-' : '') + out;
}

var $ = function (id) { return document.getElementById(id); };

var el = {
  value: $('value'), unit: $('unit'),
  warn: $('warn'),
  rows: $('result-rows')
};

function render() {
  el.value.value = onlyDecimal(el.value.value);
  var num = parseFloat(el.value.value);
  if (isNaN(num)) num = 0;
  var fromUnit = el.unit.value;

  var result = calculate(num, fromUnit);

  if (!result.valid) {
    el.warn.innerHTML = '<p>0 이상의 숫자를 입력해주세요.</p>';
    el.warn.hidden = false;
    el.rows.innerHTML = '';
    return;
  }
  el.warn.hidden = true;

  el.rows.innerHTML = result.results.map(function (r) {
    var isCurrent = r.unit === fromUnit;
    return '<tr' + (isCurrent ? ' class="is-highlight"' : '') + '>' +
      '<th scope="row">' + r.label + '</th>' +
      '<td>' + formatNumber(r.value) + '</td></tr>';
  }).join('');
}

/* ---------- 시작 ---------- */
el.value.addEventListener('input', render);
el.unit.addEventListener('change', render);

render();
