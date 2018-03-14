# apollo-tutorial-kit

Starting point for the Apollo GraphQL Server tutorial.

Follow along with the tutorial in the blog post: [How to build a GraphQL server](https://medium.com/apollo-stack/tutorial-building-a-graphql-server-cddaa023c035#.wy5h1htxs). If you want to skip ahead to the solution, check out the [server-tutorial-solution](https://github.com/apollographql/apollo-tutorial-kit/tree/server-tutorial-solution) branch of this repo.

Up-to-date documentation and explanations can be found in the [Apollo Server docs](https://www.apollographql.com/docs/apollo-server/)

## Getting started

```bash
git clone https://github.com/apollostack/apollo-starter-kit
cd apollo-starter-kit
npm install
npm start
```

Then open [http://localhost:3000/graphiql](http://localhost:3000/graphiql)

When you paste this on the left side of the page:

```graphql
{
  testString
}
```

and hit the play button (cmd-return), then you should get this on the right side:

```json
{
  "data": {
    "testString": "It works!"
  }
}
```
