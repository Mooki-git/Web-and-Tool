/* =========================================================
   ISA 절세 효과 계산기
   계산 기준: 조세특례제한법 제91조의18 (2026.08 확정)
   ========================================================= */

/* ---------- 세율·한도 상수 (제도가 바뀌면 여기만 고치면 됩니다) ---------- */
var RULES = {
  EXEMPT_GENERAL: 2000000,   // 일반형 비과세 한도 200만원
  EXEMPT_SEOMIN:  4000000,   // 서민형(농어민형 동일) 비과세 한도 400만원
  ISA_RATE:       0.099,     // ISA 한도 초과분 9.9% 분리과세 (소득세 9% + 지방소득세 0.9%)
  NORMAL_RATE:    0.154,     // 일반 계좌 15.4% (소득세 14% + 지방소득세 1.4%)
  MANDATORY_YEARS: 3         // 의무가입기간 3년
};

/* ---------- 화면 요소 모아두기 ---------- */
var $ = function (id) { return document.getElementById(id); };

var el = {
  profit:      $('profit'),
  profitEcho:  $('profit-echo'),
  chips:       document.querySelectorAll('.chip'),
  incomeQ:     $('income-question'),
  optLow:      $('income-opt-low'),
  optHigh:     $('income-opt-high'),
  lossWrap:    $('loss-wrap'),
  loss:        $('loss'),
  lossEcho:    $('loss-echo'),

  stateEmpty:   $('state-empty'),
  stateBlocked: $('state-blocked'),
  stateOk:      $('state-ok'),

  badge:      $('type-badge'),
  headline:   $('saving-headline'),
  mMonth:     $('m-month'),
  mRate:      $('m-rate'),
  mThree:     $('m-three'),
  lossNote:   $('loss-note'),
  shareBtn:   $('share-btn'),
  shareToast: $('share-toast')
};

/* ---------- 숫자 포맷 도우미 ---------- */
function onlyDigits(str) {
  return String(str).replace(/[^0-9]/g, '');
}

function comma(n) {
  return Number(n).toLocaleString('ko-KR');
}

function won(n) {
  return comma(Math.round(n)) + '원';
}

/** 12,345,678 -> "1,234만 5,678원" 형태의 읽기 쉬운 문구 */
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

/* ---------- 입력창: 입력하면서 자동으로 콤마 찍기 ---------- */
function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caret = input.selectionStart;
    var before = input.value.slice(0, caret);
    var digitsBefore = onlyDigits(before).length;

    var digits = onlyDigits(input.value).slice(0, 12); // 최대 12자리
    input.value = digits ? comma(digits) : '';

    // 커서 위치 복원
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

/* ---------- 현재 선택값 읽기 ---------- */
function radioValue(name) {
  var checked = document.querySelector('input[name="' + name + '"]:checked');
  return checked ? checked.value : null;
}

function readInputs() {
  return {
    profit:      readMoney(el.profit),
    incomeType:  radioValue('incomeType'),   // 'salary' | 'business'
    incomeLevel: radioValue('incomeLevel'),  // 'low' | 'high'
    finIncome:   radioValue('finIncome'),    // 'no' | 'yes'
    hasLoss:     radioValue('hasLoss'),      // 'no' | 'yes'
    loss:        radioValue('hasLoss') === 'yes' ? readMoney(el.loss) : 0
  };
}

/* =========================================================
   핵심 계산
   ========================================================= */
function calculate(input) {
  // 1) 가입 자격 판정
  if (input.finIncome === 'yes') {
    return { blocked: true };
  }
  var isSeomin = (input.incomeLevel === 'low');

  // 2) ISA는 손실과 이익을 합산(손익통산)한 뒤 과세
  var netProfit = Math.max(0, input.profit - input.loss);

  // 3) 계좌별 과세대상 수익과 세금
  var baseGeneral = Math.max(0, netProfit - RULES.EXEMPT_GENERAL);
  var baseSeomin  = Math.max(0, netProfit - RULES.EXEMPT_SEOMIN);
  var baseNormal  = input.profit; // 일반계좌는 손익통산이 안 되므로 이익 전액이 과세대상

  var taxGeneral = baseGeneral * RULES.ISA_RATE;
  var taxSeomin  = baseSeomin  * RULES.ISA_RATE;
  var taxNormal  = baseNormal  * RULES.NORMAL_RATE;

  // 4) 판정된 유형 기준 절세액
  var myTax  = isSeomin ? taxSeomin : taxGeneral;
  var saving = Math.max(0, taxNormal - myTax);

  return {
    blocked: false,
    isSeomin: isSeomin,
    netProfit: netProfit,
    baseNormal: baseNormal,
    baseGeneral: baseGeneral,
    baseSeomin: baseSeomin,
    taxNormal: taxNormal,
    taxGeneral: taxGeneral,
    taxSeomin: taxSeomin,
    saving: saving,
    savingMonthly: saving / 12,
    savingRate: input.profit > 0 ? (saving / input.profit) * 100 : 0,
    savingThreeYear: saving * RULES.MANDATORY_YEARS
  };
}

/* =========================================================
   화면 그리기
   ========================================================= */
function showState(which) {
  el.stateEmpty.classList.toggle('is-hidden', which !== 'empty');
  el.stateBlocked.classList.toggle('is-hidden', which !== 'blocked');
  el.stateOk.classList.toggle('is-hidden', which !== 'ok');
}

/** 비교표에서 판정 안 된 유형 열을 흐리게 처리 */
function highlightColumns(focusCol) {
  ['normal', 'general', 'seomin'].forEach(function (col) {
    var cells = document.querySelectorAll('.cmp [data-col="' + col + '"]');
    var isFocus = (col === 'normal' || col === focusCol);
    Array.prototype.forEach.call(cells, function (c) {
      c.classList.toggle('is-dim', !isFocus);
      c.classList.toggle('is-focus', col === focusCol);
    });
  });

  // 좁은 화면에서 표가 잘릴 때: 판정된 열이 보이도록 스크롤 + 안내 문구
  var box = $('table-scroll');
  var hint = $('scroll-hint');
  if (!box || !hint) return;

  var scrollable = box.scrollWidth > box.clientWidth + 1;
  hint.classList.toggle('is-hidden', !scrollable);

  if (scrollable) {
    var head = document.querySelector('.cmp thead th[data-col="' + focusCol + '"]');
    if (head) {
      var hr = head.getBoundingClientRect();
      var br = box.getBoundingClientRect();
      var over = hr.right - br.right;          // 오른쪽으로 얼마나 벗어났는지
      if (over > 0) box.scrollLeft = Math.min(box.scrollWidth, box.scrollLeft + over + 4);
    }
  }
}

function render() {
  var input = readInputs();

  // 소득 형태에 따라 질문 문구 바꾸기
  if (input.incomeType === 'business') {
    el.incomeQ.textContent = '종합소득금액이 3,800만원 이하인가요?';
    el.optLow.textContent  = '3,800만원 이하';
    el.optHigh.textContent = '3,800만원 초과';
  } else {
    el.incomeQ.textContent = '총급여가 5,000만원 이하인가요?';
    el.optLow.textContent  = '5,000만원 이하';
    el.optHigh.textContent = '5,000만원 초과';
  }

  // 손실 입력란 보이기/숨기기
  var lossOn = (input.hasLoss === 'yes');
  el.lossWrap.classList.toggle('is-hidden', !lossOn);
  el.lossEcho.classList.toggle('is-hidden', !lossOn);
  if (lossOn) {
    el.lossEcho.innerHTML = input.loss > 0
      ? '손실 <strong>' + readable(input.loss) + '</strong>'
      : '손실 금액을 입력해 주세요.';
  }

  // 수익 입력 안내
  el.profitEcho.innerHTML = input.profit > 0
    ? '<strong>' + readable(input.profit) + '</strong>'
    : '금액을 입력하면 결과가 바로 계산됩니다.';

  // 칩 활성화 표시
  Array.prototype.forEach.call(el.chips, function (chip) {
    chip.classList.toggle('is-active', Number(chip.dataset.amount) === input.profit);
  });

  var r = calculate(input);

  // --- 상태 1: 가입 불가 ---
  if (r.blocked) { showState('blocked'); return; }

  // --- 상태 2: 아직 수익 미입력 ---
  if (input.profit <= 0) { showState('empty'); return; }

  // --- 상태 3: 정상 결과 ---
  showState('ok');

  el.badge.textContent = r.isSeomin ? '서민형 ISA 대상입니다' : '일반형 ISA 대상입니다';
  el.badge.className = 'badge ' + (r.isSeomin ? 'badge-good' : '');

  el.headline.textContent = won(r.saving);
  el.mMonth.textContent   = won(r.savingMonthly);
  el.mRate.textContent    = r.savingRate.toFixed(1) + '%';
  el.mThree.textContent   = won(r.savingThreeYear);

  // 표는 좁은 화면을 고려해 '원'을 빼고 숫자만 넣습니다 (단위는 표 아래에 한 번만 표기)
  $('t-base-normal').textContent  = comma(Math.round(r.baseNormal));
  $('t-base-general').textContent = comma(Math.round(r.baseGeneral));
  $('t-base-seomin').textContent  = comma(Math.round(r.baseSeomin));
  $('t-tax-normal').textContent   = comma(Math.round(r.taxNormal));
  $('t-tax-general').textContent  = comma(Math.round(r.taxGeneral));
  $('t-tax-seomin').textContent   = comma(Math.round(r.taxSeomin));

  highlightColumns(r.isSeomin ? 'seomin' : 'general');

  // 손익통산 안내 문구
  if (input.loss > 0) {
    el.lossNote.classList.remove('is-hidden');
    el.lossNote.textContent =
      '손실 ' + won(input.loss) + '이 반영돼 과세대상이 ' +
      won(input.profit) + ' → ' + won(r.netProfit) + '으로 줄었습니다. ' +
      '일반계좌에서는 이 합산이 되지 않습니다.';
  } else {
    el.lossNote.classList.add('is-hidden');
  }

  saveToUrl(input);
}

/* =========================================================
   공유 (입력값을 주소에 담아 링크로 전달)
   ========================================================= */
function saveToUrl(input) {
  var p = new URLSearchParams();
  p.set('p', input.profit);
  p.set('t', input.incomeType);
  p.set('i', input.incomeLevel);
  if (input.finIncome === 'yes') p.set('f', '1');
  if (input.loss > 0) p.set('l', input.loss);
  try {
    history.replaceState(null, '', '?' + p.toString());
  } catch (e) {
    // file:// 로 열었을 때는 주소 변경이 막혀 있어 무시합니다.
  }
}

function loadFromUrl() {
  var p = new URLSearchParams(location.search);
  if (!p.toString()) return;

  var profit = parseInt(p.get('p'), 10);
  if (profit > 0) el.profit.value = comma(profit);

  var setRadio = function (name, value) {
    var target = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (target) target.checked = true;
  };
  if (p.get('t')) setRadio('incomeType', p.get('t'));
  if (p.get('i')) setRadio('incomeLevel', p.get('i'));
  if (p.get('f') === '1') setRadio('finIncome', 'yes');

  var loss = parseInt(p.get('l'), 10);
  if (loss > 0) {
    setRadio('hasLoss', 'yes');
    el.loss.value = comma(loss);
  }
}

function share() {
  var text = 'ISA 절세 효과 계산기 — 내 절세액은 연 ' + el.headline.textContent;
  var url = location.href;

  if (navigator.share) {
    navigator.share({ title: 'ISA 절세 효과 계산기', text: text, url: url })
      .catch(function () {});
    return;
  }
  var done = function () {
    el.shareToast.classList.remove('is-hidden');
    setTimeout(function () { el.shareToast.classList.add('is-hidden'); }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, function () {});
  } else {
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.profit, render);
attachMoneyFormat(el.loss, render);

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.profit.value = comma(chip.dataset.amount);
    render();
  });
});

Array.prototype.forEach.call(
  document.querySelectorAll('input[type="radio"]'),
  function (radio) { radio.addEventListener('change', render); }
);

el.shareBtn.addEventListener('click', share);

document.querySelectorAll('.is-soon').forEach(function (a) {
  a.addEventListener('click', function (e) { e.preventDefault(); });
});

loadFromUrl();
render();
