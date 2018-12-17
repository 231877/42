'use strict';
(() => {
	let keys = {
		'up': 1,
		'down': 2,
		'left': 4,
		'right': 8,
		'attack': 16
	}, key = 0;
	let macro = {
		'floor_clr': '#3a5275',
		'round_clr': '#1a103a',
		'door_clr': '#821020',
		'player_clr': '#ff8849',
		'wall_clr': '#0d0704'
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
		constructor(id) {
			let canvas_id = document.getElementById(id || 'game');
			this.width = canvas_id.width, this.height = canvas_id.height, this.canvas = canvas_id.getContext('2d'),
			this.size = 32, this.current_time = 0;
			this.canvas.imageSmoothingEnabled = false;
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
		render3D(index, dir, map, objects, x, y, fov, width, height, xo, yo, angle) {
			let stack = [], xoffset = xo || 0, yoffset = yo || 0, column = fov / width, range = width / fov;
			this.canvas.fillStyle = macro.round_clr;
			this.canvas.fillRect(xoffset, yoffset, width, height * .5);
			this.canvas.fillStyle = macro.floor_clr;
			this.canvas.fillRect(xoffset, yoffset + height * .5, width, height * .5);
			for (let d = 0; d < fov; d += column) {
				for (let dist = 0; dist < width*height; dist++) {
					let n_dir = dir - fov * .5 + d,
						point_x = x + Math.cos(this.radian(n_dir)) * dist, point_y = y + Math.sin(this.radian(n_dir)) * dist;
					if (map[Math.floor(point_x / this.size)][Math.floor(point_y / this.size)]) {
						let h = height * (this.size / Math.abs(Math.sqrt((point_x - x)**2 + (point_y - y)**2) * Math.cos(this.radian(n_dir - dir)))),
							offset = Math.sqrt((Math.floor(point_x / this.size + (Math.sin(this.radian(n_dir + 90)) < 0)) * this.size - point_x) ** 2 + (Math.floor(point_y / this.size + (Math.cos(this.radian(n_dir + 90)) > 0)) * this.size - point_y) ** 2);
						if (map[Math.floor(point_x / this.size)][Math.floor(point_y / this.size)] == 1) {
							//this.canvas.fillStyle = macro.wall_clr;
							//this.canvas.fillRect(xoffset + d * range, yoffset + height * .5 - h * .5 + angle, range, h);
							this.canvas.drawImage(img_wall, offset, 0, column, img_wall.height, xoffset + d * range, yoffset + (height - h) * .5 + angle, range, h);
						} else {
							this.canvas.drawImage(img_door, offset, 0, column, img_door.height, xoffset + d * range, yoffset + (height - h) * .5 + angle, range, h);
							
						}
						//console.log(this.radian(n_dir));
						//console.log();
						//console.log(Math.cos(this.radian(n_dir + 90)));

						
						//
						for (let n_dist = 10; n_dist < dist; n_dist++) {
							point_x = x + Math.cos(this.radian(n_dir)) * n_dist;
							point_y = y + Math.sin(this.radian(n_dir)) * n_dist;
							for (let i = 0; i < objects.length; i++) {
								if (point_x >= objects[i].x - 4 && point_x <= objects[i].x + 4 && point_y >= objects[i].y - 4 && point_y <= objects[i].y + 4) {
									let find = false;
									for (let k = 0; k < stack.length; k++) {
										if (stack[k][2] == i) {
											stack[k][6] = (xoffset + (d + 1) * column) - stack[k][4];
											stack[k][11] = d - stack[k][6] * .5 / column;
											find = true;
											break;
										}
									}
									if (!find) {
										let size = Math.min(height * (16 / Math.abs(Math.sqrt((objects[i].x - x)**2 + (objects[i].y - y)**2) * Math.cos(this.radian(n_dir - dir)))) * .75, height),
											index = objects[i].index || 0, ndir = objects[i].dir || 0;
										stack.push([objects[i].type, n_dist, i, size, xoffset + d * column, yoffset + height * .5 - size * .25 + angle, 0, index, ndir, objects[i].x, objects[i].y, d]);
									}
									break;
								}
							}
						}
						break;
					}
				}
			}
			stack = stack.sort((a, b) => { return b[1] - a[1]; });
			for (let i = 0; i < stack.length; i++) {
				if (stack[i][0] != 'camera') {
					switch(stack[i][0]) {
						case 'item':
							let part = (stack[i][11] < fov * .5) ? img_item.width - img_item.width / (stack[i][3] / stack[i][6]) : img_item.width / (stack[i][3] / stack[i][6]) - img_item.width;
							this.canvas.drawImage(img_item, part, 0, img_item.width, img_item.height, stack[i][4], stack[i][5], stack[i][6], stack[i][3]);
						break;
						case 'bullet':
							this.canvas.fillStyle = macro.player_clr;
							this.canvas.fillRect(stack[i][4], stack[i][5], stack[i][6], stack[i][3]);
						break;
					}
				} else {
					if (!stack[i][7]) {
						this.canvas.fillStyle = macro.player_clr;
						this.canvas.fillRect(stack[i][4], stack[i][5], stack[i][6], stack[i][3]);
					} else this.render3D(stack[i][7], stack[i][8], map, objects.concat(cams), stack[i][9], stack[i][10], 60, stack[i][6], stack[i][3], stack[i][4], stack[i][5], 0);
				}
			}
		}
	}
	let map = [
		[1, 1, 1, 1, 1, 1, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 1, 2, 1, 0, 1, 1],
		[1, 0, 0, 1, 0, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1]
	];
	let cams = [new Camera(64, 64, 0, 0)],
		objects = [];
	let render = new Render('game');
	let img_item = new Image(), img_wall = new Image(), img_door = new Image();

	img_item.src = './item.png';
	img_wall.src = './wall.png';
	img_door.src = './door.png';

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
	img_door.onload = () => {
		let update = () => {
			render.current_time++;
			cams[0].move(map, render.size);
			render.render3D(0, cams[0].dir, map, objects.concat(cams), cams[0].x, cams[0].y, 60, render.width, render.height, 0, 0, Math.sin(cams[0].angle * .2) * 8);
			//render.render3D(1, cams[1].dir, map, objects.concat(cams), cams[1].x, cams[1].y, 60, render.width * .5, render.height * .5, render.width * .5, 0, 0);
			//render.render3D(2, cams[2].dir, map, objects.concat(cams), cams[2].x, cams[2].y, 60, render.width * .5, render.height * .5, 0, render.height * .5, 0);
			//render.render3D(3, cams[3].dir, map, objects.concat(cams), cams[3].x, cams[3].y, 60, render.width * .5, render.height * .5, render.width * .5, render.height * .5, 0);
			window.requestAnimationFrame(update);
		}
		update();
	}
})();