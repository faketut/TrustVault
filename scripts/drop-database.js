/**
 * Danger: Drop all collections in the configured MongoDB database.
 * Run with: node scripts/drop-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function dropAllCollections() {
  const mongoURI = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'sex-consent-system';

  if (!mongoURI) {
    console.error('MONGODB_URI is not set. Aborting.');
    process.exit(1);
  }

  try {
    console.log(`\n⚠️  WARNING: This will drop ALL collections in database "${dbName}"!`);
    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName,
    });

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('No collections found. Nothing to drop.');
      return;
    }

    console.log(`Found ${collections.length} collections. Dropping...`);
    for (const { name } of collections) {
      try {
        await db.dropCollection(name);
        console.log(`  ✅ Dropped collection: ${name}`);
      } catch (err) {
        // Ignore NamespaceNotFound errors if collection already gone
        if (err && err.codeName !== 'NamespaceNotFound') {
          console.error(`  ❌ Failed to drop ${name}:`, err.message);
        }
      }
    }

    console.log('\n🎉 All collections dropped successfully.');
  } catch (err) {
    console.error('❌ Drop operation failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

if (require.main === module) {
  dropAllCollections().catch(console.error);
}

module.exports = { dropAllCollections };


