/* eslint-env browser */
import './canvas-shadow.css'
import './client.css'
import MainLoop from 'mainloop.js'
import makeGif from './makeGif.js'
import {setupAnimationState, replaceElement, hexToRgb, formToJson, storageAvailable} from './utils.js'
import {createState, updateGenerator, drawGenerator} from './animatedGradientFuncs.js'

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

/**
 * Save the contents of `form` to `sessionStorage` in name:value pairs
 * @param {HTMLFormElement} form
 */
const saveFormContents = (form) => {
  const formData = new FormData(form)
  for (let pair of formData.entries()) {
    const [name, value] = pair
    sessionStorage.setItem(name, value)
  }
}

/**
 * Populate the values of inputs in `form` by name from sessionStorage
 * @param {HTMLFormElement} form
 */
const loadFormContents = (form) => {
  const inputNames = Array.from(new FormData(form).keys())
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

// EXECUTION
// Get our DOM elements
const container = document.getElementById('canvas-container')
const form = document.getElementById('form')
const buttonRenderGif = document.getElementById('button-gif-render')
const gifContainer = document.getElementById('gif-container')
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
  if (storageAvailable('sessionStorage')) {
    saveFormContents(event.target)
  }
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
    gifLinkContainer.appendChild(downloadLink)
  }

  // Update GIF rendering message then create the GIF
  requestAnimationFrame(() => {
    gifContainer.style.display = 'block'
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

// Run on page load

// Hide the GIF container at the start
gifContainer.style.display = 'none'

// Load form contents from sessionStorage if available
if (storageAvailable('sessionStorage')) {
  loadFormContents(form)
}

// Start the preview animation
form.querySelector('[type="submit"]').click()
