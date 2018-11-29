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
| --- | --- | --- |
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
| --- | --- | --- |
| error | string | access_denied |
| error_description | string | The user denied the request |

Most other errors, such as invalid scopes or missing parameters, will be returned to your redirect_uri in a similar fashion.
The only exceptions are if the client_id is invalid or the redirect_uri is not associated with that oauth app.
In those situations, the errors will just be displayed on the screen so not to redirect the user to potentially malicious URLs.

If the user allows the request and there are no errors, they will be redirected to the redirect URI with two query parameters

**Incoming Parmaeters**

| Name | Type | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| **grant_type** | string | Must be 'authorization_code' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **redirect_uri** | string | The redirect_uri that was used to obtain the code. It must exactly match the redirect_uri used to obtain the code. |
| **code** | string | The code you received back from the authorization step. |

The response will have three fields

**Returned Fields**

| Name | Type | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| **grant_type** | string | Must be 'authorization_code' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **redirect_uri** | string | The redirect_uri that was used to obtain the code. It must exactly match the redirect_uri used to obtain the code. |
| **code** | string | The code you received back from the authorization step. |


The response will be in JSON format and will have the following fields:

**Returned Fields**

| Name | Type | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| **grant_type** | string | Must be 'refresh_token' for this operation. |
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **refresh_token** | string | The refresh token associated with the access_token you want to refresh. |

The response will have two fields

**Returned Fields**

| Name | Type | Description |
| --- | --- | --- |
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
| --- | --- | --- |
| **grant_type** | string | Must be 'refresh_token' for this operation.
| **client_id** | string | The client_id for your registered OAuth app. |
| **client_secret** | string | The client_secret for your registered OAuth app. |
| **refresh_token** | string | The refresh token associated with the access_token you want to refresh. |


The response will be in JSON format and will have the following fields:

**Returned Fields**

| Name | Type | Description |
| --- | --- | --- |
| access_token | string | The new scoped token that you can use to access the user's information. |
| expires_in | string | The number of seconds until the access_token becomes invalid. This is generally one month from the exchange. |

Here's an example request:

```
POST https://api.lifescope.io/auth/access_token?grant_type=refresh_token_token&client_id=abc123&client_secret=abcdefghijklmnop1234567890&redirect_uri=https%3A%2F%2Fexample.com%2Fauth&refresh_token=abcdefghijklmnop1234567890
```

Overwrite the old ```access_token``` with the new one.