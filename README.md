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

Start a shell in the web container
```sh
docker-compose run --rm web bash
```

```sh
# Install mysql-client
apt-get update
apt-get install -y mysql-client

# Get the password from settings.py or docker-compose.yml to create the database
mysql --host db -u root -p -e 'CREATE DATABASE readrboard CHARACTER SET utf8;'

# Initialize the database
./manage.py syncdb --all
./manage.py migrate --fake

exit
```

## Run it

```sh
# Start dinghy if it's not running
dinghy up

# Update the codes
get pull

# Run migrations
docker-compose run --rm web ./manage.py migrate

# Start the containers
docker-compose up --force-recreate
```
