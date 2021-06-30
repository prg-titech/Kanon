#!/bin/bash
# Use 'jo' to generate the json file.
# Run 'apt install jo' to enable it.

# rm -rf json/
mkdir json

### Generate filelists (json/examples_*.json) for each subdirectory
function getPaths () {
  ls -la -fd $(find $1) | grep '.js' | jo -pa
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
find ./examples/* -maxdepth 1 | grep .js | jo -pa > json/examples.json