/* eslint-env browser */
/** @module animatedGradientFuncs */
import { DIRECTION } from './constants'
import { create2dContext, rgbToHex, getNextIndex } from './utils'
import { drawNoisyGradient, scaleImageData, fillImageData } from './drawFuncs'

/**
 * @typedef {Object} State
 * @property {HTMLCanvasElement} canvasBackground - `<canvas>` element to hold the background
 * @property {CanvasRenderingContext2D} ctxBackground - Context for `canvasBackground`
 * @property {HTMLCanvasElement} canvasForeground - `<canvas>` element to hold the foreground
 * @property {CanvasRenderingContext2D} ctxForeground - Context for `canvasForeground`
 * @property {HTMLCanvasElement} canvasFinal - `<canvas>` element to hold the composited frame
 * @property {CanvasRenderingContext2D} ctxFinal - Context for `canvasFinal`
 * @property {number} scalingFactor - Integer factor by which the gradient should be scaled to
 * @property {ImageData} fullSizeImageData - `ImageData` object that is equal to the size of `canvasFinal`
 * @property {ImageData} scaledImageData - `ImageData` object that has the dimensions of `fullSizeImageData` divided by `scalingFactor`
 * @property {number} progress - A floating point number between 0.0 and 1.0 indicating the current progress of a single loop of the animation
 * @property {Array.<Number[]>} gradientColors - Array of 3-arrays of integers that represent RGB triples that will be used for the gradient.
 * @property {number} gradientColorIndex - Current index in `gradientColors`
 * @property {number} gradientDirection - Property of DIRECTION indicating which direction the gradient should move
 * @property {number} gradientWidth - Floating point number defining the proportion of the frame the gradient's transition should take up (e.g. `0.5`: 50% of the frame)
 * @property {string} text - The text that should be drawn on the animation
 * @property {opentype.Font} font - The font the text should be drawn in
 * @property {number} fontSize - The size in pixels of the font
 */

/**
 * Return a State object.
 * @param {Object} options - Object to populate the state
 * @param {Number} options.width - The desired width of the canvas
 * @param {Number} options.height - The desired height of the canvas
 * @param {Number} options.scalingFactor - Value for `State.scalingFactor`
 * @param {Array.<Number[]>} options.colors - Value for `State.gradientColors`
 * @param {Number} options.gradientDirection - Value for `State.gradientDirection`
 * @param {string} options.text - Value for `State.text`
 * @param {opentype.Font} options.font - Value for `State.font`
 * @param {Number} options.fontSize - Value for `State.fontSize`
 * @returns {State} A state object
 */
const createState = ({ width, height, scalingFactor, colors, gradientDirection, text, font, fontSize }) => {
  const { canvas: canvasBackground, ctx: ctxBackground } = create2dContext(width, height)
  const { canvas: canvasForeground, ctx: ctxForeground } = create2dContext(width, height)
  const { canvas: canvasFinal, ctx: ctxFinal } = create2dContext(width, height)
  const scaledImageData = new ImageData(width / scalingFactor, height / scalingFactor)
  return {
    canvasBackground: canvasBackground,
    ctxBackground: ctxBackground,
    canvasForeground: canvasForeground,
    ctxForeground: ctxForeground,
    canvasFinal: canvasFinal,
    ctxFinal: ctxFinal,
    scalingFactor: scalingFactor,
    fullSizeImageData: new ImageData(width, height),
    scaledImageData: scaledImageData,
    progress: 0.0,
    gradientColors: colors,
    gradientColorIndex: 0,
    colorChanged: false,
    gradientDirection: DIRECTION[gradientDirection],
    gradientWidth: 0.5,
    text: text,
    font: font,
    fontSize: fontSize
  }
}

/**
 * Return a function that takes a single float argument `delta` and modifies `stateTarget`
 * in a number of ways:
 *   - Increment `stateTarget.progress` such that it takes `stateTarget.gradientColors.length * 2000 ms`
 * to reach `1.0`, then loop back to `0.0` if it passes `1.0`.
 *   - Update `stateTarget.gradientColorIndex` to regularly move through the colors, completing a
 * full cycle by the time `stateTarget.progress` reaches 1.0.
 *   - If `stateTarget.gradientColorIndex` changed, set `stateTarget.colorChanged` to `true`.
 * @param {Object} stateTarget object that will be modified by update()
 * @returns {Function} An update function
 */
const updateFactory = (stateTarget) => {
  const update = (delta) => {
    // Update progress variable
    const newProgress = stateTarget.progress + (delta / (stateTarget.gradientColors.length * 2000))
    if (newProgress > 1.0) {
      stateTarget.progress = 0.0
    } else {
      stateTarget.progress = newProgress
    }
    // Update color index
    const newColorIndex = Math.floor(stateTarget.progress * stateTarget.gradientColors.length)
    if (newColorIndex !== stateTarget.gradientColorIndex) {
      stateTarget.gradientColorIndex = newColorIndex
      // Put up a flag that draw() will put down
      stateTarget.colorChanged = true
    }
  }

  return update
}

/**
 * Draw text in the middle of a CanvasRenderingContext2D
 * @param {CanvasRenderingContext2D} ctx - Canvas the text will be drawn onto
 * @param {String} text - The text that will be drawn
 * @param {Font} font - opentype.js `Font` instance
 * @param {Number} fontSize - The size of the font in pixels
 * @param {String} color - Color in hex format
 */
const drawText = (ctx, text, font, fontSize, color) => {
  const textWidth = font.getAdvanceWidth(text, fontSize)
  const textHeight = fontSize / 2
  const startX = Math.round((ctx.canvas.width - textWidth) / 2)
  const startY = Math.round((ctx.canvas.height - textHeight) / 2) + textHeight
  const path = font.getPath(text, startX, startY, fontSize)
  path.fill = color
  path.draw(ctx)
}

/**
 * Fill `state.ctxBackground` with a solid rectagle in the next color, with text from `state.text`
 * drawn in the middle in the current color.
 * @param {State} state - State from which to get the drawing context
 */
const drawBackground = (state) => {
  state.ctxBackground.save()

  // Get colors
  const backgroundColor = state.gradientColors[getNextIndex(state.gradientColorIndex, state.gradientColors)]
  const backgroundTextColor = state.gradientColors[state.gradientColorIndex]

  state.ctxBackground.fillStyle = rgbToHex(...backgroundColor)
  state.ctxBackground.fillRect(0, 0, state.canvasBackground.width, state.canvasBackground.height)
  drawText(state.ctxBackground, state.text, state.font, state.fontSize, rgbToHex(...backgroundTextColor))

  state.ctxBackground.restore()
}

/**
 * Draw a pixelated gradient in the current color onto `state.scaledImageData`, scale it up into
 * `state.fullSizeImageData`, paste it onto `state.ctxForeground`, and composite some text on top.
 * @param {State} state - State from which to get the drawing context
 */
const drawForeground = (state) => {
  state.ctxForeground.save()

  // Draw the gradient
  const progressXColors = state.progress * state.gradientColors.length
  const colorProgress = progressXColors - Math.floor(progressXColors)
  drawNoisyGradient(
    state.scaledImageData,
    state.gradientColors[state.gradientColorIndex],
    state.gradientWidth,
    (colorProgress * (1 + state.gradientWidth)) - state.gradientWidth,
    state.gradientDirection
  )

  // Scale up ImageData if necessary
  if (state.scalingFactor === 1) {
    state.ctxForeground.putImageData(state.scaledImageData, 0, 0)
  } else {
    scaleImageData(
      state.scaledImageData,
      state.fullSizeImageData,
      state.scalingFactor
    )
    state.ctxForeground.putImageData(state.fullSizeImageData, 0, 0)
  }

  // Set composition settings
  // For technique: https://stackoverflow.com/a/18387192/9165387
  state.ctxForeground.globalCompositeOperation = 'source-atop'

  // Draw text
  // Get next color for text
  const foregroundTextColor = state.gradientColors[getNextIndex(state.gradientColorIndex, state.gradientColors)]
  drawText(state.ctxForeground, state.text, state.font, state.fontSize, rgbToHex(...foregroundTextColor))

  state.ctxForeground.restore()
}

/**
 * Return a function that takes no arguments and uses `drawBackground` and `drawForeground` to draw
 * a pixelated gradient with a caption in the middle using information from `stateTarget`.
 * @param {State} stateTarget - State from which to get the drawing contexts and configuration
 * @returns {Function} A draw function
 */
const drawFactory = (stateTarget) => {
  const draw = () => {
    // Blank out stateTarget.scaledImageData if the active color changed since the last frame
    if (stateTarget.colorChanged) {
      fillImageData(stateTarget.scaledImageData, [0, 0, 0, 0])
      stateTarget.colorChanged = false
    }
    drawBackground(stateTarget)
    drawForeground(stateTarget)

    stateTarget.ctxFinal.drawImage(stateTarget.canvasBackground, 0, 0)
    stateTarget.ctxFinal.drawImage(stateTarget.canvasForeground, 0, 0)
  }

  return draw
}

export {
  createState,
  updateFactory,
  drawFactory
}
