const bcrypt = require("bcrypt"),
_ = require("underscore");

// this will serve as the updated user model when using sequelizev4
// Sequelize.STRING // DataTypes.STRING
/* instanceMethods are deprecated


*/ 
const User = sequelize.define("user", {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }             
    },
    salt: {
        type: DataTypes.STRING
    },
    password_hash: {
        type: DataTypes.STRING
    },
    password: {
        type: DataTypes.VIRTUAL,
        allowNull: false,
        validate: {
            len: [7, 100]
        }
    },
    set: function (value) {
        let salt = bcrypt.genSaltSync(10),
        hashedPassword = bcrypt.hashSync(value, salt);
        this.setDataValue("password", value);
        this.setDataValue("salt", salt);
        this.setDataValue("password_hash", hashedPassword);
    },{ 
        hooks : {
            beforeValidate: function (user. options) {
                if (typeof user.email === "string") {
                    user.email = user.email.toLowerCase();
                }
            }
        }
    },{
        scopes: {
            public: {
                attributes: ["id", "email", "createdAt", "updatedAt"]
            }
        }
    } 
});

User.prototype.toPublicJSON = function() {
    let json = this.toJSON();
    return _.pick(json, "id", "email", "createAt", "updatedAt"
};

export.modules = User;
