#! /bin/bash
docker-compose run --rm web python ./manage.py test rb chronos analytics reporting
