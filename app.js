var express = require("express");
var session = require('express-session');
var secret = 'notThatSecretSecret';
var app = express();
var port = 3000;
var bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  _id: null,
  role: null,
  secret: secret
}));

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
    if(req.session._id){
      res.sendFile(__dirname + "/views/addUser.html");
    } else {
      res.redirect("/")
    }
  });

  // add product (paginacion)
  app.get("/addProduct/:saltar", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let filtro1 = false
      let filtro2 = false

      // obtener total
      const total = db.collection('products')
      total.find({}).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        const collection = db.collection('products')
        collection.find({}).skip(saltar).limit(pagination).toArray((err, products) => {
          res.render(__dirname + "/views/addProduct.ejs", {products, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // add product (paginacion y filtros)
  app.get("/addProduct/:saltar/:nombre/:categoria", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let nombre = String(req.params.nombre) == "null" ? "" : String(req.params.nombre)
      let categoria = String(req.params.categoria) == "null" ? "" : String(req.params.categoria)

      // obtener total
      const total = db.collection('products')
      total.find({
        name: {$regex: ".*" + nombre + ".*"},
        categories: [categoria]
      }).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.nombre)
        let filtro2 = String(req.params.categoria)
        const collection = db.collection('products')
        collection.find({
          name: {$regex: ".*" + nombre + ".*"},
          categories: [categoria]
        }).skip(saltar).limit(pagination).toArray((err, products) => {
          res.render(__dirname + "/views/addProduct.ejs", {products, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
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

  app.post("/editProduct/:idProduct", (req, res) => {
    console.log(req.body)
    var id = mongoose.Types.ObjectId(req.params.idProduct)

    const collection = db.collection('products')
    collection.findOneAndUpdate({_id: id}, {$set: req.body})
    .then((docs)=>{
      console.log(docs)
      return res.end("success")
    })
    .catch((err)=>{
      console.log(err)
      return res.end("error")
    })
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
    collection.findOne({username: req.body.username, password: req.body.password})
      .then((docs)=>{
        console.log(docs)
        if(docs){
          req.session._id = docs._id;
          req.session.role = docs.role;
          return res.end("success")
        } else {
          return res.end("error")
        }
      })
      .catch((err)=>{
        console.log(err)
        return res.end("error")
      })
  });

  // logs
  app.listen(port, () => {
    console.log("Server listening on port " + port);
  });
  
})