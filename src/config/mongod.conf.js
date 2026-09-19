import mongoose from 'mongoose'
import dotenv from "dotenv";

dotenv.config();

const mongo_host = process.env.MONGO_HOST;
const mongo_port = process.env.MONGO_PORT;
const mongo_db = process.env.MONGO_DB;
const mongo_user = process.env.MONGO_USER;
const mongo_pass = encodeURIComponent(process.env.MONGO_PASSWORD);

//const uri = `mongodb://${mongo_user}:${mongo_pass}@${mongo_host}:${mongo_port}/${mongo_db}?authSource=admin`;

const uri = process.env.MONGO_URI
// Create mongooseClient object similar to Redis client structure
const mongooseClient = {
  connect: async () => {
    try {
      await mongoose.connect(uri, 
        {
            serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      });
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  }
};

// Event listeners for mongoose connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB.');
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from DB.');
});


// Export the mongooseClient object
export default mongooseClient;
