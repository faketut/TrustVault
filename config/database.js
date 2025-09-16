// config/database.js - MongoDB connection configuration
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGODB_DB_NAME || 'sex-consent-system'
    });

    console.log('✅ Successfully connected to MongoDB!');
    
    // Send a ping to confirm a successful connection
    await mongoose.connection.db.admin().ping();
    console.log('🏓 Pinged your deployment. You successfully connected to MongoDB!');
    
    await verifyDatabaseHealth();
    
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('💥 Server startup failed due to database issues');
    process.exit(1);
  }
};

/**
 * Initialize empty collections if database is empty
 */
const initializeCollections = async () => {
  try {
    console.log('📊 Initializing database collections...');
    
    // Import models to ensure schemas are registered
    const { User, Contract } = require('../models');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const existingCollectionNames = collections.map(col => col.name);
    
    // Define required collections with their Mongoose models
    const requiredCollections = [
      { name: 'users', model: User },
      { name: 'contracts', model: Contract }
    ];
    
    for (const collection of requiredCollections) {
      if (!existingCollectionNames.includes(collection.name)) {
        console.log(`📝 Creating collection: ${collection.name}`);
        
        // Create collection using Mongoose model (this ensures proper schema)
        await collection.model.createCollection();
        
        // Create indexes using Mongoose (this ensures proper index creation)
        await collection.model.ensureIndexes();
        
        console.log(`✅ Created collection: ${collection.name} with schema validation`);
      } else {
        console.log(`✅ Collection exists: ${collection.name}`);
        
        // Ensure indexes are up to date for existing collections
        try {
          await collection.model.ensureIndexes();
          console.log(`🔧 Updated indexes for: ${collection.name}`);
        } catch (indexError) {
          console.warn(`⚠️  Could not update indexes for ${collection.name}:`, indexError.message);
        }
      }
    }
    
    // Insert sample data if collections are empty
    await insertSampleData();
    
    console.log('✅ Database collections initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    throw error; // Re-throw to fail startup if initialization fails
  }
};

/**
 * Insert sample data to ensure collections work properly
 */
const insertSampleData = async () => {
  try {
    console.log('📝 Checking for sample data...');
    
    // Import models
    const { User, Contract } = require('../models');
    
    // Check if users collection is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('📝 Inserting sample user data...');
      
      // Create sample users with different authentication methods
      const sampleUsers = [
        // Basic user
        {
          socialMediaId: 'sample_user',
          platform: 'other',
          nickname: 'Sample User',
          role: 'user',
          signCount: 0,
          revokeCount: 0
        },
        // WeChat user
        {
          socialMediaId: 'sample_wechat_user',
          platform: 'wechat',
          nickname: 'WeChat User',
          role: 'user',
          signCount: 2,
          revokeCount: 0,
          wechatData: {
            unionid: 'sample_unionid',
            sex: 1,
            province: 'Beijing',
            city: 'Beijing',
            country: 'China'
          }
        },
        // Phone user
        {
          phoneNumber: '+1234567890',
          platform: 'phone',
          nickname: 'Phone User',
          role: 'user',
          signCount: 1,
          revokeCount: 0,
          phoneVerification: {
            isVerified: true,
            attempts: 0
          }
        },
        // Apple ID user
        {
          appleId: 'sample_apple_id_12345',
          platform: 'apple',
          nickname: 'Apple User',
          role: 'user',
          signCount: 0,
          revokeCount: 1,
          appleData: {
            identityToken: 'mock_identity_token_sample',
            authorizationCode: 'mock_auth_code_sample',
            user: {
              id: 'sample_apple_id_12345',
              email: 'sample@privaterelay.appleid.com',
              name: {
                firstName: 'Apple',
                lastName: 'User'
              }
            }
          }
        },
        // Admin user
        {
          socialMediaId: 'admin_user',
          platform: 'other',
          nickname: 'Admin User',
          role: 'admin',
          signCount: 5,
          revokeCount: 2
        }
      ];
      
      // Insert all sample users
      for (const userData of sampleUsers) {
        const user = new User(userData);
        await user.save();
      }
      
      console.log(`✅ Sample user data inserted (${sampleUsers.length} users)`);
    } else {
      console.log(`ℹ️  Users collection already has ${userCount} documents`);
    }
    
    // Check if contracts collection is empty
    const contractCount = await Contract.countDocuments();
    if (contractCount === 0) {
      console.log('📝 Inserting sample contract data...');
      
      // Create sample contract using Mongoose model
      const sampleContract = new Contract({
        contractId: 'sample_contract_' + Date.now(),
        partyAId: 'sample_user',
        partyBId: 'sample_user_2',
        startDateTime: new Date(),
        endDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        status: 'inactive'
      });
      
      await sampleContract.save();
      console.log('✅ Sample contract data inserted');
    } else {
      console.log(`ℹ️  Contracts collection already has ${contractCount} documents`);
    }
    
    // No annotations collection anymore (annotation is embedded on Contract)
    
    console.log('✅ Sample data insertion completed!');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error; // Re-throw to fail startup if sample data insertion fails
  }
};

/**
 * Verify database health and required collections
 */
const verifyDatabaseHealth = async () => {
  try {
    console.log('🔍 Verifying database health...');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    // Check required collections exist
    const requiredCollections = ['users', 'contracts'];
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      throw new Error(`Missing required collections: ${missingCollections.join(', ')}`);
    }
    
    // Check collections have proper indexes
    for (const collectionName of requiredCollections) {
      const indexes = await db.collection(collectionName).listIndexes().toArray();
      console.log(`📊 Collection '${collectionName}' has ${indexes.length} indexes`);
    }
    
    // Test basic operations
    const userCount = await db.collection('users').countDocuments();
    const contractCount = await db.collection('contracts').countDocuments();
    const annotationCount = 0;
    
    console.log('📈 Database statistics:');
    console.log(`  👤 Users: ${userCount}`);
    console.log(`  📄 Contracts: ${contractCount}`);
    console.log(`  📝 Annotations: integrated on Contract`);
    
    console.log('✅ Database health verification completed!');
    
  } catch (error) {
    console.error('❌ Database health verification failed:', error);
    throw error; // Fail startup if health check fails
  }
};

module.exports = connectDB;
