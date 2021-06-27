#!/bin/bash
rm -rf json/
mkdir json

function getSamples () {
  ls -la -fd $(find $1) | grep '.js' | xargs -I{} basename {} .js | jo -pa
}

pathArr=()
baseNameArr=()
for path in $(find ./samples/* -maxdepth 0); do
  if [ -d $path ] ; then
    pathArr+=("$path")
    bn=$(basename $path)
    getSamples $path > json/samples_$bn.json
  fi
done