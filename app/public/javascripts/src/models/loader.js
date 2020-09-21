/* global app $ */
app.service('loader', ($timeout) => {
  $timeout(() => {
    $('#loader-wrapper').css('display', 'none')
  })
})
