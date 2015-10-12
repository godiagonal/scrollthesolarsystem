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

$sth = $pdo->prepare("SELECT b.*, d.elon, d.range
                      FROM bodies b INNER JOIN bodies_data d
                      ON b.id = d.body_id AND d.date = '2015-10-12'
                      ORDER BY b.order ASC"); // CURDATE()
$sth->bindParam(':id', $id, PDO::PARAM_INT);
$sth->execute();

$res = $sth->fetchAll();
echo json_encode($res);

?>
