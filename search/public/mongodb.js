const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://admin:Tyfg8k3OaOMGxZ23@cluster0.bv3rotn.mongodb.net/?retryWrites=true&w=majority";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // database and collection code goes here
        const db = client.db("sample_guides");
        const coll = db.collection("planets");
        // find code goes here
        // let filter = Builders<BsonDocument>.Filter.Eq("item", BsonNull.Value);

        // const cursor = coll.find({orderFromSun: 2}, (err, data) => {
        console.log("asdf");
        await coll.find({orderFromSun: 2}, (err, data) => {
            console.log(data);
        });
        // console.log(cursor);
        // const result = await cursor.toArray();
        // iterate code goes here
        // if(result.length === 0){
        //     console.log("EMPTY");
        // }else {
        //     console.log("not empty:" + result.length); 
        //     await cursor.forEach(console.log);
        // }
        

    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);

// database and collection code goes here

