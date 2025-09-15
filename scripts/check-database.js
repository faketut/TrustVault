/**
 * Database Health Check Script
 * 
 * This script checks if the database is properly initialized
 * Run with: node scripts/check-database.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Contract, Annotation } = require('../models');

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database health...\n');
    
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
    
    // Check collections
    await checkCollections();
    
    // Check data
    await checkData();
    
    console.log('\n🎉 Database health check completed successfully!');
    
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

const checkCollections = async () => {
  console.log('📊 Checking collections...');
  
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    const requiredCollections = ['users', 'contracts', 'annotations'];
    
    for (const collectionName of requiredCollections) {
      if (collectionNames.includes(collectionName)) {
        console.log(`  ✅ ${collectionName} collection exists`);
      } else {
        console.log(`  ❌ ${collectionName} collection missing`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
    throw error;
  }
};

const checkData = async () => {
  console.log('\n📝 Checking data...');
  
  try {
    // Check users
    const userCount = await User.countDocuments();
    console.log(`  👤 Users: ${userCount} documents`);
    
    // Check contracts
    const contractCount = await Contract.countDocuments();
    console.log(`  📄 Contracts: ${contractCount} documents`);
    
    // Check annotations
    const annotationCount = await Annotation.countDocuments();
    console.log(`  📝 Annotations: ${annotationCount} documents`);
    
    // Check indexes
    await checkIndexes();
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
    throw error;
  }
};

const checkIndexes = async () => {
  console.log('\n🔍 Checking indexes...');
  
  try {
    const db = mongoose.connection.db;
    
    // Check users indexes
    const userIndexes = await db.collection('users').indexes();
    console.log(`  👤 Users indexes: ${userIndexes.length} indexes`);
    
    // Check contracts indexes
    const contractIndexes = await db.collection('contracts').indexes();
    console.log(`  📄 Contracts indexes: ${contractIndexes.length} indexes`);
    
    // Check annotations indexes
    const annotationIndexes = await db.collection('annotations').indexes();
    console.log(`  📝 Annotations indexes: ${annotationIndexes.length} indexes`);
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    throw error;
  }
};

// Run the check if this file is executed directly
if (require.main === module) {
  checkDatabase().catch(console.error);
}

module.exports = { checkDatabase, checkCollections, checkData, checkIndexes };
