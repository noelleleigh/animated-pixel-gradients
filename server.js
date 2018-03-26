/* eslint-env node */

// init project
const process = require('process')
const path = require('path')
const express = require('express')
const helmet = require('helmet')
const app = express()
require('dotenv').config()

app.use(helmet())
app.use(express.static('build'))

// Website endpoint
app.get('/', (request, response) => {
  response.sendFile(path.resolve(__dirname, 'build/client.html'))
})

// Tweet-making endpoint
app.get(`/${process.env.tweetEndpoint}`, (request, response) => {
  response.status(501).send('Twitter bot in development.')
})

// listen for requests
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
