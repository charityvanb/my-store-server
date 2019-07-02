const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const PORT = process.env.PORT || 8080;

const app = express();

//Middleware
app.use(cors())
app.use(morgan())
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
  Category.findAll()
    .then(categories => {
      res.json({
        categories
      })
    })
    .catch(error => {
      next(error)
    })
})

//error handling
// The following 2 `app.use`"s MUST follow ALL your routes/middleware
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