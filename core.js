'use strict';
(() => {
	let keys = {
		'up': 1,
		'down': 2,
		'left': 4,
		'right': 8,
		'attack': 16
	}, key = 0, macro = {
		'floor_clr': '#3a5275',
		'round_clr': '#1a103a'
	}
	class Obj {
		constructor(x, y, type) {
			this.x = x || 0, this.y = y || 0, this.type = type || '';
		}
	}
	class Camera extends Obj {
		constructor(x, y, dir, index) {
			super(x, y, 'camera');
			//this.x = x || 0, this.y = y || 0,
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
		constructor(x, y) { super(x, y, 'item'); }
	}
	class Bullet extends Obj {
		constructor(x, y, dir) {
			super(x, y, 'bullet');
			this.dir = dir || 0;
		}
		move(map, size) {
			let xx = Math.cos(this.dir * Math.PI / 180) * 2, yy = Math.sin(this.dir * Math.PI / 180) * 2;
			if (map[Math.floor((this.x + xx) / size)][Math.floor((this.y + yy) / size)]) {
				while(!map[Math.floor((this.x + Math.sign(xx)) / size)][Math.floor((this.y + Math.sign(yy)) / size)]) {
					this.x += Math.sign(xx);
					this.y += Math.sign(yy);
				}
				xx = 0;
				yy = 0;
			}
			this.x += xx;
			this.y += yy;
		}
	}
	class Render {
		constructor(id, texture) {
			let canvas_id = document.getElementById(id || 'game');
			this.width = canvas_id.width, this.height = canvas_id.height, this.canvas = canvas_id.getContext('2d'),
			this.size = 32, this.current_time = 0;
			this.canvas.imageSmoothingEnabled = false;
			this.texture = texture || {}, this.load_texture = 0, this.max_texture = Object.keys(this.texture).length;
			Object.keys(this.texture).forEach(e => {
				let value = this.texture[e];
				this.texture[e] = new Image();
				this.texture[e].src = value;
				this.texture[e].onload = () => this.load_texture++;
			});

		}
		loading(draw) {
			if (draw != undefined) draw(this.load_texture, this.max_texture);
			return this.load_texture >= this.max_texture - 1;
		}
		render2D(map, objects, x, y, scale) {
			this.canvas.fillStyle = '#fff';
			this.canvas.fillRect(x, y, map[0].length * this.size * scale, (map.length - 1) * this.size * scale);
			this.canvas.fillStyle = '#000';
			for (let i = 0; i < map.length; i++)
				for (let j = 0; j < map[i].length; j++)
					if (map[i][j] == 1) this.canvas.fillRect(x + i * this.size * scale, y + j * this.size * scale, this.size * scale, this.size * scale);
			this.canvas.fillStyle = '#f00';
			for (let i = 0; i < objects.length; i++) this.canvas.fillRect(x + objects[i].x * scale - 16 * scale, y + objects[i].y * scale - 16 * scale, 32 * scale, 32 * scale);
			this.canvas.fillStyle = '#ff5';
			this.canvas.fillRect(x + camera.x * scale - this.size * scale * .5, y + camera.y * scale - this.size * scale * .5, this.size * scale, this.size * scale);
			this.canvas.beginPath();
			this.canvas.moveTo(x + camera.x * scale, y + camera.y * scale);
			this.canvas.lineTo(x + camera.x * scale + Math.cos(this.radian(camera.dir)) * 400, y + camera.y * scale + Math.sin(this.radian(camera.dir)) * 400);
			this.canvas.stroke();
			this.canvas.closePath();
		}
		radian(value) { return (value * Math.PI / 180); }
		render3D(index, x, y, dir, fov, objects, map, width, height, load, xo, yo, angle) {
			if (this.loading(load)) {
				let stack = [], xoffset = xo || 0, yoffset = yo || 0, column = fov / width, range = width / fov;
				this.canvas.fillStyle = macro.round_clr;
				this.canvas.fillRect(xoffset, yoffset, width, height * .5);
				this.canvas.fillStyle = macro.floor_clr;
				this.canvas.fillRect(xoffset, yoffset + height * .5, width, height * .5);
				for (let d = fov; d > -1; d -= column) {
					for (let dist = 0; dist < width*height; dist++) {
						let n_dir = dir - fov * .5 + d,
							point_x = x + Math.cos(this.radian(n_dir)) * dist, point_y = y + Math.sin(this.radian(n_dir)) * dist,
							val = map[Math.floor(point_x / this.size)][Math.floor(point_y / this.size)];
						if (val) {
							let h = height * (this.size / Math.abs(Math.sqrt((point_x - x)**2 + (point_y - y)**2) * Math.cos(this.radian(n_dir - dir)))), xo = 0, yo = 0,
								offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
							if (offset > this.size - 1) xo = yo = 1;
							offset = Math.sqrt((point_x - Math.floor(point_x / this.size + xo) * this.size) ** 2 + (point_y - Math.floor(point_y / this.size + yo) * this.size) ** 2);
							let texture = this.texture.wall;
							switch(val) {
								case 2: texture = this.texture.door; break;
								case 3: texture = this.texture.wall2; break;
							}
							stack.push([h, [texture, Math.min(offset, texture.width - column), 0, column, texture.height, xoffset + d * range, yoffset + (height - h) * .5 + angle, range, h]]);
							break;
						}
					}
				}
				stack = stack.sort((a, b) => { return a[0] - b[0]; });
				stack.forEach(e => this.canvas.drawImage(e[1][0], e[1][1], e[1][2], e[1][3], e[1][4], e[1][5], e[1][6], e[1][7], e[1][8]));
			}
		}
	}
	let map = [
		[1, 1, 1, 1, 1, 1, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 1, 2, 3, 0, 3, 1],
		[1, 0, 0, 1, 0, 0, 1],
		[2, 0, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1]
	];
	let cams = [new Camera(196, 80, 135, 0)], objects = [],
		render = new Render('game', {
			'item': 'item.png',
			'wall': 'wall.png',
			'door': 'door.png',
			'wall2': 'wall2.png'
		});
	
	let loading = (start, end) => {
		render.canvas.fillStyle = '#f00';
		render.canvas.fillRect(10, 10, (start / end) * render.width, render.height);
	}, control = () => {
		document.onkeydown = e => {
			switch(e.keyCode) {
				case 68: key |= keys.right; break;
				case 65: key |= keys.left; break;
				case 83: key |= keys.up; break;
				case 87: key |= keys.down; break;
				case 32: key |= keys.attack; break;
			}
			e.preventDefault();
		}
		document.onkeyup = e => {
			switch(e.keyCode) {
				case 68: key &=~ keys.right; break;
				case 65: key &=~ keys.left; break;
				case 83: key &=~ keys.up; break;
				case 87: key &=~ keys.down; break;
				case 32: key &=~ keys.attack; break;
			}
			e.preventDefault();
		}
	}, update = () => {
		render.current_time++;
		cams[0].move(map, render.size);
		render.render3D(0, cams[0].x, cams[0].y, cams[0].dir, 60, objects, map, render.width, render.height, loading, 0, 0, Math.sin(cams[0].angle * .2) * 4);
		window.requestAnimationFrame(update);
	}
	control();
	update();
})();