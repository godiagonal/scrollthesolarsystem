<?php

require('db.php');

$sth = $pdo->prepare("SELECT * FROM bodies ORDER BY bodies.order ASC");

$sth->execute(array($date));
$planets = $sth->fetchAll();

$date = date('Y-m-d');
$start_date = date('Y-m-d', strtotime($date.' - 365 days'));
$end_date = date('Y-m-d', strtotime($date.' + 365 days'));

// Select 1 day per week (today's weekday) to limit results
foreach ($planets as $planet) {
    
    $sth = $pdo->prepare("SELECT record_date, elon, distance FROM bodies_data
                          WHERE body_id = ? AND DAYOFWEEK(record_date) = DAYOFWEEK(?)
                          AND record_date >= ? AND record_date <= ?
                          ORDER BY record_date ASC");
    
    $sth->execute(array($planet->id, $date, $start_date, $end_date));
    $records = $sth->fetchAll();
    
    $planet->records = $records;
    
}

echo json_encode($planets);

?>
