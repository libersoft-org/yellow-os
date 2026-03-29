#!/bin/sh

results=$(find . -type f -executable \
        -not -path "*/node_modules/*" \
        -not -path "*/build/*" \
        -not -path "*/binaries/*" \
        -not -path "*/.git/*" \
        -not -path "*/.husky/*" \
        -not -path "*/.githooks/*" \
        -not -name "*.sh" \
        -not -name "*.lockb" \
        -not -name "*.fish")

if [ -n "$results" ]; then
    echo "----------------------------------------------"
    echo "File(s) with incorrect executable permissions:"
    echo "----------------------------------------------"
    echo
    echo "$results" | sed 's/^/chmod -x /'
fi
