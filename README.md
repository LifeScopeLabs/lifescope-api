# [LifeScope-API](https://github.com/LifeScopeLabs/lifescope-api)

## [Repository](https://github.com/LifeScopeLabs/lifescope-api)

**(production phase, high priority)**

The LifeScope API is a universal platform backend. There are two components to the API; a GraphQL-based API for CRUD operations on the LifeScope data schema and a REST API for logout and connection OAuth workflow.

[gqlschema]:https://lifescopelabs.github.io/assets/diagrams/LifeScopeSchema.png


# [Setup Instructions](https://github.com/LifeScopeLabs/lifescope-api/blob/master/setup/01-mongo-bitscoop.md)

# LifeScope API Pltafrom Documentation

## [OAuth API Documentation](https://github.com/LifeScopeLabs/lifescope-api/blob/master/documentation/oauth.md)

## [Schema Documentation](https://github.com/LifeScopeLabs/lifescope-api/blob/master/documentation/schema.md)

![gqlschema]

## Providers

| Data Source | Status | Data Collected |
|--|--|--|
| Facebook | production | events, content, contacts, locations |
| Twitter | production | events, content, contacts, locations |
| Pinterest | beta | events, content, locations |
| Dropbox | production | events, content, locations |
| Steam | production | events, content |
| Reddit | production | events, content, contacts, contacts |
| Spotify | production | events, content |
| GitHub | production | events, content, contacts |
| Instagram | production | events, content, contacts |
| Google | production | events, content, contacts |
| Slice | development | events, content, things |
| FitBit | planned | events, things |
| TV Time | planned | events, content |
  
# Dependencies

* [graphql-compose](https://github.com/graphql-compose/graphql-compose)
* [graphql-compose-mongoose](https://github.com/graphql-compose/graphql-compose-mongoose)
* Vue/Nuxt

# Development Roadmap

- Improved Place and Thing Support
- Add WSS support for GraphQL Subscriptions
- Example: https://github.com/apollographql/subscriptions-transport-ws