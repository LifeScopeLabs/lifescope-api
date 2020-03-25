# Building and running LifeScope API in a local Kubernetes dev environment
Once you have a MongoDB cluster running and have set up a BitScoop account, created maps for all of the services, and 
saved the credentials for that service in its respective Map, you have everything you need to run the API.
The API server was designed to be uploaded and run via Kubernetes.
On a local machine, this can be accomplished via [Minikube](https://kubernetes.io/docs/setup/learning-environment/minikube/).

Instructions for installing Minikube can be found [here](https://kubernetes.io/docs/tasks/tools/install-minikube/).

## Update hostfile to direct dev.lifescope traffic to Minikube's IP

Minikube listens for external traffic on a local IP.
This IP can be obtained by running ```minikube ip```.

In dev mode, LifeScope by default runs each service on the domain <service>.dev.lifescope.io.
For the API, this would be api.dev.lifescope.io.
To get your machine to direct LifeScope dev browser traffic to the Kubernetes cluster, you'll need to update your hostfile
(usually ```/etc/hosts```); you may need root priveleges to edit this file.
Add a line like the following, and make sure to save it:

```192.168.99.109  api.dev.lifescope.io app.dev.lifescope.io embed.dev.lifescope.io xr.dev.lifescope.io nxr.dev.lifescope.io```

The IP at the start should be whatever the output of ```minikube ip``` returned.

## Location of Kubernetes scripts

This guide references Kubernetes configuration scripts. 
These scripts are all located in [a separate repository](https://github.com/lifescopelabs/lifescope-kubernetes).

## Create config file
You'll need to create a new file in the config folder called dev.json.
The gitignore contains this filename, so there's no chance of accidentally committing it.

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

## Install node_modules
Run npm install or yarn install (npm or yarn must already be installed).

## Run migrations
NOTE: If you've already done this while setting up the app, you can skip this entire step here.

You'll need to run the two migrations in the migrations folder via 'NODE_ENV=dev node --experimental-modules migrations/<name>.js'.
The first migration creates indices on each collection that LifeScope stores in the database.
The second loads the LifeScope Providers into the database. 
Make sure that you've replaced the remote_map_id's in the Providers with the BitScoop Map IDs you've created.


## Containerize API via Docker and run in a Kubernetes Cluster
The LifeScope API can be run in a Kubernetes Cluster via containerizing the code with Docker.

Containerized builds of the codebase can be found on LifeScope Labs' Docker hub, ```lifescopelabs/lifescope-api:vX.Y.Z```.
If you want to build your own, you have two options: build into Minikube's local Docker registry, or build locally and push
to a Docker Hub you control. 

### 1a. Point shell to Minikube's local Docker registry (optional)

By default, Docker uses a distinct local registry when building images.
Minikube has its own local Docker registry, and by default will pull images from Docker Hub into its registry
before spinning up instances of those images.
You can point your Linux/Mac shell to the Minikube registry so that Docker builds directly into Minikube via the following:
```eval $(minikube -p minikube docker-env)```

If you do this, you can skip the following step and go directly to 'Containerize the API with Docker'.

### 1b. Set up Docker Hub account and install Docker on your machine (optional)
*LifeScope has a Docker Hub account with repositories for images of each of the applications that make up the service.
The Kubernetes scripts are coded to pull specific versions from the official repos.
If you're just pulling the official images, you don't need to set up your own Hub or repositories therein.*

*If you followed the previous section and pointed your shell to Minikube's local Docker registry, definitely skip
this step, as it's completely unnecessary.*

This guide will not cover how to set up a Docker Hub account or a local copy of Docker since the instructions provided 
by the makers of those services are more than sufficient.
Once you've created a Docker Hub account, you'll need to make public repositories for each of the lifescope services you
want to run. At the very least, you'll want to run lifescope-api and lifescope-app, and the Docker Hubs for those are 
most easily named ```lifescope-api```and ```lifescope-app```. If you use different names, you'll have to change the 
image names in the Kubernetes config files for each repo in the lifescope-kubernetes sub-directories for those services.

### 2. Containerize the API with Docker (optional)

*LifeScope has a Docker Hub account with repositories for images of each of the applications that make up the service.
The Kubernetes scripts are coded to pull specific versions from the official repos.
If you want to pull from a repo you control, do the following:*

After installing Docker on your machine, from the top level of this application run ```docker build -t <Docker Hub username>/lifescope-api:vX.Y.Z .```.
X,Y, and Z should be the current version of the API, though it's not required that you tag the image with a version.

You'll then need to push this image to Docker Hub so that the Kubernetes deployment can get the proper image.
Within lifescope-kubernetes/lifescope-api/base/lifescope-api.yaml, you'll see a few instances of an image name that points to an image name, something along
the lines of lifescopelabs/lifescope-api:v4.0.0. Each instance of this will need to be changed to <Docker Hub username>/<public repo name>:<version name>.
For example, if your username is 'cookiemonstar' and you're building v4.5.2 of the API, you'd change the 'image' field 
wherever it occurs in base/lifescope-api.yaml to ```cookiemonstar/lifescope-api:v4.5.2```.
This should match everything following the '-t' in the build command.

Once the image is built, you can push it to Docker Hub by running ```docker push <imagename>```, e.g. ```docker push cookiemonstar/lifescope-api:v4.5.2```.
If you're using Minikube's Docker registry, skip this push command because Minikube already has the image.
You're now ready to deploy the Kubernetes cluster.

### Run Nginx Kustomize config

From the top level of the lifescope-kubernetes repo, run ```kubectl apply -k lifescope-nginx/base```.
This will install nginx in your K8s cluster. 

### Run API Kustomize script

*Before running this, make sure that you have the dev.json file from the config folder in lifescope-kubernetes/lifescope-api/base*

From the top level of the lifescope-kubernetes repo, run ```kubectl apply -k lifescope-api/base```.

If this ran properly, you should be able to go to api.dev.lifescope.io/gql-p and see the GraphQL Playground running. 

