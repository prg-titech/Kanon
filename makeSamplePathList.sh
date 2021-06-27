#!/bin/bash
rm -rf json/
mkdir json

function getExamples () {
  ls -la -fd $(find $1) | grep '.js' | xargs -I{} basename {} .js | jo -pa
}

pathArr=()
baseNameArr=()
for path in $(find ./examples/* -maxdepth 0); do
  if [ -d $path ] ; then
    pathArr+=("$path")
    bn=$(basename $path)
    getExamples $path > json/examples_$bn.json
  fi
done