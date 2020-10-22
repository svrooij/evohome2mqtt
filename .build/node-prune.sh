#!/bin/sh

# This script will run node-prune only on linux/amd64 because it isn't supported on other platforms.
if [$TARGETPLATFORM == "linux/amd64"]
then
  apk add --no-cache curl
  curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | sh -s -- -b /usr/local/bin
  npm prune --production
  /usr/local/bin/node-prune
else
  npm prune --production
fi