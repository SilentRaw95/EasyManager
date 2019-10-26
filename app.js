var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// conexion a mongodb
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo");

// schemas
var productSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  price: Number,
  // categories: [String]
});
var Product = mongoose.model("products", productSchema);

// rutas
// pagina de inicio
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// add product
app.get("/addProduct", (req, res) => {
  res.sendFile(__dirname + "/views/addProduct.html");
});

// apis
app.post("/addProduct", (req, res) => {
  var myData = new Product(req.body);
  myData.save()
    .then(item => {
      res.send("product saved to database");
    })
    .catch(err => {
      res.status(400).send("Unable to save to database");
    });
});

// logs
app.listen(port, () => {
  console.log("Server listening on port " + port);
});