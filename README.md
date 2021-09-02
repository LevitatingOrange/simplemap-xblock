# SimpleMap XBlock
A XBlock (for the openedx eLearning platform) to show a map with configurable markers.
This is also a cursory expirement to develop and xblock based on react without the default html 
templating. I hope to extract all the necessary glue code for react into a library or project 
template, to ease the development of new, modern, engaging, interactive and easy-to-develop XBlocks.

## Folder structure
- `simplemap/`: Traditional XBlock code
- `simplemap/public/index.html`: Glue html file for react
- `simplemap/public/dist`: Compiled assets (minified js, css, etc...)
- `src/`: React files

## TODO
- [ ] Custom Marker Icon
- [ ] min browser version, pass to esbuild
- [ ] include source map for easier debugging
- [ ] Poetry seems buggy and does not want to include package_data that is also in gitignore even though it should when specified via include. This means build output gets commited to git...
- [ ] Better tile layer? Mabox streets is nice and free for small scale

