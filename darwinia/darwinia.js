var Darwinia = new Backbone.Marionette.Application();
Darwinia.addRegions({
	header: "#header",
	game: "#game",
	left: "#left",
	right: "#right",
	footer: "#footer",
	modal: "#modal"
});
Darwinia.router = Backbone.Router.extend({
	routes: {
		"*actions": "default"
	}
});
Darwinia.routes = new Darwinia.router();
Darwinia.routes.on("route:default",function(actions){
	console.debug("started");
	var env=new environment();
	env.init();
});
Darwinia.start=function(){
	Backbone.history.start();
}();