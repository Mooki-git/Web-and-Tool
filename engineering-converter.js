/* =========================================================
   공학단위 변환기 (토크·점도·전류·자기)
   각 카테고리는 독립된 기준 단위(base)를 가지며, 전부 배수(선형) 관계.

   토크: N·m 기준. kgf·m=9.80665N·m(정확), lbf·ft=1.3558179483314004N·m,
         lbf·in=0.1129848290276167N·m (모두 lbf=4.4482216152605N, ft=0.3048m,
         in=0.0254m 정의로부터 도출된 정확값)
   점도(동점도 아닌 동적점도): Pa·s 기준. 1P(포아즈)=0.1Pa·s(정확, CGS 정의),
         1cP(센티포아즈)=0.001Pa·s=1mPa·s
   전류: A 기준, SI 접두어 배수
   자기(자속밀도): T(테슬라) 기준. 1G(가우스)=0.0001T(정확, CGS-SI 관계)
   ========================================================= */

function linear(factor) {
  return { toBase: function (v) { return v * factor; }, fromBase: function (v) { return v / factor; } };
}

var CATEGORIES = {
  torque: {
    name: '토크', defaultUnit: 'Nm', defaultValue: '1',
    units: {
      Nm:    { label: 'N·m (뉴턴미터)', ops: linear(1) },
      kgfm:  { label: 'kgf·m (킬로그램힘미터)', ops: linear(9.80665) },
      lbfft: { label: 'lbf·ft (파운드힘피트)', ops: linear(1.3558179483314004) },
      lbfin: { label: 'lbf·in (파운드힘인치)', ops: linear(0.1129848290276167) }
    },
    order: ['Nm', 'kgfm', 'lbfft', 'lbfin']
  },
  viscosity: {
    name: '점도', defaultUnit: 'cP', defaultValue: '1',
    units: {
      Pas: { label: 'Pa·s (파스칼초)', ops: linear(1) },
      mPas:{ label: 'mPa·s (밀리파스칼초)', ops: linear(0.001) },
      cP:  { label: 'cP (센티포아즈)', ops: linear(0.001) },
      P:   { label: 'P (포아즈)', ops: linear(0.1) }
    },
    order: ['Pas', 'mPas', 'cP', 'P']
  },
  current: {
    name: '전류', defaultUnit: 'A', defaultValue: '1',
    units: {
      uA: { label: 'µA (마이크로암페어)', ops: linear(0.000001) },
      mA: { label: 'mA (밀리암페어)', ops: linear(0.001) },
      A:  { label: 'A (암페어)', ops: linear(1) },
      kA: { label: 'kA (킬로암페어)', ops: linear(1000) }
    },
    order: ['uA', 'mA', 'A', 'kA']
  },
  magnetic: {
    name: '자기(자속밀도)', defaultUnit: 'mT', defaultValue: '1',
    units: {
      uT: { label: 'µT (마이크로테슬라)', ops: linear(0.000001) },
      mT: { label: 'mT (밀리테슬라)', ops: linear(0.001) },
      T:  { label: 'T (테슬라)', ops: linear(1) },
      G:  { label: 'G (가우스)', ops: linear(0.0001) }
    },
    order: ['uT', 'mT', 'T', 'G']
  }
};

function calculate(category, value, fromUnit) {
  var cat = CATEGORIES[category];
  if (!cat || !cat.units[fromUnit]) return { valid: false };
  if (!(value >= 0)) return { valid: false };
  var base = cat.units[fromUnit].ops.toBase(value);
  var results = cat.order.map(function (key) {
    return { unit: key, label: cat.units[key].label, value: cat.units[key].ops.fromBase(base) };
  });
  return { valid: true, base: base, results: results };
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
  category: $('category'), value: $('value'), unit: $('unit'),
  warn: $('warn'),
  rows: $('result-rows')
};

function populateUnits(categoryKey, selectedUnit) {
  var cat = CATEGORIES[categoryKey];
  el.unit.innerHTML = cat.order.map(function (key) {
    return '<option value="' + key + '"' + (key === selectedUnit ? ' selected' : '') + '>' + cat.units[key].label + '</option>';
  }).join('');
}

function render() {
  var categoryKey = el.category.value;
  el.value.value = onlyDecimal(el.value.value);

  var num = parseFloat(el.value.value);
  if (isNaN(num)) num = 0;
  var fromUnit = el.unit.value;

  var result = calculate(categoryKey, num, fromUnit);

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

function onCategoryChange() {
  var cat = CATEGORIES[el.category.value];
  populateUnits(el.category.value, cat.defaultUnit);
  el.value.value = cat.defaultValue;
  render();
}

/* ---------- 시작 ---------- */
populateUnits(el.category.value, CATEGORIES[el.category.value].defaultUnit);

el.category.addEventListener('change', onCategoryChange);
el.value.addEventListener('input', render);
el.unit.addEventListener('change', render);

render();
