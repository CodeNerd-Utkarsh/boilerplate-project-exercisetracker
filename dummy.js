const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')

// middlewares
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// * connection to [MONGODB]
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// * connection verification 
const connection = mongoose.connection
connection.on('error', (err) => console.error(`err: ${err} `))
connection.once('open', () => {
  console.log("Connected to MONGODB");
})

// * Schema creation
const Schema = mongoose.Schema;
const ExerciseSchema = new Schema({
  userId: { type: String, requires: true },
  description: String,
  duration: Number,
  date: Date,
})

const UserSchema = new Schema({
  username: String,
})

// * MODELS for Schema
const User = mongoose.model("User", UserSchema)
const Exercise = mongoose.model("Exercise", ExerciseSchema)

// * API ENDPOINTS

app.get('/api/users/:id/logs', (req, res) => {
  const { to, from, limit } = req.query;
  const id = req.params.id;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      res.send("Can't find user")
    } else {
      let dateObj = {};
      if (from) {
        dateObj["$gte"] = new Date(from);
      }
      if (to) {
        dateObj["lte"] = new Date(to);
      }
      let filter = {
        userId: id,
      }
      if (from || to) {
        filter.date = dateObj;
      }
      let nonNullLimit = limit ?? 500;
      Exercise.find(filter)
        .limit(nonNullLimit)
        .exec((err, data) => {
          if (err || !data) {
            res.json([])
          } else {
            const count = data.length;
            const rawLog = data;
            const { username, _id } = userData;
            const log = rawLog.map((l) => ({
              description: l.description,
              duration: l.duration,
              date: l.date.toDateString(),
            }))
            res.json({ username, count, _id, log });
          }
        })
    }
  })
})

app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if (!users) res.send("No user are here")
    else {
      res.json(users)
    }
  })
})

app.post('/api/users', (req, res) => {
  const newUser = new User({
    username: req.body.username,
  })
  newUser.save((err, data) => {
    if (err) console.log(err);
    else {
      res.json(data)
    }
  })
})

app.post('/api/users/:id/exercises', (req, res) => {
  const id = req.params.id
  const { description, duration, date } = req.body;
  User.findById(id, (err, userData) => {
    if (err || !userData) {
      res.send("Can't find user")
    } else {
      const newExercise = new Exercise({
        userId: id,
        description,
        duration,
        date: new Date(date)
      })
      newExercise.save((err, result) => {
        if (err || !result) {
          res.send("An error occured during saving the data...")
        } else {
          const { description, duration, date, _id } = result;
          res.json({
            username: userData.username,
            description: description,
            duration,
            date: date.toDateString(),
            _id: result.id
          })
        }
      })
    }
  })
})






app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
  console.log(`Your running on http://localhost:${PORT}`)
})
