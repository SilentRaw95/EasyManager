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
mongoose.connect("mongodb://localhost:27017/easy-manager");

// schemas
var userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  username: String,
  password: String,
  role: String
});
var UserDB = mongoose.model("user", userSchema);

var productSchema = new mongoose.Schema({
  name: String,
  stock: Number,
  price: Number,
  categories: [String]
});
var ProductDB = mongoose.model("products", productSchema);

// rutas
// pagina de inicio
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// add user
app.get("/addUser", (req, res) => {
  res.sendFile(__dirname + "/views/addUser.html");
});

// add product
app.get("/addProduct", (req, res) => {
  res.sendFile(__dirname + "/views/addProduct.html");
});

// apis
app.post("/addProduct", (req, res) => {
  req.body.categories = req.body.categories.split(',')

  var myData = new ProductDB(req.body);
  myData.save()
    .then(item => {
      res.redirect("/addProduct")
    })
    .catch(err => {
      res.status(400).send("Unable to save to database");
    });
});

app.post("/addUser", (req, res) => {
  var myData = new UserDB(req.body);
  myData.save()
    .then(item => {
      res.redirect("/addUser")
    })
    .catch(err => {
      res.status(400).send("Unable to save to database");
    });
});

// logs
app.listen(port, () => {
  console.log("Server listening on port " + port);
});