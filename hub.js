(function () {
  var input = document.getElementById('tool-search');
  var sections = Array.prototype.slice.call(document.querySelectorAll('.tool-section'));
  var empty = document.getElementById('tool-empty');
  var catButtons = Array.prototype.slice.call(document.querySelectorAll('.hub-cat'));
  var activeCat = 'all';

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, '');
  }

  function filter() {
    var q = input ? normalize(input.value) : '';
    var anyVisible = false;

    sections.forEach(function (section) {
      var catMatch = activeCat === 'all' || section.getAttribute('data-cat') === activeCat;
      var sectionMatch = false;

      var cards = section.querySelectorAll('.tool-card');
      Array.prototype.forEach.call(cards, function (card) {
        var haystack = normalize(card.getAttribute('data-search') || card.textContent);
        var match = !q || haystack.indexOf(q) !== -1;
        card.classList.toggle('is-hidden', !match);
        if (match) sectionMatch = true;
      });

      // 카테고리가 선택돼 있으면 그 카테고리가 아닌 섹션은 무조건 숨김.
      // 검색어가 있을 때는 그 안에서도 매치가 없는 섹션을 추가로 숨김.
      var visible = catMatch && (!q || sectionMatch);
      section.classList.toggle('is-hidden', !visible);
      if (visible) anyVisible = true;
    });

    if (empty) empty.classList.toggle('is-hidden', anyVisible);
  }

  if (input) input.addEventListener('input', filter);

  catButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeCat = btn.getAttribute('data-cat');
      catButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      filter();
    });
  });

  filter();
})();
