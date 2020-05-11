$(document).ready(function() {
  $('#newPlanName').on('click', function() {
    const newPlanName = $('#newPlanInput').val();
    $('div.canvas-title').text(newPlanName);
  });
});
