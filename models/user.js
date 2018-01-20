const bcrypt = require("bcrypt"),
_ = require("underscore"),
cryptojs = require("crypto-js"),
jwt = require("jsonwebtoken");

// just use this deprecated code as starters then figure out 
// v4 later
module.exports = function(sequelize, DataTypes) {
    const user = sequelize.define("user", {
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
            }, 
        set: function (value) {
           let salt = bcrypt.genSaltSync(10),
           hashedPassword = bcrypt.hashSync(value, salt);
           this.setDataValue("password", value);
           this.setDataValue("salt", salt);
           this.setDataValue("password_hash", hashedPassword);
            }
        }
    }, {
        hooks: {
            beforeValidate: function (user, options) {
                if (typeof user.email === "string") {
                    user.email = user.email.toLowerCase();
                }
            }
        },
        classMethods: {
            authenticate: function (body) {
                
                return new Promise(function (resolve, reject) {
                    if(typeof(body.email) !== "string" || typeof(body.password) !== "string"){
                        return reject();
                    }
                    user.findOne({
                        where: {
                            email: body.email
                        }
                    }).then(function(user){
                        if(!user || !bcrypt.compareSync(body.password, user.get("password_hash"))){
                            return reject();
                        }
                        resolve(user);
                    }, function (err) {
                           reject();
                       });
                });
            }, 
            findByToken: function (token) {
                return new Promise(function(resolve, reject) {
                    try {
                        let decodedJWT = jwt.verify(token, "qwerty098"),
                        bytes = cryptojs.AES.decrypt(decodedJWT.token, "abc123!@#!"),
                        tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
                        user.findById(tokenData.id).then(function(user){
                            if (user) {
                                resolve(user);
                            } else {
                                reject();
                            }
                        }, function (err) {
                            reject();
                        });
                    } catch (err) {
                        reject();
                    }
            }); 
            }
        },

            //instance methods are deprecated
           // need to use either sequelize's scope
           // or add toPublicJSON as method to sequelize prototype
        instanceMethods: {
            toPublicJSON: function () {
                let json = this.toJSON();
                return _.pick(json, "id", "email", "createdAt", "updatedAt")
            },
            generateToken: function(type){
                if(!_.isString(type)){
                    return undefined;
                }
                try {
                    let stringData = JSON.stringify({id: this.get("id"), type: type}),
                    encryptedData = cryptojs.AES.encrypt(stringData, "abc123!@#!").toString(),
                    token = jwt.sign({
                        token: encryptedData
                    }, "qwerty098");
                    return token;
                } catch (err) {
                    console.error(err);
                    return undefined;
                }
            }
        }
    });
    
    return user;
};
