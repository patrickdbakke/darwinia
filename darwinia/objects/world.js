var creatureScores=new Array();
var environment=function(){
	var env={
		timeStep: 1.0 / 60.0,
		doDraw: true,
		paused: false,
		stop:false,
		camera:{
			target: -1,// which car should we follow? -1 = leader
			x: 0,
			y: 0,
			zoom:70,
			speed:0.05
		},
		doSleep: true,
		
		width:0,
		height:0,
		zoom:1,
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
		
		canvas: null,
		precanvas: null,
		prectx:null,
		realctx:null,
		minimapcamera:null,
		graphcanvas:null,
		graphctx:null,
		minimapcanvas:null,
		minimapctx:null,
		gravity:null,
		world:null,
		
		creatureGeneration:[],
		topScores:[],
		graphTop:[],
		graphElite:[],
		graphAverage:[],
		floorTiles:[],
		creatureArray:[],
		
		init:function(){
			var canvasID="mainbox";
			this.height=Math.min($(document).height(),600);
			this.width=Math.min($(document).width(),1200);
			this.zoom=this.zoom*15*this.height/200;
			this.canvas=document.getElementById(canvasID);
			this.canvas.width=this.width;
			this.canvas.height=this.height;
			this.precanvas = document.createElement('canvas');
				this.precanvas.width = this.width;
				this.precanvas.height = this.height;
			this.prectx = this.precanvas.getContext('2d');
			this.realctx = this.canvas.getContext("2d");
			
			this.minimapcamera = document.getElementById("minimapcamera").style;
				console.debug(this.minimapcamera);
				this.minimapcamera.width = 12*this.minimapscale+"px";
				this.minimapcamera.height = 6*this.minimapscale+"px";
			this.graphcanvas = document.getElementById("graphcanvas");
			this.graphctx = graphcanvas.getContext("2d");
			this.minimapcanvas = document.getElementById("minimap");
			this.minimapctx = this.minimapcanvas.getContext("2d");
			this.fogdistance = document.getElementById("minimapfog").style;
			this.gravity = new b2Vec2(0.0, -9.81);
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
			this.createFloor();
			this.drawMiniMap();
			this.generationZero();
			var that=this;
			this.stop=false;
			var doAnimation=function(){
				that.simulationStep();
				that.drawScreen();
				requestAnimationFrame(doAnimation);
			};
			doAnimation();
		},
		showDistance: function(distance, height) {
			$("#distancemeter").html("distance: "+distance+" meters<br />height: "+height+" meters");
			if(distance > this.minimapfogdistance) {
				this.fogdistance.width = 800 - Math.round(distance + 15) * this.minimapscale + "px";
				this.minimapfogdistance = distance;
			}
		},

		/* ========================================================================= */
		/* ==== Floor ============================================================== */
		createFloor: function() {
			var last_tile = last_fixture = last_world_coords = null;
			var tile_position = new b2Vec2(-5,0);
			this.floorTiles = new Array();
			Math.seedrandom(this.floorseed);
			for(var k = 0; k < this.maxFloorTiles; k++) {
				last_tile = this.createFloorTile(tile_position, (Math.random()*3 - 1.5) * 1.5*k/this.maxFloorTiles);
				this.floorTiles.push(last_tile);
				last_fixture = last_tile.GetFixtureList();
				last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
				tile_position = last_world_coords;
			}
		},
		createFloorTile: function(position, angle) {
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
			var newcoords = this.rotateFloorTile(coords, center, angle);
			fix_def.shape.SetAsArray(newcoords);
			body.CreateFixture(fix_def);
			return body;
		},
		rotateFloorTile: function(coords, center, angle) {
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

		generationZero: function() {
			for(var k = 0; k < this.generationSize; k++) {
				var car_def = this.createRandomCar();
					car_def.index = k;
				this.creatureGeneration.push(car_def);
			}
			this.gen_counter = 0;
			this.deadCars = 0;
			this.leaderPosition = new Object();
			this.leaderPosition.x = 0;
			this.leaderPosition.y = 0;
			this.materializeGeneration();
			$("#generation").html("generation 0");
			$("#population").html("cars alive: "+this.generationSize);
		},
		materializeGeneration: function() {
			this.creatureArray = new Array();
			for(var k = 0; k < this.generationSize; k++) {
				this.creatureArray.push(new creature(this.creatureGeneration[k],this.world));
			}
		},
		nextGeneration: function() {
			var newGeneration = new Array();
			var newborn;
			this.getChampions();
			this.topScores.push({i:this.gen_counter,v:creatureScores[0].v,x:creatureScores[0].x,y:creatureScores[0].y,y2:creatureScores[0].y2});
			this.plot_graphs();
			for(var k = 0; k < this.gen_champions; k++) {
				creatureScores[k].car_def.is_elite = true;
				creatureScores[k].car_def.index = k;
				newGeneration.push(creatureScores[k].car_def);
			}
			for(k = this.gen_champions; k < this.generationSize; k++) {
				var parent1 = this.getParents();
				var parent2 = parent1;
				while(parent2 == parent1) {
					parent2 = this.getParents();
				}
				newborn = this.makeChild(this.creatureGeneration[parent1],this.creatureGeneration[parent2]);
				newborn = this.mutate(newborn);
				newborn.is_elite = false;
				newborn.index = k;
				newGeneration.push(newborn);
			}
			creatureScores = new Array();
			this.creatureGeneration = newGeneration;
			this.gen_counter++;
			this.materializeGeneration();
			this.deadCars = 0;
			this.leaderPosition = new Object();
			this.leaderPosition.x = 0;
			this.leaderPosition.y = 0;
			$("#generation").html("generation "+this.gen_counter);
			$("#cars").html("");
			$("#population").html("cars alive: "+this.generationSize);
		},
		getChampions: function() {
			var ret = new Array();
			creatureScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < this.generationSize; k++) {
				ret.push(creatureScores[k].i);
			}
			return ret;
		},
		getParents: function() {
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
		makeChild: function(car_def1, car_def2) {
			var newCarDef = new Object();
			swapPoint1 = Math.round(Math.random()*(this.nAttributes-1));
			swapPoint2 = swapPoint1;
			while(swapPoint2 == swapPoint1) {
				swapPoint2 = Math.round(Math.random()*(this.nAttributes-1));
			}
			var parents = [car_def1, car_def2];
			var curparent = 0;

			curparent = this.chooseParent(curparent,0);
			newCarDef.wheel_radius1 = parents[curparent].wheel_radius1;
			curparent = this.chooseParent(curparent,1);
			newCarDef.wheel_radius2 = parents[curparent].wheel_radius2;

			curparent = this.chooseParent(curparent,2);
			newCarDef.wheel_vertex1 = parents[curparent].wheel_vertex1;
			curparent = this.chooseParent(curparent,3);
			newCarDef.wheel_vertex2 = parents[curparent].wheel_vertex2;

			newCarDef.vertex_list = new Array();
			curparent = this.chooseParent(curparent,4);
			newCarDef.vertex_list[0] = parents[curparent].vertex_list[0];
			curparent = this.chooseParent(curparent,5);
			newCarDef.vertex_list[1] = parents[curparent].vertex_list[1];
			curparent = this.chooseParent(curparent,6);
			newCarDef.vertex_list[2] = parents[curparent].vertex_list[2];
			curparent = this.chooseParent(curparent,7);
			newCarDef.vertex_list[3] = parents[curparent].vertex_list[3];
			curparent = this.chooseParent(curparent,8);
			newCarDef.vertex_list[4] = parents[curparent].vertex_list[4];
			curparent = this.chooseParent(curparent,9);
			newCarDef.vertex_list[5] = parents[curparent].vertex_list[5];
			curparent = this.chooseParent(curparent,10);
			newCarDef.vertex_list[6] = parents[curparent].vertex_list[6];
			curparent = this.chooseParent(curparent,11);
			newCarDef.vertex_list[7] = parents[curparent].vertex_list[7];
			curparent = this.chooseParent(curparent,12);
			newCarDef.wheel_density1 = parents[curparent].wheel_density1;
			curparent = this.chooseParent(curparent,13);
			newCarDef.wheel_density2 = parents[curparent].wheel_density2;
			return newCarDef;
		},
		mutate: function(car_def) {
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
		chooseParent: function(curparent, attributeIndex) {
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
		setMutation: function(mutation) {
			gen_mutation = parseFloat(mutation);
		},
		setEliteSize: function(clones) {
			gen_champions = parseInt(clones, 10);
		},
		/* ==== END Genration ====================================================== */
		/* ========================================================================= */

		/* ========================================================================= */
		/* ==== Drawing ============================================================ */
		drawScreen: function() {
			var ctx=this.prectx;
			ctx.clearRect(0,0,this.width*this.zoom,this.height*this.zoom);
			ctx.save();
			this.setCameraPosition();
			ctx.translate(200*this.zoom/100-(this.camera.x*this.zoom), 200*this.zoom/100+ (this.camera.y*this.zoom));
			ctx.scale(this.zoom, -this.zoom);
			this.drawFloor(ctx);
			this.drawCars(ctx);
			ctx.restore();
			this.canvas.width=this.canvas.width;
			this.realctx.drawImage(this.precanvas, 0, 0);
		},
		minimapCamera: function(x, y) {
			this.minimapcamera.left = Math.round((2+this.camera.x) * this.minimapscale) + "px";
			this.minimapcamera.top = Math.round((31-this.camera.y) * this.minimapscale) + "px";
		},
		setCameraTarget: function(k) {
			this.camera.target = k;
		},
		setCameraPosition: function() {
			if(this.camera.target >= 0) {
				var cameraTargetPosition = this.creatureArray[this.camera.target].getPosition();
			} else {
				var cameraTargetPosition = this.leaderPosition;
			}
			var diff_y = this.camera.y - cameraTargetPosition.y;
			var diff_x = this.camera.x - cameraTargetPosition.x;
			this.camera.y -= this.camera.speed * diff_y;
			this.camera.x -= this.camera.speed * diff_x;
			this.minimapCamera(this.camera.x, this.camera.y);
		},
		drawFloor: function(ctx) {
			ctx.strokeStyle = "#000";
			ctx.fillStyle = "#777";
			ctx.lineWidth = 1/this.camera.zoom;
			ctx.beginPath();
			outer_loop:
			for(var k = Math.max(0,this.last_drawn_tile-20); k < this.floorTiles.length; k++) {
				var b = this.floorTiles[k];
				for (var f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
					if((shapePosition > (this.camera.x - 5)) && (shapePosition < (this.camera.x + 10))) {
						this.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
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
		drawCars: function(ctx) {
			for(var k = (this.creatureArray.length-1); k >= 0; k--) {
				this.myCar = this.creatureArray[k];
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
					this.drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
				}
				b = this.myCar.wheel2;
				for (f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var color = Math.round(255 - (255 * (f.m_density - this.wheelMinDensity)) / this.wheelMaxDensity).toString();
					var rgbcolor = "rgb("+color+","+color+","+color+")";
					this.drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
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
					this.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
				}
				ctx.fill();
				ctx.stroke();
			}
		},
		drawVirtualPoly: function(body, vtx, n_vtx) {
			var ctx=this.prectx;
			var p;
			var p0 = body.GetWorldPoint(vtx[0]);
			ctx.moveTo(p0.x, p0.y);
			for (var i = 1; i < n_vtx; i++) {
				p = body.GetWorldPoint(vtx[i]);
				ctx.lineTo(p.x, p.y);
			}
			ctx.lineTo(p0.x, p0.y);
		},
		drawPoly: function(body, vtx, n_vtx) {
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
		drawCircle: function(body, center, radius, angle, color) {
			var ctx=this.prectx;
			var p = body.GetWorldPoint(center);
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, radius, 0, 2*Math.PI, true);
			ctx.moveTo(p.x, p.y);
			ctx.lineTo(p.x + radius*Math.cos(angle), p.y + radius*Math.sin(angle));
			ctx.fill();
			ctx.stroke();
		},
		drawMiniMap: function() {
			var last_tile = last_fixture = last_world_coords = null;
			var tile_position = new b2Vec2(-5,0);
			this.minimapfogdistance = 0;
			this.fogdistance.width = "800px";
			this.minimapcanvas.width = this.minimapcanvas.width;
			this.minimapctx.strokeStyle = "#000";
			this.minimapctx.beginPath();
			this.minimapctx.moveTo(0,35 * this.minimapscale);
			for(var k = 0; k < this.floorTiles.length; k++) {
				last_tile = this.floorTiles[k];
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
		storeGraphScores: function() {
			this.graphAverage.push(this.average(creatureScores));
			this.graphElite.push(this.eliteaverage(creatureScores));
			this.graphTop.push(creatureScores[0].v);
		},
		plotTop: function() {
			var graphsize = this.graphTop.length;
				this.graphctx.strokeStyle = "#f00";
				this.graphctx.beginPath();
				this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.graphTop[k]);
			}
			this.graphctx.stroke();
		},
		plotElite: function() {
			var graphsize = this.graphElite.length;
			this.graphctx.strokeStyle = "#0f0";
			this.graphctx.beginPath();
			this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.graphElite[k]);
			}
			this.graphctx.stroke();
		},
		plotAverage: function() {
			var graphsize = this.graphAverage.length;
			this.graphctx.strokeStyle = "#00f";
			this.graphctx.beginPath();
			this.graphctx.moveTo(0,0);
			for(var k = 0; k < this.graphsize; k++) {
				this.graphctx.lineTo(400*(k+1)/this.graphsize,this.graphAverage[k]);
			}
			this.graphctx.stroke();
		},
		plot_graphs: function() {
			this.storeGraphScores();
			this.clearGraphics();
			this.plotAverage();
			this.plotElite();
			this.plotTop();
			this.listTopScores();
		},
		eliteaverage: function(scores) {
			var sum = 0;
			for(var k = 0; k < Math.floor(this.generationSize/2); k++) {
				sum += scores[k].v;
			}
			return sum/Math.floor(this.generationSize/2);
		},
		average: function(scores) {
			var sum = 0;
			for(var k = 0; k < this.generationSize; k++) {
				sum += scores[k].v;
			}
			return sum/this.generationSize;
		},
		clearGraphics: function() {
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
		listTopScores: function() {
			$("#topscores").html("Top Scores:<br />");
			this.topScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < Math.min(10,this.topScores.length); k++) {
				$("#topscores").html($("#topscores").html() + 
					"#"+(k+1)+": "+Math.round(this.topScores[k].v*100)/100+
					" d:"+Math.round(this.topScores[k].x*100)/100+
					" h:"+Math.round(this.topScores[k].y2*100)/100+"/"+Math.round(this.topScores[k].y*100)/100+
					"m (gen "+this.topScores[k].i+")<br />");
			}
		},
		/* ==== END Graphs ========================================================= */
		/* ========================================================================= */
		simulationStep: function() {
			this.world.Step(1/30, 20, 20);
			for(var k = 0; k < this.generationSize; k++) {
				if(!this.creatureArray[k].alive) {
					continue;
				}
				this.creatureArray[k].frames++;
				var position = this.creatureArray[k].getPosition();
				this.creatureArray[k].minimapmarker.left = Math.round((position.x+5) * this.minimapscale) + "px";
				this.creatureArray[k].healthBar.width = Math.round((this.creatureArray[k].health/this.creatureArray[k].max_car_health)*100) + "%";
				if(this.creatureArray[k].checkDeath()) {
					this.creatureArray[k].kill();
					this.deadCars++;
					$("#population").html("cars alive: " + (this.generationSize-this.deadCars));
					if(this.deadCars >= this.generationSize) {
						this.newRound();
					}
					if(this.leaderPosition.leader == k) {
						this.findLeader();
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
		findLeader: function() {
			var lead = 0;
			for(var k = 0; k < this.creatureArray.length; k++) {
				if(!this.creatureArray[k].alive) {
					continue;
				}
				position = this.creatureArray[k].getPosition();
				if(position.x > lead) {
					this.leaderPosition = position;
					this.leaderPosition.leader = k;
				}
			}
		},
		newRound: function() {
			this.nextGeneration();
			this.camera.x = this.camera.y = 0;
			this.setCameraTarget(-1);
		},
		startSimulation: function() {
			var that=this;
			this.stop=false;
			var doAnimation=function(){
				that.simulationStep();
				that.drawScreen();
				requestAnimationFrame(doAnimation);
			};
			doAnimation();
		},
		stopSimulation: function() {
			// this.stop=true;
		},
		createRandomCar: function() {
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
		kill: function() {
			var position = myCar.maxPosition;
			var score = position ;
			$("#cars").html($("#cars").html() += Math.round(position*100)/100 + "m + " +" m/s = "+ Math.round(score*100)/100 +"pts<br />");
			creatureScores.push({ i:current_car_index, v:score,  x:position, y:myCar.maxPositiony, y2:myCar.minPositiony });
			current_car_index++;
			killCar();
			if(current_car_index >= generationSize) {
				this.nextGeneration();
				current_car_index = 0;
			}
			this.myCar = this.createNextCar();
			this.last_drawn_tile = 0;
		},
		resetPopulation: function() {
			$("#generation").html('');
			$("#cars").html('');
			$("#topscores").html('');
			this.clearGraphics();
			this.creatureArray = new Array();
			this.creatureGeneration = new Array();
			this.creatureScores = new Array();
			this.topScores = new Array();
			this.graphTop = new Array();
			this.graphElite = new Array();
			this.graphAverage = new Array();
			this.lastmax = 0;
			this.lastaverage = 0;
			this.lasteliteaverage = 0;
			this.swapPoint1 = 0;
			this.swapPoint2 = 0;
			this.generationZero();
		},
		reset: function() {
			this.doDraw = true;
			this.stopSimulation();
			for (b = this.world.m_bodyList; b; b = b.m_next) {
				world.DestroyBody(b);
			}
			floorseed = document.getElementById("newseed").value;
			Math.seedrandom(floorseed);
			this.createFloor();
			this.drawMiniMap();
			Math.seedrandom();
			this.resetPopulation();
			this.startSimulation();
		},
		confirmResetWorld: function() {
			if(confirm('Really reset world?')) {
				this.reset();
			} else {
				return false;
			}
		}
	}
	return env;
};