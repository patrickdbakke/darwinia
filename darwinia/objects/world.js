var cw_carScores=new Array();
var environment=function(){
	var env={
		timeStep: 1.0 / 60.0,
		doDraw: true,
		cw_paused: false,
		box2dfps: 60,
		screenfps: 60,
		camera:{
			target: -1,// which car should we follow? -1 = leader
			x: 0,
			y: 0,
			zoom:70,
			speed:0.05
		},
		doSleep: true,
		
		graphheight: 200,
		graphwidth: 400,
		minimapscale: 3,
		minimapfogdistance:0,
		fogdistance:0,
		generationSize: 20,
		
		maxFloorTiles: 200,
		last_drawn_tile: 0,
		gen_champions: 1,
		gen_parentality: 0.2,
		gen_mutation: 0.05,
		gen_counter: 0,
		nAttributes: 14,

		groundPieceWidth: 1.5,
		groundPieceHeight: 0.15,
		chassisMaxAxis: 1.1,
		chassisMinAxis: 0.1,

		wheelMaxRadius: 0.5,
		wheelMinRadius: 0.2,
		wheelMaxDensity: 100,
		wheelMinDensity: 40,
		// wheelDensityRange:140,
		velocityIndex: 0,
		deathSpeed: 0.1,
		swapPoint1: 0,
		swapPoint2: 0,
		distanceMeter:0,
		leaderPosition:{
			x:0,
			y:0
		},
		floorseed:0,
		
		debugbox: null,
		canvas: null,
		ctx:null,
		minimapcamera:null,
		graphcanvas:null,
		graphctx:null,
		minimapcanvas:null,
		minimapctx:null,
		gravity:null,
		world:null,
		
		cw_carGeneration:[],
		cw_topScores:[],
		cw_graphTop:[],
		cw_graphElite:[],
		cw_graphAverage:[],
		cw_floorTiles:[],
		cw_carArray:[],
		
		init:function(){
			var canvasID="mainbox";
			this.debugbox=document.getElementById("debug");
			this.canvas=document.getElementById(canvasID);
			this.ctx=this.canvas.getContext("2d");
			this.minimapcamera = document.getElementById("minimapcamera").style;
				this.minimapcamera.width = 12*this.minimapscale+"px";
				this.minimapcamera.height = 6*this.minimapscale+"px";
			this.graphcanvas = document.getElementById("graphcanvas");
			this.graphctx = graphcanvas.getContext("2d");
			this.minimapcanvas = document.getElementById("minimap");
			this.minimapctx = this.minimapcanvas.getContext("2d");
			this.fogdistance = document.getElementById("minimapfog").style;
			this.gravity = new b2Vec2(0.0, -9.81);
			this.distanceMeter = document.getElementById("distancemeter");
			// clone silver dot and health bar
			var mmm = document.getElementsByName('minimapmarker')[0];
			var hbar = document.getElementsByName('healthbar')[0];
			for(var k = 0; k < this.generationSize; k++) {
				// minimap markers
				var newbar = mmm.cloneNode(true);
				newbar.id = "bar"+k;
				newbar.style.paddingTop = k*9+"px";
				minimapholder.appendChild(newbar);
				// health bars
				var newhealth = hbar.cloneNode(true);
				newhealth.getElementsByTagName("DIV")[0].id = "health"+k;
				newhealth.car_index = k;
				document.getElementById("health").appendChild(newhealth);
			}
			mmm.parentNode.removeChild(mmm);
			hbar.parentNode.removeChild(hbar);
			this.floorseed = Math.seedrandom();
			this.world = new b2World(this.gravity, this.doSleep);
			this.cw_createFloor();
			this.cw_drawMiniMap();
			this.cw_generationZero();
			var that=this;
			this.cw_runningInterval = setInterval(function(){
				that.simulationStep();
			}, Math.round(1000/this.box2dfps));
			this.cw_drawInterval = setInterval(function(){
				that.cw_drawScreen();
			}, Math.round(1000/this.screenfps));
		},
		debug: function(str, clear) {
			if(clear) {
				debugbox.innerHTML = "";
			}
			debugbox.innerHTML += str+"<br />";
		},
		showDistance: function(distance, height) {
			this.distanceMeter.innerHTML = "distance: "+distance+" meters<br />";
			this.distanceMeter.innerHTML += "height: "+height+" meters";
			if(distance > this.minimapfogdistance) {
				this.fogdistance.width = 800 - Math.round(distance + 15) * this.minimapscale + "px";
				this.minimapfogdistance = distance;
			}
		},

		/* ========================================================================= */
		/* ==== Floor ============================================================== */
		cw_createFloor: function() {
			var last_tile = last_fixture = last_world_coords = null;
			var tile_position = new b2Vec2(-5,0);
			this.cw_floorTiles = new Array();
			Math.seedrandom(this.floorseed);
			for(var k = 0; k < this.maxFloorTiles; k++) {
				last_tile = this.cw_createFloorTile(tile_position, (Math.random()*3 - 1.5) * 1.5*k/this.maxFloorTiles);
				this.cw_floorTiles.push(last_tile);
				last_fixture = last_tile.GetFixtureList();
				last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
				tile_position = last_world_coords;
			}
		},
		cw_createFloorTile: function(position, angle) {
			var body_def = new b2BodyDef();
				body_def.position.Set(position.x, position.y);
			var body = this.world.CreateBody(body_def);
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.friction = 0.5;
			var coords = new Array();
				coords.push(new b2Vec2(0,0));
				coords.push(new b2Vec2(0,-this.groundPieceHeight));
				coords.push(new b2Vec2(this.groundPieceWidth,-this.groundPieceHeight));
				coords.push(new b2Vec2(this.groundPieceWidth,0));
			var center = new b2Vec2(0,0);
			var newcoords = this.cw_rotateFloorTile(coords, center, angle);
			fix_def.shape.SetAsArray(newcoords);
			body.CreateFixture(fix_def);
			return body;
		},
		cw_rotateFloorTile: function(coords, center, angle) {
			var newcoords = new Array();
			for(var k = 0; k < coords.length; k++) {
				nc = new Object();
				nc.x = Math.cos(angle)*(coords[k].x - center.x) - Math.sin(angle)*(coords[k].y - center.y) + center.x;
				nc.y = Math.sin(angle)*(coords[k].x - center.x) + Math.cos(angle)*(coords[k].y - center.y) + center.y;
				newcoords.push(nc);
			}
			return newcoords;
		},
		/* ==== END Floor ========================================================== */
		/* ========================================================================= */
		/* ========================================================================= */
		/* ==== Generation ========================================================= */

		cw_generationZero: function() {
			for(var k = 0; k < this.generationSize; k++) {
				var car_def = this.cw_createRandomCar();
					car_def.index = k;
				this.cw_carGeneration.push(car_def);
			}
			this.gen_counter = 0;
			this.cw_deadCars = 0;
			this.leaderPosition = new Object();
			this.leaderPosition.x = 0;
			this.leaderPosition.y = 0;
			this.cw_materializeGeneration();
			document.getElementById("generation").innerHTML = "generation 0";
			document.getElementById("population").innerHTML = "cars alive: "+this.generationSize;
		},
		cw_materializeGeneration: function() {
			this.cw_carArray = new Array();
			for(var k = 0; k < this.generationSize; k++) {
				this.cw_carArray.push(new cw_Car(this.cw_carGeneration[k],this.world));
			}
		},
		cw_nextGeneration: function() {
			var newGeneration = new Array();
			var newborn;
			this.cw_getChampions();
			this.cw_topScores.push({i:this.gen_counter,v:cw_carScores[0].v,x:cw_carScores[0].x,y:cw_carScores[0].y,y2:cw_carScores[0].y2});
			this.plot_graphs();
			for(var k = 0; k < this.gen_champions; k++) {
				cw_carScores[k].car_def.is_elite = true;
				cw_carScores[k].car_def.index = k;
				newGeneration.push(cw_carScores[k].car_def);
			}
			for(k = this.gen_champions; k < this.generationSize; k++) {
				var parent1 = this.cw_getParents();
				var parent2 = parent1;
				while(parent2 == parent1) {
					parent2 = this.cw_getParents();
				}
				newborn = this.cw_makeChild(this.cw_carGeneration[parent1],this.cw_carGeneration[parent2]);
				newborn = this.cw_mutate(newborn);
				newborn.is_elite = false;
				newborn.index = k;
				newGeneration.push(newborn);
			}
			cw_carScores = new Array();
			this.cw_carGeneration = newGeneration;
			this.gen_counter++;
			this.cw_materializeGeneration();
			this.cw_deadCars = 0;
			this.leaderPosition = new Object();
			this.leaderPosition.x = 0;
			this.leaderPosition.y = 0;
			document.getElementById("generation").innerHTML = "generation "+this.gen_counter;
			document.getElementById("cars").innerHTML = "";
			document.getElementById("population").innerHTML = "cars alive: "+this.generationSize;
		},
		cw_getChampions: function() {
			var ret = new Array();
			cw_carScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < this.generationSize; k++) {
				ret.push(cw_carScores[k].i);
			}
			return ret;
		},
		cw_getParents: function() {
			var parentIndex = -1;
			for(var k = 0; k < this.generationSize; k++) {
				if(Math.random() <= this.gen_parentality) {
					parentIndex = k;
					break;
				}
			}
			if(parentIndex == -1) {
				parentIndex = Math.round(Math.random()*(this.generationSize-1));
			}
			return parentIndex;
		},
		cw_makeChild: function(car_def1, car_def2) {
			var newCarDef = new Object();
			swapPoint1 = Math.round(Math.random()*(this.nAttributes-1));
			swapPoint2 = swapPoint1;
			while(swapPoint2 == swapPoint1) {
				swapPoint2 = Math.round(Math.random()*(this.nAttributes-1));
			}
			var parents = [car_def1, car_def2];
			var curparent = 0;

			curparent = this.cw_chooseParent(curparent,0);
			newCarDef.wheel_radius1 = parents[curparent].wheel_radius1;
			curparent = this.cw_chooseParent(curparent,1);
			newCarDef.wheel_radius2 = parents[curparent].wheel_radius2;

			curparent = this.cw_chooseParent(curparent,2);
			newCarDef.wheel_vertex1 = parents[curparent].wheel_vertex1;
			curparent = this.cw_chooseParent(curparent,3);
			newCarDef.wheel_vertex2 = parents[curparent].wheel_vertex2;

			newCarDef.vertex_list = new Array();
			curparent = this.cw_chooseParent(curparent,4);
			newCarDef.vertex_list[0] = parents[curparent].vertex_list[0];
			curparent = this.cw_chooseParent(curparent,5);
			newCarDef.vertex_list[1] = parents[curparent].vertex_list[1];
			curparent = this.cw_chooseParent(curparent,6);
			newCarDef.vertex_list[2] = parents[curparent].vertex_list[2];
			curparent = this.cw_chooseParent(curparent,7);
			newCarDef.vertex_list[3] = parents[curparent].vertex_list[3];
			curparent = this.cw_chooseParent(curparent,8);
			newCarDef.vertex_list[4] = parents[curparent].vertex_list[4];
			curparent = this.cw_chooseParent(curparent,9);
			newCarDef.vertex_list[5] = parents[curparent].vertex_list[5];
			curparent = this.cw_chooseParent(curparent,10);
			newCarDef.vertex_list[6] = parents[curparent].vertex_list[6];
			curparent = this.cw_chooseParent(curparent,11);
			newCarDef.vertex_list[7] = parents[curparent].vertex_list[7];
			curparent = this.cw_chooseParent(curparent,12);
			newCarDef.wheel_density1 = parents[curparent].wheel_density1;
			curparent = this.cw_chooseParent(curparent,13);
			newCarDef.wheel_density2 = parents[curparent].wheel_density2;
			return newCarDef;
		},
		cw_mutate: function(car_def) {
			if(Math.random() < this.gen_mutation)
				car_def.wheel_radius1 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			if(Math.random() < this.gen_mutation)
				car_def.wheel_radius2 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			if(Math.random() < this.gen_mutation)
				car_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
			if(Math.random() < this.gen_mutation)
				car_def.wheel_vertex2 = Math.floor(Math.random()*8)%8;
			if(Math.random() < this.gen_mutation)
				car_def.wheel_density1 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;
			if(Math.random() < this.gen_mutation)
				car_def.wheel_density2 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(0,1,new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,0));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(1,1,new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(2,1,new b2Vec2(0,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(3,1,new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(4,1,new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,0));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(5,1,new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(6,1,new b2Vec2(0,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			if(Math.random() < this.gen_mutation)
				car_def.vertex_list.splice(7,1,new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			return car_def;
		},
		cw_chooseParent: function(curparent, attributeIndex) {
			var ret;
			if((swapPoint1 == attributeIndex) || (swapPoint2 == attributeIndex)) {
				if(curparent == 1) {
					ret = 0;
				}else{
					ret = 1;
				}
			}else{
				ret = curparent;
			}
			return ret;
		},
		cw_setMutation: function(mutation) {
			gen_mutation = parseFloat(mutation);
		},
		cw_setEliteSize: function(clones) {
			gen_champions = parseInt(clones, 10);
		},
		/* ==== END Genration ====================================================== */
		/* ========================================================================= */

		/* ========================================================================= */
		/* ==== Drawing ============================================================ */
		cw_drawScreen: function() {
			var ctx=this.ctx;
			ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
			ctx.save();
			this.cw_setCameraPosition();
			ctx.translate(200-(this.camera.x*this.camera.zoom), 200+(this.camera.y*this.camera.zoom));
			ctx.scale(this.camera.zoom, -this.camera.zoom);
			this.cw_drawFloor();
			this.cw_drawCars();
			ctx.restore();
		},
		cw_minimapCamera: function(x, y) {
			this.minimapcamera.left = Math.round((2+this.camera.x) * this.minimapscale) + "px";
			this.minimapcamera.top = Math.round((31-this.camera.y) * this.minimapscale) + "px";
		},
		cw_setCameraTarget: function(k) {
			this.camera.target = k;
		},
		cw_setCameraPosition: function() {
			if(this.camera.target >= 0) {
				var cameraTargetPosition = this.cw_carArray[this.camera.target].getPosition();
			} else {
				var cameraTargetPosition = this.leaderPosition;
			}
			var diff_y = this.camera.y - cameraTargetPosition.y;
			var diff_x = this.camera.x - cameraTargetPosition.x;
			this.camera.y -= this.camera.speed * diff_y;
			this.camera.x -= this.camera.speed * diff_x;
			this.cw_minimapCamera(this.camera.x, this.camera.y);
		},
		cw_drawFloor: function() {
			var ctx=this.ctx;
			ctx.strokeStyle = "#000";
			ctx.fillStyle = "#777";
			ctx.lineWidth = 1/this.camera.zoom;
			ctx.beginPath();
			outer_loop:
			for(var k = Math.max(0,this.last_drawn_tile-20); k < this.cw_floorTiles.length; k++) {
				var b = this.cw_floorTiles[k];
				for (f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
					if((shapePosition > (this.camera.x - 5)) && (shapePosition < (this.camera.x + 10))) {
						this.cw_drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
					}
					if(shapePosition > this.camera.x + 10) {
						this.last_drawn_tile = k;
						break outer_loop;
					}
				}
			}
			ctx.fill();
			ctx.stroke();
		},
		cw_drawCars: function() {
			var ctx=this.ctx;
			for(var k = (this.cw_carArray.length-1); k >= 0; k--) {
				this.myCar = this.cw_carArray[k];
				if(!this.myCar.alive) {
					continue;
				}
				this.myCarPos = this.myCar.getPosition();
				if(this.myCarPos.x < (this.camera.x - 5)) {	// too far behind, don't draw
					continue;
				}
				ctx.strokeStyle = "#444";
				ctx.lineWidth = 1/this.camera.zoom;
				b = this.myCar.wheel1;
				for (f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var color = Math.round(255 - (255 * (f.m_density - this.wheelMinDensity)) / this.wheelMaxDensity).toString();
					var rgbcolor = "rgb("+color+","+color+","+color+")";
					this.cw_drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
				}
				b = this.myCar.wheel2;
				for (f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var color = Math.round(255 - (255 * (f.m_density - this.wheelMinDensity)) / this.wheelMaxDensity).toString();
					var rgbcolor = "rgb("+color+","+color+","+color+")";
					this.cw_drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
				}
				if(this.myCar.is_elite) {
					ctx.strokeStyle = "#44c";
					ctx.fillStyle = "#ddf";
				} else {
					ctx.strokeStyle = "#c44";
					ctx.fillStyle = "#fdd";
				}
				ctx.beginPath();
				var b = this.myCar.chassis;
				for (f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					this.cw_drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
				}
				ctx.fill();
				ctx.stroke();
			}
		},
		toggleDisplay: function() {
			if(this.cw_paused) {
				return;
			}
			this.canvas.width = this.canvas.width;
			if(this.doDraw) {
				this.doDraw = false;
				this.cw_stopSimulation();
				this.cw_runningInterval = setInterval(this.simulationStep, 1); // simulate 1000x per second when not drawing
			} else {
				this.doDraw = true;
				clearInterval(this.cw_runningInterval);
				this.cw_startSimulation();
			}
		},
		cw_drawVirtualPoly: function(body, vtx, n_vtx) {
			// set strokestyle and fillstyle before call
			// call beginPath before call
			var ctx=this.ctx;
			var p0 = body.GetWorldPoint(vtx[0]);
			ctx.moveTo(p0.x, p0.y);
			for (var i = 1; i < n_vtx; i++) {
				p = body.GetWorldPoint(vtx[i]);
				ctx.lineTo(p.x, p.y);
			}
			ctx.lineTo(p0.x, p0.y);
		},
		cw_drawPoly: function(body, vtx, n_vtx) {
			ctx.beginPath();
			var p0 = body.GetWorldPoint(vtx[0]);
			ctx.moveTo(p0.x, p0.y);
			for (var i = 1; i < n_vtx; i++) {
				p = body.GetWorldPoint(vtx[i]);
				ctx.lineTo(p.x, p.y);
			}
			ctx.lineTo(p0.x, p0.y);
			ctx.fill();
			ctx.stroke();
		},
		cw_drawCircle: function(body, center, radius, angle, color) {
			var ctx=this.ctx;
			var p = body.GetWorldPoint(center);
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, radius, 0, 2*Math.PI, true);
			ctx.moveTo(p.x, p.y);
			ctx.lineTo(p.x + radius*Math.cos(angle), p.y + radius*Math.sin(angle));
			ctx.fill();
			ctx.stroke();
		},
		cw_drawMiniMap: function() {
			var last_tile = last_fixture = last_world_coords = null;
			var tile_position = new b2Vec2(-5,0);
			this.minimapfogdistance = 0;
			this.fogdistance.width = "800px";
			this.minimapcanvas.width = this.minimapcanvas.width;
			this.minimapctx.strokeStyle = "#000";
			this.minimapctx.beginPath();
			this.minimapctx.moveTo(0,35 * this.minimapscale);
			for(var k = 0; k < this.cw_floorTiles.length; k++) {
				last_tile = this.cw_floorTiles[k];
				last_fixture = last_tile.GetFixtureList();
				last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
				tile_position = last_world_coords;
				this.minimapctx.lineTo((tile_position.x + 5) * this.minimapscale, (-tile_position.y + 35) * this.minimapscale);
			}
			this.minimapctx.stroke();
		},
		/* ==== END Drawing ======================================================== */
		/* ========================================================================= */
		/* ========================================================================= */
		/* ==== Graphs ============================================================= */
		cw_storeGraphScores: function() {
			this.cw_graphAverage.push(this.cw_average(cw_carScores));
			this.cw_graphElite.push(this.cw_eliteaverage(cw_carScores));
			this.cw_graphTop.push(cw_carScores[0].v);
		},
		cw_plotTop: function() {
			var graphsize = this.cw_graphTop.length;
				this.graphctx.strokeStyle = "#f00";
				this.graphctx.beginPath();
				this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.cw_graphTop[k]);
			}
			this.graphctx.stroke();
		},
		cw_plotElite: function() {
			var graphsize = this.cw_graphElite.length;
			this.graphctx.strokeStyle = "#0f0";
			this.graphctx.beginPath();
			this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.cw_graphElite[k]);
			}
			this.graphctx.stroke();
		},
		cw_plotAverage: function() {
			var graphsize = this.cw_graphAverage.length;
			this.graphctx.strokeStyle = "#00f";
			this.graphctx.beginPath();
			this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.cw_graphAverage[k]);
			}
			this.graphctx.stroke();
		},
		plot_graphs: function() {
			this.cw_storeGraphScores();
			this.cw_clearGraphics();
			this.cw_plotAverage();
			this.cw_plotElite();
			this.cw_plotTop();
			this.cw_listTopScores();
		},
		cw_eliteaverage: function(scores) {
			var sum = 0;
			for(var k = 0; k < Math.floor(this.generationSize/2); k++) {
				sum += scores[k].v;
			}
			return sum/Math.floor(this.generationSize/2);
		},
		cw_average: function(scores) {
			var sum = 0;
			for(var k = 0; k < this.generationSize; k++) {
				sum += scores[k].v;
			}
			return sum/this.generationSize;
		},
		cw_clearGraphics: function() {
			this.graphcanvas.width = this.graphcanvas.width;
			this.graphctx.translate(0,this.graphheight);
			this.graphctx.scale(1,-1);
			this.graphctx.lineWidth = 1;
			this.graphctx.strokeStyle="#888";
			this.graphctx.beginPath();
			this.graphctx.moveTo(0,this.graphheight/2);
			this.graphctx.lineTo(this.graphwidth, this.graphheight/2);
			this.graphctx.moveTo(0,this.graphheight/4);
			this.graphctx.lineTo(this.graphwidth, this.graphheight/4);
			this.graphctx.moveTo(0,this.graphheight*3/4);
			this.graphctx.lineTo(this.graphwidth, this.graphheight*3/4);
			this.graphctx.stroke();
		},
		cw_listTopScores: function() {
			var ts = document.getElementById("topscores");
				ts.innerHTML = "Top Scores:<br />";
			this.cw_topScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < Math.min(10,this.cw_topScores.length); k++) {
				document.getElementById("topscores").innerHTML += 
					"#"+(k+1)+": "+Math.round(this.cw_topScores[k].v*100)/100+
					" d:"+Math.round(this.cw_topScores[k].x*100)/100+
					" h:"+Math.round(this.cw_topScores[k].y2*100)/100+"/"+Math.round(this.cw_topScores[k].y*100)/100+
					"m (gen "+this.cw_topScores[k].i+")<br />";
			}
		},
		/* ==== END Graphs ========================================================= */
		/* ========================================================================= */
		simulationStep: function() {
			this.world.Step(1/this.box2dfps, 20, 20);
			for(var k = 0; k < this.generationSize; k++) {
				if(!this.cw_carArray[k].alive) {
					continue;
				}
				this.cw_carArray[k].frames++;
				var position = this.cw_carArray[k].getPosition();
				this.cw_carArray[k].minimapmarker.left = Math.round((position.x+5) * this.minimapscale) + "px";
				this.cw_carArray[k].healthBar.width = Math.round((this.cw_carArray[k].health/this.cw_carArray[k].max_car_health)*100) + "%";
				if(this.cw_carArray[k].checkDeath()) {
					this.cw_carArray[k].kill();
					this.cw_deadCars++;
					document.getElementById("population").innerHTML = "cars alive: " + (this.generationSize-this.cw_deadCars);
					if(this.cw_deadCars >= this.generationSize) {
						this.cw_newRound();
					}
					if(this.leaderPosition.leader == k) {
						this.cw_findLeader();
					}
					continue;
				}
				if(position.x > this.leaderPosition.x) {
					this.leaderPosition = position;
					this.leaderPosition.leader = k;
				}
			}
			this.showDistance(Math.round(this.leaderPosition.x*100)/100, Math.round(this.leaderPosition.y*100)/100);
		},
		cw_findLeader: function() {
			var lead = 0;
			for(var k = 0; k < this.cw_carArray.length; k++) {
				if(!this.cw_carArray[k].alive) {
					continue;
				}
				position = this.cw_carArray[k].getPosition();
				if(position.x > lead) {
					this.leaderPosition = position;
					this.leaderPosition.leader = k;
				}
			}
		},
		cw_newRound: function() {
			this.cw_nextGeneration();
			this.camera.x = this.camera.y = 0;
			this.cw_setCameraTarget(-1);
		},
		cw_startSimulation: function() {
			var that=this;
			cw_runningInterval = setInterval(function(){
				that.simulationStep()
			}, Math.round(1000/box2dfps));
			cw_drawInterval = setInterval(function(){
				that.cw_drawScreen()
			}, Math.round(1000/screenfps));
		},
		cw_stopSimulation: function() {
			clearInterval(cw_runningInterval);
			clearInterval(cw_drawInterval);
		},
		cw_createRandomCar: function() {
			var v2;
			var car_def = new Object();
			car_def.wheel_radius1 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			car_def.wheel_radius2 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			car_def.wheel_density1 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;
			car_def.wheel_density2 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;

			car_def.vertex_list = new Array();
			car_def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,0));
			car_def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			car_def.vertex_list.push(new b2Vec2(0,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			car_def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			car_def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,0));
			car_def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			car_def.vertex_list.push(new b2Vec2(0,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			car_def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));

			car_def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
			v2 = car_def.wheel_vertex1;
			while(v2 == car_def.wheel_vertex1) {
				v2 = Math.floor(Math.random()*8)%8
			}
			car_def.wheel_vertex2 = v2;

			return car_def;
		},
		cw_kill: function() {
			var avgspeed = (myCar.maxPosition / myCar.frames) * box2dfps;
			var position = myCar.maxPosition;
			var score = position + avgspeed;
			document.getElementById("cars").innerHTML += Math.round(position*100)/100 + "m + " +" "+Math.round(avgspeed*100)/100+" m/s = "+ Math.round(score*100)/100 +"pts<br />";
			cw_carScores.push({ i:current_car_index, v:score, s: avgspeed, x:position, y:myCar.maxPositiony, y2:myCar.minPositiony });
			current_car_index++;
			cw_killCar();
			if(current_car_index >= generationSize) {
				this.cw_nextGeneration();
				current_car_index = 0;
			}
			this.myCar = this.cw_createNextCar();
			this.last_drawn_tile = 0;
		},
		resetPopulation: function() {
			document.getElementById("generation").innerHTML = "";
			document.getElementById("cars").innerHTML = "";
			document.getElementById("topscores").innerHTML = "";
			this.cw_clearGraphics();
			this.cw_carArray = new Array();
			this.cw_carGeneration = new Array();
			this.cw_carScores = new Array();
			this.cw_topScores = new Array();
			this.cw_graphTop = new Array();
			this.cw_graphElite = new Array();
			this.cw_graphAverage = new Array();
			this.lastmax = 0;
			this.lastaverage = 0;
			this.lasteliteaverage = 0;
			this.swapPoint1 = 0;
			this.swapPoint2 = 0;
			this.cw_generationZero();
		},
		reset: function() {
			this.doDraw = true;
			this.cw_stopSimulation();
			for (b = this.world.m_bodyList; b; b = b.m_next) {
				world.DestroyBody(b);
			}
			floorseed = document.getElementById("newseed").value;
			Math.seedrandom(floorseed);
			this.cw_createFloor();
			this.cw_drawMiniMap();
			Math.seedrandom();
			this.resetPopulation();
			this.cw_startSimulation();
		},
		cw_confirmResetWorld: function() {
			if(confirm('Really reset world?')) {
				this.reset();
			} else {
				return false;
			}
		}
	}
	return env;
};


/* ========================================================================= */
/* === Car ================================================================= */
var cw_Car = function() {
	this.__constructor.apply(this, arguments);
}
cw_Car.prototype.chassis = null;
cw_Car.prototype.wheel1 = null;
cw_Car.prototype.wheel2 = null;
cw_Car.prototype.__constructor = function(car_def,world) {
	this.velocityIndex = 0;
	this.health = 100;
	this.maxPosition = 0;
	this.maxPositiony = 0;
	this.minPositiony = 0;
	this.max_car_health = 100;
	this.car_health = 100;
	this.motorSpeed = 20;
	this.gravity = new b2Vec2(0.0, -9.81);
	this.frames = 0;
	this.car_def = car_def;
	this.world=world;
	this.alive = true;
	this.is_elite = car_def.is_elite;
	this.healthBar = document.getElementById("health"+car_def.index).style;
	this.healthBarText = document.getElementById("health"+car_def.index).nextSibling.nextSibling;
	this.healthBarText.innerHTML = car_def.index;
	this.minimapmarker = document.getElementById("bar"+car_def.index).style;

	if(this.is_elite) {
		this.healthBar.backgroundColor = "#44c";
		document.getElementById("bar"+car_def.index).style.borderLeft = "1px solid #44c";
		document.getElementById("bar"+car_def.index).innerHTML = car_def.index;
	}else{
		this.healthBar.backgroundColor = "#c44";
		document.getElementById("bar"+car_def.index).style.borderLeft = "1px solid #c44";
		document.getElementById("bar"+car_def.index).innerHTML = car_def.index;
	}
	this.chassis = cw_createChassis(car_def.vertex_list,world);
	this.wheel1 = cw_createWheel(car_def.wheel_radius1, car_def.wheel_density1,world);
	this.wheel2 = cw_createWheel(car_def.wheel_radius2, car_def.wheel_density2,world);

	var carmass = this.chassis.GetMass() + this.wheel1.GetMass() + this.wheel2.GetMass();
	var torque1 = carmass * -this.gravity.y / car_def.wheel_radius1;
	var torque2 = carmass * -this.gravity.y / car_def.wheel_radius2;

	var joint_def = new b2RevoluteJointDef();
	var randvertex = this.chassis.vertex_list[car_def.wheel_vertex1];
	joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
	joint_def.localAnchorB.Set(0, 0);
	joint_def.maxMotorTorque = torque1;
	joint_def.motorSpeed = -this.motorSpeed;
	joint_def.enableMotor = true;
	joint_def.bodyA = this.chassis;
	joint_def.bodyB = this.wheel1;

	var joint = this.world.CreateJoint(joint_def);

	randvertex = this.chassis.vertex_list[car_def.wheel_vertex2];
	joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
	joint_def.localAnchorB.Set(0, 0);
	joint_def.maxMotorTorque = torque2;
	joint_def.motorSpeed = -this.motorSpeed;
	joint_def.enableMotor = true;
	joint_def.bodyA = this.chassis;
	joint_def.bodyB = this.wheel2;

	var joint = this.world.CreateJoint(joint_def);
}
cw_Car.prototype.getPosition = function() {
	return this.chassis.GetPosition();
}

cw_Car.prototype.draw = function() {
	drawObject(this.chassis);
	drawObject(this.wheel1);
	drawObject(this.wheel2);
}

cw_Car.prototype.kill = function() {
	var avgspeed = (this.maxPosition / this.frames) * 60;
	var position = this.maxPosition;
	var score = position + avgspeed;
	cw_carScores.push({ car_def:this.car_def, v:score, s: avgspeed, x:position, y:this.maxPositiony, y2:this.minPositiony });
	this.world.DestroyBody(this.chassis);
	this.world.DestroyBody(this.wheel1);
	this.world.DestroyBody(this.wheel2);
	this.alive = false;
}

cw_Car.prototype.checkDeath = function() {
	// check health
	var position = this.getPosition();
	if(position.y > this.maxPositiony) {
		this.maxPositiony = position.y;
	}
	if(position .y < this.minPositiony) {
		this.minPositiony = position.y;
	}
	if(position.x > this.maxPosition + 0.02) {
		this.health = this.max_car_health;
		this.maxPosition = position.x;
	}else{
		if(position.x > this.maxPosition) {
			this.maxPosition = position.x;
		}
		if(Math.abs(this.chassis.GetLinearVelocity().x) < 0.001) {
			this.health -= 5;
		}
		this.health--;
		if(this.health <= 0) {
			this.healthBarText.innerHTML = "&#9760;";
			this.healthBar.width = "0";
			return true;
		}
	}
}
function cw_createChassis(vertex_list,world) {
	var body_def = new b2BodyDef();
		body_def.type = b2Body.b2_dynamicBody;
		body_def.position.Set(0.0, 4.0);
	var body = world.CreateBody(body_def);
		cw_createChassisPart(body, vertex_list[0],vertex_list[1]);
		cw_createChassisPart(body, vertex_list[1],vertex_list[2]);
		cw_createChassisPart(body, vertex_list[2],vertex_list[3]);
		cw_createChassisPart(body, vertex_list[3],vertex_list[4]);
		cw_createChassisPart(body, vertex_list[4],vertex_list[5]);
		cw_createChassisPart(body, vertex_list[5],vertex_list[6]);
		cw_createChassisPart(body, vertex_list[6],vertex_list[7]);
		cw_createChassisPart(body, vertex_list[7],vertex_list[0]);
		body.vertex_list = vertex_list;
	return body;
}
function cw_createWheel(radius, density,world) {
	var body_def = new b2BodyDef();
		body_def.type = b2Body.b2_dynamicBody;
		body_def.position.Set(0, 0);
	var body = world.CreateBody(body_def);
	var fix_def = new b2FixtureDef();
		fix_def.shape = new b2CircleShape(radius);
		fix_def.density = density;
		fix_def.friction = 1;
		fix_def.restitution = 0.2;
		fix_def.filter.groupIndex = -1;
	body.CreateFixture(fix_def);
	return body;
}
function cw_createChassisPart(body, vertex1, vertex2) {
	var vertex_list = new Array();
		vertex_list.push(vertex1);
		vertex_list.push(vertex2);
		vertex_list.push(b2Vec2.Make(0,0));
	var fix_def = new b2FixtureDef();
		fix_def.shape = new b2PolygonShape();
		fix_def.density = 80;
		fix_def.friction = 10;
		fix_def.restitution = 0.2;
		fix_def.filter.groupIndex = -1;
		fix_def.shape.SetAsArray(vertex_list,3);
	body.CreateFixture(fix_def);
}

/* === END Car ============================================================= */
/* ========================================================================= */