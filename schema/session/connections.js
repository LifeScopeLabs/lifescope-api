import type { Resolver, TypeComposer } from 'graphql-compose';
import type { MongooseModel } from 'mongoose';
import { GraphQLNonNull } from 'graphql-compose/lib/graphql';

export default function connectionCreate(
  model: MongooseModel,
  tc: TypeComposer
): Resolver {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeById() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'TypeComposer') {
    throw new Error('Second arg for Resolver removeById() should be instance of TypeComposer.');
  }

  const outputTypeName = `RemoveById${tc.getTypeName()}Payload`;
  const outputType = tc.constructor.schemaComposer.getOrCreateTC(outputTypeName, t => {
    t.addFields({
      recordId: {
        type: GraphQLMongoID,
        description: 'Removed document ID',
      },
      record: {
        type: tc,
        description: 'Removed document',
      },
    });
  });

  const resolver = new tc.constructor.schemaComposer.Resolver({
    name: 'createConnection',
    kind: 'mutation',
    description:
      'Create a new LifeScope Connection'
    type: outputType,
    resolve: async () => {
      
    },
  });

  return resolver;
}