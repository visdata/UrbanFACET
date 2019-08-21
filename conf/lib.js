/**
 * lib.js in backend
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2016-12-07 12:31:51
 * @version $Id$
 */

'use strict'
const fs = require('fs');
const path = require('path');

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const url = 'mongodb://127.0.0.1:27017/tdnormal';
const pool = require('./db');

let ArrayContains = function(obj, val) {
    var i = obj.length;
    while (i--) {
        if (obj[i] == val) {
            return true;
        }
    }
    
    return false;
}

/**
 * 检查文件是否存在的函数
 * @param  {[type]} directory [description]
 * @return {[type]}           [description]
 */
let checkDirectory = function(directory) {  
    if (fs.existsSync(directory)) {
        return true
    }

    return false
}

/**
 * 连接 MongoDB 数据库
 * @return {[type]} [description]
 */
let connectMongo = function() {
     let promise = new Promise(function(resolve, reject) {
        MongoClient.connect(url, function(err, db) {
            if (err) {
                reject(err)
            } else {
                resolve(db)
            }
        })
     })

     return promise
}

/**
 * 连接 MySQL 数据库
 * @return {[type]} [description]
 */
let connectMySQL = function() {
    let promise = new Promise(function(resolve, reject) {
        pool.getConnection(function(err, connection) {
            if (err) {
                reject(err)
            } else {
                resolve(connection)
            }
        })
    })

    return promise
}

/**
 * 从文件中获取数据的函数
 * @param  {[type]} filename [description]
 * @return {[type]}          [description]
 */
let getDatafromFile = function(filename) {
    let promise = new Promise(function(resolve, reject) {
        fs.readFile(filename, function(err, result) {
            if (err) {
                reject(err)
            } else {
                resolve(result)
            }
        })
    })

    return promise
}


module.exports = {
    ArrayContains: ArrayContains,
    checkDirectory: checkDirectory,
    connectMongo: connectMongo,
    connectMySQL: connectMySQL,
    getDatafromFile: getDatafromFile
}