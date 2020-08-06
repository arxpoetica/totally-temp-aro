module.exports = browser.addCommand("login", (userName, password) => {

  browser.url('/login')
  $('#txtEmail').setValue(userName)
  $('#txtPassword').setValue(password)
  $('#btnLogin').click()

  return true;
})

describe('Login to App', function() {
  it('login to App', function() {
    browser.windowHandleSize({width: 1600, height: 768})
    browser.login(process.env.USER,process.env.PSWD)
  });
});