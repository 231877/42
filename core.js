'use strict';

class Obj {
	constructor(x, y, type) {
		this.x = x || 0, this.y = y || 0, this.type = type || '';
	}
}
class Camera extends Obj {
	constructor(x, y, dir, index) {
		super(x, y, 'camera');
		this.angle = 0;
		this.dir = dir || 0, this.index = index || 0;
	}
	move(map, size) {
		let hspd = Math.sign((key & keys.down) - (key & keys.up));
		if (hspd) {
			let xx = Math.cos(this.dir * Math.PI / 180) * hspd * 2, yy = Math.sin(this.dir * Math.PI / 180) * hspd * 2;
			if (map[Math.floor((this.x + xx) / size)][Math.floor((this.y + yy) / size)]) {
				while(!map[Math.floor((this.x + Math.sign(xx)) / size)][Math.floor((this.y + Math.sign(yy)) / size)]) {
					this.x += Math.sign(xx);
					this.y += Math.sign(yy);
				}
				xx = 0;
				yy = 0;
				this.angle = 0;
			} else this.angle++;
			this.x += xx;
			this.y += yy;
			
		} else this.angle = 0;
		this.dir += Math.sign((key & keys.right) - (key & keys.left)) * 2;
		if (key & keys.attack) {
			objects.push(new Bullet(this.x, this.y, this.dir));
			key &=~ keys.attack;
		}
	}
}
class Item extends Obj {
	constructor(x, y, texture) { 
		super(x, y, 'item'); 
		this.texture = texture;
	}
}
class Core42 {
	constructor(texture) {
		this.maps = [], this.objects = [],
		this.camera = [], this.current_map = 0,
		this.texture = texture || {}, this.load = 0, this.max = Object.keys(this.texture).length;
		let val = '';
		Object.keys(this.texture).forEach(e => {
			val = this.texture[e];
			this.texture[e] = new Image();
			this.texture[e].src = val;
			this.texture[e].onload = () => this.load++;
			this.texture[e].onerror = (e) => console.log('path error!');
		});
		this.keys = {
			'up': 1,
			'down': 2,
			'left': 4,
			'right': 8,
			'attack': 16
		}, this.key = 0;
	}
	add_camera(cam) { this.camera.push(cam); }
	add_object(obj) { this.objects.push(obj); }
	add_map(map, assoc) { 
		Object.keys(assoc).forEach(e => { assoc[e] = this.texture[assoc[e]]; });
		this.maps.push([map, assoc]); 
	}
	get map() { return this.maps[this.current_map]; }
	loading(draw, render) {
		if (draw != undefined) draw(render, this.load, this.max);
		return this.load >= this.max;
	}
	control(assoc) {
		document.onkeydown = e => {
			Object.keys(assoc).forEach(f => { if (e.keyCode == f) this.key |= this.keys[assoc[f]]; });	
			e.preventDefault();
		}
		document.onkeyup = e => {
			Object.keys(assoc).forEach(f => { if (e.keyCode == f) this.key &=~ this.keys[assoc[f]]; });	
			e.preventDefault();
		}
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
	render3D(index, x, y, dir, fov, objects, map, width, height, load, xo, yo, angle) {
		if (load) {
			let xoffset = xo || 0, yoffset = yo || 0, column = fov / width, range = width / fov;
			this.canvas.fillStyle = this.round;
			this.canvas.fillRect(xoffset, yoffset, width, height * .5);
			this.canvas.fillStyle = this.floor;
			this.canvas.fillRect(xoffset, yoffset + height * .5, width, height * .5);
			for (let d = fov; d > -1; d -= column) {
				for (let dist = 0; dist < width*height; dist++) {
					let n_dir = dir - fov * .5 + d,
						point_x = x + Math.cos(this.radian(n_dir)) * dist, point_y = y + Math.sin(this.radian(n_dir)) * dist,
						val = map[0][Math.floor(point_x / this.size)][Math.floor(point_y / this.size)];
					if (val) {
						let h = height * (this.size / Math.abs(Math.sqrt((point_x - x)**2 + (point_y - y)**2) * Math.cos(this.radian(n_dir - dir)))), xo = 0, yo = 0,
							offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
						if (offset > this.size - 1) xo = yo = 1;
						offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
						let texture = map[1][val];
						this.stack.push([h, {
							'texture': texture,
							'left': Math.min(offset, texture.width - column), 'top': 0,
							'width': column, 'height': texture.height,
							'x': xoffset + d * range, 'y': yoffset + (height - h) * .5 + angle,
							'w': range, 'h': h
						}]);
						break;
					}
					for (let i = 0; i < objects.length; i++) { // рисование предметов:
						let point_x = x + Math.cos(this.radian(n_dir)) * dist, point_y = y + Math.sin(this.radian(n_dir)) * dist;
						if (Math.floor(point_x / (this.size * .5)) == Math.floor(objects[i].x / (this.size * .5)) && Math.floor(point_y / (this.size * .5)) == Math.floor(objects[i].y / (this.size * .5))) {
							let h = height * ((this.size * .5) / Math.abs(Math.sqrt((Math.floor(objects[i].x / (this.size * .5)) * (this.size * .5) - x)**2 + (Math.floor(objects[i].y / (this.size * .5)) * (this.size * .5) - y)**2) * Math.cos(this.radian(n_dir - dir)))),
								xo = 0, yo = 0, offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
							if (offset > objects[i].texture.width - 1) xo = yo = 1;
							offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
							this.stack.push([h * 2, {
								'texture': objects[i].texture,
								'left': point_x - objects[i].x + (n_dir - dir),
								'top': 0,
								'width': column, 'height': objects[i].texture.height,
								'x': xoffset + d * range, 'y': yoffset + (height - h) * .5 + angle,
								'w': range, 'h': h * 2
							}]);
							//console.log(point_x - objects[i].x + (fov - d), point_y - objects[i].y);
							//fff
							break;
						}
					}
				}
			}
			this.stack.sort((a, b) => { return a[0] - b[0]; }).forEach(e => this.canvas.drawImage(e[1]['texture'], e[1]['left'], e[1]['top'], e[1]['width'], e[1]['height'], e[1]['x'], e[1]['y'], e[1]['w'], e[1]['h']));
			this.stack = [];
		}
	}
}