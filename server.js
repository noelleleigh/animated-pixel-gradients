/* eslint-env node */

// init project
const process = require('process')
const path = require('path')
const express = require('express')
const app = express()
require('dotenv').config()

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
  const port = listener.address().port
  const domain = 'localhost'
  const host = `${domain}:${port}`
  const devMessage = `Your app is live at http://${host}`
  const prodMessage = `Your app is listening on port ${port}`
  console.log(
    process.env.NODE_ENV === 'development'
      ? devMessage
      : prodMessage
  )
})
