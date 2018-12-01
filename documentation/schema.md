# LifeScope Data Schema

LifeScope data is broken down into several different interrelated objects:

* Events (actions the user took)
* Content (digital objects such as videos, photos, receipts, text, etc.)
* Contacts (entities a user interacted with)
* Locations (where the user was)
* Connections (a user's specific account with a Provider)
* Providers (services a user used, e.g. Facebook, GitHub, Google Takeout)

## Retrieving Related Objects
As part of the GraphQL implementation, objects may have 'Relations' to other objects.
What this means is that a related object may be retrieved as part of the call for the original object simply by making the related object one of the 'fields' requested.
For example, if you wanted to retrieve the Contacts related to an Event, you would make the following request:

```
mutation eventSearch(<various variables>) {
	id,
	hydratedContacts {
		id,
		avatar_url,
		handle,
		name
	}
}
``` 

Note that the related object also requires you to specify which of its fields you want returned.

**Note about LifeScope IDs**

All of the objects' IDs are UUID4s.
These UUIDs are stored as Binaries, and directly accessing them via the API will return a garbled jumble that's the direct stringification of those binary characters.
In order to get the human-readable form, a virtual field is provided on the schema; this field is usually titled ```<field>_id_string```.
The only exception is that the human-readable form of ```_id```, the ID of the object in question, is just called ```id```.
Due to the way virtual fields work, you **must** request the binary fields as well when making the GraphQL request. 

For example, an Event is stored with a UUID4 for its ```_id```, ```connection_id```, and ```provider_id```.
To get human-readable form of those fields, one would make the following GraphQL request:

```
	mutation eventSearch(<various variables>) {
		_id,
		id,
		connection_id,
		connection_id_string,
		provider_id,
		provider_id_string
	}
```

It is **not** required to request the binary field when requesting related fields.
As demonstrated in the example in 'Retrieving Related Objects', you would not need to request ```contact_ids``` in order to get ```hydratedContacts```. 

## Events

Events are the central-most object in LifeScope.
They represent an action in a user's history, and are related to virtually every other object in the schema.

### Fields

| Name | Type | Description |
| --- | --- | --- |
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
 

### Relations

As mentioned in 'Retrieving Related Objects', if you are requesting any of these related objects, you must specify which of the related objects' fields you want retrieved as well.

| Name |  Related Object |
| --- | --- |
| hydratedContacts | Contacts |
| hydratedContent | Content |
| hydratedLocation | Locations |

## Example GraphQL Request with Schema

```
mutation eventSearch($q: String, $offset: Int, $limit: Int, $filters: String, $sortField: String, $sortOrder: String) {
    eventSearch(q: $q, offset: $offset, limit: $limit, filters: $filters, sortField: $sortField, sortOrder: $sortOrder) {
        id,
        connection_id,
        connection_id_string,
        contact_interaction_type,
        context,
        datetime,
        provider_id,
        provider_id_string,
        provider_name,
        type,
        content_ids,
        contact_ids,
        location_id,
        location_id_string,
        tagMasks {
          added,
          removed,
          source
        },
        hydratedContent {
            id,
            embed_content,
            embed_format,
            embed_thumbnail,
            mimetype,
            price,
            tagMasks {
                added,
                removed,
                source
            },
            text,
            title,
            type,
            url
        },
        hydratedContacts {
            id,
            avatar_url,
            handle,
            name,
            tagMasks {
                added,
                removed,
                source
            }
        }
    }
}
```

## Contacts

Contacts represent an entity that a user has interacted with through a digital service, such as a Twitter user or a Gmail account.
As of this writing, there is no linkage between different Contacts; even if the same person controls those Twitter and Gmail accounts, each account is treated as a separate Contact.
We hope to introduce a separate object in the future to represent a person in their entirety.

A Contact can be associated with multiple Events, though that association is strictly one-sided from the perspective of Events.
A Contact has no record of which Events it's associated with.

### Fields

| Name | Type | Description |
| --- | --- | --- |
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
 
### Relations
 
 None

### Example GraphQL Request with Schema

```
mutation contactSearch($q: String, $offset: Int, $limit: Int, $filters: String, $sortField: String, $sortOrder: String) {
    contactSearch(q: $q, offset: $offset, limit: $limit, filters: $filters, sortField: $sortField, sortOrder: $sortOrder) {
        id,
        avatar_url,
        connection_id,
        connection_id_string,
        provider_id,
        provider_id_string,
        handle,
        name,
        provider_id,
        provider_id_string,
        tagMasks {
            added,
            removed,
            source
        }
    }
}
```

## Content

Content represents a digital object that a user has interacted with, such as an image, a video, a file, an achievement, or a webpage.

A specific Content can be associated with multiple Events, though that association is strictly one-sided from the perspective of Events.
A Content has no record of which Events it's associated with.

### Fields

| Name | Type | Description |
| --- | --- | --- |
| _id | Binary | A UUID4 in binary form uniquely identifying this object. |
| id | String | A virtual field containing a human-readable form of the Content's ```_id```. |
| connection_id | Binary | A UUID4 in binary form uniquely identifying the Connection used to create this Content. |
| connection_id_string | String | A virtual field containing a human-readable form of the Content's ```connection_id```. |
| created | Date | When the the Content was first created in LifeScope. |
| embed_content | String | A URL from which an embeddable version of the Content can be retrieved. Not always present. |
| embed_format | String | The format of the ```embed_content```, such as 'email', 'jpeg', or 'mp4'. Not present if there is no ```embed_content```. |
| embed_thumbnail | String | A URL from which an embeddable thumbnail of the Content can be retrieved. Not always present, but can be present even if ```embed_content``` is null. |
| identifier | String | A unique internal identifier created from mashing up various aspects of the Contact. You shouldn't worry about this, as it's only really used when ingesting data into LifeScope.
| mimetype | String | The specific format of the object, e.g. 'image/jpeg'.  |
| price | Double | The price of the Content, with no specific currency associated. |
| provider_id | Binary | A UUID4 in binary form uniquely identifying the Provider associated with this Contact. |
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
 
### Relations
 
 None

### Example GraphQL Request with Schema

```
mutation contentSearch($q: String, $offset: Int, $limit: Int, $filters: String, $sortField: String, $sortOrder: String) {
    contentSearch(q: $q, offset: $offset, limit: $limit, filters: $filters, sortField: $sortField, sortOrder: $sortOrder) {
        id,
        connection_id,
        connection_id_string,
        embed_content,
        embed_format,
        embed_thumbnail,
        provider_id,
        provider_id_string,
        mimetype,
        price,
        provider_id,
        provider_id_string,
        tagMasks {
            added,
            removed,
            source
        },
        text,
        title,
        type,
        url
    }
}

```

## Locations

Locations represent where a user was at a given date and time.
There can be many different Locations for the exact same coordinates; a user will likely have many Locations at their home, but each one will have a different ```datetime```.
We hope to introduce a new object in the future to generalize related Locations into a Place. 

### Fields

| Name | Type | Description |
| --- | --- | --- |
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
 
### Relations
 
 None

### Example GraphQL Request with Schema

```
query locationManyById ($ids: [String]) {
    locationFindManyById (ids: $ids) {
    	id,
    	estimated,
    	geo_format,
    	geolocation
    }
}
```

### Different Types of Locations

Locations can come from a few different sources:

#### From the Provider where the Event was retrieved

These Locations were recorded by and retrieved from a Provider.
An example would be Locations associated with Tweets and retrieved along with those Tweets.

This type of Location will have ```estimated``` be false, ```tracked``` be false, and ```uploaded``` be false.

#### Recorded by location tracking in the LifeScope app

If a user enables it, the LifeScope app will record their location whenever they navigate to a page on the LifeScope app.

This type of Location will have ```estimated``` be false, ```tracked``` be true, and ```uploaded``` be false.

These Locations will not be associated with an Event, but can be used to more accurately estimate Events that lack Locations of their own.

#### Uploaded from a source of GeoJSON data obtained from something like Google Takeout.

Certain Providers, such as Google, have a wealth of location data that a user can download, but which cannot be automatically retrieved from their API.
In order to get this information into LifeScope, a user has to manually download this data in the form of a GeoJSON file and then upload it from their settings.

This type of Location will have ```estimated``` be false, ```tracked``` be false, and ```uploaded``` be true.

These Locations will not be associated with an Event, but can be used to more accurately estimate Events that lack Locations of their own.

#### Estimated by LifeScope from other real Locations.

Since most digital data out there does not have a location, LifeScope will estimate the Location of everything that does not have a real Location associated with it.
This process is handled automatically by a worker task, and is re-run periodically.
The estimated Location's coordinates are set to the non-estimated Location closest in time to when the Event occurred.
The estimated coordinates may change over time if new non-estimated Locations are ingested into LifeScope that are closer in time to the Event in question.

THis type of Location will have ```estimated``` be true, ```tracked``` be false, and ```uploaded``` be false.

These Locations will always be associated with an Event.

## tagMasks (not an object, but a field of most object)

One of LifeScope's useful features is the ability to tag objects.
Many objects that are already tagged in the services they were generated from with '#<tag>' will be automatically tagged; for example, Tweets that have hashtags will automatically be tagged in LifeScope with those hashtags.
Users can further add or remove tags from these objects via the app.

Taggable objects have a 'tagMasks' field.
This field is an object with three sub-fields: ```added```, ```removed```, and ```source```.
All three of these sub-fields are an array of strings (or null).
```source``` is comprised of tags that were originally present on the object, and is never modified.
```added``` is comprised of tags the user has added, and can include tags in ```source```.
```removed``` is comprised of tags the user has removed, and can include tags in ```source```.

When a user removes a tag, it's removed from ```added``` (if present) and added to ```removed```.
Similarly, when a user adds a tag, it's removed from ```removed``` (if present) and added to ```added```.
When interpreting this object, the current valid tags are the unique union of ```source``` and ```added```, minus anything in ```removed```.

As an example, let's say a Tweet was ingested into LifeScope that already had the tags '#oneTwoThree' and '#whatever'.
The user later tagged that Content with 'bestWeekend' and removed the tag 'whatever'.
tagMasks would appear as

```
tagMasks {
	added: ['bestWeekend'],
	removed: ['whatever'],
	source: ['oneTwoThree', 'whatever']
}
```