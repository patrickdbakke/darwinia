var leaves = function(car_def,world) {
	var o={
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
		frames: 0,
		car_def: car_def,
		alive: true,
		is_elite: car_def.is_elite,
		world: world,
		parts:{
			p3:null
		},
		init:function(){
			this.gravity=new b2Vec2(0.0, -9.81);
			this.parts.p3 = this.P3(car_def.vertex_list,world);
			var carmass = this.parts.p3.GetMass();
		},
		getPosition: function() {
			return this.parts.p3.GetPosition();
		},
		kill: function() {
			var position = this.maxPosition.x;
			var score = position;
			scores.push({ car_def:this.car_def, v:score, x:position, y:this.maxPositiony, y2:this.minPosition.y });
			this.world.DestroyBody(this.parts.p3);
			this.alive = false;
		},
		checkDeath: function() {
			var position = this.getPosition();
			if(position.y<-10)
				return true;
		},
		P3: function(vertex_list,world) {
			var body_def = new b2BodyDef();
				body_def.type = b2Body.b2_dynamicBody;
				body_def.position.Set(0.0, 4.0);
			var body = world.CreateBody(body_def);
				body.vertex_list = [
					{x:.1,y:.5},{x:0,y:.6},
					{x:.6,y:.1}
				];
				for(var i=0;i<body.vertex_list.length;i++){
					this.P3Part(body, body.vertex_list[i],body.vertex_list[(i+1)%body.vertex_list.length]);
				}
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
				fix_def.restitution = .5;
				fix_def.filter.groupIndex = -1;
				fix_def.shape.SetAsArray(vertex_list,3);
			var b=body.CreateFixture(fix_def);
			var impulseCenter={
					x:b.GetBody().GetWorldCenter().x,
					y:b.GetBody().GetWorldCenter().y+Math.random(),
				}
				b.GetBody().ApplyImpulse(
					new b2Vec2(.5*Math.random(),.5*Math.random()),
					impulseCenter
				);
		}
	};
	o.init(car_def,world);
	return o;
}