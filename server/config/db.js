import mongoose from "mongoose"; //Mongoos exports a singleton object. It runs only one instance for each process.
//It holds; connection state, all registered models, all schema configurations 

export async function connectToDatabase(){
    // registers a listener for the connection object for the 'connected' event.
    mongoose.connection.on('connected',()=>{
        console.log("Successfully connected to MongoDB")
    })
    //connects using connection string
    await mongoose.connect(process.env.MONGODB_URI)
}