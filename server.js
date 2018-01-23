const express = require("express"),
bodyParser = require("body-parser"),
_ = require("underscore"),
db = require("./db.js"),
bcrypt = require("bcrypt"),
middleware = require("./middleware.js")(db),
app = express(),
PORT = process.env.PORT || 3000;
let todos = [];
let _id = 0;
const id = () => (_id = _id + 1);

app.use(bodyParser.json());

app.get("/", function(req, res){
    res.send("Todo API Root");
});

// GET /todos?completed=true&q=wordInDescription with sql
app.get("/todos", middleware.requireAuthentication, function (req, res) {
    let query = req.query,
    where = {};
    
    if (query.hasOwnProperty("completed") && query.completed === "true") {
        where.completed = true;
    } else if (query.hasOwnProperty("completed") && query.completed === "false") {
        where.completed = false;
    }

    if (query.hasOwnProperty("q") && query.q.length > 0) {
        where.description = {
            $like: `%${query.q}%` 
        }
    }

    db.todo.findAll({where : where}).then(function (todos) {
        res.json(todos);
    }, function (err) {
        res.status(500).send();
    }); 
});

// GET /todo/:id with sql
app.get("/todos/:id", middleware.requireAuthentication, function(req, res){
    let todoId = parseInt(req.params.id, 10);
    db.todo.findById(todoId).then(function(todo){
        if (!!todo) {
            res.json(todo.toJSON());
        } else {
            res.status(404).send();
        }
    }, function (err) {
        res.status(500).send();
    });
});

//POST /todos with sql
app.post("/todos", middleware.requireAuthentication, function(req, res) {
    let body = _.pick(req.body, "description", "completed");
    body.description = body.description.trim();
    db.todo.create(body).then(function(todo){
        console.log("Here is the todo: ", todo.dataValues)
        res.json(todo.toJSON());
    }, function (err) {
        res.status(400).json(err);
    });
});

//DELETE /todos/:id with sql
app.delete("/todos/:id", middleware.requireAuthentication, function(req, res){
    let todoId = parseInt(req.params.id, 10);
    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then(function (rowsDeleted) {
        if(rowsDeleted === 0) {
            res.status(404).json({
                error: "No todo with id"
            });
        } else {
            res.status(204).send();
        }
    }, function () {
        res.status(500).send();
    });
});

//PUT /todos/:id with sql
app.put("/todos/:id", middleware.requireAuthentication, function(req, res){
    let todoId = parseInt(req.params.id, 10),
    matchedTodo = _.findWhere(todos, {id: todoId}),
    body = _.pick(req.body, "description", "completed"),
    attributes = {};
    body.description = body.description.trim();
    
    if (body.hasOwnProperty("completed")){
        attributes.completed = body.completed;
    } 
    if (body.hasOwnProperty("description")){
        attributes.description = body.description;
    } 
    
    db.todo.findById(todoId).then(function (todo) {
        if (todo) {
            todo.update(attributes).then(function (todo) {
                res.json(todo.toJSON());
        }, function (err) {
                res.status(400).json(err);
            });    
        } else {
            res.status(404).send();
        }
    }, function () {
        res.status(500).send();
    });    
});

app.post("/users", function(req, res){
    let body = _.pick(req.body, "email", "password");
    body.email = body.email.trim();
    db.user.create(body).then(function(user){
        res.json(user.toPublicJSON());
    }, function (err) {
        res.status(400).json(err);
    }); 
});

app.post("/users/login", function (req, res) {
    let body = _.pick(req.body, "email", "password");

    db.user.authenticate(body).then(function (user) {
        let token = user.generateToken("authentication");
        if(token){
            res.header("Auth", token).json(user.toPublicJSON());
        } else {
            res.status(401).send();
        } 
    }, function (err) {
        res.status(401).send();
        console.log(err);
    });

});

db.sequelize.sync({force: true}).then(function () {
    app.listen(PORT, function(){
        console.log(`Express listening on PORT: ${PORT}`);
    });   
});


