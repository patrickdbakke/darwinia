var floor = function(environment) {
	var o={
		environment:environment,
		maxTiles: 200,
		groundPieceWidth: 3.5,
		groundPieceHeight: 0.3,
		last_drawn_tile: 0,
		seed:0,
		tiles:[],
		color:"#8dd35f",
		init:function(){
			
		},
		createFloor: function() {
			var last_tile = last_fixture = last_world_coords = null;
			var tile_position = new b2Vec2(-5,0);
			this.tiles = new Array();
			for(var k = 0; k < this.maxTiles; k++) {
				last_tile = this.createFloorTile(tile_position, (Math.random()*3 - 1.5) * 1.5 * k/this.maxTiles);
				this.tiles.push(last_tile);
				last_fixture = last_tile.GetFixtureList();
				last_world_coords = last_tile.GetWorldPoint(last_fixture.GetShape().m_vertices[3]);
				tile_position = last_world_coords;
			}
		},
		floorPoints:function(){
			var tilePositions = new Array();
			for(var k = 0; k < this.tiles.length; k++) {
				tilePositions.push(this.tiles[k].GetWorldPoint(this.tiles[k].GetFixtureList().GetShape().m_vertices[3]));
			}
			return tilePositions;
		},
		createFloorTile: function(position, angle) {
			var body_def = new b2BodyDef();
				body_def.position.Set(position.x, position.y);
			var body = this.environment.world.CreateBody(body_def);
			var fix_def = new b2FixtureDef();
				fix_def.shape = new b2PolygonShape();
				fix_def.friction = 0.5;
			var coords = new Array();
				coords.push(new b2Vec2(0,0));
				coords.push(new b2Vec2(0,-this.groundPieceHeight));
				coords.push(new b2Vec2(this.groundPieceWidth,-this.groundPieceHeight));
				coords.push(new b2Vec2(this.groundPieceWidth,0));
			var center = new b2Vec2(0,0);
			var newcoords = this.rotate(coords, center, angle);
				fix_def.shape.SetAsArray(newcoords);
				body.CreateFixture(fix_def);
			return body;
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
		},
		draw: function(ctx,camera) {
			ctx.strokeStyle = "#000";
			ctx.fillStyle = this.color;
			ctx.lineWidth = 1/camera.zoom;
			ctx.beginPath();
			outer_loop:
			for(var k = 0; k < this.tiles.length; k++) {
				var b = this.tiles[k];
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
		}
	};
	o.init();
	return o;
}