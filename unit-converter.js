/* =========================================================
   단위 변환기 (길이·무게·부피·온도·속도)
   각 단위는 toBase(v)/fromBase(v) 함수 쌍으로 정의 — 대부분 단순 배수(선형)지만
   온도만 오프셋이 있는 변환(섭씨/화씨/켈빈)이라 함수 쌍 구조로 통일함.

   무게 근(斤): 정육점 등 "고기" 기준 600g (채소·과일 기준은 375g으로 다름 — 안내 문구로 구분)
   부피 되: 대한민국 계량법 기준 1되 = 1.8039L
   부피 컵: 한국 요리 계량컵 관행 기준 200mL
   속도 knot: 1해리(1852m, 국제 정의)/시간
   ========================================================= */

function linear(factor) {
  return { toBase: function (v) { return v * factor; }, fromBase: function (v) { return v / factor; } };
}

var CATEGORIES = {
  length: {
    name: '길이', defaultUnit: 'm', defaultValue: '1',
    units: {
      mm:   { label: 'mm (밀리미터)', ops: linear(0.001) },
      cm:   { label: 'cm (센티미터)', ops: linear(0.01) },
      m:    { label: 'm (미터)', ops: linear(1) },
      km:   { label: 'km (킬로미터)', ops: linear(1000) },
      inch: { label: 'in (인치)', ops: linear(0.0254) },
      ft:   { label: 'ft (피트)', ops: linear(0.3048) },
      yd:   { label: 'yd (야드)', ops: linear(0.9144) },
      mile: { label: 'mile (마일)', ops: linear(1609.344) },
      ja:   { label: '자 (한국 전통단위)', ops: linear(10 / 33) }
    },
    order: ['mm', 'cm', 'm', 'km', 'inch', 'ft', 'yd', 'mile', 'ja']
  },
  weight: {
    name: '무게', defaultUnit: 'kg', defaultValue: '1',
    units: {
      mg:   { label: 'mg (밀리그램)', ops: linear(0.001) },
      g:    { label: 'g (그램)', ops: linear(1) },
      kg:   { label: 'kg (킬로그램)', ops: linear(1000) },
      t:    { label: 't (톤)', ops: linear(1000000) },
      oz:   { label: 'oz (온스)', ops: linear(28.349523125) },
      lb:   { label: 'lb (파운드)', ops: linear(453.59237) },
      geun: { label: '근 (고기 기준)', ops: linear(600) }
    },
    order: ['mg', 'g', 'kg', 't', 'oz', 'lb', 'geun']
  },
  volume: {
    name: '부피', defaultUnit: 'L', defaultValue: '1',
    units: {
      mL:     { label: 'mL (밀리리터)', ops: linear(0.001) },
      L:      { label: 'L (리터)', ops: linear(1) },
      m3:     { label: 'm³ (세제곱미터)', ops: linear(1000) },
      gallon: { label: 'gallon (미국 갤런)', ops: linear(3.785411784) },
      cup:    { label: '컵 (한국 계량컵)', ops: linear(0.2) },
      doe:    { label: '되 (한국 전통단위)', ops: linear(1.8039) }
    },
    order: ['mL', 'L', 'm3', 'gallon', 'cup', 'doe']
  },
  temperature: {
    name: '온도', defaultUnit: 'c', defaultValue: '0',
    units: {
      c: { label: '°C (섭씨)', ops: { toBase: function (v) { return v + 273.15; }, fromBase: function (v) { return v - 273.15; } } },
      f: { label: '°F (화씨)', ops: { toBase: function (v) { return (v - 32) * 5 / 9 + 273.15; }, fromBase: function (v) { return (v - 273.15) * 9 / 5 + 32; } } },
      k: { label: 'K (켈빈)', ops: linear(1) }
    },
    order: ['c', 'f', 'k']
  },
  speed: {
    name: '속도', defaultUnit: 'kmh', defaultValue: '1',
    units: {
      ms:   { label: 'm/s (미터/초)', ops: linear(1) },
      kmh:  { label: 'km/h (킬로미터/시)', ops: linear(1 / 3.6) },
      mph:  { label: 'mph (마일/시)', ops: linear(0.44704) },
      knot: { label: 'knot (노트)', ops: linear(1852 / 3600) },
      fts:  { label: 'ft/s (피트/초)', ops: linear(0.3048) }
    },
    order: ['ms', 'kmh', 'mph', 'knot', 'fts']
  }
};

function calculate(category, value, fromUnit) {
  var cat = CATEGORIES[category];
  if (!cat || !cat.units[fromUnit]) return { valid: false };
  var base = cat.units[fromUnit].ops.toBase(value);
  if (category === 'temperature') {
    if (base < 0) return { valid: false, reason: 'below-absolute-zero' };
  } else if (!(value >= 0)) {
    return { valid: false };
  }
  var results = cat.order.map(function (key) {
    return { unit: key, label: cat.units[key].label, value: cat.units[key].ops.fromBase(base) };
  });
  return { valid: true, base: base, results: results };
}

/* ---------- 숫자 포맷 ---------- */
function onlyDecimal(s, allowNegative) {
  var cleaned = allowNegative ? String(s).replace(/[^0-9.-]/g, '') : String(s).replace(/[^0-9.]/g, '');
  if (allowNegative) {
    var neg = cleaned.charAt(0) === '-';
    cleaned = cleaned.replace(/-/g, '');
    if (neg) cleaned = '-' + cleaned;
  }
  var signLen = cleaned.charAt(0) === '-' ? 1 : 0;
  var firstDot = cleaned.indexOf('.', signLen);
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
  var isTemp = categoryKey === 'temperature';
  el.value.value = onlyDecimal(el.value.value, isTemp);

  var num = parseFloat(el.value.value);
  if (isNaN(num)) num = 0;
  var fromUnit = el.unit.value;

  var result = calculate(categoryKey, num, fromUnit);

  if (!result.valid) {
    var msg = result.reason === 'below-absolute-zero'
      ? '절대영도(-273.15°C) 미만의 온도는 존재할 수 없습니다.'
      : '0 이상의 숫자를 입력해주세요.';
    el.warn.innerHTML = '<p>' + msg + '</p>';
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
