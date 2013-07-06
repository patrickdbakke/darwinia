var creature = function(definition, world,id) {
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
		max_health: 100,
		motorSpeed: 20,
		gravity: 0,
		alive: true,
		is_elite: false,
		def:null,
		world: world,
		parts:{
			p3:null,
			p1:null,
			p2:null,
		},
		nAttributes: 14,
		chassisMaxAxis: 2.1,
		chassisMinAxis: .5,
		wheelMaxRadius: 1,
		wheelMinRadius: 0.4,
		wheelMaxDensity: 100,
		wheelMinDensity: 40,
		swapPoint1: 0,
		swapPoint2: 0,
		
		init:function(){
			if(!definition){
				this.def=this.createRandomCar();
			}else{
				this.def=definition;
			}
			var def=this.def;
			this.gravity=new b2Vec2(0.0, -9.81);
			this.parts.p1 = this.wheel(def[0]*this.wheelMaxRadius+this.wheelMinRadius, def[2]*this.wheelMaxDensity+this.wheelMinDensity,world);
			this.parts.p2 = this.wheel(def[1]*this.wheelMaxRadius+this.wheelMinRadius, def[3]*this.wheelMaxDensity+this.wheelMinDensity,world);
			var vertices=[];
			for(var i=0;i<8;i++){
				vertices[2*i]=def[2*i+6];
				vertices[2*i+1]=def[2*i+1+6];
			}
			this.parts.p3 = this.P3(vertices,world);

			var carmass = this.parts.p3.GetMass() + this.parts.p1.GetMass() + this.parts.p2.GetMass();
			var torque1 = carmass * -this.gravity.y / (def[0]*this.wheelMaxRadius+this.wheelMinRadius);
			var torque2 = carmass * -this.gravity.y / (def[1]*this.wheelMaxRadius+this.wheelMinRadius);
			var i=Math.floor(def[4]*8)%8;
			var randvertex = this.indiceToVertex(i,vertices[2*i],vertices[2*i+1]);
			var joint_def = new b2RevoluteJointDef();
				joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
				joint_def.localAnchorB.Set(0, 0);
				joint_def.maxMotorTorque = torque1;
				joint_def.motorSpeed = -this.motorSpeed;
				joint_def.enableMotor = true;
				joint_def.bodyA = this.parts.p3;
				joint_def.bodyB = this.parts.p1;
			var joint = this.world.CreateJoint(joint_def);
			var i=Math.floor(def[5]*8)%8;
			randvertex = this.indiceToVertex(i,vertices[2*i],vertices[2*i+1]);
				joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
				joint_def.localAnchorB.Set(0, 0);
				joint_def.maxMotorTorque = torque2;
				joint_def.motorSpeed = -this.motorSpeed;
				joint_def.enableMotor = true;
				joint_def.bodyA = this.parts.p3;
				joint_def.bodyB = this.parts.p2;

			var joint = this.world.CreateJoint(joint_def);
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
		mutate: function(car_def) {
			for(var i=0;i<22;i++){
				if(Math.random() < this.gen_mutation)
					car_def[i] = Math.random();
			}
			return car_def;
		},
		getPosition: function() {
			return this.parts.p3.GetPosition();
		},
		kill: function() {
			var position = this.maxPosition.x;
			var score = position;
			scores.push({ car_def:this.def, v:score, x:position, y:this.maxPositiony, y2:this.minPosition.y });
			this.world.DestroyBody(this.parts.p3);
			this.world.DestroyBody(this.parts.p1);
			this.world.DestroyBody(this.parts.p2);
			this.alive = false;
		},
		checkDeath: function() {
			var position = this.getPosition();
			if(position.y > this.maxPosition.y) {
				this.maxPosition.y = position.y;
			}
			if(position.y < this.minPosition.y) {
				this.minPosition.y = position.y;
			}
			if(position.x > this.maxPosition.x + 0.02) {
				this.health = this.max_health;
				this.maxPosition.x = position.x;
			}else{
				if(position.x > this.maxPosition.x) {
					this.maxPosition.x = position.x;
				}
				if(Math.abs(this.parts.p3.GetLinearVelocity().x) < 0.001) {
					this.health -= 5;
				}
				this.health--;
				if(this.health <= 0) {
					return true;
				}
			}
		},
		P3: function(vertices,world) {
			var body_def = new b2BodyDef();
				body_def.type = b2Body.b2_dynamicBody;
				body_def.position.Set(0.0, 4.0);
			var body = world.CreateBody(body_def);
			var j;
			for(var i=0;i<vertices.length/2;i++){
				j=(i+1)%(vertices.length/2);
				this.P3Part(body, this.indiceToVertex(i,vertices[2*i],vertices[2*i+1]),this.indiceToVertex(j,vertices[2*j],vertices[2*j+1]));
			}
			return body;
		},
		wheel: function(radius, density,world) {
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
		},
		P3Part: function(body, vertex1, vertex2) {
			var vertices = new Array();
				vertices.push(vertex1);
				vertices.push(vertex2);
				vertices.push(b2Vec2.Make(0,0));
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.density = 80;
				fix_def.friction = 10;
				fix_def.restitution = 0.2;
				fix_def.filter.groupIndex = -1;
				fix_def.shape.SetAsArray(vertices,3);
			body.CreateFixture(fix_def);
		}
	};
	o.init(world);
	return o;
}