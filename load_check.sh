echo "Setting up ssh-agent."
ssh-add

echo "Configuring environment."
. gce_deploytasks.sh


foreach_exec_root "$ARRAY" "Load Check" "free -m; uptime; netstat -ant | wc -l"
foreach_exec_root "$DBS" "Load Check" "free -m; uptime; netstat -ant | wc -l"
foreach_exec_root "$CACHES" "Load Check" "free -m; uptime; netstat -ant | wc -l"
#foreach_exec_root "$EVENTS" "Load Check" "uptime; netstat -ant | wc -l"
echo "UTIL1"
uptime; netstat -ant | wc -l