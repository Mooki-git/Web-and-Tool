/* =========================================================
   종합소득세 계산기 (2026년 기준)
   합산 대상: 이자+배당(금융소득) · 사업소득 · 근로소득 · 연금소득 · 기타소득
   ========================================================= */

var PERSONAL_DEDUCTION = 1500000;
var FIN_INCOME_LIMIT = 20000000;
var FIN_FLAT_RATE = 0.14;
var GROSSUP_RATE = 0.11;
var MISC_WITHHOLD_RATE = 0.22;
var BUSINESS_WITHHOLD_RATE = 0.033;
var STANDARD_CREDIT_WORKER = 130000;
var STANDARD_CREDIT_NONWORKER = 70000;
var CARD_LIMIT_LOW = 3000000;
var CARD_LIMIT_HIGH = 2500000;

var PENSION_RATE = 0.0475, PENSION_MAX_M = 6590000, PENSION_MIN_M = 410000;
var HEALTH_RATE = 0.03595, CARE_RATE = 0.1314, EMPLOY_RATE = 0.009;

function floorTo(n, unit) { return Math.floor(Math.round(n * 1000) / 1000 / unit) * unit; }

function wageInsuranceAnnual(wage) {
  var monthly = wage / 12;
  var pensionBase = Math.min(Math.max(monthly, PENSION_MIN_M), PENSION_MAX_M);
  var pension = floorTo(pensionBase * PENSION_RATE, 10);
  var health = floorTo(monthly * HEALTH_RATE, 10);
  var care = floorTo(health * CARE_RATE, 10);
  var employ = floorTo(monthly * EMPLOY_RATE, 10);
  return { pension: pension * 12, health: health * 12, care: care * 12, employ: employ * 12 };
}

function progressiveTax(base) {
  var B = [
    [14000000,   0.06, 0], [50000000,   0.15, 1260000],
    [88000000,   0.24, 5760000], [150000000,  0.35, 15440000],
    [300000000,  0.38, 19940000], [500000000,  0.40, 25940000],
    [1000000000, 0.42, 35940000], [Infinity,   0.45, 65940000]
  ];
  for (var i = 0; i < B.length; i++) if (base <= B[i][0]) return Math.max(0, base * B[i][1] - B[i][2]);
  return 0;
}

function earnedDeduction(gross) {
  var d;
  if (gross <= 5000000) d = gross * 0.7;
  else if (gross <= 15000000) d = 3500000 + (gross - 5000000) * 0.4;
  else if (gross <= 45000000) d = 7500000 + (gross - 15000000) * 0.15;
  else if (gross <= 100000000) d = 12000000 + (gross - 45000000) * 0.05;
  else d = 39500000 + (gross - 100000000) * 0.02;
  return Math.min(d, 20000000);
}

function earnedTaxCredit(calcTax, gross) {
  var credit = calcTax <= 1300000 ? calcTax * 0.55 : 715000 + (calcTax - 1300000) * 0.3;
  var limit;
  if (gross <= 33000000) limit = 740000;
  else if (gross <= 70000000) limit = Math.max(660000, 740000 - (gross - 33000000) * 0.008);
  else if (gross <= 120000000) limit = Math.max(500000, 660000 - (gross - 70000000) * 0.5);
  else limit = Math.max(200000, 500000 - (gross - 120000000) * 0.5);
  return Math.min(credit, limit);
}

function pensionDeduction(total) {
  var d;
  if (total <= 3500000) d = total;
  else if (total <= 7000000) d = 3500000 + (total - 3500000) * 0.4;
  else if (total <= 14000000) d = 4900000 + (total - 7000000) * 0.2;
  else d = 6300000 + (total - 14000000) * 0.1;
  return Math.min(d, 9000000);
}

function cardDeduction(gross, creditCardUsed, otherUsed) {
  var totalUsed = creditCardUsed + otherUsed;
  var threshold = gross * 0.25;
  if (totalUsed <= threshold) return 0;
  var overThreshold = totalUsed - threshold;
  var creditPortion = Math.min(creditCardUsed, overThreshold);
  var otherPortion = Math.max(0, overThreshold - creditPortion);
  var deduction = creditPortion * 0.15 + otherPortion * 0.30;
  var limit = gross <= 70000000 ? CARD_LIMIT_LOW : CARD_LIMIT_HIGH;
  return Math.min(deduction, limit);
}

function medicalCredit(gross, medicalExpense) {
  var base = Math.max(0, medicalExpense - gross * 0.03);
  return base * 0.15;
}

function donationCredit(donation) {
  if (donation <= 10000000) return donation * 0.15;
  return 10000000 * 0.15 + (donation - 10000000) * 0.30;
}

function calculate(o) {
  o = o || {};
  var wage = Math.max(0, o.wage || 0);
  var bizRevenue = Math.max(0, o.bizRevenue || 0);
  var bizExpenseMode = o.bizExpenseMode || 'rate';
  var bizExpenseRate = o.bizExpenseRate || 0;
  var bizExpenseAmount = Math.max(0, o.bizExpenseAmount || 0);
  var pensionTotal = Math.max(0, o.pensionTotal || 0);
  var miscRevenue = Math.max(0, o.miscRevenue || 0);
  var miscExpenseRate = (o.miscExpenseRate != null ? o.miscExpenseRate : 60);
  var interest = Math.max(0, o.interest || 0);
  var dividend = Math.max(0, o.dividend || 0);
  var dependents = Math.max(1, o.dependents || 1);
  var creditCardUsed = Math.max(0, o.creditCardUsed || 0);
  var otherCardUsed = Math.max(0, o.otherCardUsed || 0);
  var medicalExpense = Math.max(0, o.medicalExpense || 0);
  var donation = Math.max(0, o.donation || 0);
  var prepaidWage = Math.max(0, o.prepaidWage || 0);
  var prepaidBiz = o.prepaidBiz != null ? o.prepaidBiz : bizRevenue * BUSINESS_WITHHOLD_RATE;
  var prepaidPension = Math.max(0, o.prepaidPension || 0);

  var wageIncome = Math.max(0, wage - earnedDeduction(wage));

  var bizExpense = bizExpenseMode === 'amount' ? bizExpenseAmount : bizRevenue * (bizExpenseRate / 100);
  var bizIncome = Math.max(0, bizRevenue - bizExpense);

  var pensionIncome = Math.max(0, pensionTotal - pensionDeduction(pensionTotal));

  var miscExpense = miscRevenue * (miscExpenseRate / 100);
  var miscIncomeFull = Math.max(0, miscRevenue - miscExpense);
  var miscWithhold = o.prepaidMisc != null ? o.prepaidMisc : Math.round(miscIncomeFull * MISC_WITHHOLD_RATE);

  var financialTotal = interest + dividend;
  var finOverLimit = financialTotal > FIN_INCOME_LIMIT;
  var finExcess = finOverLimit ? financialTotal - FIN_INCOME_LIMIT : 0;
  var grossUp = finOverLimit ? Math.min(dividend, finExcess) * GROSSUP_RATE : 0;
  var finIncomeForBase = finOverLimit ? finExcess + grossUp : 0;

  var hasWage = wage > 0;

  var personalDeduction = dependents * PERSONAL_DEDUCTION;
  var cardDed = hasWage ? cardDeduction(wage, creditCardUsed, otherCardUsed) : 0;
  var wageInsurance = hasWage ? wageInsuranceAnnual(wage) : { pension: 0, health: 0, care: 0, employ: 0 };
  var insuranceDeduction = wageInsurance.pension + wageInsurance.health + wageInsurance.care + wageInsurance.employ;
  var bizPensionPaid = Math.max(0, o.bizPensionPaid || 0);
  var incomeDeductions = personalDeduction + cardDed + insuranceDeduction + bizPensionPaid;

  var baseWithoutFin = wageIncome + bizIncome + pensionIncome + miscIncomeFull;

  var taxBaseA = Math.max(0, baseWithoutFin + finIncomeForBase - incomeDeductions);
  var calcTaxA_progressive = progressiveTax(taxBaseA);
  var calcTaxA = calcTaxA_progressive + FIN_INCOME_LIMIT * FIN_FLAT_RATE * (finOverLimit ? 1 : 0);

  var taxBaseB = Math.max(0, baseWithoutFin - incomeDeductions);
  var calcTaxB_progressive = progressiveTax(taxBaseB);
  var calcTaxB = calcTaxB_progressive + financialTotal * FIN_FLAT_RATE;

  var useComprehensive = finOverLimit ? (calcTaxA >= calcTaxB) : true;
  var calcTax, taxBase;
  if (!finOverLimit) {
    taxBase = taxBaseB;
    calcTax = calcTaxB_progressive;
  } else if (useComprehensive) {
    taxBase = taxBaseA;
    calcTax = calcTaxA;
  } else {
    taxBase = taxBaseB;
    calcTax = calcTaxB;
  }

  // 근로소득세액공제는 "근로소득에 대한 종합소득산출세액"에만 적용된다(소득세법 제59조).
  // 근로소득에 대한 산출세액 = 종합소득산출세액 × (근로소득금액 ÷ 종합소득금액)
  var totalGrossForRatio = baseWithoutFin + (useComprehensive && finOverLimit ? finIncomeForBase : 0);
  var wageRatio = totalGrossForRatio > 0 ? wageIncome / totalGrossForRatio : 0;
  var wageAttributableTax = progressiveTax(taxBase) * wageRatio;
  var earnedCredit = hasWage ? earnedTaxCredit(wageAttributableTax, wage) : 0;
  var dividendCredit = (finOverLimit && useComprehensive) ? grossUp : 0;

  var medicalCred = hasWage ? medicalCredit(wage, medicalExpense) : 0;
  var donationCred = hasWage ? donationCredit(donation) : 0;
  var itemizedCredit = medicalCred + donationCred;

  var standardCredit = hasWage ? STANDARD_CREDIT_WORKER : STANDARD_CREDIT_NONWORKER;
  var chosenStandardOrItemized = Math.max(standardCredit, itemizedCredit);

  var totalCredit = earnedCredit + dividendCredit + chosenStandardOrItemized;
  var determinedIncomeTax = floorTo(Math.max(0, calcTax - totalCredit), 1);
  var localTax = floorTo(determinedIncomeTax * 0.1, 1);
  var totalTax = determinedIncomeTax + localTax;

  var prepaidFinancial = financialTotal * FIN_FLAT_RATE;
  var prepaidTotal = prepaidWage + prepaidBiz + prepaidPension + miscWithhold + prepaidFinancial;

  var finalAmount = totalTax - prepaidTotal;

  return {
    wageIncome: wageIncome, bizIncome: bizIncome, bizExpense: bizExpense,
    pensionIncome: pensionIncome, miscIncomeFull: miscIncomeFull, miscWithhold: miscWithhold,
    financialTotal: financialTotal, finOverLimit: finOverLimit, finExcess: finExcess,
    grossUp: grossUp, finIncomeForBase: finIncomeForBase, useComprehensive: useComprehensive,
    calcTaxA: calcTaxA, calcTaxB: calcTaxB,
    personalDeduction: personalDeduction, cardDed: cardDed, insuranceDeduction: insuranceDeduction,
    wageInsurance: wageInsurance, incomeDeductions: incomeDeductions,
    taxBase: taxBase, calcTax: calcTax,
    earnedCredit: earnedCredit, dividendCredit: dividendCredit,
    medicalCred: medicalCred, donationCred: donationCred, itemizedCredit: itemizedCredit,
    standardCredit: standardCredit, chosenStandardOrItemized: chosenStandardOrItemized,
    totalCredit: totalCredit, determinedIncomeTax: determinedIncomeTax, localTax: localTax, totalTax: totalTax,
    prepaidTotal: prepaidTotal, prepaidFinancial: prepaidFinancial, prepaidBiz: prepaidBiz, finalAmount: finalAmount,
    hasWage: hasWage
  };
}

/* ---------- 숫자 포맷 ---------- */
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

var $ = function (id) { return document.getElementById(id); };

var el = {
  wage: $('wage'), wagePrepaidSection: $('s-wage-prepaid'), wagePrepaid: $('wage-prepaid'),
  bizRevenue: $('biz-revenue'), bizRate: $('biz-rate'), bizAmount: $('biz-amount'),
  bizRateWrap: $('biz-rate-wrap'), bizAmountWrap: $('biz-amount-wrap'),
  bizPrepaid: $('biz-prepaid'), bizPensionPaid: $('biz-pension-paid'),
  pensionTotal: $('pension-total'), pensionPrepaid: $('pension-prepaid'),
  miscRevenue: $('misc-revenue'), miscRate: $('misc-rate'), miscPrepaid: $('misc-prepaid'),
  interest: $('interest'), dividend: $('dividend'),
  cardCredit: $('card-credit'), cardOther: $('card-other'), medical: $('medical'), donation: $('donation'),
  creditsNa: $('credits-na'), creditsFields: $('credits-fields'),

  headline: $('headline'), headLabel: $('head-label'), headSub: $('head-sub'), warn: $('warn'),

  rWage: $('r-wage'), rBiz: $('r-biz'), rPension: $('r-pension'), rMisc: $('r-misc'), rFin: $('r-fin'),
  rTotalIncome: $('r-total-income'), finNote: $('fin-note'),
  rDeductions: $('r-deductions'), rTaxbase: $('r-taxbase'), rCalctax: $('r-calctax'),
  rCredits: $('r-credits'), rDetermined: $('r-determined'), rLocal: $('r-local'), rTotaltax: $('r-totaltax'),
  rPrepaid: $('r-prepaid')
};

var touched = { bizPrepaid: false, miscPrepaid: false };
el.bizPrepaid.addEventListener('input', function () { touched.bizPrepaid = true; });
el.miscPrepaid.addEventListener('input', function () { touched.miscPrepaid = true; });

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
function readPercent(input) {
  var v = parseFloat(String(input.value).replace(/[^0-9.]/g, ''));
  return isNaN(v) ? 0 : v;
}
function currentBizMode() {
  var checked = document.querySelector('input[name="biz-mode"]:checked');
  return checked ? checked.value : 'rate';
}
function currentFamily() {
  var checked = document.querySelector('input[name="family"]:checked');
  return checked ? parseInt(checked.value, 10) : 1;
}

function render() {
  var wage = readMoney(el.wage);
  var bizRevenue = readMoney(el.bizRevenue);
  var bizMode = currentBizMode();
  var bizRate = readPercent(el.bizRate);
  var bizAmount = readMoney(el.bizAmount);
  var pensionTotal = readMoney(el.pensionTotal);
  var miscRevenue = readMoney(el.miscRevenue);
  var miscRate = readPercent(el.miscRate);
  var interest = readMoney(el.interest);
  var dividend = readMoney(el.dividend);
  var dependents = currentFamily();

  // 토글: 사업소득 경비 입력 방식
  el.bizRateWrap.hidden = bizMode !== 'rate';
  el.bizAmountWrap.hidden = bizMode !== 'amount';

  // 자동계산 필드(사용자가 손대지 않은 경우만 갱신)
  if (!touched.bizPrepaid) {
    el.bizPrepaid.value = bizRevenue > 0 ? comma(Math.round(bizRevenue * 0.033)) : '';
  }

  var hasWage = wage > 0;
  el.wagePrepaidSection.hidden = !hasWage;
  el.creditsNa.hidden = hasWage;
  el.creditsFields.style.opacity = hasWage ? '1' : '.45';

  var miscIncomeFullPreview = miscRevenue * (1 - miscRate / 100);
  if (!touched.miscPrepaid) {
    el.miscPrepaid.value = miscIncomeFullPreview > 0 ? comma(Math.round(miscIncomeFullPreview * 0.22)) : '';
  }

  var r = calculate({
    wage: wage,
    bizRevenue: bizRevenue, bizExpenseMode: bizMode, bizExpenseRate: bizRate, bizExpenseAmount: bizAmount,
    pensionTotal: pensionTotal,
    miscRevenue: miscRevenue, miscExpenseRate: miscRate,
    interest: interest, dividend: dividend,
    dependents: dependents,
    creditCardUsed: hasWage ? readMoney(el.cardCredit) : 0,
    otherCardUsed: hasWage ? readMoney(el.cardOther) : 0,
    medicalExpense: hasWage ? readMoney(el.medical) : 0,
    donation: hasWage ? readMoney(el.donation) : 0,
    prepaidWage: readMoney(el.wagePrepaid),
    prepaidBiz: readMoney(el.bizPrepaid),
    prepaidPension: readMoney(el.pensionPrepaid),
    prepaidMisc: readMoney(el.miscPrepaid),
    bizPensionPaid: readMoney(el.bizPensionPaid)
  });

  var isRefund = r.finalAmount < 0;
  el.headLabel.textContent = isRefund ? '예상 환급세액' : '예상 납부세액';
  el.headline.textContent = comma(Math.abs(r.finalAmount)) + '원';
  el.headSub.textContent = '총 결정세액 ' + readable(r.totalTax) + ' · 기납부세액 ' + readable(r.prepaidTotal);

  var warnParts = [];
  if (r.finOverLimit) {
    warnParts.push('금융소득이 2,000만원을 넘어 <strong>' + (r.useComprehensive ? '종합과세' : '분리과세 비교금액') + '</strong> 방식으로 계산됐습니다.');
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  el.rWage.textContent = comma(r.wageIncome);
  el.rBiz.textContent = comma(r.bizIncome);
  el.rPension.textContent = comma(r.pensionIncome);
  el.rMisc.textContent = comma(r.miscIncomeFull);
  el.rFin.textContent = comma(r.finIncomeForBase);
  el.rTotalIncome.textContent = comma(r.wageIncome + r.bizIncome + r.pensionIncome + r.miscIncomeFull + r.finIncomeForBase);

  el.finNote.textContent = r.finOverLimit
    ? '금융소득 ' + readable(r.financialTotal) + ' 중 2,000만원 초과분 + 배당가산 ' + readable(r.grossUp) + '이 종합소득에 합산됐습니다.'
    : (r.financialTotal > 0 ? '금융소득 ' + readable(r.financialTotal) + '은 2,000만원 이하라 15.4% 원천징수로 종결되어 종합소득에 합산되지 않았습니다.' : '');

  el.rDeductions.textContent = comma(r.incomeDeductions);
  el.rTaxbase.textContent = comma(Math.round(r.taxBase));
  el.rCalctax.textContent = comma(Math.round(r.calcTax));
  el.rCredits.textContent = comma(Math.round(r.totalCredit));
  el.rDetermined.textContent = comma(r.determinedIncomeTax);
  el.rLocal.textContent = comma(r.localTax);
  el.rTotaltax.textContent = comma(r.totalTax);
  el.rPrepaid.textContent = comma(Math.round(r.prepaidTotal));
}

/* ---------- 시작 ---------- */
// 금액(원) 입력란: 콤마 자동 포맷
[el.wage, el.bizRevenue, el.bizAmount, el.bizPrepaid, el.bizPensionPaid,
 el.pensionTotal, el.pensionPrepaid, el.miscRevenue, el.miscPrepaid,
 el.interest, el.dividend, el.cardCredit, el.cardOther, el.medical, el.donation, el.wagePrepaid
].forEach(function (input) { attachMoneyFormat(input, render); });

// 퍼센트(%) 입력란: 콤마 포맷 없이 소수점 그대로 입력 가능
[el.bizRate, el.miscRate].forEach(function (input) {
  input.addEventListener('input', render);
});

Array.prototype.forEach.call(document.querySelectorAll('input[type="radio"]'), function (radio) {
  radio.addEventListener('change', render);
});

render();
