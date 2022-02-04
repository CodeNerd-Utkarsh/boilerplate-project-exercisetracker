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
//Excercise Schema
const Schema = mongoose.Schema;

const exSchema = new Schema({
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    date: String
})
//User Schema
const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    log: [exSchema]
})
const User = mongoose.model("User", userSchema)
const ExModel = mongoose.model("Excercise", exSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});


//Endpoind Of user
app.post("/api/users", async (req, res) => {
    const { username } = req.body
    const user = await User.create({ username: username })
    res.json(user)
}).get(async (req, res) => {
    const user = await User.find()
    res.json(user)
})

//Excercise Endpoint

app.post("/api/users/:_id/exercises", async (req, res) => {
    const { description, duration, date } = req.body
    const { _id } = req.params
    let excercise = await ExModel.create({ description, duration: parseInt(duration), date })
    if (excercise.date === "") {
        excercise.date = new Date(Date.now()).toISOString().substr(0, 10)
    }
    await User.findByIdAndUpdate(_id, { $push: { log: excercise } }, { new: true }, (err, user) => {
        let responseObj = {}
        responseObj["_id"] = user._id
        responseObj["username"] = user.username
        responseObj["date"] = new Date(excercise.date).toDateString(),
            responseObj["description"] = excercise.description,
            responseObj["duration"] = excercise.duration

        res.json(responseObj)
    })

    res.json({})

})

//Logs Endpoint
app.get("/api/users/:_id/logs", async (req, res) => {
    if (req.params._id) {
        await User.findById(req.params._id, (err, result) => {
            if (!err) {
                let responseObj = {}
                responseObj["_id"] = result._id
                responseObj["username"] = result.username
                responseObj["count"] = result.log.length

                if (req.query.limit) {
                    responseObj["log"] = result.log.slice(0, req.query.limit)
                } else {
                    responseObj["log"] = result.log.map(log => ({
                        description: log.description,
                        duration: log.duration,
                        date: new Date(log.date).toDateString()
                    }))
                }
                if (req.query.from || req.query.to) {
                    let fromDate = new Date(0)
                    let toDate = new Date()
                    if (req.query.from) {
                        fromDate = new Date(req.query.from)
                    }
                    if (req.query.to) {
                        toDate = new Date(req.query.to)
                    }
                    fromDate = fromDate.getTime()
                    toDate = toDate.getTime()
                    responseObj["log"] = result.log.filter((session) => {
                        let sessionDate = new Date(session.date).getTime()

                        return sessionDate >= fromDate && sessionDate <= toDate
                    })
                }
                res.json(responseObj)
            } else {
                res.json({ err: err })
            }
        })
    } else {
        res.json({ user: "user not found with this id" })
    }
})
app.get('/api/users', (req, res) => {
    User.find({}, (err, users) => {
        if (!users) res.send("No user are here")
        else {
            res.json(users)
        }
    })
})


const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
    console.log(`Your running on http://localhost:${PORT}`)
})
