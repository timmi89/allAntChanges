#!/bin/bash

while read -r json
do
    echo $json >& data.json
    curl -H "Content-Type: application/json" --data @data.json http://localhost:8080/eventsprerelational/ff/ext/importEvent
    echo $json
done
