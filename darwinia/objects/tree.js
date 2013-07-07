var forest=function(environment,floorPoints){
	var o={
		floorPoints:floorPoints,
		environment:environment,
		treecolor:"#784418",
		budcolor:"rgba(34,85,0,.8)",
		treePolys:[],
		budPolys:[],
		trees:[],
		treeOdds:0.7,
		init:function(){
			for(var i=0;i<this.floorPoints.length;i++){
				if(Math.random()>this.treeOdds){
					var t=new tree(environment);
					var parts=t.createTree(this.floorPoints[i]);
					var buds=t.createBuds();
					for(var j=0;j<parts.length;j++){
						this.treePolys.push(parts[j]);
					}
					for(var j=0;j<buds.length;j++){
						this.budPolys.push(buds[j]);
					}
					this.trees.push(t);
				}
			}
		},
		draw:function(ctx,camera){
			ctx.strokeStyle = "#000";
			ctx.fillStyle = this.treecolor;
			ctx.lineWidth = 1/camera.zoom;
			ctx.beginPath();
			outer_loop:
			for(var k = 0; k < this.treePolys.length; k++) {
				var b = this.treePolys[k];
				for (var f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
					if((shapePosition > (camera.x - this.environment.width/2/100*2.5)) && (shapePosition < (camera.x + this.environment.width/2/100*2.5))) {
						this.environment.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
					}
				}
			}
			ctx.fill();
			ctx.stroke();
			this.drawBuds(ctx,camera);
		},
		drawBuds:function(ctx,camera){
			ctx.strokeStyle = "#000";
			ctx.fillStyle = this.budcolor;
			ctx.lineWidth = 1/camera.zoom;
			ctx.beginPath();
			outer_loop:
			for(var k = 0; k < this.budPolys.length; k++) {
				var b = this.budPolys[k];
				for (var f = b.GetFixtureList(); f; f = f.m_next) {
					var s = f.GetShape();
					var shapePosition = b.GetWorldPoint(s.m_vertices[0]).x;
					if((shapePosition > (camera.x - this.environment.width/2/100*2.5)) && (shapePosition < (camera.x + this.environment.width/2/100*2.5))) {
						this.environment.drawVirtualPoly(b, s.m_vertices, s.m_vertexCount);
					}
				}
			}
			ctx.fill();
			ctx.stroke();
		},
		germinate:function(k){
			var i=Math.floor(this.budPolys.length*Math.random());
			var position=this.budPolys[i].GetPosition();
			return new fruit(null,this.environment.world,k,position);
		}
	};
	o.init();
	return o;
};
var tree = function(environment) {
	var o={
		environment:environment,
		parts:[],
		buds:[],
		branchHeight: 3,
		branchWidth: 1.25,
		leafHeight:3,
		leafWidth:1.75,
		maxTreeSize:20,
		init:function(){
		
		},
		createTree:function(position, definition){
			this.createTreeBranch(position,1,Math.PI/2);
			return this.parts;
		},
		createTreeBranch:function(position,thickness,angle){
			var body_def = new b2BodyDef();
				body_def.position.Set(position.x, position.y-.1);
			var body = this.environment.world.CreateBody(body_def);
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.friction = 0.5;
				fix_def.filter.groupIndex = -1;
			var coords = new Array();
				coords.push(new b2Vec2(0,0));
				coords.push(new b2Vec2(0,-this.branchWidth*thickness));
				coords.push(new b2Vec2(this.branchHeight*thickness,-this.branchWidth*thickness));
				coords.push(new b2Vec2(this.branchHeight*thickness,0));
			var center = new b2Vec2(0,0);
			var newcoords = this.rotate(coords, center, angle);
				var pt1=newcoords[0];
				var pt2=newcoords[1];
				for(var i=0;i<newcoords.length;i++){
					newcoords[i].x-=(pt1.x+pt2.x)/2;
					newcoords[i].y-=(pt1.y+pt2.y)/2;
				}
				fix_def.shape.SetAsArray(newcoords);
				body.CreateFixture(fix_def);
			this.parts.push(body);
				var last_fixture=body.GetFixtureList();
				var pt1=body.GetWorldPoint(last_fixture.GetShape().m_vertices[3])
				var pt2=body.GetWorldPoint(last_fixture.GetShape().m_vertices[2])
				var newPosition={
					x:(pt1.x+pt2.x)/2,
					y:(pt1.y+pt2.y)/2
				};
				newPosition.y-=thickness*.2;
			if(thickness>.4 && this.parts.length<this.maxTreeSize){
				this.createTreeBranch(newPosition,thickness*.7,Math.PI/(1+Math.random()*2));
				if(Math.random()>.5){
					this.createTreeBranch(newPosition,thickness,Math.PI/(1+Math.random()*2));
				}
			}else if(thickness<.9){
				this.createBud(newPosition,thickness/.9,Math.PI/(Math.random()));
				this.createBud(newPosition,thickness/.9,Math.PI/(1+Math.random()));
				this.createBud(newPosition,thickness/.9,Math.PI/(-Math.random()));
			}
		},
		createBuds:function(){
			return this.buds;
		},
		createBud:function(position,thickness,angle){
			var body_def = new b2BodyDef();
				body_def.position.Set(position.x, position.y-.1);
			var body = this.environment.world.CreateBody(body_def);
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.friction = 0.5;
				fix_def.filter.groupIndex = -1;
			var coords = new Array();
				coords.push(new b2Vec2(0,0));
				coords.push(new b2Vec2(0,-this.leafWidth*thickness*2.1));
				coords.push(new b2Vec2(this.leafHeight*thickness*2.1,-this.leafWidth*thickness/2));
				coords.push(new b2Vec2(this.leafHeight*thickness*2,-this.leafWidth*thickness/2));
				coords.push(new b2Vec2(this.leafHeight*thickness*2,0));
			var center = new b2Vec2(0,0);
			var newcoords = this.rotate(coords, center, angle);
				fix_def.shape.SetAsArray(newcoords);
				body.CreateFixture(fix_def);
			this.buds.push(body);
		},
		rotate: function(coords, center, angle) {
			var newcoords = new Array();
			for(var k = 0; k < coords.length; k++) {
				nc = new Object();
				nc.x = Math.cos(angle)*(coords[k].x - center.x) - Math.sin(angle)*(coords[k].y - center.y) + center.x;
				nc.y = Math.sin(angle)*(coords[k].x - center.x) + Math.cos(angle)*(coords[k].y - center.y) + center.y;
				newcoords.push(nc);
			}
			return newcoords;
		}
	};
	o.init();
	return o;
}