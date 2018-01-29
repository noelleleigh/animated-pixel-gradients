/* eslint-env browser */
import './canvas-shadow.css'
import './client.css'
import MainLoop from 'mainloop.js'
import makeGif from './makeGif'
import {setupAnimationState, replaceElement, hexToRgb, formToJson} from './utils'
import {createState, updateGenerator, drawGenerator} from './animatedGradientFuncs'

/**
 * Take the contents of an HTMLFormElement and return a object suitable for use as options for
 * `createState`.
 *
 * Expects form children with at least the following names:
 *   - `canvasWidth`
 *   - `canvasHeight`
 *   - `scalingFactor`
 *   - `gradientColor1`
 *   - `gradientColor2`
 *   - `gradientDirection`
 *   - `canvasText`
 * @param {HTMLFormElement} form
 */
const transformFormToStateOptions = (form) => {
  const formResults = formToJson(form)
  return {
    width: formResults.canvasWidth,
    height: formResults.canvasHeight,
    scalingFactor: formResults.scalingFactor,
    colors: [formResults.gradientColor1, formResults.gradientColor2].map(hexToRgb),
    gradientDirection: formResults.gradientDirection,
    text: formResults.canvasText
  }
}

/**
 * Convenience function to take the contents of an HTMLFormElement and use them to configure
 * a canvas animation that is appended as a child of `containerElement` and started.
 * @param {HTMLFormElement} form - Source of the configuration data for the animation
 * @param {HTMLElement} containerElement - Container element for the canvas
 */
const createPreviewAnimation = (form, containerElement) => {
  const stateOptions = transformFormToStateOptions(form)
  const {
    initState,
    updateFunc,
    drawFunc
  } = setupAnimationState(createState, updateGenerator, drawGenerator, stateOptions)
  replaceElement(containerElement, containerElement.children[0], initState.canvasFinal)

  MainLoop.setUpdate(updateFunc).setDraw(drawFunc).start()
}

// EXECUTION
// Get our DOM elements
const container = document.getElementById('canvas-container')
const form = document.getElementById('form')
const buttonRenderGif = document.getElementById('button-gif-render')
const labelGifRender = document.getElementById('gif-render-progress')
const gifLinkContainer = document.getElementById('gif-link-container')

// Setup event listeners

// Allow tapping on inputs to focus them
Array.from(document.querySelectorAll('form input[type="number"], form input[type="text"], form input[type="color"]'))
  .forEach((element) => {
    element.addEventListener('touchend', (event) => {
      event.target.focus()
      event.target.select()
    })
  })

// Create preview animation
form.addEventListener('submit', (event) => {
  event.preventDefault()
  createPreviewAnimation(event.target, container)
})

// Render GIF file and add a download link
buttonRenderGif.addEventListener('click', (event) => {
  event.preventDefault()
  const stateOptions = transformFormToStateOptions(form)
  const {
    initState,
    updateFunc,
    drawFunc
  } = setupAnimationState(createState, updateGenerator, drawGenerator, stateOptions)

  // Display the percentage progress
  const progressHandler = (progress) => {
    labelGifRender.textContent = `Combining frames: ${Math.floor(progress * 100)}%`
  }

  // Create a download link to the GIF
  const finishedHandler = (blob) => {
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    // Make filename safe
    const filename = document.getElementById('input-canvas-text').value.replace(/[\\/:*?<>| ]/g, '')
    downloadLink.download = filename
    const sizeMB = Number.parseFloat(blob.size / 1024 / 1024)
    downloadLink.textContent = `Click to download GIF (${sizeMB.toPrecision(3)} MB)`
    replaceElement(gifLinkContainer, gifLinkContainer.children[0], downloadLink)
  }

  // Update GIF rendering message then create the GIF
  requestAnimationFrame(() => {
    gifLinkContainer.innerHTML = ''
    labelGifRender.textContent = 'Gathering frames...'
    requestAnimationFrame(() => {
      makeGif(
        initState, updateFunc, drawFunc, 1000 / 60,
        progressHandler,
        finishedHandler
      )
    })
  })
})

// Pause the preview animation when clicked
container.addEventListener('click', (event) => {
  MainLoop.isRunning() ? MainLoop.stop() : MainLoop.start()
})

// Start the preview animation
form.querySelector('[type="submit"]').click()
