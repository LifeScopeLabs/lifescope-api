/* @flow */

// TODO: FIXXX
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';

export const ProvidersSchema = new mongoose.Schema(
  {
    
    alt_sources: {
      likes: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
    },
    remote_map_id: {
      type: Buffer,
      index: false
    },
    sources: {
      achievements: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      
      boards: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      comments: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      direct_messages_received: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },

      direct_messages_sent: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      drive_changes: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      edits: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },

      events: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      games_owned: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      gilded_comments: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      gmail_inbox: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      messages_received: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      messages_sent: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      pins: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      playlists: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      posts: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      saved_albums: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      saved_comments: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      saved_tracks: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
      submitted: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      threads_downvoted: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      threads_upvoted: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
      },
      tweets: {
        description: {
          type: String,
          index: false
        },
        enabled_by_default: {
          type: Boolean,
          index: false
        },
        mapping: {
          type: String,
          index: false
        },
        name: {
          type: String,
          index: false
        },
        population: {
          type: String,
          index: false
        },
      },
    },
  },
  {
    collection: 'providers',
  }
);
  
export const Providers = mongoose.model('Providers', ProvidersSchema);

export const ProviderTC = composeWithMongoose(Providers);

