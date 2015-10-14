<?php

$dsn      = 'mysql:host=localhost;dbname=solarsystem;';
$login    = 'root';
$password = 'root';
$options  = array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES 'UTF8'");

try {
    $pdo = new PDO($dsn, $login, $password, $options);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
}
catch (Exception $e) {
    throw new PDOException('Could not connect to database.');
}

?>