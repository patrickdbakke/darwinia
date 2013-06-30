var creature = function() {
	this.__constructor.apply(this, arguments);
}
creature.prototype.chassis = null;
creature.prototype.wheel1 = null;
creature.prototype.wheel2 = null;
creature.prototype.__constructor = function(car_def,world) {
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
creature.prototype.getPosition = function() {
	return this.chassis.GetPosition();
}

creature.prototype.draw = function() {
	drawObject(this.chassis);
	drawObject(this.wheel1);
	drawObject(this.wheel2);
}

creature.prototype.kill = function() {
	var avgspeed = (this.maxPosition / this.frames) * 60;
	var position = this.maxPosition;
	var score = position + avgspeed;
	creatureScores.push({ car_def:this.car_def, v:score, s: avgspeed, x:position, y:this.maxPositiony, y2:this.minPositiony });
	this.world.DestroyBody(this.chassis);
	this.world.DestroyBody(this.wheel1);
	this.world.DestroyBody(this.wheel2);
	this.alive = false;
}

creature.prototype.checkDeath = function() {
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