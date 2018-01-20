const Sequelize = require("sequelize"),
env = process.env.NODE_ENV || "development";
let sequelize;

if (env === "production") {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: "postgres"
    });
} else {
    sequelize = new Sequelize(undefined, undefined, undefined, {
        "dialect": "sqlite",
        "storage": "data/dev-todo-api.sqlite"
    });
}

let db = {};

db.todo = sequelize.import(__dirname + "/models/todo.js");
db.user = sequelize.import(__dirname + "/models/user.js");
//double-check to make sure dirname isn't causing issues
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
