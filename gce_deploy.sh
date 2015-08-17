echo "Setting up ssh-agent."
ssh-add

echo "Configuring environment."
. gce_deploytasks.sh

foreach_exec_broadcaster "$ARRAY" "Basic update" "$BASIC"
foreach_exec_root "$ARRAY" "Restart antenna" "$SUPER"
