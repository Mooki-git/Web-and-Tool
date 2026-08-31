/* =========================================================
   ISA 유형 진단 계산기
   판정 로직은 PROJECT.md 5.1 스펙을 그대로 따름 — 임의로 단순화 금지
   ========================================================= */

var $ = function (id) { return document.getElementById(id); };

var el = {
  chips:      document.querySelectorAll('.chip'),
  amount:     $('invest-amount'),

  stateEmpty: $('it-state-empty'),
  stateOk:    $('it-state-ok'),

  type:          $('it-type'),
  reason:        $('it-reason'),
  contradiction: $('it-contradiction'),
  feebox:        $('it-feebox'),
  feeTitle:      $('it-fee-title'),
  feeAmount:     $('it-fee-amount'),
  feenote:       $('it-feenote'),

  rowBrokerage:     $('row-brokerage'),
  rowTrust:         $('row-trust'),
  rowDiscretionary: $('row-discretionary'),

  retryBtn: $('retry-btn')
};

/* ---------- 숫자 포맷 도우미 ---------- */
function onlyDigits(str) { return String(str).replace(/[^0-9]/g, ''); }
function comma(n) { return Number(n).toLocaleString('ko-KR'); }
function won(n) { return comma(Math.round(n)) + '원'; }

function attachMoneyFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caret = input.selectionStart;
    var before = input.value.slice(0, caret);
    var digitsBefore = onlyDigits(before).length;

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
function radioValue(name) {
  var checked = document.querySelector('input[name="' + name + '"]:checked');
  return checked ? checked.value : null;
}

/* =========================================================
   판정 로직 (PROJECT.md 5.1 그대로)
   ========================================================= */
function diagnose(q1, q2, q3) {
  var wantsDirect  = (q1 === 'direct');
  var wantsChoose  = (q2 === 'choose');
  var feeSensitive = (q3 === 'sensitive');

  var branch;
  if (wantsDirect)          branch = 'brokerage';
  else if (wantsChoose)     branch = 'trust-choose';
  else if (feeSensitive)    branch = 'trust-fee';
  else                      branch = 'discretionary';

  var typeName = {
    'brokerage':      '중개형',
    'trust-choose':   '신탁형',
    'trust-fee':      '신탁형',
    'discretionary':  '일임형'
  }[branch];

  var reason = {
    'brokerage':     '직접 사고팔고 싶다고 하셔서 중개형을 추천해요. 세 유형 중 유일하게 주식·ETF 직접 매매가 가능합니다.',
    'trust-choose':  '맡기기보다 상품을 직접 고르고 싶다고 하셔서 신탁형을 추천해요. 예적금 등 개별 상품과 수량을 투자자가 직접 지정합니다.',
    'trust-fee':     '맡기고 싶다고 하셨지만 수수료도 1원까지 아깝다고 하셔서, 일임 보수가 없는 신탁형을 먼저 추천해요. 상품을 직접 지정해야 하는 대신 매년 나가는 운용보수를 아낄 수 있습니다.',
    'discretionary': '관리에 시간 쓰기보다 전문가에게 맡기고 싶다고 하셔서 일임형을 추천해요. 모델포트폴리오만 고르면 이후 운용은 금융사가 맡습니다.'
  }[branch];

  var feenote = {
    'brokerage':     '중개형은 계좌를 굴리는 보수 대신, 매매할 때마다 위탁수수료가 붙어요. 증권사마다 차이가 크니 가입 전에 꼭 비교해보세요.',
    'trust-choose':  '신탁형은 계좌를 유지하는 동안 신탁보수가 붙습니다. 금융사마다 다르니 가입 전에 확인해보세요.',
    'trust-fee':     '아래 금액만큼 매년 나가는 게 괜찮다면, 상품 선택까지 맡길 수 있는 일임형도 좋은 선택이에요.',
    'discretionary': '보수가 부담되면, 상품을 직접 지정하는 대신 일임 보수가 없는 신탁형도 함께 비교해보세요.'
  }[branch];

  // 모순 응답: 직접 매매하고 싶다면서 상품 선택은 맡기고 싶다고 한 경우
  var showContradiction = wantsDirect && !wantsChoose;

  // 일임형 후보군(Q1·Q2 모두 "맡기고 싶다" 방향)일 때만 보수 추정 박스 노출
  var showFeeBox = !wantsDirect && !wantsChoose;
  var feeTitle = branch === 'discretionary' ? '예상 일임 보수 (연)' : '일임형을 고르면 드는 보수 (연)';

  return {
    branch: branch,
    typeName: typeName,
    reason: reason,
    feenote: feenote,
    showContradiction: showContradiction,
    showFeeBox: showFeeBox,
    feeTitle: feeTitle
  };
}

/* =========================================================
   화면 그리기
   ========================================================= */
function render() {
  var q1 = radioValue('q1');
  var q2 = radioValue('q2');
  var q3 = radioValue('q3');
  var amount = readMoney(el.amount);

  Array.prototype.forEach.call(el.chips, function (chip) {
    chip.classList.toggle('is-active', Number(chip.dataset.amount) === amount);
  });

  if (!q1 || !q2 || !q3) {
    el.stateEmpty.classList.remove('is-hidden');
    el.stateOk.classList.add('is-hidden');
    return;
  }
  el.stateEmpty.classList.add('is-hidden');
  el.stateOk.classList.remove('is-hidden');

  var r = diagnose(q1, q2, q3);

  el.type.textContent = r.typeName;
  el.reason.textContent = r.reason;
  el.feenote.textContent = r.feenote;

  // 모순 안내
  if (r.showContradiction) {
    el.contradiction.classList.remove('is-hidden');
    el.contradiction.textContent =
      '직접 사고팔고 싶다고 하셔서 중개형으로 안내드렸어요. 다만 중개형은 어떤 상품을 살지도 직접 고르셔야 합니다. ' +
      '상품 선택까지 맡기고 싶으시면 첫 번째 질문을 \'맡기고 싶어요\'로 바꿔보세요.';
  } else {
    el.contradiction.classList.add('is-hidden');
  }

  // 일임형 보수 추정
  if (r.showFeeBox) {
    el.feebox.classList.remove('is-hidden');
    el.feeTitle.textContent = r.feeTitle;
    if (amount > 0) {
      var low = Math.round(amount * 0.001);
      var high = Math.round(amount * 0.006);
      el.feeAmount.textContent = won(low) + ' ~ ' + won(high);
    } else {
      el.feeAmount.textContent = '투자 예정 금액을 입력하면 예상 보수를 계산해드립니다.';
    }
  } else {
    el.feebox.classList.add('is-hidden');
  }

  // 비교표 하이라이트
  el.rowBrokerage.classList.toggle('is-highlight', r.branch === 'brokerage');
  el.rowTrust.classList.toggle('is-highlight', r.branch === 'trust-choose' || r.branch === 'trust-fee');
  el.rowDiscretionary.classList.toggle('is-highlight', r.branch === 'discretionary');
}

/* =========================================================
   다시 진단
   ========================================================= */
function reset() {
  document.querySelectorAll('input[type="radio"]').forEach(function (r) { r.checked = false; });
  el.amount.value = '';
  render();
  var first = document.querySelector('.wrap .card');
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================
   시작
   ========================================================= */
attachMoneyFormat(el.amount, render);

Array.prototype.forEach.call(el.chips, function (chip) {
  chip.addEventListener('click', function () {
    el.amount.value = comma(chip.dataset.amount);
    render();
  });
});

document.querySelectorAll('input[type="radio"]').forEach(function (radio) {
  radio.addEventListener('change', render);
});

el.retryBtn.addEventListener('click', reset);

render();
