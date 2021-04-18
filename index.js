const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
require("dotenv").config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfv4g.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static("doctors"));
app.use(fileUpload());

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const serviceCollection = client.db("houseCleaning").collection("services");
  const reviewCollection = client.db("houseCleaning").collection("reviews");
  const ordersCollection = client.db("houseCleaning").collection("orders");
  const adminCollection = client.db("houseCleaning").collection("admins");

  app.post("/addOrder", (req, res) => {
    const newOrder = req.body;
    ordersCollection.insertOne(newOrder).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.post("/addAdmin", (req, res) => {
    const newAdmin = req.body;
    adminCollection.insertOne(newAdmin).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/orders", (req, res) => {
    const email = req.query.email;

    adminCollection.find({ adminEmail: email }).toArray((err, admin) => {
      if (admin.length === 0) {
        const queryEmail = req.query.email;
        ordersCollection
          .find({ email: queryEmail })
          .toArray((err, documents) => {
            res.send(documents);
          });
      } else {
        ordersCollection.find().toArray((err, documents) => {
          res.send(documents);
        });
      }
    });
  });

  app.post("/addAService", (req, res) => {
    const file = req.files.file;
    const serviceTitle = req.body.serviceTitle;
    const serviceDescription = req.body.serviceDescription;
    const serviceCharge = req.body.serviceCharge;
    const serviceKey = req.body.serviceKey;
    const newImg = file.data;
    const encImg = newImg.toString("base64");

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    // console.log(serviceTitle, serviceDescription, file);

    serviceCollection
      .insertOne({
        serviceTitle,
        serviceDescription,
        serviceCharge,
        serviceKey,
        image,
      })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });

  app.get("/services", (req, res) => {
    serviceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.delete("/deleteService/:serviceId", (req, res) => {
    const id = ObjectID(req.params.serviceId);
    // console.log(id);
    serviceCollection.findOneAndDelete({ _id: id }).then((result) => {
      console.log(result);
    });
  });

  app.get("/service/:serviceKey", (req, res) => {
    const key = req.params.serviceKey;
    serviceCollection.findOne({ serviceKey: key }).then((item) => {
      res.send(item);
    });
  });

  app.post("/addReview", (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/reviews", (req, res) => {
    reviewCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });


  app.get('/checkAdmin',(req, res) =>{
    const email = req.query.email;
    // console.log(email);
    adminCollection.find({adminEmail: email}).toArray((err, documents) => {
      res.send(documents);
    });
  })


  // app.patch('/updateStatus/:id', (req, res) =>{
  //   console.log(req.body)

  //   ordersCollection.updateOne({_id: ObjectID(req.params.id)},
  //   {
  //     $set : { status: req.body.newStatus}
  //   })
  //   .then(result =>{
  //     console.log(result);
  //   })
  // })








});



app.listen(port);
