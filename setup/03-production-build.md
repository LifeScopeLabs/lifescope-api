# Building and running LifeScope API locally
Once you have a MongoDB cluster running and have set up a BitScoop account, created maps for all of the services, and saved the credentials for that service in its respective Map, you have everything you need to run the API.
The API server was designed to be uploaded and run via AWS Elastic Beanstalk.

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

## Run migrations
You'll need to run the two migrations in the migrations folder via 'NODE_ENV=production node migrations/<name>.js'.
The first migration creates indices on each collection that LifeScope stores in the database.
The second loads the LifeScope Providers into the database. 

## Obtain SSL certificate
IF you want your server to be secure, you'll need to purchase a domain name and then register the domain or subdomain that you want to use for LifeScope with Amazon Certificate Manager.

## Install node_modules
Run npm install or yarn install (npm or yarn must already be installed).

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
Select the SSL certificate you registered in ACM, and select an SSL policy.
Finally, click Save.

Everything should be configured at this point, so click 'Create environment'.
Elastic Beanstalk should take a few minutes to set up everything for you.
When it's done, you should be able to hit the URL followed by '/gql-i', and a GraphiQL interface should appear.