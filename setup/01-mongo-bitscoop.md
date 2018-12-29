# Setting up MongoDB and BitScoop

The two major pieces of external tech that LifeScope relies on are MongoDB for data storage and BitScoop for data retrieval from APIs.
You will need to set up both of these services for LifeScope to work.

Note that the instructions in this file are replicated in all components of LifeScope - lifescope-api, lifescope-app, and Lifescope-Core.
You only need to perform this setup once; the instructions are duplicated so that you don't miss any steps that are critical to that component's base functionality.

## MongoDB

Any instance of MongoDB is acceptable, whether it's running on your local machine, running in the cloud, or created and managed by a hosted service such as MongoDB Atlas.
The important thing you'll need is the address string, which is in the general form 'mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]' (see more at https://docs.mongodb.com/manual/reference/connection-string/).
If you're running it locally, it should be 'mongodb://localhost:27017'.
MongoDB Atlas will provide the entire connection string other than the username and password if you click the 'Connect' button on your cluster and then click 'Connect your Application'.
As of the time of writing, the version of Mongoose that the API uses runs Mongo driver 3.0.9, so you must select the connection string for version 3.4 and below.

## BitScoop

LifeScope uses the handy and powerful API integration platform [BitScoop](https://bitscoop.com) to handle the acquisition of user credentials for supported services and the retrieval of data from those services.
You need to create a BitScoop account, then create a Map for each service from templates that can be found in fixtures/maps.
Take note of the Callback URL for each Map once it's been created, as you usually need that for the following step.  
After each Map is created, you'll need to obtain credentials for the service, then edit the Map, put the credentials in their proper places, and save the Map.
These credentials are usually obtained by creating a developer account and/or app with the service; individual details are found below.

One other thing you need to do is create an API key in BitScoop, then edit that key and enable all of the scopes (by default all scopes are disabled).

The final thing you'll need to do after creating each map is replace the field 'remote_map_id' in the provider in 'fixures/providers/<service>.json' with the ID of the Map you created for that service.

### Dropbox
Create an account with Dropbox if you don't have one already.
When you're signed in, go to [your developer apps page](https://www.dropbox.com/developers/apps).
Create a new app; it should be for the Dropbox API (not the Business API) and should have full Dropbox access.
Give it a name and click Create; you should be taken to the Settings page for the new app.
On the settings page, you need to copy the Callback URL from the API Map you made into 'OAuth2 Redirect URIs'; amke sure to click the Add button.
Copy the App key and App secret into 'auth_key' and 'auth_secret', respectively, in the 'auth' portion of the Map, then save the Map.

#### Facebook
Create a developer account with Facebook if you don’t have one already.
When you’re signed in, go to [your apps page](https://developers.facebook.com/apps).
Click on Add a New App.
Enter a name for this app and click Create App ID, then solve the Captcha if asked.
You should be taken to the Add Product page for the new app.

Click the ‘Get Started’ button for Facebook Login.
This should add it to the list of Products at the bottom of the left-hand menu.
We don’t need to go through their quickstart, so click on the Login product and then go to its Settings.
Copy the Map’s Callback URL into ‘Valid OAuth redirect URIs’ and make sure to Save Changes.
Now go to the app’s Basic Settings and copy the App ID and App Secret into ‘auth_key’ and ‘auth_secret’, respectively, in the auth portion of the Map, then save the Map.

### GitHub
Create an account with GitHub if you don’t have one already.
When you’re signed in, go to [your developer settings page](https://github.com/settings/developers).
Click on Register a New Application.
Enter a name and homepage URL, and copy the Callback URL from the API Map you made into ‘Authorization callback URL’.
Click Register Application.
You should be taken to the settings for the application you just made.
Go back to the details for the API Map and click ‘Source’ in the upper right to edit the Map.
Copy the Client ID and Client Secret from the GitHub application into ‘auth_key’ and ‘auth_secret’, respectively, in the ‘auth’ portion of the Map, then save the Map.

Repeat the above steps starting with registering a new application to make a separate application and Map for GitHub Login.
GitHub does not allow for multiple callback URLs on the same application, so for simplicity we're using one Map for Login and another Map for retrieving data.

 - GitHub API Documentation https://developer.github.com/

### Google
Create an account with Google if you don't have one already.
Go to the Google API Console for [People](https://console.developers.google.com/apis/api/people.googleapis.com/overview), [Drive](https://console.developers.google.com/apis/api/drive.googleapis.com/overview) and [Gmail](https://console.developers.google.com/apis/api/gmail.googleapis.com/overview) and make sure all are enabled (plus any other services if we've added more data sources and have forgotten to update this documentation).
Next click on ‘Credentials’ on the left-hand side, underneath ‘Dashboard’ and ‘Library’. Click on the blue button ‘Create Credentials’ and select ‘OAuth client id’.
Choose application type ‘Web application’, then in ‘Authorized redirect URIs’ enter the Callback URL that can be found on the Details page for the API Map you created for Google Analytics; it should be in the form https://auth.api.bitscoop.com/done/<map_id>.
Click ‘Create’ twice; it should show a pop-up with your client ID and secret. These will be entered in the API Map as the auth_key and auth_secret, respectively, in the ‘auth’ portion of the map.

- Google Analytics API Documentation:

 https://developers.google.com/analytics/
- Google API Console for Analytics:

 https://console.developers.google.com/apis/api/analytics.googleapis.com/overview

### Instagram
Create an account with Instagram if you don't have one already.
Go to the [Instagram Developer Client Management](https://www.instagram.com/developer/clients/manage) and click on Register a New Client.
Fill in the required fields, in particular copying the Callback URL from the API Map you made into 'Valid Redirect URIs', then click Register.
When the client is created, click Manage and copy the Client ID and Client Secret into auth_key and auth_secret in the 'auth' portion of your Instagram Map. Make sure to save the Map.

### Pinterest
Create an account with Pinterest if you don't have one already.
Go to [your developer apps](https://developers.pinterest.com/apps/) and create a new app; give it a name and description and click Create.
Go to the app's settings once it's created and, under Web, enter the Callback URL from the Map under 'Redirect URIs' and make sure it's saved.
Then, copy the App ID and App secret into 'auth_key' and 'auth_secret', respectively, in the 'auth' portion of the Map, then save the Map.

### reddit
Create an account with reddit if you don't have one already.
Go to [your reddit app preferences](https://www.reddit.com/prefs/apps/), scroll down to 'developed applications', and click on the button to create an app.
Give it a name, make sure 'web app' is selected for the type, and copy the Callback URL from the API Map you made into 'redirect uri', then click 'create app'.
When it's created, click the 'edit' link inside of the app.
Copy the string to the right of the icon into 'auth_key' and also copy the 'secret' into 'auth_secret' in the 'auth' block in the reddit Map. Make sure to save the Map.

### Spotify
On our [GitHub page](h
Create an account with Spotify if you don't have one already.
Go to [your Spotify Developer applications](https://developer.spotify.com/my-applications/#!/applications) and create a new app.
When it's created, copy the Redirect URL from the map you made into 'Reirect URIs'. Make sure to save the application.
Copy the Client ID and Client Secret into 'auth_key' and 'auth_secret' in the 'auth' block in the Spotify Map. Make sure to save the Map.

### Steam
Create an account with Steam if you don't have one already.
Go to [your Steam API key page](http://steamcommunity.com/dev/apikey) and create an API key.
Copy this into 'auth_key' in the 'auth' block in the API Map. Make sure to save the Steam Map.

### Twitter
Create an account with Twitter if you don't have one already.
Go to [your Twitter apps](https://apps.twitter.com) and create a new app.
Fill in the required fields and copy the Callback URL from the API Map you made for Twitter into 'Callback URL'.
Check the box to agree to the Developer Agreement and click the Create button.
Click on the app that was just created.
Click on the Permissions tab and select the 'Read, Write, and Access direct messages' option, then click 'Update Settings'.
Click on the 'Keys and Access Tokens' tab and copy the Consumer Key and Consumer Secret into 'auth_key' and 'auth_secret' in the 'auth' portion of your Twitter Map. Make sure to save the map.

Repeat the above steps starting with creating a new app to make a separate application and Map for Twitter Login.
Twitter does not allow for multiple callback URLs on the same application, so for simplicity we're using one Map for Login and another Map for retrieving data.

# [Step 2: Local Build](https://github.com/LifeScopeLabs/lifescope-api/blob/master/setup/02-local-build.md)