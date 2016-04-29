FROM debian:jessie

ADD ./mysql.list /etc/apt/sources.list.d/mysql.list
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 5072E1F5 && \
    apt-get update && apt-get install -y wget vim lsb-release && \
    apt-get upgrade -y mysql-client mysql-connector-python-cext && \
    apt-get autoremove -y

RUN wget https://github.com/sysown/proxysql/releases/download/v1.1.2/proxysql_1.1.2-debian8_amd64.deb && \
    dpkg -i proxysql_1.1.2-debian8_amd64.deb

ENTRYPOINT exec /usr/bin/proxysql
