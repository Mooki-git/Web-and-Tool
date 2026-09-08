/* =========================================================
   압력 변환기
   기준 단위: Pa (파스칼)
   - kPa/MPa: SI 배수
   - bar: 정의상 정확히 100,000Pa
   - atm: 표준대기압, 정의상 정확히 101,325Pa
   - psi: 1 lbf/in² = 4.4482216152605N / 0.00064516m² = 6894.757293168361Pa (정확)
   - mmHg: 관용 수은주밀리미터, 13595.1kg/m³ × 9.80665m/s² × 0.001m = 133.322387415Pa (정확, NIST 정의)
   - kgf/cm²: 1kgf/cm² = 9.80665N / 0.0001m² = 98066.5Pa (정확)
   ========================================================= */

var UNITS = {
  Pa:     { label: 'Pa (파스칼)', toBase: 1 },
  kPa:    { label: 'kPa (킬로파스칼)', toBase: 1000 },
  MPa:    { label: 'MPa (메가파스칼)', toBase: 1000000 },
  bar:    { label: 'bar (바)', toBase: 100000 },
  atm:    { label: 'atm (표준대기압)', toBase: 101325 },
  psi:    { label: 'psi (제곱인치당 파운드)', toBase: 6894.757293168361 },
  mmHg:   { label: 'mmHg (수은주밀리미터)', toBase: 133.322387415 },
  kgfcm2: { label: 'kgf/cm² (평방센티당 킬로그램힘)', toBase: 98066.5 }
};

var UNIT_ORDER = ['Pa', 'kPa', 'MPa', 'bar', 'atm', 'psi', 'mmHg', 'kgfcm2'];

function calculate(value, fromUnit) {
  if (!(value >= 0) || !UNITS[fromUnit]) {
    return { valid: false };
  }
  var pa = value * UNITS[fromUnit].toBase;
  var results = UNIT_ORDER.map(function (key) {
    return { unit: key, label: UNITS[key].label, value: pa / UNITS[key].toBase };
  });
  return { valid: true, pa: pa, results: results };
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
