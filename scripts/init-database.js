/**
 * Database Initialization Script
 * 
 * This script initializes the database with empty collections and sample data
 * Run with: node scripts/init-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Contract, Annotation } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...\n');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: process.env.MONGODB_DB_NAME || 'sex-consent-system'
    });

    console.log('✅ Connected to MongoDB successfully!\n');
    
    // Initialize collections
    await initializeCollections();
    
    // Insert sample data
    await insertSampleData();
    
    console.log('\n🎉 Database initialization completed successfully!');
    console.log('📊 Database is ready for use.');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

const initializeCollections = async () => {
  console.log('📊 Initializing collections...');
  
  try {
    // Create collections by using the models
    // This ensures proper schema validation and indexes
    
    // Users collection
    console.log('  📝 Creating users collection...');
    await User.createCollection();
    console.log('  ✅ Users collection ready');
    
    // Contracts collection
    console.log('  📝 Creating contracts collection...');
    await Contract.createCollection();
    console.log('  ✅ Contracts collection ready');
    
    // Annotations collection
    console.log('  📝 Creating annotations collection...');
    await Annotation.createCollection();
    console.log('  ✅ Annotations collection ready');
    
  } catch (error) {
    console.error('❌ Error creating collections:', error);
    throw error;
  }
};

const insertSampleData = async () => {
  console.log('\n📝 Inserting sample data...');
  
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    const contractCount = await Contract.countDocuments();
    
    if (userCount === 0) {
      console.log('  👤 Creating sample users...');
      
      // Create sample users with comprehensive authentication methods
      const sampleUsers = [
        // WeChat user (basic)
        {
          socialMediaId: 'sample_wechat_basic',
          platform: 'wechat',
          role: 'user',
          signCount: 0,
          revokeCount: 0
        },
        // WeChat user
        {
          socialMediaId: 'sample_wechat_user',
          platform: 'wechat',
          role: 'user',
          signCount: 2,
          revokeCount: 0,
          wechatData: {
            unionid: 'sample_unionid',
            sex: 1,
            province: 'Beijing',
            city: 'Beijing',
            country: 'China',
            access_token: 'mock_wechat_access_token',
            refresh_token: 'mock_wechat_refresh_token',
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          }
        },
        // Phone user
        {
          phoneNumber: '+1234567890',
          platform: 'phone',
          role: 'user',
          signCount: 1,
          revokeCount: 0,
          phoneVerification: {
            isVerified: true,
            attempts: 0
          }
        },
        // Apple ID user with comprehensive data
        {
          appleId: 'sample_apple_id_12345',
          platform: 'apple',
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
        // Admin user (WeChat)
        {
          socialMediaId: 'admin_wechat_user',
          platform: 'wechat',
          role: 'admin',
          signCount: 5,
          revokeCount: 2
        },
        // Lawyer user (Phone)
        {
          phoneNumber: '+1987654321',
          platform: 'phone',
          role: 'lawyer',
          signCount: 0,
          revokeCount: 0,
          phoneVerification: {
            isVerified: true,
            attempts: 0
          }
        }
      ];
      
      await User.insertMany(sampleUsers);
      console.log('  ✅ Sample users created');
    } else {
      console.log('  ℹ️  Users collection already has data, skipping...');
    }
    
    if (contractCount === 0) {
      console.log('  📄 Creating sample contracts...');
      
      // Create sample contracts
      const sampleContracts = [
        {
          contractId: 'sample_contract_1',
          partyAId: 'sample_wechat_user',
          partyBId: '+1234567890', // Phone user ID
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: 'active'
        },
        {
          contractId: 'sample_contract_2',
          partyAId: 'sample_apple_id_12345', // Apple user ID
          partyBId: 'admin_wechat_user', // Admin WeChat user ID
          startDateTime: new Date(),
          endDateTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'inactive'
        }
      ];
      
      await Contract.insertMany(sampleContracts);
      console.log('  ✅ Sample contracts created');
    } else {
      console.log('  ℹ️  Contracts collection already has data, skipping...');
    }
    
    // Create sample annotations
    const annotationCount = await Annotation.countDocuments();
    if (annotationCount === 0) {
      console.log('  📝 Creating sample annotations...');
      
      const sampleAnnotations = [
        {
          contractId: 'sample_contract_1',
          lawyerId: '+1987654321', // Lawyer phone user ID
          note: 'This is a sample contract for testing purposes.',
          severity: 'info',
          timestamp: new Date()
        },
        {
          contractId: 'sample_contract_2',
          lawyerId: '+1987654321', // Lawyer phone user ID
          note: 'Contract requires review before activation.',
          severity: 'warning',
          timestamp: new Date()
        }
      ];
      
      await Annotation.insertMany(sampleAnnotations);
      console.log('  ✅ Sample annotations created');
    } else {
      console.log('  ℹ️  Annotations collection already has data, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    throw error;
  }
};

// Run the initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase, initializeCollections, insertSampleData };
