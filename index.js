const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(morgan('dev'))

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.c4vqagl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})

async function run() {
  try {
    const usersCollection = client.db('tomatoDB').collection('users')
    // const roomsCollection = client.db('aircncDb').collection('rooms')
    // const bookingsCollection = client.db('aircncDb').collection('bookings')

    //Save user email and role into the mongodb userCollection 
    app.put('/users/:email',async(req,res)=>{
      const email = req.params.email
      const user = req.body
      const query = {email: email }
      const options = {upsert : true}
      const updateDoc = {
        $set : user
      }
      const result = await usersCollection.updateOne(query,updateDoc,options)
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Tomato Server is eating.......')
})

app.listen(port, () => {
  console.log(`Tomato is running on port ${port}`)
})
