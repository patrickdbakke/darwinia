var scores=new Array();
once=0;
var environment=function(seed){
	var env={
		timeStep: 1.0 / 60.0,
		stop:false,
		camera:{
			target: -1,// which car should we follow? -1 = leader
			x: 0,
			y: 0,
			zoom:70,
			speed:0.05
		},
		
		width:0,
		height:0,
		zoom:.5,
		graphheight: 200,
		graphwidth: 400,
		
		generationSize: 2,
		gen_champions: 1,
		gen_parentality: 0.2,
		gen_mutation: 0.05,
		gen_counter: 0,
		
		fruitCount:0,
		maxFruitCount:20,

		wheelMaxDensity: 100,
		wheelMinDensity: 40,
		distanceMeter:0,
		leaderPosition:{
			x:0,
			y:0
		},
		
		canvas: null,
		precanvas: null,
		prectx:null,
		realctx:null,
		graphcanvas:null,
		graphctx:null,
		gravity:null,
		world:null,
		
		definitions:[],
		topScores:[],
		graphTop:[],
		graphElite:[],
		graphAverage:[],
		objects:[],
		
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
			
			this.graphctx = graphcanvas.getContext("2d");
			this.graphcanvas = document.getElementById("graphcanvas");
			this.gravity = new b2Vec2(0.0, -9.81);
			var hbar = document.getElementsByName('healthbar')[0];
			for(var k = 0; k < this.generationSize; k++) {
				// health bars
				var newhealth = hbar.cloneNode(true);
				newhealth.getElementsByTagName("DIV")[0].id = "health"+k;
				newhealth.car_index = k;
				document.getElementById("health").appendChild(newhealth);
			}
			hbar.parentNode.removeChild(hbar);
			this.world = new b2World(this.gravity, true);
			this.floor = new floor(this);
			this.floor.createFloor();
			this.forest=new forest(this,this.floor.floorPoints());
			this.generationZero();
			var that=this;
			this.stop=false;
			var doAnimation=function(){
				that.simulationStep();
				that.drawScreen();
				that.detectCollisions();
				requestAnimationFrame(doAnimation);
			};
			doAnimation();
		},
		detectCollisions:function(){
			var node = this.world.GetBodyList();
			while (node) {
				var curr_node = node;
					node = node.GetNext();
				if(curr_node.m_userData && curr_node.m_userData.type=="creature"){
					var edge = curr_node.GetContactList();
					while (edge)  {
						var other=edge.other;
						if(other.m_userData && other.m_userData.type=="fruit"){
							if(once<10){
								console.debug(curr_node,other);
								once++;
							}
							if (other.GetType() == b2Body.b2_dynamicBody) {
								var othershape = other.GetFixtureList().GetShape();
								if (othershape.GetType() == b2Shape.e_polygonShape) {
									break;	
								 }
							 }
						}
						 edge = edge.next;
					}
				}
			}
		},
		showDistance: function(distance, height) {
			$("#distancemeter").html("distance: "+distance+" meters<br />height: "+height+" meters");
		},
		generationZero: function() {
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
			var c;
			this.objects = new Array();
			this.fruit = new Array();
			this.fruitCount=0;
			for(var k = 0; k < this.generationSize; k++) {
				c=new creature(this.definitions[k],this.world,k);
				this.objects.push(c);
				this.definitions.push(c.def);
			}
			while(this.fruitCount<this.maxFruitCount){
				this.fruit.push(this.forest.germinate(this.fruitCount));
				this.fruitCount++;
			}
		},
		nextGeneration: function() {
			var newGeneration = new Array();
			var newborn;
			this.getChampions();
			this.topScores.push({i:this.gen_counter,v:scores[0].v,x:scores[0].x,y:scores[0].y,y2:scores[0].y2});
			this.plot_graphs();
			for(var k = 0; k < this.gen_champions; k++) {
				scores[k].car_def.is_elite = true;
				scores[k].car_def.index = k;
				newGeneration.push(scores[k].car_def);
			}
			for(k = this.gen_champions; k < this.generationSize; k++) {
				var parent1 = this.getParents();
				var parent2 = parent1;
				while(parent2 == parent1) {
					parent2 = this.getParents();
				}
				newborn = this.makeChild(this.definitions[parent1],this.definitions[parent2]);
				newborn = this.mutate(newborn);
				newborn.index = k;
				newGeneration.push(newborn);
			}
			scores = new Array();
			this.definitions = newGeneration;
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
			scores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < this.generationSize; k++) {
				ret.push(scores[k].i);
			}
			return ret;
		},
		getParents: function() {
			for(var k = 0; k < this.generationSize; k++) {
				if(Math.random() <= this.gen_parentality) {
					return k;
					break;
				}
			}
			return Math.round(Math.random()*(this.generationSize-1));
		},
		makeChild: function(def1, def2) {
			var swapPoint1 = Math.round(Math.random()*(Math.min(def1.length,def2.length)-1));
			var swapPoint2 = swapPoint1;
			while(swapPoint1 == swapPoint2) {
				swapPoint2 = Math.round(Math.random()*(Math.min(def1.length,def2.length)-1));
			}
			var parents = [def1, def2];
			var curparent = 0;
			
			var newdef=[];
			for(var i=0;i<22;i++){
				curparent = this.chooseParent(curparent,i,swapPoint1, swapPoint2);
				newdef[i] = parents[curparent][i];
			}
			return newdef;
		},
		mutate: function(car_def) {
			for(var i=0;i<22;i++){
				if(Math.random() < this.gen_mutation)
					car_def[i] = Math.random();
			}
			return car_def;
		},
		chooseParent: function(curparent, attributeIndex,swapPoint1, swapPoint2) {
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
		setCameraTarget: function(k) {
			this.camera.target = k;
		},
		setCameraPosition: function() {
			if(this.camera.target >= 0) {
				var cameraTargetPosition = this.objects[this.camera.target].getPosition();
			} else {
				var cameraTargetPosition = this.leaderPosition;
			}
			var diff_y = this.camera.y - cameraTargetPosition.y;
			var diff_x = this.camera.x - cameraTargetPosition.x;
			this.camera.y -= this.camera.speed * diff_y;
			this.camera.x -= this.camera.speed * diff_x;
		},
		drawScreen: function() {
			var ctx=this.prectx;
			ctx.clearRect(0,0,this.width*this.zoom,this.height*this.zoom);
			ctx.save();
			this.setCameraPosition();
			ctx.translate(this.width*this.zoom/100-(this.camera.x*this.zoom), this.height*this.zoom/50+ (this.camera.y*this.zoom));
			ctx.scale(this.zoom, -this.zoom);
			this.forest.draw(ctx,this.camera);
			this.floor.draw(ctx,this.camera);
			this.drawObjects(ctx);
			ctx.restore();
			this.canvas.width=this.canvas.width;
			this.realctx.drawImage(this.precanvas, 0, 0);
		},
		drawObjects: function(ctx) {
			for(var k = (this.objects.length-1); k >= 0; k--) {
				var obj = this.objects[k];
				if(!obj.alive) {
					continue;
				}
				if(obj.getPosition().x < (this.camera.x - 10) || obj.getPosition().x>(this.camera.x + this.width/2/100*2.5)) {
					continue;
				}
				ctx.lineWidth = 1/this.camera.zoom;
				for(part in obj.parts){
					var b=obj.parts[part];
					for (f = b.GetFixtureList(); f; f = f.m_next) {
						var s = f.GetShape();
						if(!s.m_vertices || (s.m_radius && s.m_vertices.length<1)){
							ctx.strokeStyle = "#444";
							var color = Math.round(255 - (255 * (f.m_density - this.wheelMinDensity)) / this.wheelMaxDensity).toString();
							var rgbcolor = "rgb("+color+","+color+","+color+")";
							this.drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
						}else if(s.m_vertices){
							if(obj.is_elite) {
								ctx.strokeStyle = "#44c";
								ctx.fillStyle = "#ddf";
							} else {
								ctx.strokeStyle = "#c44";
								ctx.fillStyle = "#fdd";
							}
							ctx.beginPath();
							this.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
							ctx.fill();
							ctx.stroke();
						}
					}
				}
			}
			for(var k = (this.fruit.length-1); k >= 0; k--) {
				var obj = this.fruit[k];
				if(!obj.alive) {
					continue;
				}
				if(obj.getPosition().x < (this.camera.x - 10) || obj.getPosition().x>(this.camera.x + this.width/2/100*2.5)) {
					continue;
				}
				ctx.lineWidth = 1/this.camera.zoom;
				for(part in obj.parts){
					var b=obj.parts[part];
					for (f = b.GetFixtureList(); f; f = f.m_next) {
						var s = f.GetShape();
						if(!s.m_vertices || (s.m_radius && s.m_vertices.length<1)){
							ctx.strokeStyle = "#444";
							var color = Math.round(255 - (255 * (f.m_density - this.wheelMinDensity)) / this.wheelMaxDensity).toString();
							var rgbcolor = "rgb("+color+","+color+","+color+")";
							this.drawCircle(b, s.m_p, s.m_radius, b.m_sweep.a, rgbcolor);
						}else if(s.m_vertices){
							ctx.strokeStyle = "#d4aa00";
							ctx.fillStyle = "#ffdd55";
							ctx.beginPath();
							this.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
							ctx.fill();
							ctx.stroke();
						}
					}
				}
			}
		},
		drawVirtualPoly: function(body, vtx) {
			var ctx=this.prectx;
			var p;
			var p0 = body.GetWorldPoint(vtx[0]);
			ctx.moveTo(p0.x, p0.y);
			for (var i = 1; i < vtx.length; i++) {
				p = body.GetWorldPoint(vtx[i]);
				ctx.lineTo(p.x, p.y);
			}
			ctx.lineTo(p0.x, p0.y);
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
		storeGraphScores: function() {
			this.graphAverage.push(this.average(scores));
			this.graphElite.push(this.eliteaverage(scores));
			this.graphTop.push(scores[0].v);
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
			$("#topscores").html("");
			this.topScores.sort(function(a,b) {if(a.v > b.v) {return -1} else {return 1}});
			for(var k = 0; k < Math.min(10,this.topScores.length); k++) {
				$("#topscores").html($("#topscores").html() + "<span class='topscore'>"+
					"#"+(k+1)+": "+Math.round(this.topScores[k].v*100)/100+
					" d:"+Math.round(this.topScores[k].x*100)/100+
					" h:"+Math.round(this.topScores[k].y2*100)/100+"/"+Math.round(this.topScores[k].y*100)/100+
					"m (gen "+this.topScores[k].i+")</span>");
			}
		},
		simulationStep: function() {
			this.world.Step(1/30, 20, 20);
			for(var k = 0; k < this.generationSize; k++) {
				if(!this.objects[k].alive) {
					continue;
				}
				var position = this.objects[k].getPosition();
				if(this.objects[k].checkDeath()) {
					this.objects[k].kill();
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
			for(var k = 0; k < this.objects.length; k++) {
				if(!this.objects[k].alive) {
					continue;
				}
				position = this.objects[k].getPosition();
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
				that.detectCollisions();
				requestAnimationFrame(doAnimation);
			};
			doAnimation();
		},
		stopSimulation: function() {
			this.stop=true;
		},
		resetPopulation: function() {
			$("#generation").html('');
			$("#cars").html('');
			$("#topscores").html('');
			this.clearGraphics();
			this.objects = new Array();
			this.definitions = new Array();
			this.scores = new Array();
			this.topScores = new Array();
			this.graphTop = new Array();
			this.graphElite = new Array();
			this.graphAverage = new Array();
			this.lastmax = 0;
			this.lastaverage = 0;
			this.lasteliteaverage = 0;
			this.generationZero();
		},
		reset: function() {
			this.stopSimulation();
			for (b = this.world.m_bodyList; b; b = b.m_next) {
				world.DestroyBody(b);
			}
			this.floor.createFloor();
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