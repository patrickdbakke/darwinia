<?php $fromIndex=true;?>
<!DOCTYPE html>
<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
		<title>Darwinia</title>
		<link rel="stylesheet" type="text/css" href="/assets/css/site.css" />
		<script id="jquery" src="/assets/js/jquery.min.js"></script>
		<script id="jquery" src="/assets/js/modernizr-2.6.2.min.js"></script>
		<script id="jquery" src="/assets/js/underscore.min.js"></script>
		<script id="jquery" src="/assets/js/backbone.min.js"></script>
		<script id="jquery" src="/assets/js/backbone.marionette.min.js"></script>
		<script src="/assets/js/seedrandom.js"></script>
		<script src="/assets/js/box2d.js"></script>
	</head>
	<body class="">
		<canvas id="mainbox"></canvas>
		<div id="topleft"></div>
		<div id="topright"></div>
		<div id="bottomright"></div>
		<div id="bottomleft"></div>
		<div id="topright"></div>
		<div id="bottomleft"></div> 
	</body>
	<?php include "darwinia/templates.php"; ?>		
	<?php include "darwinia/views.php"; ?>		
	<?php include "darwinia/models.php"; ?>		
	<script src="/darwinia/objects/creature.js"></script>
	<script src="/darwinia/objects/fruit.js"></script>
	<script src="/darwinia/objects/floor.js"></script>
	<script src="/darwinia/objects/world.js"></script>
	<script src="/darwinia/darwinia.js"></script>
</html>