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

// otras librerias
var moment = require("moment")

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
  var UserDB = mongoose.model("users", userSchema);

  var productSchema = new mongoose.Schema({
    name: String,
    stock: Number,
    price: Number,
    categories: [String]
  });
  var ProductDB = mongoose.model("products", productSchema);

  var modificationSchema = new mongoose.Schema({
    date: String,
    product: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
    employe: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    name: String,
    modification: {
      price: Number,
      stock: Number,
      categories: [String]
    }
  });
  var ModificationDB = mongoose.model("modifications", modificationSchema);

  var sells_Schema = new mongoose.Schema({
    date: String,
    total: Number,
    employe: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    products: [{
      product_data: { type: mongoose.Schema.Types.ObjectId, ref: "products" },
      name: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }]
  })
  var Sells_SchemaDB = mongoose.model("sells", sells_Schema);

  // rutas
  // pagina de inicio
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
  });

  // pagina de inicio (con session)
  app.get("/home", (req, res) => {
    if(req.session._id){
      res.sendFile(__dirname + "/views/home.html");
    } else {
      res.redirect("/")
    }
  });

  // add user (paginacion)
  app.get("/addUser/:saltar", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let filtro1 = false

      // obtener total
      const total = db.collection('users')
      total.find({}).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        const collection = db.collection('users')
        collection.find({}).skip(saltar).limit(pagination).toArray((err, users) => {
          res.render(__dirname + "/views/addUser.ejs", {users, totalResults, filtro1})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // add user (paginacion y filtros)
  app.get("/addUser/:saltar/:nombre", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let nombre = String(req.params.nombre) == "null" ? "" : String(req.params.nombre)

      // obtener total
      const total = db.collection('users')
      total.find({
        first_name: {$regex: ".*" + nombre + ".*"}
      }).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.nombre)
        const collection = db.collection('users')
        collection.find({
          first_name: {$regex: ".*" + nombre + ".*"}
        }).skip(saltar).limit(pagination).toArray((err, users) => {
          res.render(__dirname + "/views/addUser.ejs", {users, totalResults, filtro1})
        })
      })
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

      // creacion de query
      let query = {}
      if(nombre && categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"},
          categories: categoria
        }
      } else if(nombre && !categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"}
        }
      } else {
        query = {
          categories: categoria
        }
      }

      // obtener total
      const total = db.collection('products')
      total.find(query).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.nombre)
        let filtro2 = String(req.params.categoria)
        const collection = db.collection('products')
        collection.find(query).skip(saltar).limit(pagination).toArray((err, products) => {
          res.render(__dirname + "/views/addProduct.ejs", {products, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // ver modificaciones (paginacion)
  app.get("/seeModifications/:saltar", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let filtro1 = false
      let filtro2 = false

      // obtener total
      const total = db.collection('modifications')
      total.find({}).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        ModificationDB.find({})
          .skip(saltar)
          .limit(pagination)
          .populate('product')
          .populate('employe')
          .exec((err, modif) => {
          console.log('modifs: ',modif)
          res.render(__dirname + "/views/modifications.ejs", {modif, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // ver modificaciones (paginacion y busqueda)
  app.get("/seeModifications/:saltar/:nombre/:categoria", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let nombre = String(req.params.nombre) == "null" ? "" : String(req.params.nombre)
      let categoria = String(req.params.categoria) == "null" ? "" : String(req.params.categoria)

      // creacion de query
      let query = {}
      if(nombre && categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"},
          "modification.categories": categoria
        }
      } else if(nombre && !categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"}
        }
      } else {
        query = {
          "modification.categories": categoria
        }
      }

      // obtener total
      const total = db.collection('modifications')
      total.find(query).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.nombre)
        let filtro2 = String(req.params.categoria)
        ModificationDB.find(query)
          .skip(saltar)
          .limit(pagination)
          .populate('product')
          .populate('employe')
          .exec((err, modif) => {
          console.log('modifs search: ',modif)
          res.render(__dirname + "/views/modifications.ejs", {modif, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // ver ventas (paginacion)
  app.get("/viewSells/:saltar", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let filtro1 = false

      // obtener total
      const total = db.collection('sells')
      total.find({}).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        Sells_SchemaDB.find({})
          .skip(saltar)
          .limit(pagination)
          .populate('employe')
          .populate('products.product_data')
          .exec((err, sells) => {
          console.log('ventas: ',sells)
          res.render(__dirname + "/views/viewSells.ejs", {sells, totalResults, filtro1})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // ver ventas (paginacion y busqueda)
  app.get("/viewSells/:saltar/:fecha", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let fecha = String(req.params.fecha) == "null" ? "" : String(req.params.fecha)

      // creacion de query
      let query = {
        date: fecha
      }

      // obtener total
      const total = db.collection('sells')
      total.find(query).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.fecha)
        Sells_SchemaDB.find(query)
          .skip(saltar)
          .limit(pagination)
          .populate('employe')
          .populate('products.product_data')
          .exec((err, sells) => {
          console.log('ventas: ',sells)
          res.render(__dirname + "/views/viewSells.ejs", {sells, totalResults, filtro1})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // vender (paginacion)
  app.get("/sell/:saltar", (req, res) => {
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
          res.render(__dirname + "/views/sell.ejs", {products, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // vender (paginacion y filtros)
  app.get("/sell/:saltar/:nombre/:categoria", (req, res) => {
    if(req.session._id){
      // valores
      let pagination = 5
      let saltar = parseInt(req.params.saltar)
      let nombre = String(req.params.nombre) == "null" ? "" : String(req.params.nombre)
      let categoria = String(req.params.categoria) == "null" ? "" : String(req.params.categoria)

      // creacion de query
      let query = {}
      if(nombre && categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"},
          categories: categoria
        }
      } else if(nombre && !categoria){
        query = {
          name: {$regex: ".*" + nombre + ".*"}
        }
      } else {
        query = {
          categories: categoria
        }
      }

      // obtener total
      const total = db.collection('products')
      total.find(query).toArray((err, numResults) => {
        let totalResults = Math.ceil(numResults.length / pagination)

        // mostrar resultados
        let filtro1 = String(req.params.nombre)
        let filtro2 = String(req.params.categoria)
        const collection = db.collection('products')
        collection.find(query).skip(saltar).limit(pagination).toArray((err, products) => {
          res.render(__dirname + "/views/sell.ejs", {products, totalResults, filtro1, filtro2})
        })
      })
    } else {
      res.redirect("/")
    }
  });

  // apis
  app.post("/addProduct", (req, res) => {
    var myData = new ProductDB(req.body);
    myData.save()
      .then(item => {
        return res.end("success")
      })
      .catch(err => {
        return res.end("error")
      });
  });

  app.post("/editProduct/:idProduct", (req, res) => {
    console.log(req.body)
    var id = mongoose.Types.ObjectId(req.params.idProduct)

    const collection = db.collection('products')
    collection.findOneAndUpdate({_id: id}, {$set: req.body})
    .then((docs)=>{
      console.log(docs)

      // create modification
      let dateString = "" + moment().format('MM/DD/YYYY, h:mm:ss a')
      let data = {
        date: dateString,
        product:  mongoose.Types.ObjectId(id),
        employe: mongoose.Types.ObjectId(req.session._id),
        name: req.body.name,
        modification: {
          price: req.body.price,
          stock: req.body.stock,
          categories: req.body.categories
        }
      }
      var createModification = new ModificationDB(data);
      createModification.save()
        .then(item => {
          return res.end("success")
        })
        .catch(err => {
          return res.end("error")
        });
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
        return res.end("success")
      })
      .catch(err => {
        console.log(err)
        return res.end("error")
      });
  });

  app.post("/editUser/:idUser", (req, res) => {
    console.log(req.body)
    var id = mongoose.Types.ObjectId(req.params.idUser)

    const collection = db.collection('users')
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

  app.post("/sellProducts", (req, res) => {
    // reducir stock
    req.body.data.forEach(item => {
      const collection = db.collection('products')
      var temp_id = mongoose.Types.ObjectId(item.product_data)
      collection.findOneAndUpdate({_id: temp_id}, {$inc:{ stock: -parseInt(item.quantity) }}, {new: true}, (err, doc) => {
        if (err) {
          console.log("Something wrong when updating data! ",err);
        }
        console.log('id: ', temp_id)
        console.log(doc);
      })
    })
    // guardar venta
    let dataPost = {}
    dataPost.date = "" + moment().format('MM-DD-YYYY')
    dataPost.employe = mongoose.Types.ObjectId(req.session._id),
    dataPost.total = 0
    dataPost.products = []
    req.body.data.forEach((element, index) => {
      dataPost.products.push({
        product_data: mongoose.Types.ObjectId(element.product_data),
        name: element.name,
        quantity: parseInt(element.quantity),
        price: element.price,
        subtotal: element.subtotal
      })
      dataPost.total = dataPost.total + element.subtotal
    })
    dataPost.products = req.body.data
    var myData = new Sells_SchemaDB(dataPost);
    myData.save()
      .then(item => {
        return res.end("success")
      })
      .catch(err => {
        console.log(err)
        return res.end("error")
      })
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