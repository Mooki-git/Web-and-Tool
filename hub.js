(function () {
  var input = document.getElementById('tool-search');
  if (!input) return;

  var sections = Array.prototype.slice.call(document.querySelectorAll('.tool-section'));
  var empty = document.getElementById('tool-empty');

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, '');
  }

  function filter() {
    var q = normalize(input.value);
    var anyVisible = false;

    sections.forEach(function (section) {
      var sectionMatch = false;
      var cards = section.querySelectorAll('.tool-card');
      Array.prototype.forEach.call(cards, function (card) {
        var haystack = normalize(card.getAttribute('data-search') || card.textContent);
        var match = !q || haystack.indexOf(q) !== -1;
        card.classList.toggle('is-hidden', !match);
        if (match) sectionMatch = true;
      });
      // 검색 중(q가 있을 때)에만 매치가 하나도 없는 카테고리 자체를 숨김.
      // 검색어가 비어 있으면 카테고리는 항상 그대로 노출.
      section.classList.toggle('is-hidden', Boolean(q) && !sectionMatch);
      if (sectionMatch) anyVisible = true;
    });

    if (empty) empty.classList.toggle('is-hidden', anyVisible);
  }

  input.addEventListener('input', filter);
})();
