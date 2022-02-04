const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const User = require("./user");
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

// ROUTES
// index route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// create user route
app.post("/api/users", async (req, res) => {
    const user = new User({
        username: req.body.username,
    });

    // check if the user already exist
    User.findOne({ username: req.body.username }, async (err, data) => {
        if (err) {
            res.send({ error: "ERROR" });
        } else {
            if (data !== null) {
                res.send("Username already taken");
            } else {
                await user.save((err, data) => {
                    if (err) {
                        res.send({ error: "ERROR" });
                    } else {
                        res.send({ username: data.username, _id: data._id });
                    }
                });
            }
        }
    });
});

//get all users
app.get("/api/users", async (req, res) => {
    await User.find()
        .select("_id username")
        .exec((err, data) => {
            if (err) {
                res.send({ error: "ERROR" });
            } else {
                res.send(data);
            }
        });
});

// add exercise
app.post("/api/users/:_id/exercises", async (req, res) => {
    const exercise = {
        description: req.body.description,
        duration: Number(req.body.duration),
        date: !isNaN(Date.parse(req.body.date))
            ? req.body.date
            : new Date().toDateString(),
    };

    // finding the user, editing the logs and saving the updated document
    User.findById(req.params._id, async (err, data) => {
        if (err) {
            res.send({ error: "ERROR" });
        } else {
            data.log.push(exercise);
            await data.save((err, updatedUser) => {
                const toReturn = {
                    _id: data._id,
                    username: data.username,
                    ...exercise,
                };
                toReturn.date = new Date(toReturn.date).toDateString();
                res.send(toReturn);
            });
        }
    });
});

// get user's exercise logs
app.get("/api/users/:_id/logs", (req, res) => {
    var to = req.query.to;
    var from = req.query.from;
    var limit = req.query.limit;

    if (isNaN(Date.parse(to))) {
        to = undefined;
    }
    if (isNaN(Date.parse(from))) {
        from = undefined;
    }

    User.findById(req.params._id)
        .select("_id username log count")
        .exec((err, data) => {
            var requiredLogs = [];
            if (to !== undefined && from !== undefined) {
                data.log.forEach((l) => {
                    const logDate = new Date(l.date).getTime();
                    if (
                        logDate <= new Date(from).getTime() &&
                        logDate >= new Date(to).getTime()
                    ) {
                        requiredLogs.push(l);
                    }
                });
            } else if (to !== undefined) {
                data.log.forEach((l) => {
                    const logDate = new Date(l.date).getTime();
                    if (logDate >= new Date(to).getTime()) {
                        requiredLogs.push(l);
                    }
                });
            } else if (from !== undefined) {
                const logDate = new Date(l.date).getTime();
                if (logDate <= new Date(from).getTime()) {
                    requiredLogs.push(l);
                }
            }
            if (requiredLogs.length !== 0) {
                data.log = requiredLogs;
            }
            if (data.log.length > limit) {
                data.log.length = limit;
            }
            data.count = data.log.length;
            console.log(data);
            res.send(data);
        });
});

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("CONNECTED TO DB");
    })
    .catch((err) => console.log(err));



const PORT = process.env.PORT || 3000
const listener = app.listen(PORT, () => {
    console.log(`Your running on http://localhost:${PORT}`)
})
