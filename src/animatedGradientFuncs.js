/* eslint-env browser */
import {DIRECTION} from './constants'
import {create2dContext, rgbToHex, getNextIndex} from './utils'
import {drawNoisyGradient, scaleImageData, fillImageData} from './drawFuncs'

/**
 * Return an object with the following properties:
 *
 *   - `canvasBackground`: HTMLCanvasElement for the background rendering
 *
 *   - `ctxBackground`: CanvasRenderingContext2D for `canvasBackground`
 *
 *   - `canvasForeground`: HTMLCanvasElement for the foreground rendering
 *
 *   - `ctxForeground`: CanvasRenderingContext2D for `canvasForeground`
 *
 *   - `canvasFinal`: HTMLCanvasElement for the final compositing
 *
 *   - `ctxFinal`: CanvasRenderingContext2D for `canvasFinal`
 *
 *   - `scalingFactor`: The magnitude by which the scaledImageData should be shrunk
 *
 *   - `fullSizeImageData`: ImageData(width, height)
 *
 *   - `scaledImageData`: ImageData(width / scalingFactor, height / scalingFactor), filled with second color
 *
 *   - `progress`: 0.0
 *
 *   - `gradientColors`: Array of Number[3], one for each RGB color the gradient should take
 *
 *   - `gradientColorIndex`: 0
 *
 *   - `gradientDirection`: DIRECTION[gradientDirection]
 *
 *   - `gradientWidth`: 0.5
 *
 *   - `text`: text

 * @param {Object} Options to populate the state
 */
const createState = ({width, height, scalingFactor, colors, gradientDirection, text, font, fontSize}) => {
  const {canvas: canvasBackground, ctx: ctxBackground} = create2dContext(width, height)
  const {canvas: canvasForeground, ctx: ctxForeground} = create2dContext(width, height)
  const {canvas: canvasFinal, ctx: ctxFinal} = create2dContext(width, height)
  const scaledImageData = new ImageData(width / scalingFactor, height / scalingFactor)
  // Fill imageData with second color if available
  // fillImageData(scaledImageData, colors[colors.length > 1 ? 1 : 0])
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
 * to reach 1.0, then loop back to 0.0 if it passes 1.0.
 *   - Update `stateTarget.gradientColorIndex` to regularly move through the colors, completing a
 * full cycle by the time `stateTarget.progress` reaches 1.0.
 * @param {Object} state object that will be modified by update()
 */
const updateGenerator = (stateTarget) => {
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
 * Draws text in center of `ctx` in 32px Visitor font with `color`
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} text
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
 * @param {Object} state
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
 * `state.scaledImageData`, and composite some text on top.
 * @param {Object} state
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
 * Return a function that takes no arguments and draws a pixelated gradient with some text on top.
 * @param {Object} state that will be used to determine what is drawn and where.
 */
const drawGenerator = (stateTarget) => {
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
  updateGenerator,
  drawGenerator
}
