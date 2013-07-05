var creature = function(world,id) {
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
			var def=this.createRandomCar();
			this.def=def;
			this.gravity=new b2Vec2(0.0, -9.81);
			this.parts.p1 = this.wheel(def.wheel_radius1, def.wheel_density1,world);
			this.parts.p2 = this.wheel(def.wheel_radius2, def.wheel_density2,world);
			this.parts.p3 = this.P3(def.vertex_list,world);

			var carmass = this.parts.p3.GetMass() + this.parts.p1.GetMass() + this.parts.p2.GetMass();
			var torque1 = carmass * -this.gravity.y / def.wheel_radius1;
			var torque2 = carmass * -this.gravity.y / def.wheel_radius2;
			var randvertex = this.parts.p3.vertex_list[def.wheel_vertex1];
			var joint_def = new b2RevoluteJointDef();
				joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
				joint_def.localAnchorB.Set(0, 0);
				joint_def.maxMotorTorque = torque1;
				joint_def.motorSpeed = -this.motorSpeed;
				joint_def.enableMotor = true;
				joint_def.bodyA = this.parts.p3;
				joint_def.bodyB = this.parts.p1;
			var joint = this.world.CreateJoint(joint_def);
			randvertex = this.parts.p3.vertex_list[def.wheel_vertex2];
				joint_def.localAnchorA.Set(randvertex.x, randvertex.y);
				joint_def.localAnchorB.Set(0, 0);
				joint_def.maxMotorTorque = torque2;
				joint_def.motorSpeed = -this.motorSpeed;
				joint_def.enableMotor = true;
				joint_def.bodyA = this.parts.p3;
				joint_def.bodyB = this.parts.p2;

			var joint = this.world.CreateJoint(joint_def);
		},
		createRandomCar: function() {
			var v2;
			var def = new Object();
			def.wheel_radius1 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			def.wheel_radius2 = Math.random()*this.wheelMaxRadius+this.wheelMinRadius;
			def.wheel_density1 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;
			def.wheel_density2 = Math.random()*this.wheelMaxDensity+this.wheelMinDensity;

			def.vertex_list = new Array();
			def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,0));
			def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			def.vertex_list.push(new b2Vec2(0,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,Math.random()*this.chassisMaxAxis + this.chassisMinAxis));
			def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,0));
			def.vertex_list.push(new b2Vec2(-Math.random()*this.chassisMaxAxis - this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			def.vertex_list.push(new b2Vec2(0,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));
			def.vertex_list.push(new b2Vec2(Math.random()*this.chassisMaxAxis + this.chassisMinAxis,-Math.random()*this.chassisMaxAxis - this.chassisMinAxis));

			def.wheel_vertex1 = Math.floor(Math.random()*8)%8;
			v2 = def.wheel_vertex1;
			while(v2 == def.wheel_vertex1) {
				v2 = Math.floor(Math.random()*8)%8
			}
			def.wheel_vertex2 = v2;
			return def;
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
			for(var i=0;i<car_def.vertex_list.length;i++){
			
			}
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
		getPosition: function() {
			return this.parts.p3.GetPosition();
		},
		kill: function() {
			console.debug("kill");
			var position = this.maxPosition.x;
			var score = position;
			scores.push({ car_def:this.def, v:score, x:position, y:this.maxPositiony, y2:this.minPosition.y });
			this.world.DestroyBody(this.parts.p3);
			this.world.DestroyBody(this.parts.p1);
			this.world.DestroyBody(this.parts.p2);
			this.alive = false;
		},
		checkDeath: function() {
			// check health
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
		P3: function(vertex_list,world) {
			var body_def = new b2BodyDef();
				body_def.type = b2Body.b2_dynamicBody;
				body_def.position.Set(0.0, 4.0);
			var body = world.CreateBody(body_def);
				body.vertex_list = vertex_list;
				for(var i=0;i<body.vertex_list.length;i++){
					this.P3Part(body, body.vertex_list[i],body.vertex_list[(i+1)%body.vertex_list.length]);
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
	};
	o.init(world);
	return o;
}