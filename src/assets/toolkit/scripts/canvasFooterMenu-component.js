$(document).ready(function() {
  $('.dropdown-item').on('click', function() {
    const selectedText = $(this).text();
    $(this)
      .parents('li')
      .next('li')
      .find('span.value')
      .text(selectedText);
  });
});
