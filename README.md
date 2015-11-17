# Antenna.is

## Setup Docker

```sh
# Install dependencies from homebrew
brew install caskroom/cask/brew-cask
brew cask install virtualbox
brew cask install virtualbox-extension-pack
brew install https://github.com/codekitchen/dinghy/raw/latest/dinghy.rb
brew install docker docker-compose

# Create docker VM with 8GB of memory, do less if you have less
dinghy create --memory=8192 --provider=virtualbox

# Build docker containers
docker-compose build
docker-compose run --rm web virtualenv virtualenvs/docker
docker-compose run --rm web pip install -r requirements.txt
```

## Setup DB
```sh
docker-compose run --rm web ./manage.py sync_cassandra
docker-compose run --rm web ./manage.py syncdb --all
docker-compose run --rm web ./manage.py migrate --fake
docker-compose run --rm web ./manage.py loaddata seed
```

## Setup hosts file compatible with previous dev environment

Add the following entries to `/etc/hosts`

```
192.168.99.100 local-static.antenna.is
192.168.99.100 local.antenna.is
```

## Run it

```sh
# Start dinghy if it's not running
dinghy up

# Update the codes
git pull

# Run migrations
docker-compose run --rm web ./manage.py migrate

# Start the containers
docker-compose up --force-recreate
```
