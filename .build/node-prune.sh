# This script will run node-prune only on linux/amd64 because it isn't supported on other platforms.
if [$PLATFORM == "linux/amd64"]
then
    curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | sh -s -- -b /usr/local/bin
    npm prune --production
    /usr/local/bin/node-prune
else
    npm prune --production
fi