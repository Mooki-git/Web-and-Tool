(function () {
  var switcher = document.querySelector('.calc-switcher[data-default-cat]');
  var sidebar = document.querySelector('.hub-sidebar');
  if (!switcher || !sidebar) return;

  var buttons = sidebar.querySelectorAll('.hub-cat');
  var links = switcher.querySelectorAll('a');
  var defaultCat = switcher.getAttribute('data-default-cat');

  function applyFilter(cat) {
    Array.prototype.forEach.call(links, function (a) {
      var match = cat === 'all' || a.getAttribute('data-cat') === cat;
      a.classList.toggle('is-hidden', !match);
    });
    Array.prototype.forEach.call(buttons, function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-cat') === cat);
    });
  }

  // 기본값: 이 페이지가 속한 카테고리만 표시 (기존 화면과 동일하게 시작)
  applyFilter(defaultCat);

  Array.prototype.forEach.call(buttons, function (btn) {
    btn.addEventListener('click', function () {
      applyFilter(btn.getAttribute('data-cat'));
    });
  });
})();
