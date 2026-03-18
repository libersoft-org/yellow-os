#!/bin/sh

ARGS="$*"
screen -dmS yellow-os bash -c ". ./colors.sh; trap bash SIGINT; (./start-dev.sh $ARGS ; bash);"
