exports.configure = (api, middleware) => {
  api.use((request, response, next) => {
    if (!request.user) {
      // The user is not logged in.
      if (request.xhr) {
        // This is a xhr request - send back a 403 error
        response.status(403)
        return response.json({ error: 'Forbidden' })
      }
      // The user has entered a URL in the browser. Redirect to the login page
      return response.redirect('/login')
    } else {
      // The user is logged in. Check if two-factor authentication is required. If yes, redirect to verification page.
      // We have named the variable "twoFactorAuthenticationDone" so that in case the variable disappears from the
      // request.user (e.g. during a refactor) then we will still keep going to the two factor verification page.
      if (request.user.twoFactorAuthenticationDone) {
        next()
      } else {
        return response.redirect('/verify-otp')
      }
    }
  })
}
