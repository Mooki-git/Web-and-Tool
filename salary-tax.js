/* =========================================================
   연봉 실수령액 계산기 (2026년 기준)
   - 4대보험: 국민연금 9.5%(근로자 4.75%) / 건강보험 7.19%(근로자 3.595%)
     / 장기요양 = 건강보험료 × 13.14% / 고용보험 0.9%
   - 소득세: 연말정산 기준(근로소득공제 → 인적공제 → 과세표준 → 세율
     → 근로소득세액공제). 매월 간이세액표 원천징수액과는 다를 수 있음
   ========================================================= */

var RULES = {
  PENSION_RATE:  0.0475,      // 국민연금 근로자 부담
  PENSION_MAX:   6590000,     // 기준소득월액 상한 (2026.7~2027.6)
  PENSION_MIN:   410000,      // 기준소득월액 하한
  HEALTH_RATE:   0.03595,     // 건강보험 근로자 부담
  CARE_RATE:     0.1314,      // 장기요양 = 건강보험료 × 13.14%
  EMPLOY_RATE:   0.009,       // 고용보험 근로자 부담(실업급여분)
  PERSONAL:      1500000,     // 인적공제 1인당
  MEAL_MAX:      200000,      // 비과세 식대 월 한도
  EARNED_DEDUCT_MAX: 20000000 // 근로소득공제 한도
};

var $ = function (id) { return document.getElementById(id); };

var el = {
  salary:      $('salary'),
  salaryEcho:  $('salary-echo'),
  salaryAfter: $('salary-after'),
  chips:       document.querySelectorAll('.chips .chip:not(.raise-chip)'),
  raiseChips:  document.querySelectorAll('.raise-chip'),

  netMonthly: $('net-monthly'),
  netSub:     $('net-sub'),
  cGross:   $('c-gross'),
  cPension: $('c-pension'),
  cHealth:  $('c-health'),
  cCare:    $('c-care'),
  cEmploy:  $('c-employ'),
  cTax:     $('c-tax'),
  cLocal:   $('c-local'),
  cNet:     $('c-net'),
  cRate:    $('c-rate'),

  raisePct:  $('raise-pct'),
  raiseSub:  $('raise-sub'),
  rGross: $('r-gross'),
  rMonthGross: $('r-month-gross'),
  rCost:  $('r-cost'),
  rNet:   $('r-net'),
  rMonth: $('r-month')
};

/* ---------- 숫자 포맷 ---------- */
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function won(n) { return comma(Math.round(n)) + '원'; }
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
function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caret = input.selectionStart;
    var digitsBefore = onlyDigits(input.value.slice(0, caret)).length;
    var digits = onlyDigits(input.value).slice(0, 12);
    input.value = digits ? comma(digits) : '';
    var pos = 0, seen = 0;
    while (pos < input.value.length && seen < digitsBefore) {
      if (/[0-9]/.test(input.value[pos])) seen++;
      pos++;
    }
    try { input.setSelectionRange(pos, pos); } catch (e) {}
    onChange();
  });
}
function readMoney(input) {
  var d = onlyDigits(input.value);
  return d ? parseInt(d, 10) : 0;
}

/* =========================================================
   핵심 계산
   ========================================================= */

// 근로소득공제
function earnedDeduction(gross) {
  var d;
  if (gross <= 5000000) d = gross * 0.7;
  else if (gross <= 15000000) d = 3500000 + (gross - 5000000) * 0.4;
  else if (gross <= 45000000) d = 7500000 + (gross - 15000000) * 0.15;
  else if (gross <= 100000000) d = 12000000 + (gross - 45000000) * 0.05;
  else d = 39500000 + (gross - 100000000) * 0.02;
  return Math.min(d, RULES.EARNED_DEDUCT_MAX);
}

// 종합소득세 누진세율 (2026년)
function progressiveTax(base) {
  var B = [
    [14000000,   0.06, 0],
    [50000000,   0.15, 1260000],
    [88000000,   0.24, 5760000],
    [150000000,  0.35, 15440000],
    [300000000,  0.38, 19940000],
    [500000000,  0.40, 25940000],
    [1000000000, 0.42, 35940000],
    [Infinity,   0.45, 65940000]
  ];
  for (var i = 0; i < B.length; i++) {
    if (base <= B[i][0]) return Math.max(0, base * B[i][1] - B[i][2]);
  }
  return 0;
}

// 근로소득세액공제
function earnedTaxCredit(calcTax, gross) {
  var credit = calcTax <= 1300000 ? calcTax * 0.55 : 715000 + (calcTax - 1300000) * 0.3;
  var limit;
  if (gross <= 33000000) limit = 740000;
  else if (gross <= 70000000) limit = Math.max(660000, 740000 - (gross - 33000000) * 0.008);
  else if (gross <= 120000000) limit = Math.max(500000, 660000 - (gross - 70000000) * 0.5);
  else limit = Math.max(200000, 500000 - (gross - 120000000) * 0.5);
  return Math.min(credit, limit);
}

function calculate(annualSalary, family, monthlyMeal) {
  var meal = Math.min(monthlyMeal, RULES.MEAL_MAX);
  var taxFree = meal * 12;
  var gross = Math.max(0, annualSalary - taxFree);   // 과세대상 총급여
  var monthlyTaxable = gross / 12;

  // 4대보험 (월, 10원 미만 절사)
  var pensionBase = Math.min(Math.max(monthlyTaxable, RULES.PENSION_MIN), RULES.PENSION_MAX);
  var pension = Math.floor(pensionBase * RULES.PENSION_RATE / 10) * 10;
  var health  = Math.floor(monthlyTaxable * RULES.HEALTH_RATE / 10) * 10;
  var care    = Math.floor(health * RULES.CARE_RATE / 10) * 10;
  var employ  = Math.floor(monthlyTaxable * RULES.EMPLOY_RATE / 10) * 10;
  var insurance = pension + health + care + employ;

  // 소득세 (연말정산 기준)
  var incomeAmount = gross - earnedDeduction(gross);
  var deductions = RULES.PERSONAL * family        // 인적공제
                 + pension * 12                   // 연금보험료공제
                 + (health + care + employ) * 12; // 보험료 특별소득공제
  var taxBase = Math.max(0, incomeAmount - deductions);
  var calcTax = progressiveTax(taxBase);
  var incomeTax = Math.max(0, calcTax - earnedTaxCredit(calcTax, gross));
  var localTax = Math.floor(incomeTax * 0.1);

  var taxMonthly = Math.floor(incomeTax / 12 / 10) * 10;
  var localMonthly = Math.floor(localTax / 12 / 10) * 10;

  var grossMonthly = Math.round(annualSalary / 12);
  var netMonthly = grossMonthly - insurance - taxMonthly - localMonthly;

  return {
    grossMonthly: grossMonthly,
    pension: pension, health: health, care: care, employ: employ,
    insurance: insurance,
    taxMonthly: taxMonthly, localMonthly: localMonthly,
    netMonthly: netMonthly,
    netAnnual: netMonthly * 12,
    taxBase: taxBase,
    cutRate: annualSalary > 0 ? (grossMonthly - netMonthly) / grossMonthly : 0
  };
}

/* =========================================================
   화면 그리기
   ========================================================= */
function render() {
  var salary = readMoney(el.salary);
  var family = parseInt(document.querySelector('input[name=family]:checked').value, 10);
  var meal = parseInt(document.querySelector('input[name=meal]:checked').value, 10);

  el.salaryEcho.innerHTML = salary > 0 ? '<strong>' + readable(salary) + '</strong>'
                                       : '연봉을 입력하면 결과가 바로 계산됩니다.';

  Array.prototype.forEach.call(el.chips, function (chip) {
    chip.classList.toggle('is-active', Number(chip.dataset.amount) === salary);
  });

  var r = calculate(salary, family, meal);

  el.netMonthly.textContent = won(r.netMonthly);
  el.netSub.textContent = '연 ' + readable(r.netAnnual) + ' · 세전 월 ' + comma(r.grossMonthly) + '원';

  el.cGross.textContent   = comma(r.grossMonthly);
  el.cPension.textContent = '-' + comma(r.pension);
  el.cHealth.textContent  = '-' + comma(r.health);
  el.cCare.textContent    = '-' + comma(r.care);
  el.cEmploy.textContent  = '-' + comma(r.employ);
  el.cTax.textContent     = '-' + comma(r.taxMonthly);
  el.cLocal.textContent   = '-' + comma(r.localMonthly);
  el.cNet.textContent     = comma(r.netMonthly);
  el.cRate.textContent    = (r.cutRate * 100).toFixed(1) + '%';

  renderRaise(salary, family, meal, r);
}

function renderRaise(salary, family, meal, before) {
  var after = readMoney(el.salaryAfter);
  var raise = after - salary;

  Array.prototype.forEach.call(el.raiseChips, function (chip) {
    chip.classList.toggle('is-active', Number(chip.dataset.raise) === raise);
  });

  if (raise <= 0) {
    el.raisePct.textContent = '-';
    el.raiseSub.textContent = '현재 연봉보다 높은 금액을 넣어보세요.';
    el.rGross.textContent = '-';
    el.rMonthGross.textContent = '-';
    el.rCost.textContent = '-';
    el.rNet.textContent = '-';
    el.rMonth.textContent = '-';
    return;
  }

  var afterCalc = calculate(after, family, meal);
  var netGain = afterCalc.netAnnual - before.netAnnual;
  var cost = raise - netGain;
  var keepPct = raise > 0 ? (netGain / raise * 100) : 0;

  el.raisePct.textContent = keepPct.toFixed(1) + '%';
  el.raiseSub.innerHTML = '연봉을 <strong>' + readable(raise) + '</strong> 올리면<br>' +
    '그중 <strong>' + readable(netGain) + '</strong>이 실제로 손에 들어옵니다.';

  el.rGross.textContent = '+' + comma(raise);
  el.rMonthGross.textContent = comma(before.grossMonthly) + ' → ' + comma(afterCalc.grossMonthly);
  el.rCost.textContent  = '-' + comma(cost);
  el.rNet.textContent   = '+' + comma(netGain);
  el.rMonth.textContent = comma(before.netMonthly) + ' → ' + comma(afterCalc.netMonthly);
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.salary, render);
attachMoneyFormat(el.salaryAfter, render);

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.salary.value = comma(chip.dataset.amount);
    render();
  });
});

Array.prototype.forEach.call(el.raiseChips, function (chip) {
  chip.addEventListener('click', function () {
    el.salaryAfter.value = comma(readMoney(el.salary) + Number(chip.dataset.raise));
    render();
  });
});

Array.prototype.forEach.call(
  document.querySelectorAll('input[type="radio"]'),
  function (radio) { radio.addEventListener('change', render); }
);

render();
