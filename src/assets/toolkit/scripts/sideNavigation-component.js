$(document).ready(function() {
  $('.design-tool').on('click', function() {
    $(this).toggleClass('active');
    $('.toolbox__toolPanel')
      .css('width', '250px')
      .toggle();
  });

  //Resize side navigation
  $('#resizable').resizable();
});
