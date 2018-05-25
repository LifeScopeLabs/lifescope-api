babel apollo -d dist/api/apollo --presets env,stage-2
babel lib -d dist/api/lib --presets env,stage-2
babel schema -d dist/api/schema --presets env,stage-2
babel server.js -d dist/api --presets env,stage-2
cp -r fixtures dist/api
cp -r schemas dist/api
cp .babelrc dist/api