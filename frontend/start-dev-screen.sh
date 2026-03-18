#!/bin/sh

ARGS="$*"
screen -dmS yellow-os-frontend bash -c ". ./colors.sh; trap bash SIGINT; (./start-dev.sh $ARGS ; bash);"
