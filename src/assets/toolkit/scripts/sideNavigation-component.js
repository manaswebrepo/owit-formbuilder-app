$(document).ready(function() {
  $('.design-tool').on('click', function() {
    $(this).toggleClass('active');
    $('.toolbox__toolPanel')
      .css('width', '250px')
      .toggle();
  });

  // $('.closebtn').click(function() {
  //   $('.toolbox__toolPanel').css('width', '0');
  // });

  //Resize side navigation
  $('#resizable').resizable();

  // draggable and dropable
  $('.draggable').draggable({
    revert: 'invalid',
    stack: '.draggable',
    helper: 'clone',
  });
  $('.droppable').droppable({
    accept: '.draggable',
    drop: function(event, ui) {
      var droppable = $(this);
      var draggable = ui.draggable;

      // Move draggable into droppable
      draggable.clone().appendTo(droppable);
      $(this)
        .find('.ui-droppable')
        .find('.ui-droppable')
        .append(ui.draggable);
      //draggable.css({top: '5px', left: '5px'});
    },
  });
});
