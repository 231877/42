'use strict';

class Obj {
	constructor(x, y, texture) {
		this.x = x || 0, this.y = y || 0;
		this.texture = texture;
	}
}
class Camera extends Obj {
	constructor(x, y, dir, index) {
		super(x, y);
		this.dir = dir || 0, this.index = index || 0, this.angle = 0;
	}
}
class Core42 {
	constructor(texture, keys) {
		this.maps = [], this.objects = [],
		this.camera = [], this.current_map = 0, this.key = 0,
		this.load = 0, this.texture = {}, this.max = (texture || []).length, this.keys = {};
		(texture || []).forEach(e => {
			let key = e.split('/').map(f => f.replace('.png', '')).join('.')
			this.texture[key] = new Image();
			this.texture[key].src = e;
			this.texture[key].onload = () => this.load++;
			this.texture[key].onerror = () => console.error('path error: ' + e + '!');
		});
		Object.keys(keys).forEach((e, i) => this.keys[keys[e]] = 1 * (i == 0) + (2 ** i) * !(i == 0));
		window.onkeydown = f => {
			Object.keys(keys).forEach(e => { if (f.keyCode == e) this.key |= this.keys[keys[e]]; });
			f.preventDefault();
		}
		window.onkeyup = f => {
			Object.keys(keys).forEach(e => { if (f.keyCode == e) this.key &=~ this.keys[keys[e]]; });
			f.preventDefault();
		}
	}
	add_object(arg) {
		if (arguments.length > 1) {
			for (let i = 0; i < arguments.length; i++)
				arguments[i] instanceof Camera ? this.camera.push(arguments[i]) : this.objects.push(arguments[i]);
		} else arg instanceof Camera ? this.camera.push(arg) : this.objects.push(arg);
	}
	add_map(map, assoc) { 
		Object.keys(assoc).forEach(e => { assoc[e] = this.texture[assoc[e]]; });
		this.maps.push([map, assoc]);
	}
	get map() { return this.maps[this.current_map]; }
	loading(draw, render) {
		if (draw != undefined) draw(render, this.load, this.max);
		return this.load >= this.max;
	}
}
class Render {
	constructor(id, floor, round) {
		let canvas_id = document.getElementById(id || 'game');
		this.width = canvas_id.width, this.height = canvas_id.height, this.canvas = canvas_id.getContext('2d'),
		this.size = 32, this.current_time = 0;
		this.canvas.imageSmoothingEnabled = false;
		this.stack = [], this.floor = floor || '#3a5275', this.round = round || '#1a103a';
	}
	radian(value) { return (value * Math.PI / 180); }
	distance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }
	render3D(index, x, y, dir, fov, objects, map, width, height, load, xo, yo, angle) {
		if (load) {
			let xoffset = xo || 0, yoffset = yo || 0, column = fov / width, range = width / fov;
			this.canvas.fillStyle = this.round;
			this.canvas.fillRect(xoffset, yoffset, width, height * .5);
			this.canvas.fillStyle = this.floor;
			this.canvas.fillRect(xoffset, yoffset + height * .5, width, height * .5);
			for (let d = fov; d > -1; d -= column) {
				for (let dist = 0; dist < (width * height) / 2; dist++) {
					let n_dir = dir - fov * .5 + d,
						point_x = x + Math.cos(this.radian(n_dir)) * dist, point_y = y + Math.sin(this.radian(n_dir)) * dist,
						val = map[0][Math.floor(point_x / this.size)][Math.floor(point_y / this.size)];
					if (val) {
						let h = height * (this.size / Math.abs(Math.sqrt((point_x - x)**2 + (point_y - y)**2) * Math.cos(this.radian(n_dir - dir)))), xo = 0, yo = 0,
							offset = this.distance(point_x, point_y, Math.floor(point_x / this.size + xo) * this.size, Math.floor(point_y / this.size + yo) * this.size);
						if (offset > this.size - 1) {
							xo = yo = 1;
							offset = this.distance(point_x, point_y, Math.floor(point_x / this.size + xo) * this.size, Math.floor(point_y / this.size + yo) * this.size);
						}
						this.stack.push([h, {
							'texture': map[1][val],
							'left': offset % (map[1][val].width - column), 'top': 0,
							'width': column, 'height': map[1][val].height,
							'x': xoffset + d * range, 'y': yoffset + (height - h) * .5 + angle,
							'w': range, 'h': h
						}]);
						break;
					} else {
						for (let i = 0, e; i < objects.length; i++) { // рисование предметов:
							e = objects[i];
							if (Math.floor(point_x) == e.x && Math.floor(point_y) == e.y) {
								let h =  height * (this.size / Math.abs(this.distance(point_x, point_y, x, y) * Math.cos(this.radian(n_dir - dir))));
								this.stack.push([h, {
									'texture': e.texture,
									'left': 0, 'top': 0,
									'width': e.texture.width, 'height': e.texture.height,
									'x': xoffset + d * range - h / 2, 'y': yoffset + height * .5 - h * .25 + angle,
									'w': h, 'h': h
								}]);
								break;
							}
						}
					}
				}
			}
			this.stack.sort((a, b) => { return a[0] - b[0]; }).forEach(e => this.canvas.drawImage(e[1]['texture'], e[1]['left'], e[1]['top'], e[1]['width'], e[1]['height'], e[1]['x'], e[1]['y'], e[1]['w'], e[1]['h']));
			this.stack = [];
		}
	}
}