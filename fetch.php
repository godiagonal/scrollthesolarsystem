<?php

require('http.php');

$url = 'http://omniweb.gsfc.nasa.gov/cgi/models/planet.cgi';

$data = array(
    'activity' => 'retrieve',
    'planet' => '1',
    'coordinate' => '1',
    'resolution' => '1',
    'start_year' => '2016',
    'start_day' => '201',
    'stop_year' => '2016',
    'stop_day' => '365',
);

$planets = array(
    1 => array(
        'name' => 'venus',
        'body_id' => '2',
        'records' => null
    ),
    2 => array(
        'name' => 'mars',
        'body_id' => '4',
        'records' => null
    ),
    3 => array(
        'name' => 'jupiter',
        'body_id' => '5',
        'records' => null
    ),
    4 => array(
        'name' => 'saturn',
        'body_id' => '6',
        'records' => null
    ),
    5 => array(
        'name' => 'uranus',
        'body_id' => '7',
        'records' => null
    ),
    6 => array(
        'name' => 'neptune',
        'body_id' => '8',
        'records' => null
    ),
    7 => array(
        'name' => 'earth',
        'body_id' => '3',
        'records' => null
    ),
    8 => array(
        'name' => 'mercury',
        'body_id' => '1',
        'records' => null
    )
);

foreach ($planets as $key => $value) {
    
    $data['planet'] = $key;
    
    $req = new HttpRequest('post', $url, $data);

    if ($req->getError()) {
        echo 'An error occured for planet ' . $key;
    }
    else {
        
        $res = $req->getResponse();
        $res = substr($res, strrpos($res, '<pre>') + 5);
        $res = substr($res, 0, strrpos($res, '</pre>'));
        
        $rows = explode(PHP_EOL, $res);
        $records = array();

        for ($i = 1; $i < count($rows); $i++) {

            if (strlen($rows[$i]) > 0) {

                $row = trim($rows[$i]);
                $cols = explode(' ', $row);
                $cols_new = array();

                for ($j = 0; $j < count($cols); $j++) {

                    if (strlen($cols[$j]) > 0)
                        $cols_new[] = $cols[$j];

                }

                $records[] = $cols_new;

            }

        }                
                
        $planets[$key]['records'] = $records;

    }
    
}

require('db.php');

foreach ($planets as $planet) {
    
    if ($planet['records'] != null) {
    
        $insert_data = array();
    
        foreach ($planet['records'] as $record) {

            $insert_data[] = $planet['body_id'];
            $insert_data[] = date('Y-m-d', strtotime($record[0] . '-01-01 + ' . ($record[1] - 1) . ' days'));
            $insert_data[] = $record[4];
            $insert_data[] = $record[2];

        }
        
        $col_names = '(body_id, record_date, elon, distance)';
        $row_places = '(?, ?, ?, ?)';
        $all_places = implode(', ', array_fill(0, count($planet['records']), $row_places));
        $sql = 'INSERT INTO bodies_data ' . $col_names . ' VALUES ' . $all_places;
        
        $pdo->beginTransaction();
        
        try {
            $sth = $pdo->prepare($sql);
            $sth->execute($insert_data);
        }
        catch (PDOException $e) {
            echo $e->getMessage();
        }
        
        $pdo->commit();
        
        print_r($planet);

    }
    
}
    
?>