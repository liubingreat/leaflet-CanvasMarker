
let version = require('../package.json').version;

const banner = `/*
 * Leaflet.layer.CanvasMarker ` + version + `,
 * 替换Dom Marker 提高性能
 * 开发者: 刘斌（540530096@qq.com）
 */`;

export default {
	input: 'src/index.js',
	output: {
		banner,
		file: 'dist/leaflet.Layer.CanvasMarker.js',
		format: 'umd',
		legacy: true, // Needed to create files loadable by IE8
		name: 'leaflet.Layer.CanvasMarker',
		sourcemap: true,
	}
};
