/* eslint-env browser */
/** @module client */
import './canvas-shadow.css'
import './client.css'
import visitorFont from './assets/visitor1.ttf'
import * as opentype from 'opentype.js'
import MainLoop from 'mainloop.js'
import makeGif from './makeGif.js'
import {
  setupAnimationState, replaceElement,
  hexToRgb, formToJson, storageAvailable } from './utils.js'
import { createState, updateFactory, drawFactory } from './animatedGradientFuncs.js'

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
 * @param {HTMLFormElement} form - Form from which to get the data
 * @returns {Object} Options object for passing into `createState`
 */
const transformFormToStateOptions = (form) => {
  const formResults = formToJson(form)
  return {
    width: formResults.canvasWidth,
    height: formResults.canvasHeight,
    scalingFactor: formResults.scalingFactor,
    colors: [formResults.gradientColor1, formResults.gradientColor2].map(hexToRgb),
    gradientDirection: formResults.gradientDirection,
    text: formResults.canvasText,
    fontSize: formResults.canvasFontSize
  }
}

/**
 * Convenience function to take the contents `form` and use them to configure
 * a canvas animation that is appended as a child of `containerElement` (replacing the existing
 * child) and started.
 * @param {HTMLFormElement} form - Source of the configuration data for the animation
 * @param {opentype.Font} font - Font that will be used for the animation
 * @param {HTMLElement} containerElement - Container element for the canvas
 */
const createPreviewAnimation = (form, font, containerElement) => {
  const stateOptions = transformFormToStateOptions(form)
  stateOptions.font = font
  const { initState, updateFunc, drawFunc } = setupAnimationState(
    createState, updateFactory, drawFactory, stateOptions
  )
  replaceElement(containerElement, containerElement.children[0], initState.canvasFinal)

  MainLoop.setUpdate(updateFunc).setDraw(drawFunc).start()
}

/**
 * Convenience function to take the contents of `form` and use them to configure
 * some animation functions that are used to generate an animated GIF.
 * @param {HTMLFormElement} form - Source of the configuration data for the animation
 * @param {opentype.Font} font - Font that will be used for the animation
 * @param {Node} progressElement - DOM node to hold the progress report as the GIF is created
 * @param {Element} linkContainer - Document element to hold the link to the completed GIF
 */
const renderGifHandler = (form, font, progressElement, linkContainer) => {
  const stateOptions = transformFormToStateOptions(form)
  stateOptions.font = font
  const { initState, updateFunc, drawFunc } = setupAnimationState(
    createState, updateFactory, drawFactory, stateOptions
  )

  // Display the percentage progress
  const progressHandler = (progress) => {
    progressElement.textContent = `Combining frames: ${Math.floor(progress * 100)}%`
  }

  // Create a download link to the GIF
  const finishedHandler = (blob) => {
    const downloadLink = document.createElement('a')
    downloadLink.href = URL.createObjectURL(blob)
    // Make filename safe
    const filename = document.getElementById('input-canvas-text').value.replace(/[\\/:*?<>|. ]/g, '')
    downloadLink.download = filename
    const sizeMB = Number.parseFloat(blob.size / 1024 / 1024)
    downloadLink.textContent = `Click to download GIF (${sizeMB.toPrecision(3)} MB)`
    linkContainer.appendChild(downloadLink)
  }

  // Update GIF rendering message then create the GIF
  requestAnimationFrame(() => {
    linkContainer.innerHTML = ''
    // linkContainer.style.display = 'block'
    progressElement.textContent = 'Gathering frames...'
    requestAnimationFrame(() => {
      makeGif(
        initState, updateFunc, drawFunc, 1000 / 60,
        progressHandler,
        finishedHandler
      )
    })
  })
}

/**
 * Save the contents of `form` to `sessionStorage` in `name: value` pairs.
 * @param {HTMLFormElement} form - Form whose values you wish to store in `sessionStorage`
 */
const saveFormContents = (form) => {
  const formData = formToJson(form)
  for (const pair of Object.entries(formData)) {
    const [name, value] = pair
    sessionStorage.setItem(name, value)
  }
}

/**
 * Populate the values of inputs in `form` by name from `sessionStorage`.
 * @param {HTMLFormElement} form - Form whose values you wish to retrieve from `sessionStorage`
 */
const loadFormContents = (form) => {
  const inputNames = Array.from(Object.keys(formToJson(form)))
  inputNames.forEach((name) => {
    const value = sessionStorage.getItem(name)
    if (value) {
      const element = form.querySelector(`[name="${name}"]`)
      if (element.type === 'radio') {
        form.querySelector(`[name="${name}"][value="${value}"]`).checked = true
      } else {
        element.value = value
      }
    }
  })
}

/**
 * Set up the event listeners, load the settings, and start the first animation
 */
const init = () => {
  // EXECUTION
  // Get our DOM elements
  const container = document.getElementById('canvas-container')
  const form = document.getElementById('form')
  const buttonRenderGif = document.getElementById('button-gif-render')
  const gifContainer = document.getElementById('gif-container')
  const labelGifRender = document.getElementById('gif-render-progress')
  const gifLinkContainer = document.getElementById('gif-link-container')

  // Setup event listeners

  // Allow tapping on inputs to focus them on mobile
  Array.from(document.querySelectorAll('form input[type="number"], form input[type="text"], form input[type="color"]'))
    .forEach((element) => {
      element.addEventListener('touchend', (event) => {
        event.target.focus()
        event.target.select()
      })
    })

  // When the form is submitted, create preview animation
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    if (storageAvailable('sessionStorage')) {
      saveFormContents(event.target)
    }
    opentype.load(visitorFont, (err, font) => {
      if (err) {
        console.error(`Font "${visitorFont}" unable to be loaded: ${err}`)
      } else {
        createPreviewAnimation(event.target, font, container)
      }
    })
  })

  // When the "Render as GIF" button is clicked, render GIF file and add a download link
  buttonRenderGif.addEventListener('click', (event) => {
    event.preventDefault()
    opentype.load(visitorFont, (err, font) => {
      if (err) {
        console.error(`Font "${visitorFont}" unable to be loaded: ${err}`)
      } else {
        gifContainer.style.display = 'block'
        renderGifHandler(form, font, labelGifRender, gifLinkContainer)
      }
    })
  })

  // Pause the preview animation when clicked
  container.addEventListener('click', (event) => {
    MainLoop.isRunning() ? MainLoop.stop() : MainLoop.start()
  })

  // Run on page load

  // Load form contents from sessionStorage if available
  if (storageAvailable('sessionStorage')) {
    loadFormContents(form)
  }

  // Start the preview animation
  form.querySelector('[type="submit"]').click()
}

init()
