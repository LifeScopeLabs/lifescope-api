# Building and running LifeScope API locally
Once you have a MongoDB cluster running and have set up a BitScoop account, created maps for all of the services, and saved the credentials for that service in its respective Map, you have everything you need to run the API.

## Create config file
You'll need to create a new file in the config folder called local.json, or dev.json, or whatever you'd like other than 'default.json' and 'production.json'.
The gitignore covers 'local.json' and 'dev.json', so if you call it anything else, be sure not to add it to git.

This new config file only needs a few lines, because the 'config' library first pulls everything from 'default.json' and then overrides anything that it finds in other config files it uses.
The config file should look like this:

```
{
  "mongodb": {
	"address": "<insert address>"
  },
  "bitscoop": {
	"api_key": "<insert API key>"
  }
}
```

## Run migrations
You'll need to run the two migrations in the migrations folder via 'NODE_ENV=local node migrations/<name>.js' (or NODE_ENV=dev, or whatever you named your config file).
The first migration creates indices on each collection that LifeScope stores in the database.
The second loads the LifeScope Providers into the database. 

## Install node_modules
Run npm install or yarn install (npm or yarn must already be installed).

## Edit hostfile and run local nginx config
You'll need to edit your hostfile to redirect traffic to *.lifescope.io to your local servers.
On Linux and Mac, run 'sudo gedit /etc/hosts', then add a line

```
127.0.0.1 api.lifescope.io app.lifescope.io xr.lifescope.io nxr.lifescope.io
```

Make sure to save this.
It may take a few minutes for the hostfile to be recognized; rebooting your computer should guarantee it.

Next, shut down any currently-running nginx with

```
sudo service nginx stop
```

and then, when navigated to the top level of the lifescope-api directory, run 

```
sudo nginx -p . -c nginx.conf
```

This will run nginx configured to redirect traffic to the four subdomains we added to the hostfile to the appropriate ports on localhost.
The nginx configuration forces SSL using some self-signed certificates found in the cert/ directory.
You will need to hit all of those URLs in a browser and accept the fact that they're not backed by a valid Cert Authority in order for traffic to get through. 

Note that you will be unable to access the public instances of LifeScope while this is running, as traffic to those lifescope subdomains is being re-routed to localhost.
If you would like to run this locally while still having access to the public version, replace the domain in both hostfile and the nginx configuration with something else, e.g.

```
127.0.0.1 api.scopelife.io app.scopelife.io xr.scopelife.io nxr.scopelife.io
``` 

and change the 'server_name's in the nginx config to 'api.scopelife.io', etc. 

## Run API locally via nodemon
enter 'npm run start' to run the server using nodemon. 