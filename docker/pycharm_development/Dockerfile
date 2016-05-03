FROM python:2.7.11

# Update MySQL libs
ADD mysql.list /etc/apt/sources.list.d/mysql.list
RUN apt-key adv --keyserver pgp.mit.edu --recv-keys 5072E1F5 && \
    apt-get update && apt-get install -y lsb-release && \
    apt-get upgrade -y mysql-client mysql-connector-python-cext && \
    apt-get autoremove -y

ENV PYTHONUNBUFFERED 1
ENV DJANGO_SETTINGS_MODULE antenna.settings

RUN mkdir -p /code/antenna
WORKDIR /code/antenna
ENV PYTHONPATH=/code

EXPOSE 22
RUN apt-get update && apt-get install -y openssh-server
RUN mkdir /var/run/sshd
RUN echo 'root:root' | chpasswd
RUN sed -i 's/PermitRootLogin without-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/PermitEmptyPasswords no/PermitEmptyPasswords yes/' /etc/ssh/sshd_config

# SSH login fix. Otherwise user is kicked off after login
RUN sed 's@session\s*required\s*pam_loginuid.so@session optional pam_loginuid.so@g' -i /etc/pam.d/sshd

ADD entry.sh /root/entry.sh

ENTRYPOINT ["/root/entry.sh"]
CMD ["/usr/sbin/sshd", "-D"]
