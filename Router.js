const { request } = require("express");
const { route }   = require("express/lib/application");
const req         = require("express/lib/request");
const { NULL }    = require("mysql/lib/protocol/constants/types");
const Functions   = require("./Components/Functions.js");

class Router {

    constructor(app, db) {
        this.functions = new Functions();

        this.login(app, db);
        this.signUp(app, db);
        this.setData(app, db);
        this.getData(app, db);
        this.updateData(app, db);
    }

    // login()
    // This function handles the login process 
    login(app, db) {
        app.post("/login", (req, res) => {

            // Create a query for the database
            db.query("SELECT email, password FROM Account WHERE email = ? AND password = ?", [req.body.email, req.body.password], (err, result) => {
                // If there is an error
                if(err) {
                    res.json({ state: "Error" });   
                } else {
                    // If the result length is true
                    if(Object.keys(result).length){
                        res.json({ state: "Success" });
                    } else {
                        res.json({ state: "Not Found" });
                    }
                   
                }
            });
        });
    }


    // signUp()
    // This function handles the sign up process
    signUp(app, db) {

        app.post("/sign_up", (req, res) => {

            // Create a query for the database
            db.query("SELECT username, email, fullName, password FROM Account", (err, result) => {
                // Response Message
                let response = {
                    state: "",
                    username: false,
                    email: false,
                    fullName: false,
                    password: false 
                };
                
               
                if(err) {
                    response["state"] = "Error";
                    res.json(response);
                } else {
                    // If there is another user with at least one identical field
                    if(this.functions.parseSignUpQuery(req.body, result, response)) {
                        response["state"] = "Invalid";
                        res.json(response);
                    } else {
                        db.query("INSERT INTO Account (email, password, username, fullName) VALUES(?, ?, ?, ?);", 
                        [req.body.email, req.body.password, req.body.username, req.body.fullName], (err) => {
                            if(err) {
                                response["state"] = "Error";
                                res.json(response);
                            } else {
                                response["state"] = "Success";
                                res.json(response);
                            }
                            
                        });
                        
                    }
                }
            });
        });
    }

    // setData()
    // This function stores the upcoming sensor data to a MySQL database.
    setData(app, db) {

        // Create a query for the database
        app.get("/set_data", (req, res) => {
            
            // Update the state of the device based othe device id
            db.query("UPDATE Device SET state = ? WHERE id = ?", [req.body.state, req.body.id], (err, result) => {

                if(err) {
                    res.json("Error");
                } else {
                    res.json("Success");
                }
            });
        });
    }

    // getdata()
    // This function retrieves the data from the MySQL database
    getData(app, db) {

        app.post("/get_data", (req, res) => {
            // Get user coordinates
            let coordinates = [[parseFloat(req.body.latitude), parseFloat(req.body.longitude)]];
            let identifications = ["user"];

            // Get rubbish bin data
            db.query("SELECT id, name, latitude, longitude FROM Device WHERE state = 1", async (err, result) => {
                if(err) {
                    res.json({ state: "Error" });
                } else {
                    let responseBody = await this.functions.optimal_path(result, coordinates, identifications);
                    res.json({ objectData: responseBody});  
                }
            });
        });
    }

    // updateData()
    // This function is used to delete a row from the devices table
    updateData(app, db) {

        app.post("/update_data", (req, res) => {
            db.query("UPDATE Device SET state = 0 WHERE name = ?", req.body.name, (err, result) => {
                if(err) {
                    res.json({state: "Error"});
                } else {
                    res.json({state: "Success"});
                }
            });
        });
    }


}

module.exports = Router;