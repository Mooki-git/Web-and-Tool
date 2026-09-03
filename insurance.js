/* =========================================================
   4대보험 계산기 (2026년 기준)
   - 근로자 부담 + 사업주 부담을 함께 계산
   - 국민연금 9.5%(각 4.75%) / 건강보험 7.19%(각 3.595%)
     / 장기요양 = 건강보험료 × 13.14% / 고용보험 실업급여 각 0.9%
   - 사업주 단독 부담: 고용안정·직업능력개발(규모별), 산재보험(업종별),
     출퇴근재해 0.06%, 임금채권보장기금 0.09%
   ========================================================= */

var RULES = {
  PENSION_RATE:    0.0475,     // 국민연금 (노사 각각)
  PENSION_MAX:     6590000,    // 기준소득월액 상한 (2026.7~2027.6)
  PENSION_MIN:     410000,     // 기준소득월액 하한
  HEALTH_RATE:     0.03595,    // 건강보험 (노사 각각)
  HEALTH_ONE_MAX:  4591740,    // 건강보험 1인 부담 상한(월) — 전체 상한 9,183,480의 절반
  CARE_RATE:       0.1314,     // 장기요양 = 건강보험료 × 13.14%
  EMPLOY_RATE:     0.009,      // 고용보험 실업급여분 (노사 각각)
  COMMUTE_RATE:    0.0006,     // 출퇴근재해 0.06% (전 업종 동일, 사업주)
  WAGE_FUND_RATE:  0.0009      // 임금채권보장기금 0.09% (사업주)
};

/* 고용안정·직업능력개발사업 — 사업주만 부담 */
var STABILITY = {
  under150:   0.0025,
  over150sme: 0.0045,
  under1000:  0.0065,
  over1000:   0.0085
};

/* =========================================================
   계산 보조
   부동소수점 오차 제거: 0.001원 단위로 반올림한 뒤 절사한다.
   (예: 2,800,000 × 0.06% = 1,679.99999…원 → 1,680원)
   이 보정이 없으면 절사 단계에서 1~10원이 깎인다.
   ========================================================= */
function floorTo(n, unit) { return Math.floor(Math.round(n * 1000) / 1000 / unit) * unit; }

function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function readable(n) {
  n = Math.round(n);
  if (n === 0) return '0원';
  var eok = Math.floor(n / 100000000);
  var man = Math.floor((n % 100000000) / 10000);
  var rest = n % 10000;
  var out = [];
  if (eok) out.push(comma(eok) + '억');
  if (man) out.push(comma(man) + '만');
  if (rest) out.push(comma(rest));
  return out.join(' ') + '원';
}

/* =========================================================
   핵심 계산
   ========================================================= */
function calculate(monthlyPay, taxFree, sizeKey, industryRate) {
  var base = Math.max(0, monthlyPay - taxFree);   // 과세대상 보수월액

  // --- 노사가 같은 금액을 내는 항목 ---
  var pensionBase = base > 0
    ? Math.min(Math.max(base, RULES.PENSION_MIN), RULES.PENSION_MAX)
    : 0;
  var pension = floorTo(pensionBase * RULES.PENSION_RATE, 10);
  var health  = Math.min(floorTo(base * RULES.HEALTH_RATE, 10), RULES.HEALTH_ONE_MAX);
  var care    = floorTo(health * RULES.CARE_RATE, 10);
  var employ  = floorTo(base * RULES.EMPLOY_RATE, 10);

  // --- 사업주만 내는 항목 ---
  var stability = floorTo(base * STABILITY[sizeKey], 1);
  var accident  = floorTo(base * industryRate, 1);
  var commute   = floorTo(base * RULES.COMMUTE_RATE, 1);
  var wageFund  = floorTo(base * RULES.WAGE_FUND_RATE, 1);

  var shared       = pension + health + care + employ;
  var employerOnly = stability + accident + commute + wageFund;

  return {
    base: base,
    pension: pension, health: health, care: care, employ: employ,
    stability: stability, accident: accident, commute: commute, wageFund: wageFund,
    workerTotal: shared,
    companyTotal: shared + employerOnly,
    employerOnly: employerOnly,
    netPay: monthlyPay - shared,
    laborCost: monthlyPay + shared + employerOnly,
    pensionCapped: base > RULES.PENSION_MAX,
    pensionFloored: base > 0 && base < RULES.PENSION_MIN,
    healthCapped: floorTo(base * RULES.HEALTH_RATE, 10) > RULES.HEALTH_ONE_MAX
  };
}

/* =========================================================
   DOM
   ========================================================= */
var $ = function (id) { return document.getElementById(id); };

var el = {
  pay:      $('pay'),
  payEcho:  $('pay-echo'),
  chips:    document.querySelectorAll('.chips .chip'),
  taxFree:  $('taxfree'),
  industry: $('industry'),
  customWrap: $('custom-wrap'),
  customRate: $('custom-rate'),

  workerTotal:  $('worker-total'),
  companyTotal: $('company-total'),
  netPay:   $('net-pay'),
  laborCost:$('labor-cost'),

  wPension: $('w-pension'), wHealth: $('w-health'), wCare: $('w-care'), wEmploy: $('w-employ'),
  cPension: $('c-pension'), cHealth: $('c-health'), cCare: $('c-care'), cEmploy: $('c-employ'),
  cStability: $('c-stability'), cAccident: $('c-accident'),
  cCommute: $('c-commute'), cWageFund: $('c-wagefund'),
  wSum: $('w-sum'), cSum: $('c-sum'),

  accidentLabel: $('accident-label'),
  stabilityLabel: $('stability-label'),
  baseEcho: $('base-echo'),
  capNote:  $('cap-note')
};

/* ---------- 콤마 자동 입력 ---------- */
function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caretFromEnd = input.value.length - input.selectionStart;
    var digits = onlyDigits(input.value);
    input.value = digits ? comma(digits) : '';
    var pos = Math.max(0, input.value.length - caretFromEnd);
    input.setSelectionRange(pos, pos);
    onChange();
  });
}
function readMoney(input) {
  var d = onlyDigits(input.value);
  return d ? Number(d) : 0;
}

function currentSize() {
  var checked = document.querySelector('input[name="size"]:checked');
  return checked ? checked.value : 'under150';
}
function currentIndustryRate() {
  var v = el.industry.value;
  if (v === 'custom') return (Number(el.customRate.value) || 0) / 100;
  return Number(v) / 100;
}

/* =========================================================
   화면 그리기
   ========================================================= */
function render() {
  var pay = readMoney(el.pay);
  var taxFree = readMoney(el.taxFree);
  var size = currentSize();
  var rate = currentIndustryRate();

  el.customWrap.hidden = el.industry.value !== 'custom';

  el.payEcho.innerHTML = pay > 0 ? '<strong>' + readable(pay) + '</strong>' : '';

  var r = calculate(pay, taxFree, size, rate);

  el.workerTotal.textContent  = comma(r.workerTotal) + '원';
  el.companyTotal.textContent = comma(r.companyTotal) + '원';
  el.netPay.textContent    = comma(r.netPay);
  el.laborCost.textContent = comma(r.laborCost);

  el.wPension.textContent = comma(r.pension);
  el.wHealth.textContent  = comma(r.health);
  el.wCare.textContent    = comma(r.care);
  el.wEmploy.textContent  = comma(r.employ);

  el.cPension.textContent = comma(r.pension);
  el.cHealth.textContent  = comma(r.health);
  el.cCare.textContent    = comma(r.care);
  el.cEmploy.textContent  = comma(r.employ);

  el.cStability.textContent = comma(r.stability);
  el.cAccident.textContent  = comma(r.accident);
  el.cCommute.textContent   = comma(r.commute);
  el.cWageFund.textContent  = comma(r.wageFund);

  el.wSum.textContent = comma(r.workerTotal);
  el.cSum.textContent = comma(r.companyTotal);

  el.accidentLabel.textContent  = '산재보험 (' + (Math.round(rate * 100000) / 1000) + '%)';
  el.stabilityLabel.textContent = '고용안정·직업능력개발 (' + (Math.round(STABILITY[size] * 100000) / 1000) + '%)';

  el.baseEcho.textContent = comma(r.base);

  var notes = [];
  if (r.pensionCapped)  notes.push('국민연금은 기준소득월액 상한(659만원)이 적용돼 더 늘지 않습니다.');
  if (r.pensionFloored) notes.push('국민연금은 기준소득월액 하한(41만원)이 적용됩니다.');
  if (r.healthCapped)   notes.push('건강보험료는 1인 부담 상한(월 459만 1,740원)이 적용됐습니다.');
  el.capNote.textContent = notes.join(' ');
  el.capNote.hidden = notes.length === 0;
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.pay, render);
attachMoneyFormat(el.taxFree, render);

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.pay.value = comma(chip.dataset.amount);
    Array.prototype.forEach.call(el.chips, function (c) { c.classList.remove('is-active'); });
    chip.classList.add('is-active');
    render();
  });
});

Array.prototype.forEach.call(document.querySelectorAll('input[name="size"]'), function (radio) {
  radio.addEventListener('change', render);
});

el.industry.addEventListener('change', render);
el.customRate.addEventListener('input', render);

render();
