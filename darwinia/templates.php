<?php
    $pattern = "/(.+?)(\.[^.]*$|$)/";
    foreach (glob("darwinia/templates/*.html") as $filename)
    {
		preg_match($pattern, basename($filename), $matches, PREG_OFFSET_CAPTURE);
        echo("<script type='text/html' id='");
        echo($matches[1][0]);
        echo("Template'>\n");
        include $filename;
        echo("\n</script>\n\n");
    }
?>