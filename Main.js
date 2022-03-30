const express       = require("express");
const app           = express();
const path          = require("path");
const mysql         = require("mysql");
const session       = require("express-session");
const MySQLStore    = require("express-mysql-session")(session)
const Router        = require("./Router");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());


// Database

// Connection information
const db = mysql.createConnection({
    host : "127.0.0.1",
    user : "georgem",
    password : "georgem2000",
    database : "smart-bin"
});


db.connect(function(err) {
    if(err) {
        console.log("Database Error.");
        throw err;
        return false;
    }
});


const sessionStore = new MySQLStore({
    expiration: (1825 * 86400 * 1000),
    endConnectionOnClose: false
}, db);


app.use(session({
    key: "abcdefg123456789",
    secret: "123456789abcdefg",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: (1825 * 86400 * 1000),
        httpOnly: false
    }
}));

new Router(app, db);

app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000);

