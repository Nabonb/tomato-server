const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
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
    const foodCollection = client.db('tomatoDB').collection('foods')
    const orderCollection = client.db('tomatoDB').collection('orders')
    // const orderedFoodCollection = client.db('tomatoDB').collection('orderFoods')

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

    //Get user with email
    app.get('/users/:email',async(req,res)=>{
      const email = req.params.email
      const query = {email:email}
      const result = await usersCollection.findOne(query)
      res.send(result)
    })

    // Add food with post method
    app.post('/foods',async(req,res)=>{
      const foodData = req.body
      const result = await foodCollection.insertOne(foodData)
      res.send(result) 
    })

    //Get all food
    app.get('/foods',async(req,res)=>{
      const allFood = await foodCollection.find().toArray()
      res.send(allFood)
    })

    //delete one food
    app.delete('/foods/:id',async(req,res)=>{
      const id = req.params.id
      const query= {_id: new ObjectId(id)}
      const result = await foodCollection.deleteOne(query)
      res.send(result)
    })

    //order food user details
    app.post('/orders',async(req,res)=>{
      const formData = req.body
      const result = await orderCollection.insertOne(formData)
      res.send(result)
    })

    //get food which are ordered for user
    app.get('/orders/:email',async(req,res)=>{
      const email = req.params.email
      console.log(email)
      const query = {userEmail:email}
      console.log(query)
      const result = await orderCollection.find(query).toArray()
      console.log(result)
      res.send(result)
    })

    //Get all the foods for the admin
    app.get('/orders',async(req,res)=>{
       const result = await orderCollection.find().toArray()
       res.send(result)
    })

    //Update orders in database 
    app.put('/orders/:id', async (req, res) => {
      const status = req.body
      console.log(status)
      const filter = { _id: new ObjectId(req.params.id) }
      const options = { upsert: true }
      const updateDoc = {
        $set: status,
      }
      const result = await orderCollection.updateOne(filter, updateDoc, options)
      res.send(result)
    })

    //stripe payment integration
    app.post('/create-checkout-session', async (req, res) => {
      const products = req.body.product;
    
      const lineItems = products.map((product) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
      }));
    
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: 'http://localhost:5173/success',
          cancel_url: 'http://localhost:5173/cancel',
        });
        res.json({ id: session.id });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });


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
