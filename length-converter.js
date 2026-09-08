/* =========================================================
   길이 변환기
   기준 단위: m (미터)
   - mm/cm/m/km: SI, 정의상 정확한 배수
   - inch/ft/yd/mile: 1959년 국제 야드-파운드 협약 기준 정확한 값
     (1 inch = 2.54cm, 1 ft = 12 inch, 1 yd = 3 ft, 1 mile = 5280 ft)
   - ja(자/척): 대한민국 계량법 기준 1자 = 10/33 m (약 30.303cm)
   ========================================================= */

var UNITS = {
  mm:   { label: 'mm (밀리미터)', toBase: 0.001 },
  cm:   { label: 'cm (센티미터)', toBase: 0.01 },
  m:    { label: 'm (미터)', toBase: 1 },
  km:   { label: 'km (킬로미터)', toBase: 1000 },
  inch: { label: 'in (인치)', toBase: 0.0254 },
  ft:   { label: 'ft (피트)', toBase: 0.3048 },
  yd:   { label: 'yd (야드)', toBase: 0.9144 },
  mile: { label: 'mile (마일)', toBase: 1609.344 },
  ja:   { label: '자 (한국 전통단위)', toBase: 10 / 33 }
};

var UNIT_ORDER = ['mm', 'cm', 'm', 'km', 'inch', 'ft', 'yd', 'mile', 'ja'];

function calculate(value, fromUnit) {
  if (!(value >= 0) || !UNITS[fromUnit]) {
    return { valid: false };
  }
  var meters = value * UNITS[fromUnit].toBase;
  var results = UNIT_ORDER.map(function (key) {
    return { unit: key, label: UNITS[key].label, value: meters / UNITS[key].toBase };
  });
  return { valid: true, meters: meters, results: results };
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
