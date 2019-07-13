# animated-pixel-gradients
Make pixelated gradient GIFs with words on them!

![Screenshot of app running](https://cdn.jsdelivr.net/gh/noelleleigh/animated-pixel-gradients@a7fd6c682339fd2b40cb2bdf84cd213be839d370/readme_assets/screenshot.png)

**Example GIF**

![Sample GIF with a purple and green gradient with the word "GRADIENT" in the middle](https://cdn.jsdelivr.net/gh/noelleleigh/animated-pixel-gradients@09eacf757a63d49f7572ce94d6e049be307d6287/readme_assets/sample_gif.gif)

[Live version on Glitch 🎏](https://animated-pixel-gradients.glitch.me/)

[Fork on GitHub](https://github.com/noelleleigh/animated-pixel-gradients)

## Install from GitHub
```
git clone https://github.com/noelleleigh/animated-pixel-gradients.git
cd animated-pixel-gradients
npm install
```
## Run locally
```
npm start
```
Open `http://localhost:PORT/` in your browser with the port that it provided (e.g. `http://localhost:8080/`)

## Libraries used
- [MainLoop.js](https://github.com/IceCreamYou/MainLoop.js) - Runs the update-draw loop for the animation preview
- [gif.js](https://github.com/jnordberg/gif.js) - Renders the GIF file
- [opentype.js](https://github.com/nodebox/opentype.js) - Draws the text on the canvas
- [spectrum](https://github.com/bgrins/spectrum) - Color picker for platforms that don't support `<input type="color">`

## To Do
- Develop Twitter bot feature
- Better support for pixel sizes that aren't factors of the canvas resolution
