const { MongoClient } = require('mongodb');
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
//TODO get from Config
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'ontoBrAPI';

async function insertOne(doc){
    const collection= await connect()
    let result=await collection.insertOne(doc)
    close()
    return result
}
async function updateOne(doc,data){
    const collection= await connect()
    let result=await collection.updateOne(doc,data)
    close()
    return result
}
async function connect() {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    const collection = db.collection('calls');

    // the following code examples can be pasted here...

    return collection;
}
function close(){
    client.close()
}

module.exports={
    insertOne,
    updateOne
}