require('dotenv').config()
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const jwt = require('express-jwt')
const jwksRsa = require('jwks-rsa')
const PORT = process.env.PORT || 4000
const app = express(process.env.STRIPE_SECRET_KEY)

// Set up Auth0 configuration
const authConfig = {
  domain: 'dev-5ilv96wt.auth0.com',
  audience: 'http://localhost:4000'
}

// Define middleware that validates incoming bearer tokens
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithm: ['RS256']
})

//seeing why stuff isn't pushing right

//Middleware
app.use(cors())
app.use(morgan())
// instead of body parser
app.use(express.json())

const db = require('./models')
const Category = db.Category
const Product = db.Product
//Router files

//Routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Route working'
  })
  // const error = new Error('it blew up')
  // next(error)
})

app.get('/api/categories', (req, res, next) => {
  Category.findAll({
    include: [{ model: Product }]
  })
    .then(categories => {
      res.json({
        categories
      })
    })
    .catch(error => {
      next(error)
    })
})

app.get('/api/products', (req, res, next) => {
  Product.findAll({
    include: [{ model: Category }]
  })
    .then(products =>
      res.json({
        products
      }))
    .catch(error => {
      next(error)
    })
})

app.get('/api/products/:id', (req, res, next) => {
  const id = req.params.id

  Product.findByPk(id, {
    include: [{ model: Category }]
  })
    .then(product => {
      res.json({
        product
      })
    })
    .catch(error => {
      next(error)
    })
})

// Define an endpoint that must be called with an access token
app.get('/api/external', checkJwt, (req, res) => {

  res.json({
    msg: 'Your Access Token was successfully validated!'
  })
})


//error handling
// The following 2 `app.use`"s MUST follow ALL your routes/middleware

app.post('/api/checkout', async (req, res, next) => {
  const lineItem = req.body 
  const lineItems= [lineItem]

  try {
    // create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
    })
    // send session to client
    res.json({ session })
  }
  catch (error) {
    next(error)
  }
})

app.use(notFound)
app.use(errorHandler)

function notFound(req, res, next) {
  res.status(404).send({error: "Not found!", status: 404, url: req.originalUrl})
}


// eslint-disable-next-line

//Error handlers need 4 routes and the error is the first one.
function errorHandler(err, req, res, next) {
  console.error("ERROR:", err)
  const stack =  process.env.NODE_ENV !== "production" ? err.stack : undefined
  res.status(500).send({error: err.message, stack, url: req.originalUrl})
}


app.listen(PORT, ()=>{
  console.log(`Server is listening on ${PORT}`);
})