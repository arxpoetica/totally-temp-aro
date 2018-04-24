app.service('globalSettingsService', ['$http','state', ($http,state) => {

  var globalSettings = {}

  globalSettings.new_user = {}
  globalSettings.mailSubject = ''
  globalSettings.mailBody = ''
  globalSettings.user = globalUser
  globalSettings.old_password = ''
  globalSettings.password = ''
  globalSettings.password_confirm = ''
  globalSettings.updatedTag = {}
  globalSettings.newTag = {}

  globalSettings.ManageUserViews = Object.freeze({
    Users: 0,
    SendEmail: 1,
    RegisterUser: 2
  })
  globalSettings.currentManageUserView = globalSettings.ManageUserViews.Users

  globalSettings.openUserView = () => {
    globalSettings.currentManageUserView = globalSettings.ManageUserViews.Users
  }

  globalSettings.openNewUserView = () => {
    globalSettings.currentManageUserView = globalSettings.ManageUserViews.RegisterUser
  }

  globalSettings.openSendMailView = () => {
    globalSettings.currentManageUserView = globalSettings.ManageUserViews.SendEmail
  }

  globalSettings.register_user = () => {
    if (globalSettings.new_user.email !== globalSettings.new_user.email_confirm) {
      return swal({
        title: 'Error',
        text: 'Emails do not match',
        type: 'error'
      })
    }
    $http.post('/admin/users/register', globalSettings.new_user)
      .then((response) => {
        globalSettings.new_user = {}
        swal({ title: 'User registered', type: 'success' })
        globalSettings.openUserView()
      })
  }

  globalSettings.sendMail = () => {
    $http.post('/admin/users/mail', { subject: globalSettings.mailSubject, text: globalSettings.mailBody })
      .then((response) => {
        globalSettings.mailSubject = ''
        globalSettings.mailBody = ''
        swal({ title: 'Emails sent', type: 'success' })
        globalSettings.openUserView()
      })
  }

  globalSettings.save = () => {
    var data = {
      first_name: globalSettings.user.first_name,
      last_name: globalSettings.user.last_name,
      email: globalSettings.user.email,
      old_password: globalSettings.old_password,
      password: globalSettings.password,
      password_confirm: globalSettings.password_confirm
    }
    $http({
      method: 'POST',
      url: '/settings/update_settings',
      data: data
    }).then((response) => {
      state.showGlobalSettings.next(false)
    }).catch((response) => {
      state.showGlobalSettings.next(false)
    })

  }

  globalSettings.saveLocation = () => {
    $http.put(`/user/default_location/${globalSettings.user.default_location}`)
  }

  globalSettings.TagManagerViews = Object.freeze({
    Tags: 0,
    CreateTag: 1,
    UpdateTag: 2,
  })

  globalSettings.currentTagManagerView = globalSettings.TagManagerViews.Tags

  globalSettings.getTags = () => {
    globalSettings.tagsList = state.listOfTags
  }  

  globalSettings.createTag = () => {
    $http.post(`/service/tag-mapping/tags?name=${globalSettings.newTag.name}&description=${globalSettings.newTag.description}&colourHue=${globalSettings.newTag.colourHue}`)
    .then((response) => {
      state.loadListOfPlanTags()
      globalSettings.getTags()
      globalSettings.currentTagManagerView = globalSettings.TagManagerViews.Tags
      globalSettings.newTag = {}
    })
  }

  globalSettings.updateTag = () => {
    $http.put(`/service/tag-mapping/tags`,_.omit(globalSettings.updatedTag,'type'))
    .then((response) => {
      state.loadListOfPlanTags()
      globalSettings.getTags()
      globalSettings.currentTagManagerView = globalSettings.TagManagerViews.Tags
      globalSettings.updatedTag = {}
    })
  }

  return globalSettings
}])