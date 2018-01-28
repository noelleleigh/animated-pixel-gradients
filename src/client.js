/* eslint-env browser */
import './canvas-shadow.css'
import './client.css'
import MainLoop from '../node_modules/mainloop.js/build/mainloop.min.js'
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
  replaceElement(containerElement, containerElement.children[0], initState.canvas)

  MainLoop.setUpdate(updateFunc).setDraw(drawFunc).start()
}

// EXECUTION
// Get our DOM elements
const container = document.getElementById('canvas-container')
const form = document.getElementById('form')
const formGif = document.getElementById('form-gif-render')
const labelGifRender = document.getElementById('gif-render-progress')
const gifLinkContainer = document.getElementById('gif-link-container')

// Setup event listeners
// Disable double-tap-to-zoom on the buttons
Array.from(document.querySelectorAll('#form input')).forEach((element) => {
  element.addEventListener('touchend', (event) => {
    event.preventDefault()
    event.target.click()
  })
})

// Create preview animation
form.addEventListener('submit', (event) => {
  event.preventDefault()
  createPreviewAnimation(event.target, container)
})

// Render GIF file and add a download link
formGif.addEventListener('submit', (event) => {
  event.preventDefault()
  const stateOptions = transformFormToStateOptions(form)
  const {
    initState,
    updateFunc,
    drawFunc
  } = setupAnimationState(createState, updateGenerator, drawGenerator, stateOptions)

  // Display the percentage progress
  const progressHandler = (progress) => {
    labelGifRender.textContent = `${Math.floor(progress * 100)}%`
  }
  // Create a download link to the GIF
  const finishedHandler = (blob) => {
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    downloadLink.download = 'gradient'
    const sizeMB = Number.parseFloat(blob.size / 1024 / 1024)
    downloadLink.textContent = `Click to download GIF (${sizeMB.toPrecision(3)} MB)`
    replaceElement(gifLinkContainer, gifLinkContainer.children[0], downloadLink)
  }

  makeGif(
    initState, updateFunc, drawFunc, 1000 / 60,
    progressHandler,
    finishedHandler
  )
})

// Start the preview animation
form.querySelector('[type="submit"]').click()
