FROM datadog/docker-dd-agent:service-discovery-k8s

COPY docker_daemon.yaml /etc/dd-agent/conf.d/docker_daemon.yaml
COPY docker_daemon.py   /opt/datadog-agent/agent/checks.d/docker_daemon.py
