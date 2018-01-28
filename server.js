/* eslint-env ndoe */

// init project
const process = require('process')
const path = require('path')
const express = require('express')
const app = express()
require('dotenv').config()

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('build'))

// Website endpoint
app.get('/', function (request, response) {
  response.sendFile(path.resolve(__dirname, 'build/client.html'))
})

// Tweet-making endpoint
app.get(`/${process.env.tweetEndpoint}`, (request, response) => {
  const puppeteer = require('puppeteer')
  puppeteer.launch()
    .then(browser => response.send('Puppeteer launched successfully!'))
    .catch(err => {
      const lines = err.message.split('\n')
      response.status(500).send(lines.map(line => `<code>${line}</code>`).join('</br>'))
    })
})

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port)
})
