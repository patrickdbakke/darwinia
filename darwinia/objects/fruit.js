var fruit = function(definition, world,id,position) {
	var o={
		id:id,
		health: 100,
		maxPosition: {
			x:0,
			y:0,
		},
		minPosition:{
			x: 0,
			y: 0
		},
		position:position || {
			x:0,
			y:4
		},
		max_health: 100,
		motorSpeed: 20,
		gravity: 0,
		alive: true,
		is_elite: false,
		def:null,
		world: world,
		parts:[],
		chassisMaxAxis: .5,
		chassisMinAxis: .5,
		
		init:function(){
			if(!definition){
				this.def=this.createRandomCar();
			}else{
				this.def=definition;
			}
			var def=this.def;
			this.gravity=new b2Vec2(0.0, -9.81);
			var vertices=[];
			for(var i=0;i<8;i++){
				vertices[2*i]=def[2*i+6];
				vertices[2*i+1]=def[2*i+1+6];
			}
			this.parts.push(this.polygon(vertices,world));
			var carmass = this.parts[0].GetMass();
			var i=Math.floor(def[4]*8)%8;
		},
		indiceToVertex: function(i,val1,val2){
			switch(i){
				case 0:
					return new b2Vec2(val1*this.chassisMaxAxis + this.chassisMinAxis,0);
					break;
				case 1:
					return new b2Vec2(val1*this.chassisMaxAxis + this.chassisMinAxis,val2*this.chassisMaxAxis + this.chassisMinAxis);
					break;
				case 2:
					return new b2Vec2(0,val2*this.chassisMaxAxis + this.chassisMinAxis);
					break;
				case 3:
					return new b2Vec2(-val1*this.chassisMaxAxis - this.chassisMinAxis,val2*this.chassisMaxAxis + this.chassisMinAxis);
					break;
				case 4:
					return new b2Vec2(-val1*this.chassisMaxAxis - this.chassisMinAxis,0);
					break;
				case 5:
					return new b2Vec2(-val1*this.chassisMaxAxis - this.chassisMinAxis,-val2*this.chassisMaxAxis - this.chassisMinAxis);
					break;
				case 6:
					return new b2Vec2(0,-val2*this.chassisMaxAxis - this.chassisMinAxis);
					break;
				case 7:
					return new b2Vec2(val1*this.chassisMaxAxis + this.chassisMinAxis,-val2*this.chassisMaxAxis - this.chassisMinAxis);
					break;
			}
		},
		createRandomCar: function() {
			var def = new Object();
				def=[];
			for(var i=0;i<22;i++){
				def[i]=Math.random();
			}
			return def;
		},
		getPosition: function() {
			return this.parts[0].GetPosition();
		},
		kill: function() {
			var d = this.maxPosition.x;
			scores.push({ car_def:this.def, v:d, x:d, y:this.maxPositiony, y2:this.minPosition.y });
			this.world.DestroyBody(this.parts[0]);
			this.alive = false;
		},
		checkDeath: function() {
			var p = this.getPosition();
			if(p.y > this.maxPosition.y) {
				this.maxPosition.y = p.y;
			}
			if(p.y < this.minPosition.y) {
				this.minPosition.y = p.y;
			}
			if(p.x > this.maxPosition.x) {
				this.health = this.max_health;
				this.maxPosition.x = p.x;
			}
			if(p.x<this.maxPosition.x){
				if(p.x > this.maxPosition.x) {
					this.maxPosition.x = p.x;
				}
				if(Math.abs(this.parts[0].GetLinearVelocity().x) < 0.001) {
					this.health -= 5;
				}
				this.health--;
			}else{
				if(Math.abs(this.parts[0].GetLinearVelocity().x) < 0.001 && Math.abs(this.parts[0].GetLinearVelocity().y) < 0.001) {
					this.health -= 1;
				}
			}
			if(this.health <= 0) {
				// return true;
			}
		},
		polygon: function(vertices,world) {
			var body_def = new b2BodyDef();
				body_def.type = b2Body.b2_dynamicBody;
				body_def.position.Set(this.position.x, this.position.y);
				body_def.userData={
					type:"fruit"
				};
			var body = world.CreateBody(body_def);
			var j;
			for(var i=0;i<vertices.length/2;i++){
				j=(i+1)%(vertices.length/2);
				this.polygonPart(body, this.indiceToVertex(i,vertices[2*i],vertices[2*i+1]),this.indiceToVertex(j,vertices[2*j],vertices[2*j+1]));
			}
			return body;
		},
		polygonPart: function(body, vertex1, vertex2) {
			var vertices = new Array();
				vertices.push(vertex1);
				vertices.push(vertex2);
				vertices.push(b2Vec2.Make(0,0));
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.density = 80;
				fix_def.friction = 10;
				fix_def.restitution = 0.3;
				fix_def.filter.groupIndex =-1;
				fix_def.shape.SetAsArray(vertices,3);
			body.CreateFixture(fix_def);
		}
	};
	o.init(world);
	return o;
}