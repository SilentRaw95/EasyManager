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

const mongo = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017'

mongo.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err, client) => {
  if (err) {
    console.error(err)
    return
  }
  const db = client.db('easy-manager')

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

  // add product (paginacion)
  app.get("/addProduct/:saltar", (req, res) => {
    // valores
    let saltar = parseInt(req.params.saltar)

    // obtener total
    const total = db.collection('products')
    total.find({}).toArray((err, numResults) => {
      let totalResults = Math.ceil(numResults.length / 5)

      // mostrar resultados
      const collection = db.collection('products')
      collection.find({}).skip(saltar).limit(5).toArray((err, products) => {
        res.render(__dirname + "/views/addProduct.ejs", {products, totalResults})
      })
    })
  });

  // add product (paginacion y filtros)
  app.get("/addProduct/:saltar/:nombre/:categoria", (req, res) => {
    // valores
    let saltar = parseInt(req.params.saltar)
    let nombre = String(req.params.nombre) == "null" ? "" : String(req.params.nombre)
    let categoria = String(req.params.categoria) == "null" ? "" : String(req.params.categoria)

    // obtener total
    const total = db.collection('products')
    total.find({
      name: {$regex: ".*" + nombre + ".*"},
      categories: [categoria]
    }).toArray((err, numResults) => {
      let totalResults = Math.ceil(numResults.length / 5)

      // mostrar resultados
      const collection = db.collection('products')
      collection.find({
        name: {$regex: ".*" + nombre + ".*"},
        categories: [categoria]
      }).skip(saltar).limit(5).toArray((err, products) => {
        res.render(__dirname + "/views/addProduct.ejs", {products, totalResults})
      })
    })
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

  app.post("/login", (req, res) => {
    const collection = db.collection('users')
    collection.findOne({name: req.body.username, password: req.body.password}, (err, item) => {
      if(item){
        res.redirect("/")
      }
    })
  });

  // logs
  app.listen(port, () => {
    console.log("Server listening on port " + port);
  });
  
})