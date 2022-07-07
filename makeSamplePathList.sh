#!/bin/bash
# Use 'jo' to generate the json file.
# Run 'apt install jo' to enable it.

# rm json/
if [ -d json ]; then
  rm -rf ./json
  mkdir json
else
  mkdir json
fi


### Generate filelists (json/examples_*.json) for each subdirectory
function getPaths () {
  # ls -la -fd $(find $1) | grep '.js' | jo -pa
  ls -la -fd $(find $1) | jo -pa
}
pathArr=()
baseNameArr=()
for path in $(find ./examples/* -maxdepth 0); do
  if [ -d $path ] ; then
    pathArr+=("$path")
    bn=$(basename $path)
    getPaths $path > json/examples_$bn.json
  fi
done

### Generate a filelist (json/examples.json) containing all examples
# find ./examples/* -maxdepth 1 | grep .js | jo -pa > json/examples.json
find ./examples/* -maxdepth 1 -type f | grep .js | jo -pa > json/examples.json