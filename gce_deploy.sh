echo "Setting up ssh-agent."
ssh-add

echo "Configuring environment."
. gce_deploytasks.sh


push_sync "$ARRAY" "Push it real good"

#GIT pull does not work without external IP
#foreach_exec_broadcaster "$ARRAY" "Basic update" "$BASIC"
foreach_exec_root "$ARRAY" "Restart antenna" "$SUPER"
