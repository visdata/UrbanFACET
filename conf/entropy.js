/**
 * entropy.js
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2017-01-08 20:16:29
 * 数据库查询接口以及回传数据处理模块
 */

'use strict'

const fs = require('fs');
const path = require('path');
const data = require('./data');
const $sql = require('../controllers/apis/mysqlMapping');
const iMax = require('./eMax');
const sMec = require('./data/metrics');
const poidis = require('./data/poidis');

function getTypeVals(val) {
    /**
     * etype: POI, ADMIN, TIMEBLOCKS
     * ctype: people, record
     */
    let etype = 'p',
        ctype = 'p',
        rtype = 'V',
    	rsize = -1,
    	rindex = -1;
    
    // the default query
    
    switch (val.substr(0,2)) {
    	case 'pp':
    		ctype = 'p';
            etype = 'p';
            rtype = 'V';
            break;
    	case 'pd':
    		ctype = 'p';
    		etype = 'a';
    		rtype = 'C';
            break;
        case 'rp':
            ctype = 'r';
            etype = 'p';
            rtype = 'D';
            break;
        case 'rd':
            ctype = 'r';
            etype = 'a';
            rtype = 'F';
            break;
        default:
            break;
    }
    
    // the new range query
    if (val[2] ==='r'){
    	rsize = Number.parseInt(val[3]);
    	rindex = Number.parseInt(val[5]);
    }
    
    return {
        'etype': etype,
        'ctype': ctype,
        'rtype': rtype,
        'rsize': rsize,
        'rindex': rindex
    }
}

function getOverview(conn, prop) {
    // city: 城市简称, tj, zjk, ts, bj
    // ftpval: 时间段或者日期类型编号, 0-8
    // entropyattr: 查找的 entropy value 字段
    // densityattr: 查找的 density value 字段
    // etable: 查找的数据表名称
    // mtype: 查询结果的显示类型,统计或者平均值
    // sqldoc: 各个表中字段的最大值
    // eMax: 获得的 entropy 最大值
    // dMax: 获得的 density 最大值

    let city = prop['city'],
        ftpval = prop['ftpval'],
        typs = getTypeVals(prop['etype']),
        entropyattr = `${typs['etype']+typs['ctype']}sval`,
        densityattr = `w${typs['ctype']}number`,
        etable = ftpval !== '' ? `${city}F${ftpval}mat` : `${city}Ematrix`,
        mtype = 'ave'；        

    if (typs['rsize'] > 0){
    	etable = `${city}R${typs[rtype]}${typs[rindex]}mat`;
    	mtype = 'sum';
    }
    sqldoc = iMax[mtype];
    eMax = Number.parseFloat(sqldoc[etable][entropyattr]);
    dMax = Number.parseFloat(sqldoc[etable][densityattr]);
        
    console.log('Query table name: ', etable, 'eMax', eMax, 'dMax', dMax);

    let p = new Promise(function(resolve, reject) {
        let sql = $sql.getValScale[mtype] + $sql.getOverviewVal[mtype] + $sql.getDistribute(mtype, eMax) + $sql.getDistribute('sum', dMax),
            param = [
                entropyattr, densityattr, etable,
                entropyattr, densityattr, etable, entropyattr, densityattr,
                entropyattr, etable, entropyattr, densityattr, entropyattr,
                densityattr, etable, entropyattr, densityattr, densityattr
            ];

        if (mtype === 'ave') {
            param = [
                entropyattr, densityattr, densityattr, etable,
                entropyattr, densityattr, densityattr, etable, entropyattr, densityattr,
                entropyattr, densityattr, etable, entropyattr, densityattr, entropyattr, densityattr,
                densityattr, etable, entropyattr, densityattr, densityattr,
            ];
        }
        
        if (typs['rsize'] > 0){
        	sql = $sql.getValScale[mtype] + $sql.getOverviewVal[mtype];
            param = [
                densityattr, densityattr, etable,
                densityattr, densityattr, etable, densityattr, densityattr
            ];
        }

        conn.query(sql, param, function(err, result) {
            conn.release();

            if (err) {
                reject(err);
            } else {
                // result[0]: Max value of entropy 
                // result[1]: Entropy list
                // result[2]: Entropy distribution stats
                // result[3]: Density distribution stats
                console.log('eval type: ', typeof result[0][0]['eval']);

                let DATA = [],
                    SPLIT = 0.003,
                    centerincrement = 0.0015, //.toFixed(4),
                    locs = data.getRegionBound(city),
                    elist = result[1],
                    reslen = elist.length

                console.log('Result length', reslen)
                for (let i = elist.length - 1; i >= 0; i--) {
                    let id = Number.parseInt(elist[i]['id']),
                        LNGNUM = parseInt((locs['east'] - locs['west']) / SPLIT + 1),
                        latind = parseInt(id / LNGNUM),
                        lngind = id - latind * LNGNUM,
                        lat = (locs['south'] + latind * SPLIT),
                        lng = (locs['west'] + lngind * SPLIT),
                        lnginc = (lng + SPLIT),
                        latinc = (lat + SPLIT),
                        lngcen = (lng + centerincrement),
                        latcen = (lat + centerincrement),
                        coordsarr = [
                            [lng, lat],
                            [lnginc, lat],
                            [lnginc, latinc],
                            [lng, latinc],
                            [lng, lat]
                        ]

                    DATA.push({
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [coordsarr]
                        },
                        "type": "Feature",
                        "id": id,
                        "prop": {
                            'e': parseFloat(elist[i]['eval']),
                            'd': parseInt(elist[i]['dval']),
                            'c': [lngcen, latcen] // center point
                        }
                    })
                }

                if (typs['rsize'] > 0){
                	resolve({
	                    'scode': 1,
	                    'data': {
	                        "type": "FeatureCollection",
	                        "features": DATA,
	                        "prop": {
	                            'scales': {
	                                'e': parseFloat(result[0][0]['eval']),
	                                'd': parseInt(result[0][0]['dval'])
	                            }
	                        }
	                    }
	                })
                }
                else{
                
	                // Remove the last element
	                let lste = result[2].pop(),
	                    lstd = result[3].pop();
	
	                result[2][result[2].length - 1]['v'] += lste['v'];
	                result[3][result[3].length - 1]['v'] += lstd['v'];
	
	                resolve({
	                    'scode': 1,
	                    'data': {
	                        "type": "FeatureCollection",
	                        "features": DATA,
	                        "prop": {
	                            'scales': {
	                                'e': parseFloat(result[0][0]['eval']),
	                                'd': parseInt(result[0][0]['dval'])
	                            }
	                        },
	                        'chart': {
	                            'e': result[2],
	                            'd': result[3] // k, v
	                        }
	                    }
	                })
                }
            }
        })
    })

    return p;
}

function getBoundary(city) {
    let data = require(`./data/${city}`);
    // console.log(data);
    return data;
}

function getMecStat(city) {
    // console.log(city);
    return sMec[city];
}

function getAoiNum(conn, prop) {
    let city = prop['city'],
        poiattr = 'total',
        // poiattr = prop['class'] === '11' ? 'total':`poi${prop['class']}`,
        p = new Promise(function(resolve, reject) {
            let sql = $sql.getAoiVal,
                param = [poiattr, `${city}CPOI`];

            // console.log('params', param)
            conn.query(sql, param, function(err, result) {
                conn.release();

                if (err) {
                    reject(err);
                } else {
                    let res = [];
                    for (let i = result.length - 1; i >= 0; i--) {
                        res.push({
                            'geo': [result[i]['lat'], result[i]['lng']],
                            'num': result[i]['num']
                        })
                    }
                    resolve({ 'scode': 1, 'data': res });
                }
            })
        });

    return p;
}

function getAoiDetails(conn, prop) {
    let city = prop['city'],
        poitype = prop['type'];

    let p1 = new Promise(function(resolve, reject) {
        let table = conn.collection(`pois_${data.getCityFullName(city)}`);

        console.log(data.getCityFullName(city));
        table.find({
            'properties.ftype': 2,
            'properties.center': {
                '$near': {
                    '$geometry': {
                      'type': "Point" ,
                      'coordinates': [ 116.37914664228447, 40.02479016490592 ]
                    },
                    '$maxDistance': 1500
                }
            }
        }, {
            'properties': 1
        }).toArray(function(err, docs){
            // console.log(err, docs);
            if (err) {
                reject(err);
            }

            let res = genGeojson(docs);
            resolve(res);
        });
    });

    let p2 = new Promise(function(resolve, reject) {
        let table = conn.collection(`pois_${data.getCityFullName(city)}`);

        console.log(data.getCityFullName(city));
        table.find({
            'properties.ftype': 2,
            'properties.radius': { '$gte': 200 },
            'properties.center': {
             '$near': {
               '$geometry': {
                  'type': "Point",
                  'coordinates': [ 116.38698591152206, 39.91039840227936 ]
               },
               '$maxDistance': 30000
             }
            }
        }, {
            'properties': 1
        }).toArray(function(err, docs){
            // console.log(err, docs);
            if (err) {
                reject(err);
            }

            let res = genGeojson(docs);
            resolve(res);
        });
    });

    function genGeojson(data) {
        let res = [];

        for (let i = data.length - 1; i >= 0; i--) {
            let obj = data[i],
                center = obj['properties']['center']['coordinates'];
                res.push({
                    'name': obj['properties']['name'],
                    'geo': [center[1], center[0]],
                    'num': 1,
                    'radius': obj['properties']['radius']
                });
        }

        return res;
    }

    return Promise.all([p1, p2]);
}

function getAoiDis(city, type) {
    let data = poidis[city][type],
        keys = ['Food&Supply', 'Entertainment', 'Education', 'Transportation', 'Healthcare', 'Financial', 'Accommodation', 'Office', 'Landscape', 'Manufacturer'];

    // data.pop();
    return { 'k': keys, 'v': data };
}

function generateGridsJson(locs, obj) {
    fs.exists('myjsonfile.json', function(exists) {
        if (exists) {
            console.log("yes file exists");
        } else {
            console.log("file not exists");

            var json = JSON.stringify(obj);
            fs.writeFile('myjsonfile.json', json);
        }
    });
}

function getExtraInfo(db, params) {
    let city = params.city,
        ftype = params.ftype,
        collection = db.collection('pois_beijing');

    // console.log('idlist: ', idlist)
    collection.find({ 'properties.ftype': Number.parseInt(ftype) }, { 'properties.center': 1, 'properties.name': 1, 'properties.': 1 }).toArray(function(err, result) {

        mongoCallback(err, result, res, {
            "clalist": clalist,
            "idstr": idstr,
            "db": db,
            "claidRelation": claidRelation,
            "file": path.join(dir, file)
        })
    });
}

module.exports = {
    getOverview: getOverview,
    getExtraInfo: getExtraInfo,
    getBoundary: getBoundary,
    getAoiNum: getAoiNum,
    getAoiDetails: getAoiDetails,
    getMecStat: getMecStat,
    getAoiDis: getAoiDis
}