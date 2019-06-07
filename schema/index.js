/* @flow */

import crudSchema from './crud-schema';

// export default {
//   uri: '/gql',
//   schema: crudSchema,
//   title: 'LifeScope GraphQL API',
//   description:
//     'This schema implements all data collected, organized, and analyzed by the LifeScope platform',
//   github: 'https://github.com/bitscooplabs/lifescope',
//   queries: queries,
// };

export const crudAPI = {
	uri: '/gql',
	schema: crudSchema,
	title: 'LifeScope GraphQL API',
	description: 'This schema implements all data collected, organized, and analyzed by the LifeScope platform',
	github: 'https://github.com/lifescopelabs/lifescope-api',
};