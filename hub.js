(function () {
  var input = document.getElementById('tool-search');
  if (!input) return;

  var cards = Array.prototype.slice.call(document.querySelectorAll('.tool-card'));
  var empty = document.getElementById('tool-empty');

  function normalize(s) {
    return (s || '').toLowerCase().replace(/\s+/g, '');
  }

  function filter() {
    var q = normalize(input.value);
    var anyVisible = false;

    cards.forEach(function (card) {
      var haystack = normalize(card.getAttribute('data-search') || card.textContent);
      var match = !q || haystack.indexOf(q) !== -1;
      card.classList.toggle('is-hidden', !match);
      if (match) anyVisible = true;
    });

    if (empty) empty.classList.toggle('is-hidden', anyVisible);
  }

  input.addEventListener('input', filter);
})();
