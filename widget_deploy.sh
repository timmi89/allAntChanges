echo "Setting up ssh-agent."
ssh-add

echo "Configuring environment."
. gce_deploytasks.sh

# In order to deploy new widget code, we just need to rsync the file to each node.
push_sync "$ARRAY" "Push it real good"
