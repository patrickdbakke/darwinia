<?php
	if(isset($fromIndex)){
		echo '<script src="/darwinia/models.js"></script>';
	}else{
		header("Content-type: application/javascript");
		foreach (glob("../../../models/*.js") as $filename)
		{
			include $filename;
		}
	}
?>