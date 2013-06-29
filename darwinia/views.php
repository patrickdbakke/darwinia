<?php
	if(isset($fromIndex)){
		echo '<script src="/darwinia/views.js"></script>';
	}else{
		header("Content-type: application/javascript");
		foreach (glob("../../../views/*.js") as $filename)
		{
			include $filename;
		}
	}
?>