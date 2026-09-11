/* =========================================================
   주식 물타기 계산기 (2026년 기준)
   - 새 평단가 = (기존 투자금액 + 추가 매수금액) / (기존 수량 + 추가 수량)
   - 본전 탈출 상승률: 마지막에 입력한 매수 단가(=현재 주가로 가정) 기준으로
     총 투자금액을 회수하는 데 필요한 매도가까지의 상승률
   - 목표 평단가 역산: 새 평단가 대신 원하는 목표 평단가를 넣으면
     마지막 매수가로 몇 주를 더 사야 하는지 계산
   ========================================================= */

/* ---------- 계산 엔진 ---------- */
function lotCost(lot, buyFeeRate) {
  return lot.price * lot.qty * (1 + buyFeeRate);
}

function simulate(base, lots, buyFeeRate, sellCostRate) {
  buyFeeRate = buyFeeRate || 0;
  sellCostRate = sellCostRate || 0;

  if (!(base.price > 0) || !(base.qty > 0)) {
    return { valid: false, reason: 'invalid-base' };
  }
  var validLots = lots.filter(function (l) { return l.price > 0 && l.qty > 0; });
  if (validLots.length === 0) {
    return { valid: false, reason: 'no-lots' };
  }

  var totalQty = base.qty;
  var totalCost = base.price * base.qty;

  validLots.forEach(function (lot) {
    totalQty += lot.qty;
    totalCost += lotCost(lot, buyFeeRate);
  });

  var newAvgPrice = totalCost / totalQty;
  var currentPrice = validLots[validLots.length - 1].price;

  var breakEvenSellPrice = sellCostRate < 1 ? totalCost / (totalQty * (1 - sellCostRate)) : Infinity;
  var riseNeededPct = currentPrice > 0 ? (breakEvenSellPrice - currentPrice) / currentPrice * 100 : null;

  return {
    valid: true,
    totalQty: totalQty, totalCost: totalCost,
    newAvgPrice: newAvgPrice, currentPrice: currentPrice,
    breakEvenSellPrice: breakEvenSellPrice, riseNeededPct: riseNeededPct
  };
}

function solveForTargetAvg(baseAvgPrice, baseQty, lastPrice, targetAvgPrice) {
  if (!(baseAvgPrice > 0) || !(baseQty > 0) || !(lastPrice > 0) || !(targetAvgPrice > 0)) {
    return { valid: false, reason: 'invalid-input' };
  }
  if (targetAvgPrice === lastPrice) {
    return { valid: false, reason: 'target-equals-price' };
  }
  var lo = Math.min(baseAvgPrice, lastPrice);
  var hi = Math.max(baseAvgPrice, lastPrice);
  if (!(targetAvgPrice > lo && targetAvgPrice < hi)) {
    return { valid: false, reason: 'target-out-of-range', lo: lo, hi: hi };
  }

  var neededQtyExact = baseQty * (baseAvgPrice - targetAvgPrice) / (targetAvgPrice - lastPrice);
  var neededQty = Math.ceil(neededQtyExact);
  var neededAmount = neededQty * lastPrice;
  var actualAvg = (baseAvgPrice * baseQty + lastPrice * neededQty) / (baseQty + neededQty);

  return { valid: true, neededQtyExact: neededQtyExact, neededQty: neededQty, neededAmount: neededAmount, actualAvg: actualAvg };
}

/* ---------- 숫자 포맷/입력 ---------- */
function onlyDigits(s) { return String(s).replace(/[^0-9]/g, ''); }
function onlyDecimal(s) {
  s = String(s).replace(/[^0-9.]/g, '');
  var firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  return s;
}
function comma(n) { return Number(n).toLocaleString('ko-KR'); }

function formatPrice(n) {
  var r = Math.round((n + Number.EPSILON) * 100) / 100;
  var s = String(r);
  var parts = s.split('.');
  parts[0] = comma(parts[0]);
  return parts.join('.') + '원';
}
function formatInt(n) { return comma(Math.round(n)) + '원'; }
function formatQty(n) { return comma(Math.round(n)) + '주'; }
function formatPct(n) {
  var r = Math.round((n + Number.EPSILON) * 100) / 100;
  var sign = r > 0 ? '+' : '';
  return sign + r.toFixed(2) + '%';
}

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
function attachDecimalFormat(input, onChange) {
  input.addEventListener('input', function () {
    var caretFromEnd = input.value.length - input.selectionStart;
    input.value = onlyDecimal(input.value);
    var pos = Math.max(0, input.value.length - caretFromEnd);
    input.setSelectionRange(pos, pos);
    onChange();
  });
}
function readMoney(input) {
  var d = onlyDigits(input.value);
  return d ? Number(d) : 0;
}
function readDecimal(input) {
  var v = parseFloat(onlyDecimal(input.value));
  return isNaN(v) ? 0 : v;
}

/* ---------- DOM ---------- */
var $ = function (id) { return document.getElementById(id); };

var el = {
  basePrice: $('base-price'), baseQty: $('base-qty'),
  lots: $('lots'), addLotBtn: $('add-lot'),
  buyFee: $('buy-fee'), sellCost: $('sell-cost'),
  warn: $('warn'),
  headline: $('headline'), headSub: $('head-sub'),
  mCost: $('m-cost'), mQty: $('m-qty'), mRise: $('m-rise'),
  targetAvg: $('target-avg'),
  tQty: $('t-qty'), tAmount: $('t-amount'), targetWarn: $('target-warn')
};

var lotSeq = 0;

function addLotRow(price, qty) {
  var idx = lotSeq++;
  var row = document.createElement('div');
  row.className = 'lot-row';
  row.setAttribute('data-lot-id', idx);
  row.innerHTML =
    '<div>' +
      '<p class="lot-label">' + (el.lots.children.length + 1) + '차 매수 단가</p>' +
      '<div class="money-field"><input type="text" inputmode="decimal" class="lot-price" autocomplete="off" value="' + (price != null ? comma(price) : '') + '"><span class="unit">원</span></div>' +
    '</div>' +
    '<div>' +
      '<p class="lot-label">수량</p>' +
      '<div class="money-field"><input type="text" inputmode="numeric" class="lot-qty" autocomplete="off" value="' + (qty != null ? comma(qty) : '') + '"><span class="unit">주</span></div>' +
    '</div>' +
    '<button type="button" class="lot-remove" aria-label="이 매수 삭제">✕</button>';
  el.lots.appendChild(row);

  var priceInput = row.querySelector('.lot-price');
  var qtyInput = row.querySelector('.lot-qty');
  attachMoneyFormat(priceInput, render);
  attachMoneyFormat(qtyInput, render);

  row.querySelector('.lot-remove').addEventListener('click', function () {
    row.remove();
    relabelLots();
    render();
  });

  relabelLots();
}

function relabelLots() {
  var rows = el.lots.querySelectorAll('.lot-row');
  rows.forEach(function (row, i) {
    row.querySelector('.lot-label').textContent = (i + 1) + '차 매수 단가';
  });
  // 최소 1개 행은 삭제 버튼 비활성화(전부 지우면 계산 불가)
  rows.forEach(function (row) {
    var btn = row.querySelector('.lot-remove');
    btn.disabled = rows.length <= 1;
  });
}

function readLots() {
  var rows = el.lots.querySelectorAll('.lot-row');
  var out = [];
  rows.forEach(function (row) {
    out.push({
      price: readMoney(row.querySelector('.lot-price')),
      qty: readMoney(row.querySelector('.lot-qty'))
    });
  });
  return out;
}

function render() {
  var base = { price: readMoney(el.basePrice), qty: readMoney(el.baseQty) };
  var lots = readLots();
  var buyFeeRate = readDecimal(el.buyFee) / 100;
  var sellCostRate = readDecimal(el.sellCost) / 100;

  var r = simulate(base, lots, buyFeeRate, sellCostRate);

  var warnParts = [];
  if (!(base.price > 0) || !(base.qty > 0)) {
    warnParts.push('현재 평단가와 보유 수량을 입력해주세요.');
  }
  var validLots = lots.filter(function (l) { return l.price > 0 && l.qty > 0; });
  if (validLots.length === 0) {
    warnParts.push('추가 매수 단가와 수량을 최소 1건 입력해주세요.');
  }
  el.warn.innerHTML = warnParts.map(function (t) { return '<p>' + t + '</p>'; }).join('');
  el.warn.hidden = warnParts.length === 0;

  // 역산 계산기는 "현재 보유 정보 + 마지막 매수가"를 기준으로 하며,
  // 위 시뮬레이션에 이미 넣은 매수 수량과는 별개로 동작합니다.
  var lastLotPrice = validLots.length > 0 ? validLots[validLots.length - 1].price : null;
  renderTarget(base, lastLotPrice);

  if (!r.valid) {
    el.headline.textContent = '0원';
    el.headSub.textContent = '-';
    el.mCost.textContent = '-';
    el.mQty.textContent = '-';
    el.mRise.textContent = '-';
    return;
  }

  el.headline.textContent = formatPrice(r.newAvgPrice);
  var pctChange = (r.newAvgPrice - base.price) / base.price * 100;
  var dir = pctChange < 0 ? '하락(물타기)' : pctChange > 0 ? '상승(불타기)' : '변화 없음';
  el.headSub.textContent = '기존 평단가 대비 ' + (Math.abs(pctChange) < 0.005 ? '변화 없음' : formatPct(pctChange) + ' ' + dir);

  el.mCost.textContent = formatInt(r.totalCost);
  el.mQty.textContent = formatQty(r.totalQty);

  if (r.riseNeededPct === null) {
    el.mRise.textContent = '-';
  } else if (r.riseNeededPct <= 0) {
    el.mRise.textContent = '이미 본전 초과';
  } else {
    el.mRise.textContent = formatPct(r.riseNeededPct);
  }
}

function renderTarget(base, lastLotPrice) {
  var targetAvg = readMoney(el.targetAvg);

  if (!(base.price > 0) || !(base.qty > 0) || !lastLotPrice) {
    el.tQty.textContent = '-';
    el.tAmount.textContent = '-';
    el.targetWarn.hidden = true;
    return;
  }
  if (!(targetAvg > 0)) {
    el.tQty.textContent = '-';
    el.tAmount.textContent = '-';
    el.targetWarn.innerHTML = '<p>목표로 하는 평단가를 입력해주세요.</p>';
    el.targetWarn.hidden = false;
    return;
  }

  var t = solveForTargetAvg(base.price, base.qty, lastLotPrice, targetAvg);

  if (!t.valid) {
    el.tQty.textContent = '-';
    el.tAmount.textContent = '-';
    var msg;
    if (t.reason === 'target-equals-price') {
      msg = '목표 평단가가 현재가(마지막 매수가)와 같습니다. 다른 값을 입력해주세요.';
    } else if (t.reason === 'target-out-of-range') {
      msg = '목표 평단가는 ' + formatPrice(t.lo) + '과 ' + formatPrice(t.hi) + ' 사이여야 도달 가능합니다.';
    } else {
      msg = '목표 평단가를 다시 확인해주세요.';
    }
    el.targetWarn.innerHTML = '<p>' + msg + '</p>';
    el.targetWarn.hidden = false;
    return;
  }

  el.targetWarn.hidden = true;
  el.tQty.textContent = formatQty(t.neededQty);
  el.tAmount.textContent = formatInt(t.neededAmount);
}

/* ---------- 초기화 ---------- */
addLotRow(50000, 100);

attachMoneyFormat(el.basePrice, render);
attachMoneyFormat(el.baseQty, render);
attachDecimalFormat(el.buyFee, render);
attachDecimalFormat(el.sellCost, render);
attachMoneyFormat(el.targetAvg, render);
el.addLotBtn.addEventListener('click', function () {
  addLotRow(null, null);
  render();
});

render();
