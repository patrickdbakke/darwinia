var Darwinia = new Backbone.Marionette.Application();
Darwinia.addRegions({
	header: "#header",
	game: "#game",
	topleft: "#topleft",
	topright: "#topright",
	bottomleft: "#bottomleft",
	bottomright: "#bottomright",
	right: "#right",
	footer: "#footer",
	modal: "#modal",
});
Darwinia.router = Backbone.Router.extend({
	routes: {
		"*actions": "default"
	}
});
Darwinia.routes = new Darwinia.router();
Darwinia.routes.on("route:default",function(actions){
	Darwinia.topright.show(new graphView);
	Darwinia.topleft.show(new topscoreView);
	Darwinia.bottomright.show(new minimapView);
	Darwinia.bottomleft.show(new dataView);
	var env=new environment();
	Math.seedrandom(seed);
	env.init();
});
Darwinia.start=function(){
	Backbone.history.start();
}();