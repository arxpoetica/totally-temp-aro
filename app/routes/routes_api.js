export const configure = (api, middleware) => {
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
      if (!request.user.hasOwnProperty('version')) {
        // If we get here, it means that the user was previously logged in and has a old cookie.
        // Redirect the user to the login page
        return response.redirect('/login')
      }
      // The user is logged in. Check if two-factor authentication is required. If yes, redirect to verification page.
      // We have named the variable "multiFactorAuthenticationDone" so that in case the variable disappears from the
      // request.user (e.g. during a refactor) then we will still keep going to the multi factor verification page.
      if (request.user.multiFactorAuthenticationDone) {
        next()
      } else {
        return response.redirect('/verify-otp')
      }
    }
  })
}
