/* =========================================================
   연금저축·IRP 세액공제 계산기 (2026년 기준)
   - 연금저축 단독 한도: 연 600만원
   - 연금저축+IRP 합산 한도: 연 900만원 (IRP 단독으로는 900만원까지 인정)
   - 공제율: 총급여 5,500만원(종합소득금액 4,500만원) 이하 16.5%, 초과 13.2%
   ========================================================= */

var PENSION_SAVING_CAP = 6000000;
var TOTAL_CAP = 9000000;
var RATE_HIGH = 0.165;
var RATE_LOW  = 0.132;
var INCOME_THRESHOLD = 55000000;

function calculate(income, pensionSaving, irp) {
  pensionSaving = Math.max(0, pensionSaving);
  irp = Math.max(0, irp);

  var savingUsed = Math.min(pensionSaving, PENSION_SAVING_CAP);
  var remainForIrp = TOTAL_CAP - savingUsed;
  var irpUsed = Math.min(irp, remainForIrp);
  var eligible = savingUsed + irpUsed;

  var rate = income <= INCOME_THRESHOLD ? RATE_HIGH : RATE_LOW;
  var refund = Math.round(eligible * rate);

  return {
    savingUsed: savingUsed, irpUsed: irpUsed, eligible: eligible,
    rate: rate, refund: refund,
    remainingRoom: TOTAL_CAP - eligible,
    savingExcess: Math.max(0, pensionSaving - PENSION_SAVING_CAP),
    irpExcess: Math.max(0, irp - remainForIrp),
    atCap: eligible >= TOTAL_CAP
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
  income: $('income'), incomeEcho: $('income-echo'),
  incomeChips: document.querySelectorAll('.chips.income-chips .chip'),
  saving: $('saving'), savingChips: document.querySelectorAll('.chips.saving-chips .chip'),
  irp: $('irp'), irpChips: document.querySelectorAll('.chips.irp-chips .chip'),

  headline: $('headline'), headSub: $('head-sub'),
  warn: $('warn'),

  rSaving: $('r-saving'), rIrp: $('r-irp'), rEligible: $('r-eligible'),
  rRate: $('r-rate'), rRefund: $('r-refund'), rRoom: $('r-room'),

  simTarget: document.querySelectorAll('input[name="sim-target"]'),
  simChips: document.querySelectorAll('.sim-chips .chip'),
  simAmount: $('sim-amount'),
  simPct: $('sim-pct'), simSub: $('sim-sub'),
  sBefore: $('s-before'), sAfter: $('s-after'), sGain: $('s-gain')
};

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

function currentSimTarget() {
  var checked = document.querySelector('input[name="sim-target"]:checked');
  return checked ? checked.value : 'saving';
}

function render() {
  var income = readMoney(el.income);
  var saving = readMoney(el.saving);
  var irp = readMoney(el.irp);

  el.incomeEcho.innerHTML = income > 0 ? '<strong>' + readable(income) + '</strong>' : '';

  var r = calculate(income, saving, irp);

  el.headline.textContent = comma(r.refund) + '원';
  el.headSub.textContent = '공제대상액 ' + readable(r.eligible) + ' × ' + (r.rate * 100).toFixed(1) + '%';

  var warn = '';
  if (r.savingExcess > 0) {
    warn += '연금저축은 <strong>600만원</strong>까지만 인정돼서, ' + comma(r.savingExcess) + '원은 공제에 반영되지 않았습니다. ';
  }
  if (r.irpExcess > 0) {
    warn += '연금저축+IRP 합산 한도(900만원)를 넘겨서 ' + comma(r.irpExcess) + '원은 공제에 반영되지 않았습니다.';
  }
  el.warn.innerHTML = warn;
  el.warn.hidden = !warn;

  el.rSaving.textContent = comma(r.savingUsed);
  el.rIrp.textContent = comma(r.irpUsed);
  el.rEligible.textContent = comma(r.eligible);
  el.rRate.textContent = (r.rate * 100).toFixed(1) + '%';
  el.rRefund.textContent = comma(r.refund);
  el.rRoom.textContent = r.atCap ? '한도 다 채우셨습니다' : comma(r.remainingRoom) + '원 더 넣을 수 있어요';

  renderSim(income, saving, irp, r);
}

function renderSim(income, saving, irp, before) {
  var target = currentSimTarget();
  var addAmount = readMoney(el.simAmount);

  var afterSaving = saving + (target === 'saving' ? addAmount : 0);
  var afterIrp = irp + (target === 'irp' ? addAmount : 0);
  var after = calculate(income, afterSaving, afterIrp);

  var gain = after.refund - before.refund;
  var pct = addAmount > 0 ? (gain / addAmount * 100) : 0;

  if (addAmount <= 0) {
    el.simPct.textContent = '-';
    el.simSub.textContent = '추가로 넣을 금액을 선택해보세요.';
  } else if (gain === 0) {
    el.simPct.textContent = '0%';
    el.simSub.innerHTML = '이미 한도를 다 채우셔서 <strong>추가 납입해도 환급이 늘지 않습니다.</strong>' +
      (target === 'saving' ? ' IRP 계좌로 넣어보세요.' : '');
  } else {
    el.simPct.textContent = (after.rate * 100).toFixed(1) + '%';
    el.simSub.innerHTML = readable(addAmount) + ' 추가 납입하면<br>환급이 <strong>' + readable(gain) + '</strong> 늘어납니다.';
  }

  el.sBefore.textContent = comma(before.refund);
  el.sAfter.textContent = comma(after.refund);
  el.sGain.textContent = '+' + comma(gain);
}

/* ---------- 시작 ---------- */
attachMoneyFormat(el.income, render);
attachMoneyFormat(el.saving, render);
attachMoneyFormat(el.irp, render);
attachMoneyFormat(el.simAmount, render);

function wireChips(chips, target, render) {
  Array.prototype.forEach.call(chips, function (chip) {
    chip.addEventListener('click', function () {
      target.value = comma(chip.dataset.amount);
      Array.prototype.forEach.call(chips, function (c) { c.classList.remove('is-active'); });
      chip.classList.add('is-active');
      render();
    });
  });
}
wireChips(el.incomeChips, el.income, render);
wireChips(el.savingChips, el.saving, render);
wireChips(el.irpChips, el.irp, render);
wireChips(el.simChips, el.simAmount, render);

Array.prototype.forEach.call(el.simTarget, function (radio) {
  radio.addEventListener('change', render);
});

render();
