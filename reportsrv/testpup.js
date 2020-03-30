const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: [
      // Required for Docker version of Puppeteer
      '--no-sandbox',
      '--disable-setuid-sandbox',
      // This will write shared memory files into /tmp instead of /dev/shm,
      // because Docker’s default for /dev/shm is 64MB
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });
  const page = await browser.newPage()
  await page.setCookie({
    name: 'session',
    value: 'eyJmbGFzaCI6e30sInBhc3Nwb3J0Ijp7InVzZXIiOnsiaWQiOjQsIm11bHRpRmFjdG9yQXV0aGVudGljYXRpb25Eb25lIjp0cnVlLCJ2ZXJzaW9uIjoiMSJ9fX0=',
    url: 'http://app:8000/'
  },
  {
    name: 'session.sig',
    value: 'C9WVxl_FnwNUNFZ5dHkJw8bJT5s',
    url: 'http://app:8000/'
  },
  {
    name: 'session',
    value: 'eyJmbGFzaCI6e30sInBhc3Nwb3J0Ijp7InVzZXIiOnsiaWQiOjQsIm11bHRpRmFjdG9yQXV0aGVudGljYXRpb25Eb25lIjp0cnVlLCJ2ZXJzaW9uIjoiMSJ9fX0=',
    url: 'http://app:8000/'
  })
  page.on('console', msg => console.log('PAGE LOG:', msg));
  // await page.setViewport({
  //   width: 1024,
  //   height: 768,
  //   deviceScaleFactor: 1
  // })
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto('http://app:8000/')
  const sleep = m => new Promise(r => setTimeout(r, m))
  await sleep(3000)
  await page.screenshot({ path: 'example.png' })

  await browser.close();
})();
