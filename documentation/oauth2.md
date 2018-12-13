# LifeScope OAuth2 documentation

## OAuth2 apps

OAuth2 is a protocol that lets external applications or services access a user's data without giving the third-party service access to the user's credentials.
In the context of LifeScope, this means that the third-party service does not have access to a user's OAuth Tokens for their Connections to other services.

When integrating your service with LifeScope, you must first create an OAuth App in LifeScope and fill out some required information.
You must redirect your users to a URL containing information specific to your OAuth app.
Each user will be shepherded through a standard workflow granting your OAuth app permission to access the information you've requested.
If approved, your service will receive an OAuth token that you can use to make requests to the LifeScope API on behalf of that user.

### Creating an OAuth app

1) Go to the [Developer settings page](https://app.lifescope.io/settings/developer) in LifeScope and click the button 'Generate New OAuth App' under 'OAuth2 Apps'.  
2) Enter a name, description homepage URL, and privacy policy URL in the appropriate fields; all are required.  
3) When the app is created, you should be redirected to the the page for it. You must enter at least one redirect URI; this is where the app will redirect user traffic once they have authorized your access to their data.  
4) Click the 'Save App' button to save any changes you've made, including changes to Redirect URIs.  

OAuth apps have two keys for identification, a ```client_id```, which is a public key, and a ```client_secret```, which is a private key.
The ```client_secret``` should never be given out to anyone, and is hidden by default on the page for your app.
If you ever suspect that the secret may have leaked, you can refresh it.
Any tokens generated with the old secret will still be valid, but new tokens will only be able to be generated with the new secret.
The page for your app also lets you invalidate all of the existing keys for your app at any time.

### Authorizing apps

#### General workflow

1) Your app generates a LifeScope URL for the user to follow in a browser; this URL contains information specific to your OAuth app and the scope of information you are requesting.  
2) The user is redirected to that URL and chooses to accept or deny your app's request for access.  
3) If accepted, a short-term code is generated, and the user is redirected back to your site via an approved Redirect URI that you registered in your OAuth app.  
4) Your servers exchange this code for an access token, and you should save this token in some database.  
5) Your application uses the access token to make requests for the user's information.  
6) (Optional) Your application refreshes the access_token once it's expired.   

#### User Authorization (steps 1-3 above)

You must generate and redirect users to a LifeScope URL that will allow them to approve your request for credentials on their behalf.
The base URL for this authorization is

```
https://app.lifescope.io/auth
```

There are several query parameters that can be sent as part of this request, and the majority of those are required.

**Outgoing Parameters** (Required are bolded)

| Name | Type | Description |
| :--- | :--- | :--- |
| **client_id** | string | The client_id for your registered OAuth app. |
| **redirect_uri** | string | A redirect URI registered to your Oauht app. This is where the user will be redirected with the short-term key after they've authorized your app. |
| **scope** | string | A comma-delimited list of scopes that your app is requesting access to. See the section on scopes for more detail on what scopes are available. |
| **response_type** | string | Must be 'code'.
| state | string | A unique identifier that is passed through the authorization process and handed back to you alongside the short-term code. This identifier is used to authenticate requests on your end and/or determine which request you are receiving. |

An example of a fully-hydrated authorization request would be

```
GET https://app.lifescope.io/auth?client_id=abc123&redirect_uri=https%3A%2F%2Fexample.com%2Fauth&scope=basic,events%3Aread&response_type=code&state=abc123def456
```  
When the user is sent to this URL, they will be told that your app is requesting access to the scopes specified in the URL.
They can either allow or deny this request.
If they deny it, they will be directed back to the specified redirect_uri along with two query parameters:

**Incoming Parameters**

| Name | Type | Value |
| :--- | :--- | :--- |
| error | string | access_denied |
| error_description | string | The user denied the request |

Most other errors, such as invalid scopes or missing parameters, will be returned to your redirect_uri in a similar fashion.
The only exceptions are if the client_id is invalid or the redirect_uri is not associated with that oauth app.
In those situations, the errors will just be displayed on the screen so not to redirect the user to potentially malicious URLs.

If the user allows the request and there are no errors, they will be redirected to the redirect URI with two query parameters

**Incoming Parmaeters**

| Name | Type | Description |
| :--- | :--- | :--- |
| code | string | A short-term code used to authorize the next step of the process. |
| state | string | The state variable you optionally passed as part of the authorization URL |

#### Exchanging the code for an access token (step 4 above)

At this point, your server will have received a request with query parameters ```code``` and, optionally, ```state```.
If you passed a ```state``` as part of the authorization request, you should verify that it was returned unchanged.
You must then make a request to another LifeScope endpoint to exchange this code for an access token.
This can either be done via GraphQL or a REST endpoint.

##### GraphQL

All GraphQL queries are made via a POST to ```https://api.lifescope.io/gql```.
This operation is a Mutation, and the name of the operation is 'oauthTokenAccessToken'.

As with the authorization step, there are several variables that can be passed as part of the request.
ALL of them are required.


**Outgoing Variables** (Required are bolded)

| Name | Type | Description |
| :--- | :--- | :--- |
| **grant_type** | string | Must be 'authorization_code' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **redirect_uri** | string | The redirect_uri that was used to obtain the code. It must exactly match the redirect_uri used to obtain the code. |
| **code** | string | The code you received back from the authorization step. |

The response will have three fields

**Returned Fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| access_token | string | The scoped token that you can use to access the user's information. |
| refresh_token | string | A token used to generate a new access_token when the current one expires. |
| expires_in | string | The number of seconds until the access_token becomes invalid. This is generally one month from the exchange. |

Here's an example of the request:

```
mutation oauthTokenAccessToken($grant_type: String!, $code: String, $redirect_uri: String!, $client_id: String!, $client_secret: String!) {
  oauthTokenAccessToken(grant_type: $grant_type, code: $code, redirect_uri: $redirect_uri, client_id: $client_id, client_secret: $client_secret) {
    access_token,
    refresh_token,
    expires_in
  }
}
```

Save the ```access_token``` and ```refresh_token``` somewhere for later use.

##### REST

Make a POST request to 

```
https://api.lifescope.io/auth/access_token
```

with the following parameters:


**Outgoing Parameters** (Required are bolded)

| Name | Type | Description |
| :--- | :--- | :--- |
| **grant_type** | string | Must be 'authorization_code' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **redirect_uri** | string | The redirect_uri that was used to obtain the code. It must exactly match the redirect_uri used to obtain the code. |
| **code** | string | The code you received back from the authorization step. |


The response will be in JSON format and will have the following fields:

**Returned Fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| access_token | string | The scoped token that you can use to access the user's information. |
| refresh_token | string | A token used to generate a new access_token when the current one expires. |
| expires_in | string | The number of seconds until the access_token becomes invalid. This is generally one month from the exchange. |

Here's an example request:

```
POST https://api.lifescope.io/auth/access_token?grant_type=authorization_code&client_id=abc123&client_secret=abcdefghijklmnop1234567890&redirect_uri=https%3A%2F%2Fexample.com%2Fauth&code=1234abcd
```

Save the ```access_token``` and ```refresh_token``` somewhere for later use.

#### Making requests with the access_token (step 5 above)

LifeScope data endpoints are **only** accessible via GraphQL. If you are unfamiliar with it, [here's a good primer](https://graphql.org/learn/).

To use the token, you must pass it as a Bearer token in an Authorization header like so:

```
Authorization: Bearer <token>
```

If the token does not have the appropriate scope, an error message will be returned stating so.

#### Refreshing the access token (step 6 above)

By default, access tokens generated on behalf of a user will expire a month from their generation and will not work after that.
Your application gets handed a refresh token when it first gets the access_token, and this refresh token lets your app get new access tokens when old ones expire.
The request you make is similar to the one used to get the access_token in the first place, and like that operation, this can be done via GraphQL or REST:

##### GraphQL

All GraphQL queries are made via a POST to ```https://api.lifescope.io/gql```.
This operation is a Mutation, and the name of the operation is 'oauthTokenAccessToken'.

The variables you pass are slightly different than the original access_token request

**Outgoing Variables** (Required are bolded)

| Name | Type | Description |
| :--- | :--- | :--- |
| **grant_type** | string | Must be 'refresh_token' for this operation. |
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **refresh_token** | string | The refresh token associated with the access_token you want to refresh. |

The response will have two fields

**Returned Fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| access_token | string | The new scoped token that you can use to access the user's information. |
| expires_in | string | The number of seconds until the access_token becomes invalid. This is generally one month from the exchange. |

Note that there's no new refresh_token.
The refresh token will never expire unless the user or you purge the token it's associated with.

Here's an example of the request:

```
mutation oauthTokenAccessToken($grant_type: String!, $refresh_token: String, $client_id: String!, $client_secret: String!) {
  oauthTokenAccessToken(grant_type: $grant_type, refresh_token: $refresh_token, client_id: $client_id, client_secret: $client_secret) {
    access_token,
    expires_in
  }
}
```

Overwrite the old ```access_token``` with the new one.

##### REST

Make a POST request to 

```
https://api.lifescope.io/auth/access_token
```

with the following parameters:


**Outgoing Parameters** (Required are bolded)

| Name | Type | Description |
| :--- | :--- | :--- |
| **grant_type** | string | Must be 'refresh_token' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **refresh_token** | string | The refresh token associated with the access_token you want to refresh. |


The response will be in JSON format and will have the following fields:

**Returned Fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| access_token | string | The new scoped token that you can use to access the user's information. |
| expires_in | string | The number of seconds until the access_token becomes invalid. This is generally one month from the exchange. |

Here's an example request:

```
POST https://api.lifescope.io/auth/access_token?grant_type=refresh_token_token&client_id=abc123&client_secret=abcdefghijklmnop1234567890&redirect_uri=https%3A%2F%2Fexample.com%2Fauth&refresh_token=abcdefghijklmnop1234567890
```

Overwrite the old ```access_token``` with the new one.


## OAuth2 Endpoints

Many of the GraphQL endpoints used by the LifeScope app are available via OAuth with appropriate scopes.
As of this writing, due to the close links between Events and Contacts/Content/Locations, any endpoint covered by one of the latter scopes is also accessible using the Events scope.
The LifeScope GraphQL URL is ```https://api.lifescope.io/gql```.
For futher documentation on the LifeScope Schema, see [here](https://lifescope.io/schema).

### contactCount (query)

Returns a count of the Contacts matching the filter.

**Scopes**

```contacts:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Contact field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "name": "Google"}, { "handle": "no-reply@google.com"] |

**Returned fields**

As with all counts, the returned data is an integer, not an object with its own fields, e.g.

```
{
    "data": {
        "contactCount": 6492
    },
}
```

### contactOne (query)

Returns the first Contact that matches the filter.
If you're doing complex searches of Contacts, you should probably use the mutation 'contactSearch' instead.

**Scopes**

```contacts:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Contact field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "name": "Google"}, { "handle": "no-reply@google.com"] |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Contact's ```_id```. |
| avatar_url | String | The URL to the Contact's avatar image. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Contact. |
| connection_id_string | String | A virtual field containing a human-readable form of the Contact's ```connection_id```. |
| created | Date | When the the Contact was first created in LifeScope. |
| handle | String | The user's unique identifier in the third-party service, e.g. their email address or Twitter handle. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Contact. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| name | String | The user's real name as recorded in the third-party service, e.g. 'Jane Doe'.
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Contact. |
| provider_id_string | String | A virtual field containing a human-readable form of the Contact's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Contact was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Contact. See the section on tagMasks for further clarification. |
| updated | Date | The last time the Contact was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Contact. |
| user_id_string | String | A virtual field containing a human-readable form of the Contact's ```user_id```. |

### contactMany (query)

Returns a list of Contacts that match the filter.
If you're doing complex searches of Contacts, you should probably use the mutation 'contactSearch' instead.

**Scopes**

```contacts:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Contact field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "name": "Google"}, { "handle": "no-reply@google.com"] |
| limit | Integer | The maximum number of results to return. |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Contact's ```_id```. |
| avatar_url | String | The URL to the Contact's avatar image. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Contact. |
| connection_id_string | String | A virtual field containing a human-readable form of the Contact's ```connection_id```. |
| created | Date | When the the Contact was first created in LifeScope. |
| handle | String | The user's unique identifier in the third-party service, e.g. their email address or Twitter handle. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Contact. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| name | String | The user's real name as recorded in the third-party service, e.g. 'Jane Doe'.
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Contact. |
| provider_id_string | String | A virtual field containing a human-readable form of the Contact's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Contact was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Contact. See the section on tagMasks for further clarification. |
| updated | Date | The last time the Contact was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Contact. |
| user_id_string | String | A virtual field containing a human-readable form of the Contact's ```user_id```. |

### contactSearch (mutation)

Returns a list of Contacts that match the search parameters.
If you're doing complex searches of Contacts, you should probably use this instead of the 'contactMany' query.

**Scopes**

```contacts:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| q | String | A query string used to perform a text search. |
| sortField | String | The field to sort results on. |
| sortOrder| String | Either 'asc' or 'desc'. |
| filters | String | An object containing search Filter, but JSON stringified right before being sent. See the section 'Search Filters' for full details. |
| limit | Integer | The maximum number of results to return. |
| offset | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Contact's ```_id```. |
| avatar_url | String | The URL to the Contact's avatar image. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Contact. |
| connection_id_string | String | A virtual field containing a human-readable form of the Contact's ```connection_id```. |
| created | Date | When the the Contact was first created in LifeScope. |
| handle | String | The user's unique identifier in the third-party service, e.g. their email address or Twitter handle. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Contact. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| name | String | The user's real name as recorded in the third-party service, e.g. 'Jane Doe'.
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Contact. |
| provider_id_string | String | A virtual field containing a human-readable form of the Contact's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Contact was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Contact. See the section on tagMasks for further clarification. |
| updated | Date | The last time the Contact was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Contact. |
| user_id_string | String | A virtual field containing a human-readable form of the Contact's ```user_id```. |


### contentCount (query)

Returns a count of the Content matching the filter.

**Scopes**

```content:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Content field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "type": "image"}, { "embed_format": "jpeg"] |

**Returned fields**

As with all counts, the returned data is an integer, not an object with its own fields, e.g.

```
{
    "data": {
        "contentCount": 6492
    },
}
```

### contentOne (query)

Returns the first Content that matches the filter.
If you're doing complex searches of Content, you should probably use the mutation 'contentSearch' instead.

**Scopes**

```content:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Content field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "type": "image"}, { "embed_format": "jpeg"] |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Content's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Content. |
| connection_id_string | String | A virtual field containing a human-readable form of the Content's ```connection_id```. |
| created | Date | When the the Content was first created in LifeScope. |
| embed_content | String | A URL from which an embeddable version of the Content can be retrieved. Not always present. |
| embed_format | String | The format of the ```embed_content```, such as 'email', 'jpeg', or 'mp4'. Not present if there is no ```embed_content```. |
| embed_thumbnail | String | A URL from which an embeddable thumbnail of the Content can be retrieved. Not always present, but can be present even if ```embed_content``` is null. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Content. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| mimetype | String | The specific format of the object, e.g. 'image/jpeg'.  |
| price | Double | The price of the Content, with no specific currency associated. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Content. |
| provider_id_string | String | A virtual field containing a human-readable form of the Content's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Content was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Content. See the section on tagMasks for further clarification. |
| text | String | The text associated with this Content. |
| title | String | A title associated with this Content. |
| type | String | A classification of the Content, such as 'web-page', 'image', 'video', or 'text'. |
| updated | Date | The last time the Content was updated in LifeScope. |
| url | String | A URL at which the the Content can be found. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Content. |
| user_id_string | String | A virtual field containing a human-readable form of the Content's ```user_id```. |


### contentMany (query)

Returns a list of Content that match the filter.
If you're doing complex searches of Content, you should probably use the mutation 'contentSearch' instead.

**Scopes**

```content:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Content field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "type": "image"}, { "embed_format": "jpeg"] |
| limit | Integer | The maximum number of results to return. |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Content's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Content. |
| connection_id_string | String | A virtual field containing a human-readable form of the Content's ```connection_id```. |
| created | Date | When the the Content was first created in LifeScope. |
| embed_content | String | A URL from which an embeddable version of the Content can be retrieved. Not always present. |
| embed_format | String | The format of the ```embed_content```, such as 'email', 'jpeg', or 'mp4'. Not present if there is no ```embed_content```. |
| embed_thumbnail | String | A URL from which an embeddable thumbnail of the Content can be retrieved. Not always present, but can be present even if ```embed_content``` is null. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Content. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| mimetype | String | The specific format of the object, e.g. 'image/jpeg'.  |
| price | Double | The price of the Content, with no specific currency associated. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Content. |
| provider_id_string | String | A virtual field containing a human-readable form of the Content's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Content was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Content. See the section on tagMasks for further clarification. |
| text | String | The text associated with this Content. |
| title | String | A title associated with this Content. |
| type | String | A classification of the Content, such as 'web-page', 'image', 'video', or 'text'. |
| updated | Date | The last time the Content was updated in LifeScope. |
| url | String | A URL at which the the Content can be found. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Content. |
| user_id_string | String | A virtual field containing a human-readable form of the Content's ```user_id```. |


### contentSearch (mutation)

Returns a list of Content that match the search parameters.
If you're doing complex searches of Content, you should probably use this instead of the 'contentMany' query.

**Scopes**

```content:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| q | String | A query string used to perform a text search. |
| sortField | String | The field to sort results on. |
| sortOrder| String | Either 'asc' or 'desc'. |
| filters | String | An object containing search Filter, but JSON stringified right before being sent. See the section 'Search Filters' for full details. |
| limit | Integer | The maximum number of results to return. |
| offset | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Content's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Content. |
| connection_id_string | String | A virtual field containing a human-readable form of the Content's ```connection_id```. |
| created | Date | When the the Content was first created in LifeScope. |
| embed_content | String | A URL from which an embeddable version of the Content can be retrieved. Not always present. |
| embed_format | String | The format of the ```embed_content```, such as 'email', 'jpeg', or 'mp4'. Not present if there is no ```embed_content```. |
| embed_thumbnail | String | A URL from which an embeddable thumbnail of the Content can be retrieved. Not always present, but can be present even if ```embed_content``` is null. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Content. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| mimetype | String | The specific format of the object, e.g. 'image/jpeg'.  |
| price | Double | The price of the Content, with no specific currency associated. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Content. |
| provider_id_string | String | A virtual field containing a human-readable form of the Content's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Content was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Content. See the section on tagMasks for further clarification. |
| text | String | The text associated with this Content. |
| title | String | A title associated with this Content. |
| type | String | A classification of the Content, such as 'web-page', 'image', 'video', or 'text'. |
| updated | Date | The last time the Content was updated in LifeScope. |
| url | String | A URL at which the the Content can be found. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Content. |
| user_id_string | String | A virtual field containing a human-readable form of the Content's ```user_id```. |


### contentFindByIdentifier (query)

Returns a piece of Content by matching the identifier.
There shouldn't be any need to use this, ever, since identifiers are for internal ingestion use only.
This is only used by the browser extension.

**Scopes**

```content:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| id | String | The identifier to search with. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Content's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Content. |
| connection_id_string | String | A virtual field containing a human-readable form of the Content's ```connection_id```. |
| created | Date | When the the Content was first created in LifeScope. |
| embed_content | String | A URL from which an embeddable version of the Content can be retrieved. Not always present. |
| embed_format | String | The format of the ```embed_content```, such as 'email', 'jpeg', or 'mp4'. Not present if there is no ```embed_content```. |
| embed_thumbnail | String | A URL from which an embeddable thumbnail of the Content can be retrieved. Not always present, but can be present even if ```embed_content``` is null. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Content. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| mimetype | String | The specific format of the object, e.g. 'image/jpeg'.  |
| price | Double | The price of the Content, with no specific currency associated. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Content. |
| provider_id_string | String | A virtual field containing a human-readable form of the Content's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Content was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Content. See the section on tagMasks for further clarification. |
| text | String | The text associated with this Content. |
| title | String | A title associated with this Content. |
| type | String | A classification of the Content, such as 'web-page', 'image', 'video', or 'text'. |
| updated | Date | The last time the Content was updated in LifeScope. |
| url | String | A URL at which the the Content can be found. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Content. |
| user_id_string | String | A virtual field containing a human-readable form of the Content's ```user_id```. |

### eventCount (query)

Returns a count of the Events matching the filter.

**Scopes**

```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Event field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "context": "Received"}, { "type": "messaged"] |

**Returned fields**

As with all counts, the returned data is an integer, not an object with its own fields, e.g.

```
{
    "data": {
        "eventCount": 6492
    },
}
```

### eventOne (query)

Returns the first Event that matches the filter.
If you're doing complex searches of Events, you should probably use the mutation 'eventSearch' instead.

**Scopes**

```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Event field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "context": "Received"}, { "type": "messaged"] |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Event's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Event. |
| connection_id_string | String | A virtual field containing a human-readable form of the Event's ```connection_id```. |
| contact_interaction_type | String | One of ```to```, ```from```, or ```with``` (or undefined) indicating how this Event interacts with the related Contacts. For example, if the Event was a message the user received, this field would be ```from```; if the Event was editing a document that the user shares with others, this field would likely be ```with```. This field may not always be populated.|
| contact_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Contact(s) associated with this Event.|
| contact_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```contact_ids```. |
| content_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Content(s) associated with this Event. |
| content_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```content_ids```. |
| context | String | A short description of what the Event was, e.g. 'Received', 'Purchased', 'Visited Web Page'. |
| created | Date | When the the Event was first created in LifeScope. |
| datetime | Date | When the Event actually occurred in real life. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Event. You shouldn't worry about this, as it's only really used to make sure that, for instance, multiple users' interactions with the same piece of Content aren't confused with each other.
| location_id | Binary | A UUID4 in binary form uniquely identifying the Location associated with this Event. |
| location_id_string | String | A virtual field containing a human-readable form of the Event's ```location_id```. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Event. |
| provider_id_string | String | A virtual field containing a human-readable form of the Event's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Event was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Event. See the section on tagMasks for further clarification. |
| type | String | A one-word categorization of the Event. Examples are 'messaged', 'purchased', 'created'. |
| updated | Date | The last time the Event was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Event. |
| user_id_string | String | A virtual field containing a human-readable form of the Event's ```user_id```. |

### eventMany (query)

Returns a list of Events that match the filter.
If you're doing complex searches of Events, you should probably use the mutation 'eventSearch' instead.

**Scopes**

```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Event field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "context": "Received"}, { "type": "messaged"] |
| limit | Integer | The maximum number of results to return. |
| skip | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Event's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Event. |
| connection_id_string | String | A virtual field containing a human-readable form of the Event's ```connection_id```. |
| contact_interaction_type | String | One of ```to```, ```from```, or ```with``` (or undefined) indicating how this Event interacts with the related Contacts. For example, if the Event was a message the user received, this field would be ```from```; if the Event was editing a document that the user shares with others, this field would likely be ```with```. This field may not always be populated.|
| contact_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Contact(s) associated with this Event.|
| contact_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```contact_ids```. |
| content_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Content(s) associated with this Event. |
| content_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```content_ids```. |
| context | String | A short description of what the Event was, e.g. 'Received', 'Purchased', 'Visited Web Page'. |
| created | Date | When the the Event was first created in LifeScope. |
| datetime | Date | When the Event actually occurred in real life. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Event. You shouldn't worry about this, as it's only really used to make sure that, for instance, multiple users' interactions with the same piece of Content aren't confused with each other.
| location_id | Binary | A UUID4 in binary form uniquely identifying the Location associated with this Event. |
| location_id_string | String | A virtual field containing a human-readable form of the Event's ```location_id```. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Event. |
| provider_id_string | String | A virtual field containing a human-readable form of the Event's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Event was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Event. See the section on tagMasks for further clarification. |
| type | String | A one-word categorization of the Event. Examples are 'messaged', 'purchased', 'created'. |
| updated | Date | The last time the Event was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Event. |
| user_id_string | String | A virtual field containing a human-readable form of the Event's ```user_id```. |

### eventSearch (mutation)

Returns a list of Events that match the search parameters.
If you're doing complex searches of Events, you should probably use this instead of the 'eventMany' query.

**Scopes**

```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| q | String | A query string used to perform a text search. |
| sortField | String | The field to sort results on. |
| sortOrder| String | Either 'asc' or 'desc'. |
| filters | String | An object containing search Filter, but JSON stringified right before being sent. See the section 'Search Filters' for full details. |
| limit | Integer | The maximum number of results to return. |
| offset | Integer | The number of results to skip. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Event's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Event. |
| connection_id_string | String | A virtual field containing a human-readable form of the Event's ```connection_id```. |
| contact_interaction_type | String | One of ```to```, ```from```, or ```with``` (or undefined) indicating how this Event interacts with the related Contacts. For example, if the Event was a message the user received, this field would be ```from```; if the Event was editing a document that the user shares with others, this field would likely be ```with```. This field may not always be populated.|
| contact_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Contact(s) associated with this Event.|
| contact_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```contact_ids```. |
| content_ids | [Binary] | A list of UUID4s in binary form uniquely identifying the Content(s) associated with this Event. |
| content_id_strings | [String] | A virtual field containing a human-readable form of the Event's ```content_ids```. |
| context | String | A short description of what the Event was, e.g. 'Received', 'Purchased', 'Visited Web Page'. |
| created | Date | When the the Event was first created in LifeScope. |
| datetime | Date | When the Event actually occurred in real life. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Event. You shouldn't worry about this, as it's only really used to make sure that, for instance, multiple users' interactions with the same piece of Content aren't confused with each other.
| location_id | Binary | A UUID4 in binary form uniquely identifying the Location associated with this Event. |
| location_id_string | String | A virtual field containing a human-readable form of the Event's ```location_id```. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Event. |
| provider_id_string | String | A virtual field containing a human-readable form of the Event's ```provider_id```. |
| provider_name | String | The name of the Provider from which this Event was obtained. |
| tagMasks | Object | Tags associated or formerly associated with this Event. See the section on tagMasks for further clarification. |
| type | String | A one-word categorization of the Event. Examples are 'messaged', 'purchased', 'created'. |
| updated | Date | The last time the Event was updated in LifeScope. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Event. |
| user_id_string | String | A virtual field containing a human-readable form of the Event's ```user_id```. |


### locationCount (query)

Returns a count of the Locations matching the filter.

**Scopes**

```locations:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| filter | Object | An object containing any Location field. Can also AND or OR multiple filter objects together, e.g. AND: [{ "geo_format": "lat_lng"}, { "estimated": false] |

**Returned fields**

As with all counts, the returned data is an integer, not an object with its own fields, e.g.

```
{
    "data": {
        "locationCount": 6492
    },
}
```

### locationFindManyById (query)

Returns the Locations whose IDs are in an array passed as a variable

**Scopes**

```locations:read``` OR ```events:read```

**Variables**

| Name | Type | Description |
| :--- | :--- | :--- |
| ids | [String] | An array of Location IDs. |

**Returned fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Location's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Location. |
| connection_id_string | String | A virtual field containing a human-readable form of the Location's ```connection_id```. |
| created | Date | When the the Location was first created in LifeScope. |
| datetime | Date | The exact date at which the user was at that Location. |
| estimated | Boolean | Whether this Location was estimated or actually recorded by some service. |
| geo_format | String | The format of the coordinates recorded in ```geolocation```. Currently the only valid value is 'lat_lng'.|
| geolocation | [Double] | The coordinates of the Location. Currently, they are in [longitude, latitude] order.|
| identifier | String | A unique internal identifier created from mashing up various aspects of the Contact. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Contact. |
| provider_id_string | String | A virtual field containing a human-readable form of the Location's ```provider_id```. |
| tracked| Boolean | Whether or not this Location came from LifeScope's location tracking. |
| updated | Date | The last time the Location was updated in LifeScope. |
| uploaded | Boolean | Whether or not this Location was uploaded in a file. |
| user_id | Binary | A UUID4 in binary form uniquely identifying the user that owns this Location. |
| user_id_string | String | A virtual field containing a human-readable form of the Location's ```user_id```. |

### userBasic (query)

Returns basic information about the user.
At present, this is just their LifeScope ID.

**Scopes**

```basic```

**Variables**

None

**Returned Fields**

| Name | Type | Description |
| :--- | :--- | :--- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Event's ```_id```. |


### Search Filters

LifeScope's search mutations use custom filters as one of the input variables.
There are six basic types of filters: 

* Who Filters (filtering by Contacts)
* What Filters (filtering by Content type)
* When Filters (filtering by Event's occurrence)
* Where Filters (filtering by Location)
* Connector Filters (filtering by Connection or Provider)
* Tag Filters (filtering by active, i.e. non-removed, tags)

One important thing to note is that **filters of the same type are ORed with each other, while different types of filters are ANDed with each other**.
If you use two different What filters, results that match either of them will potentially be added to the return pool.
If you use a Who and a What filter, the search result must match Contacts specified by the Who filter AND Content specified by the What filter; results that match one but not the other will not be returned.

#### Who Filters

Who filters filter by a Contact's ```name``` and/or ```handle```.
They can also filter by ```contact_interaction_type``` on an Event; this field can be 'to', 'from', or 'with'.

Who filters are sent in the 'filters' variable under the key ```whoFilters```.
The value is an array of filters..

If the filter is just for the ```contact_interaction_type```, it would look like this:

```
{
	"whoFilters": [
		{
			"event.contact_interaction_type": "to"
		}
	]
}
```

If the filter is just for a ```name``` or ```handle```, it would look like this:

```
{
	"whoFilters": [
		{
			"$or":[
				{
					"name": "steve"
				},
				{
					"handle": "steve"
				}
			]
		}
	]
}
```

If the filter combines both of those search parameters, it would look like this:

```
{
	"whoFilters": [
		{
			"$and":[
				{
					"event.contact_interaction_type":
					"to"
				},
				{
					"$or":[
						{
							"name": "steve"
						},
						{
							"handle": "steve"
						}
					]
				}
	]
}
```
 
If sending multiple Who filters simultaneously, it would look like this:
 
```
{
	"whoFilters": [
		{
			"$and":[
				{
					"event.contact_interaction_type": "from"
				},
				{
					"$or":[
						{
							"name": "steve"
						},
						{
							"handle": "steve"
						}
					]
				}
			]
		},
		{
			"$or":[
				{
					"name": "bob"
				},
				{
					"handle": "bob"
				}
			]
		},
		{
			"event.contact_interaction_type": "to"
		}
	]
}
```

#### What Filters

What filters filter by a Content's ```type```.

What filters are sent in the 'filters' variable under the key ```whatFilters```.
The value is an array of filters.

Here's an example of sending multiple What filters:

```
{
	"whatFilters": [
		{
			"type": "code"
		},
		{
			"type": "receipt"
		},
		{
			"type": "image"
		}
	]
}
```

#### When Filters

When filters filter by an Event's ```datetime```.

What filters are sent in the 'filters' variable under the key ```whatFilters```.
The value is an array of filters.
Dates should be sent in JSON Date format (ISO 8601) as a string, in UTC, as seen in the example below.

Here's an example of sending multiple When filters:

```
{
	"whenFilters": [
		{
			"datetime": {
				"$gte":"2018-11-17T00:29:54.472Z"
			}
		},
		{
			"datetime":{
				"$gte":"2018-06-30T23:29:54.472Z",
				"$lte":"2018-07-01T23:29:54.472Z"
			}
		}
	]
}
```


#### Where Filters

Where filters filter by an Event's Location.

Where filters are sent in the 'filters' variable under the key ```whereFilters```.
The value is an array of filters.
Filters can either explicitly exclude estimated Locations, or, if not specified, will include estimated and non-estimated Locations.
The coordinates are passed as an array containing an array that contains a set of arrays, with each innermost array being a pair of [```longitude```, ```latitude```] points. The final point must match the first point.

Here's an example of sending multiple Where filters:

```
{
	"whereFilters": [
		{
			"$and": [
				{
					"hydratedLocation.geolocation": {
						"$geoWithin":{
							"$geometry": {
								"type": "Polygon",
								"coordinates": [
									[
										[-127.42089843750128,40.512737220154264], 
										[-108.61230468750249,39.70611205302902],
										[-119.15917968750159,26.66584756122161],
										[-127.42089843750128,40.512737220154264]
									]
								]
							}
						}
					}
				}
			]
		},
		{
			"$and": [
				{
					"hydratedLocation.geolocation": {
						"$not": {
							"$geoWithin": {
								"$geometry": {
									"type": "Polygon",
									"coordinates": [
										[
											[-105.62402343750237,49.55281934390436],
											[-85.49707031250644,45.766548576851505],
											[-99.99902343750249,41.1114163934007],
											[-105.62402343750237,49.55281934390436]
										]
									]
								}
							}
						}
					}
				},
				{
					"hydratedLocation.estimated": false
				}
			]
		}
	]
}
```
Note, in the second filter, that the geolocation uses a '$not'.
This filter would return results whose Locations fall **outside** the specified coordinates.
In the first filter, only results whose Locations fell **inside** the specified coordinates would be returned.

#### Connector Filters

Connector filters filter by the ID of the Connection or Provider which the objects came from.

Connector filters are sent in the 'filters' variable under the key ```connectorFilters```.
The value is an array of filters.
You specify either the ```provider_id_string``` or the ```connection_id_string``` as the key and the ID in string format as the value for each filter.

Here is an example of sending multiple Connector filters:

```

{
	"connectorFilters": [
		{
			"provider_id_string: "50e95221070d4413827dd0309d93bbc4"
		},
		{
			"connection_id_string": "d79396a197df43f0bf9632f5f78457f3"
		}
	]
}
```

#### Tag Filters

Tag filters filter by the active, i.e. non-removed, tags on objects.

Tag filters are sent in the 'filters' variable under the key ```tagFilters```.
The value is an array of strings, where each string is a tag.

Here is an example of sending multiple Connector filters:

```

{
	"tagFilters": [
		"guardian",
		"beachparty",
		"limes"
	]
}
```