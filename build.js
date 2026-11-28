// node build.js [out.html]  : _head.html + _engine.js + _sfx.js + _ui.js -> neuro-inc.html (do not edit the output by hand)
const fs = require('fs'), path = require('path');
const r = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const out = process.argv[2] || path.join(__dirname, 'neuro-inc.html');
fs.writeFileSync(out, r('_head.html') + '<script id="engine">' + r('_engine.js') + '</script>\n<script id="sfx">' + r('_sfx.js') + '</script>\n<script id="ui">\n' + r('_ui.js') + '</script>\n</body>\n</html>\n');
console.log('built ' + out);
