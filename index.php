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
		<canvas id="mainbox" width="800" height="400"></canvas>
		<div id="graphholder">
			<canvas id="graphcanvas" width="400" height="200"></canvas>
			<div class="scale" id="s100">200</div>
			<div class="scale" id="s75">150</div>
			<div class="scale" id="s50">100</div>
			<div class="scale" id="s25">50</div>
			<div class="scale" id="s0">0</div>
		</div>
		<div id="minimapholder">
			<div id="minimapfog" style="width: 653px;"></div>
			<canvas id="minimap" width="800" height="200"></canvas>
			<div id="minimapcamera" style="width: 36px; height: 18px; left: 101px; top: 93px;"></div>
			<div name="minimapmarker" class="minimapmarker" id="bar0" style="padding-top: 0px; border-left-width: 1px; border-left-style: solid; border-left-color: rgb(68, 68, 204); left: 48px;">0</div>
		</div>
		<div id="topscoreholder">
			<input type="button" value="View top replay" onclick="cw_toggleGhostReplay(this)"><br>
			<div id="topscores">Top Scores:<br></div>
		</div>
		<div id="debug"></div>
		<div id="data">
			<br>
			<input type="button" value="Surprise!" onclick="toggleDisplay()">
			<input type="button" value="New Population" onclick="cw_resetPopulation()">
			<div>
				Create new world with seed:
				<input type="text" value="Enter any string" id="newseed">
				<input type="button" value="Go!" onclick="cw_confirmResetWorld()">
			</div>
			<div>
				Mutation rate:
				<select id="mutationrate" onchange="cw_setMutation(this.options[this.selectedIndex].value)">
					<option value="0">0%</option>
					<option value="0.01">1%</option>
					<option value="0.02">2%</option>
					<option value="0.03">3%</option>
					<option value="0.04">4%</option>
					<option value="0.05" selected="selected">5%</option>
					<option value="0.1">10%</option>
					<option value="0.2">20%</option>
					<option value="0.3">30%</option>
					<option value="0.4">40%</option>
					<option value="0.5">50%</option>
					<option value="0.75">75%</option>
					<option value="1.0">100%</option>
				</select>
			</div>
			<div>
				Elite clones:
				<select id="elitesize" onchange="cw_setEliteSize(this.options[this.selectedIndex].value)">
					<option value="0">0</option>
					<option value="1" selected="selected">1</option>
					<option value="2">2</option>
					<option value="3">3</option>
					<option value="4">4</option>
					<option value="5">5</option>
					<option value="6">6</option>
					<option value="7">7</option>
					<option value="8">8</option>
					<option value="9">9</option>
					<option value="10">10</option>
				</select>
			</div>
			<div id="generation"></div>
			<div id="population"></div>
			<div id="distancemeter"></div>
			<input type="button" value="Watch Leader" onclick="cw_setCameraTarget(-1)">
			<div id="health">
				<div name="healthbar" class="healthbar" onclick="cw_setCameraTarget(this.car_index)">
					<div name="health" class="health" id="health19" style="background-color: rgb(204, 68, 68); width: 0px;"></div>
					<div name="healthtext" class="healthtext">&#9760;</div>
				</div>
			</div>
			<div id="cars"></div>
		</div>  
	</body>
	<?php include "darwinia/templates.php"; ?>		
	<?php include "darwinia/views.php"; ?>		
	<?php include "darwinia/models.php"; ?>		
	<script src="/darwinia/objects/ghost.js"></script>
	<script src="/darwinia/objects/car.js"></script>
	<script src="/darwinia/objects/world.js"></script>
	<script src="/darwinia/darwinia.js"></script>
</html>