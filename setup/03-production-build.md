# Building and running LifeScope API in a cloud production environment
Once you have a MongoDB cluster running and have set up a BitScoop account, created maps for all of the services, and saved the credentials for that service in its respective Map, you have everything you need to run the API.
The API server was designed to be uploaded and run via Kubernetes. To date it has only been tested on AWS' Elastic Kubernetes Service (and locally on minikube).
All further instructions will assume AWS technologies since we can speak to them; using another cloud provider should
work similarly, just with appropriate deviations to account for how Google/Microsoft/etc. clouds work in practice. 

## Location of Kubernetes scripts

This guide references Kubernetes configuration scripts. 
These scripts are all located in [a separate repository](https://github.com/lifescopelabs/lifescope-kubernetes).

## Create config file
You'll need to create a new file in the config folder called production.json.
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

## Obtain SSL certificate
IF you want your server to be secure, you'll need to purchase a domain name and then register the domain or subdomain 
that you want to use for LifeScope with Amazon Certificate Manager.

## Install node_modules
Run npm install or yarn install (npm or yarn must already be installed).

## Run migrations
NOTE: If you've already done this while setting up the app, you can skip this entire step here.

You'll need to run the two migrations in the migrations folder via 'NODE_ENV=production node --experimental-modules migrations/<name>.js'.
The first migration creates indices on each collection that LifeScope stores in the database.
The second loads the LifeScope Providers into the database. 
Make sure that you've replaced the remote_map_id's in the Providers with the BitScoop Map IDs you've created.


#Set up DockerHub account, containerize API via Docker, and run in a Kubernetes Cluster
The LifeScope API can be run in a Kubernetes Cluster via containerizing the code with Docker and uploading the image to DockerHub.

## Set up DockerHub account and install Docker on your machine
This guide will not cover how to set up a DockerHub account or a local copy of Docker since the instructions provided 
by the makers of those services are more than sufficient.
Once you've created a DockerHub account, you'll need to make two public repositories, most easily named ```lifescope-api```
and ```lifescope-app```. If you use different names, you'll have to change the image names in the various .yaml files
in the /kube/* directories.

## Containerize the API with Docker (optional)

*LifeScope has a Docker Hub account with repositories for images of each of the applications that make up the service.
The Kubernetes scripts are coded to pull specific versions from the official repos.
If you want to pull from a repo you control, do the following:*

After installing Docker on your machine, from the top level of this application run ```docker build -t <DockerHub username>/lifescope-api:vX.Y.Z .```.
X,Y, and Z should be the current version of the API, though it's not required that you tag the image with a version.

You'll then need to push this image to DockerHub so that the Kubernetes deployment can get the proper image.
Within prod/lifescope-api.yaml, you'll see a few instances of an image name that points to an image name, something along
the lines of lifescope/lifescope-api:v4.0.0. Each instance of this will need to be changed to <DockerHub username>/<public repo name>:<version name>.
For example, if your username is 'cookiemonstar' and you're building v4.5.2 of the API, you'd change the 'image' field 
wherever it occurs in prod/lifescope-api.yaml to ```cookiemonstar/lifescope-api:v4.5.2```.
This should match everything following the '-t' in the build command.

Once the image is built, you can push it to DockerHub by running ```docker push <imagename>```, e.g. ```docker push cookiemonstar/lifescope-api:v4.5.2```.
You're now ready to deploy the Kubernetes cluster.

## Deploy Kubernetes cluster
This guide is copied almost verbatim in lifescope-app, so if you've already set up that, you can skip straight to
running the lifescope-api script.

### Install eksctl and create Fargate cluster
Refer to [this guide](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html) for how to set up
eksctl.

To provision the Fargate cluster, run ```eksctl create cluster -f kube/prod/aws-cluster.yaml```

### Run Nginx script and provision DNS routing to Load Balancer

From the top level of this repo, run ```kubectl apply -f kube/prod/nginx.yaml```.
This will install nginx in your K8s cluster. After a minute or so the Load Balancer that is set up will have provisioned
an external IP, which you can get by running ```kubectl get service -n nginx-ingress``` and looking in the column 'EXTERNAL-IP'.

This external IP will need to be used in a few places.

First, go to [AWS Route53 -> Hosted zones](https://console.aws.amazon.com/route53/home?#hosted-zones:).
Create a Hosted Zone for the top-level domain you're using.
Within that, create a Record Set. The Name can be left blank, Type should be 'A - IPv4 address', set Alias to 'Yes',
and under Alias Target enter 'dualstack.<external-IP>' (if you click on the text box for Alias Target, a prompt scrollable box
should pop up with various resources you have in AWS; the Load Balancer for Nginx should be under 'ELB Classic load balancers'
and if clicked on it should autocomplete everything properly). Click Create when this is all entered.

Next, you'll need to make two CNAMEs with your domain registrar from 'app' and 'api' to the external IP.

### Create 'lifescope' namespace

Run the following command to create a namespace called 'lifescope' in the Kubernetes cluster:
```kubectl apply -f kube/prod/lifescope-namespace.yaml```

### Create appropriate secret config

The config files containing credentials for development and production environments are intentionally not committed.
They are also ignored by Docker when building the image so that they don't end up in a publicly-available image.
In order to get these files into the Kubernetes environment, you must package them into a Secret.
This Secret must be created manually instead of being part of the overall deployment in kube/**/lifescope-api.yaml
and must be applied before running the deployment script.

Your config files should be located in the config/ directory, e.g. config/dev.json or config/production.json.
Run the following command to create the secret:
```kubectl create secret generic lifescope-api-dev-config -n lifescope --from-file=config/dev.json```
or
```kubectl create secret generic lifescope-api-prod-config -n lifescope --from-file=config/production.json```

The later deployment script expects those exact names, so if you want to call them something else, you'll have to
change kube/**/lifescope-api.yaml.

### Run API K8s script

From the top level of this repo, run ```kubectl apply -f kube/prod/lifescope-api.yaml```.

If this ran properly, you should be able to go to api.<domain>/gql-p and see the GraphQL Playground running. 

# Build and run in AWS Elastic Beanstalk (Deprecated)
The LifeScope API can be bundled and run via AWS Elastic Beanstalk.
NOTE: This was last successfully tested and run in version 3.5.3 of the API. Version 4.0.0 switched to using Node 12
with its --experimental-modules support for ES6 imports, as well as switching to running it in production using
Kubernetes. Some additional work may be needed to make the current iteration of the code work in this environment.

## Build and package the files
Run 'npm run build'.
When that's finished, run 'gulp bundle:ebs'.
The end result should be a .zip file in the dist/ folder called 'lifescope-api-ebs.x.y.x.zip'.

## Create Elastic Beanstalk
Create an AWS account if you don't have one already.
Go to the home page for Elastic Beanstalk and create a new Application.
Within this application, create a new Environment.
The type should be 'Web server environment'.
Give it a name and select a domain (this domain will have to be unique).
For Platform, pick 'Preconfigured platform' and select 'node.js'.

For Application code, select 'Upload your code', then click on the Upload button.
For Source code origin keep 'Local file' selected, then click 'Choose file', navigate to the lifescope-api/dist folder, and select the lifescope-api-ebs .zip file that was generated.
You'll probably want to use a version label such as 'api-v1' (or 'api-v2', 'api-v3', etc. if you recompile the code later)
 
Next click the Upload button in the lower right and then click 'Configure more options'.
First Modify 'Software'.
Change the node.js version to 8.11.1 (or whatever the latest version is).
The node command needs to be 'npm run serve', and you should add an Environment property with Name 'NODE_ENV' and Value 'production'.
Click Save to lock these options in.

You can change the virtual hardware this runs on in the Instances and Capacity pages.
How you want to configure this is up to you and your wallet, but under Capacity you do need to set the Environment type to 'Load balanced'.

You then should modify the Load Balancer.
Select 'Application Load Balancer', then add a listener on port 443 over HTTPS.
Select the SSL certificate you registered in ACM, select an SSL policy, then click 'Add'.
You then need to select the 'default' process, then select 'Options'->Edit, and change the HTTP code to 204 and the path to '/health', then click Save.
Finally, click Save.

Everything should be configured at this point, so click 'Create environment'.
Elastic Beanstalk should take a few minutes to set up everything for you.
When it's done, you should be able to hit the URL followed by '/gql-i', and a GraphiQL interface should appear.


