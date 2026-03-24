#!/bin/sh

cd backend
bun prettier --write "**/*.{js,ts,json}"
cd ..
