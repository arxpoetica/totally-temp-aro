exports.configure = (api, middleware) => {
  api.use((request, response, next) => {
    if (!request.user) {
      if (request.xhr) {
        response.status(403)
        return response.json({ error: 'Forbidden' })
      }
      return response.redirect('/login')
    }
    next()
  })
}
