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
//const bezier = require('../node_modules/turf-bezier');
const sdcurve = require('./SDCurve');
const simplify = require('./simplify');

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

    switch (val.substr(0,2)) {
    	  case 'pp':
            ctype = 'p';
            etype = 'p';
			rtype = 'V';
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
        case 'pd':
            ctype = 'p';
			etype = 'a';
			rtype = 'C';
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
    if(['ppb', 'pdb', 'rpb', 'rdb', 'ppbo', 'pdbo', 'rpbo', 'rdbo'].indexOf(prop['etype']) > -1){
		let city = prop['city'],
        ftpval = prop['ftpval'],
        typs = getTypeVals(prop['etype'] + '0_0'),
        entropyattr = `${typs['etype']+typs['ctype']}sval`,
        densityattr = 'wpnumber',
        etable,
        mtype = 'sum',
        sqldoc = iMax[mtype];
    
		console.log("typs: " + JSON.stringify(typs))
		console.log("ftp:" + ftpval)
		//console.log("sqldoc" + JSON.stringify(sqldoc))

		if(ftpval !== ''){
			if (city === 'bj'){
				etable = `bjF${ftpval}mat`;
			}else {
				etable = `${city}F${ftpval}mat`;
			}
		}else {
			if (city === 'bj'){
				etable = `wbjEmatrix`;
			}else {
				etable = `${city}Ematrix`;
			}
		}
		
		
		
		//let eMax = Number.parseFloat(sqldoc[etable][entropyattr]),
		//	dMax = Number.parseFloat(sqldoc[etable][densityattr]);

		//console.log('city: ', city, 'Query table name: ', etable, 'eMax', eMax, 'dMax', dMax);
		
		let p = new Promise(function(resolve, reject) {
			
			let etable_0 = `${city}R${typs['rtype']}0mat`,
				etable_1= `${city}R${typs['rtype']}1mat`,
				etable_2 = `${city}R${typs['rtype']}2mat`;
				
			console.log(etable_0, etable_1, etable_2)
			console.log('tttttttttype:    ' + etable)
			let sql = $sql.getValScale[mtype] + $sql.getOverviewValD[mtype] + $sql.getValScale[mtype] + $sql.getOverviewValD[mtype] + $sql.getValScale[mtype] + $sql.getOverviewValD[mtype],
			param = [
				densityattr, densityattr, etable_0,
				densityattr, etable_0, densityattr, densityattr,
				densityattr, densityattr, etable_1,
				densityattr, etable_1, densityattr, densityattr,
				densityattr, densityattr, etable_2,
				densityattr, etable_2, densityattr, densityattr
			];
		
		// console.log(sql);
		// console.log(param);
		
			conn.query(sql, param, function(err, result) {
					//console.log("result" + JSON.stringify(result[0]))
					//console.log("result" + JSON.stringify(result[1]))
				conn.release();

				if (err) {
					reject(err);
				} else {
					console.log('eval0 type: ', result[0][0]['eval']);
					console.log('eval1 type: ', result[2][0]['eval']);
					console.log('eval2 type: ', result[4][0]['eval']);

					let DATA = [],
						result_e_max = 0.0,
						result_d_max = 0.0,
						SPLIT = 0.003,
						centerincrement = 0.0015, //.toFixed(4),
						locs = data.getRegionBound(city);
						
					for(var svg_num = 0; svg_num < 3; svg_num ++){
						let list = result[1 + svg_num*2],
							reslen = list.length;
						
						//console.log("dlist:" + JSON.stringify(dlist))
						console.log('Result length', reslen)
						for (let i = list.length - 1; i >= 0; i--) {
							let id = Number.parseInt(list[i]['id']),
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
								
								//console.log("map    : " + coordsarr[0])

							//console.log("dilst[j] :" + dlist[1]['dval'])

							DATA.push({
								"geometry": {
									"type": "Polygon",
									"coordinates": [coordsarr]
								},
								"type": "Feature",
								"id": id,
								"prop": {
									'v': parseFloat(list[i]['val']),
									'e': parseFloat(list[i]['val']),
									'd': parseFloat(list[i]['val']),
									'c': [lngcen, latcen],
									'num': Number.parseInt(svg_num)// center point
								}
							})
						}
						
						if(result[0 + svg_num*2][0]['eval'] > result_e_max){
							result_e_max = result[0 + svg_num*2][0]['eval'];
						}
						if(result[0 + svg_num*2][0]['dval'] > result_d_max){
							result_d_max = result[0 + svg_num*2][0]['dval'];
						}
							
						console.info("end")
					}
					resolve({
					  'scode': 1,
					  'data': {
						  "type": "FeatureCollection",
						  "features": DATA,
						  "prop": {
							  'scales': {
								  'e': parseFloat(result_e_max),
								  'd': parseFloat(result_d_max)
							  }
						  }
					  }
					})
						
				}
			})
			
		})
		return p;
	}
	else{
		let city = prop['city'],
        ftpval = prop['ftpval'],
        typs = getTypeVals(prop['etype']),
        entropyattr = `${typs['etype']+typs['ctype']}sval`,
        densityattr = `w${typs['ctype']}number`,
        etable,
        mtype = 'ave',
        sqldoc = iMax[mtype];
    
		console.log("typs: " + JSON.stringify(typs))
		console.log("ftp:" + ftpval)
		//console.log("sqldoc" + JSON.stringify(sqldoc))

		if(ftpval !== ''){
			if (city === 'bj'){
				etable = `bjF${ftpval}mat`;
			}else {
				etable = `${city}F${ftpval}mat`;
			}
		}else {
			if (city === 'bj'){
				etable = `wbjEmatrix`;
			}else {
				etable = `${city}Ematrix`;
			}
		}
		
		if (typs['rsize'] >= 0){
			etable = `${city}R${typs['rtype']}${typs['rindex']}mat`;
			mtype = 'sum';
			sqldoc = iMax[mtype];
		}

		let eMax = Number.parseFloat(sqldoc[etable][entropyattr]),
			dMax = Number.parseFloat(sqldoc[etable][densityattr]);

		console.log('city: ', city, 'Query table name: ', etable, 'eMax', eMax, 'dMax', dMax);
	   
		
		let p = new Promise(function(resolve, reject) {
				let sql = $sql.getValScale[mtype] + $sql.getOverviewValE[mtype] + $sql.getDistribute(mtype, eMax) + $sql.getDistribute('sum', dMax),
				param = [
					entropyattr, densityattr, etable,
					//entropyattr, densityattr, etable, entropyattr, densityattr,
					entropyattr, etable, entropyattr, densityattr, entropyattr,
					entropyattr, etable, entropyattr, densityattr, entropyattr,
					densityattr, etable, entropyattr, densityattr, densityattr
				];

			if (mtype === 'ave') {
				param = [
					entropyattr, densityattr, densityattr, etable,
					//entropyattr, densityattr, densityattr, etable, entropyattr, densityattr,
					entropyattr, densityattr, etable, entropyattr, densityattr, entropyattr, densityattr,
					entropyattr, densityattr, etable, entropyattr, densityattr, entropyattr, densityattr,
					densityattr, etable, entropyattr, densityattr, densityattr
				];
			}
				if (prop['etype'] === 'de')
				{
					  sql = $sql.getValScale[mtype] + $sql.getOverviewValD[mtype] + $sql.getDistribute(mtype, eMax) + $sql.getDistribute('sum', dMax),
					param = [
						entropyattr, densityattr, etable,
						//entropyattr, densityattr, etable, entropyattr, densityattr,
						densityattr, etable, densityattr, densityattr,
						entropyattr, etable, entropyattr, densityattr, entropyattr,
						densityattr, etable, entropyattr, densityattr, densityattr
					];

				if (mtype === 'ave') {
					param = [
						entropyattr, densityattr, densityattr, etable,
						//entropyattr, densityattr, densityattr, etable, entropyattr, densityattr,
						densityattr, etable, densityattr, densityattr,
						entropyattr, densityattr, etable, entropyattr, densityattr, entropyattr, densityattr,
						densityattr, etable, entropyattr, densityattr, densityattr
					];
				}
					
				}
				
				if (typs['rsize'] > 0){
				sql = $sql.getValScale[mtype] + $sql.getOverviewValD[mtype];
				param = [
					densityattr, densityattr, etable,
					densityattr, etable, densityattr, densityattr
				];
			}
			
			// console.log(sql);
			// console.log(param);
			
			conn.query(sql, param, function(err, result) {
					//console.log("result" + JSON.stringify(result[0]))
					//console.log("result" + JSON.stringify(result[1]))
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
						list = result[1],
						reslen = list.length
					
					//console.log("dlist:" + JSON.stringify(dlist))
					console.log('Result length', reslen)
					for (let i = list.length - 1; i >= 0; i--) {
						let id = Number.parseInt(list[i]['id']),
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

						//console.log("dilst[j] :" + dlist[1]['dval'])

						DATA.push({
							"geometry": {
								"type": "Polygon",
								"coordinates": [coordsarr]
							},
							"type": "Feature",
							"id": id,
							"prop": {
								'v': parseFloat(list[i]['val']),
								'e': parseFloat(list[i]['val']),
								'd': parseFloat(list[i]['val']),
								'c': [lngcen, latcen] // center point
							}
						})
					}
					console.info("end")

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

						//console.log("result2 :" + JSON.stringify(result[2]))
					
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
}

function getCompareview(conn, prop) {
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
        etable0 = ftpval !== '' ? `${city}F0mat` : `${city}Ematrix`,
        etable1 = ftpval !== '' ? `${city}F1mat` : `${city}Ematrix`,
        etable2 = ftpval !== '' ? `${city}F2mat` : `${city}Ematrix`,
        etable3 = ftpval !== '' ? `${city}F3mat` : `${city}Ematrix`,
        etable4 = ftpval !== '' ? `${city}F4mat` : `${city}Ematrix`,
        etable5 = ftpval !== '' ? `${city}F5mat` : `${city}Ematrix`,
        mtype = 'ave',
        sqldoc = iMax[mtype];
    
    let p = new Promise(function(resolve, reject) {
		let sql = $sql.getCompareValCityE[mtype],
		    param = [
			  entropyattr, entropyattr, densityattr, entropyattr, entropyattr, densityattr, 
			  entropyattr, entropyattr, densityattr, entropyattr, entropyattr, densityattr];
		
        if (ftpval === ''){
        		if (mtype === 'ave') {
                 param = [
                 		entropyattr, densityattr, entropyattr, densityattr,
                 		entropyattr, densityattr, entropyattr, densityattr,
                 		entropyattr, densityattr, entropyattr, densityattr,
                 		entropyattr, densityattr, entropyattr, densityattr
                 ];
             }
        		if (prop['etype'] === 'de')
         		{
         			sql = $sql.getCompareValCityD[mtype],
                     param = [
                     		densityattr, densityattr, densityattr, densityattr, densityattr, densityattr, densityattr, densityattr
                     ];

                 if (mtype === 'ave') {
                     param = [
                     		densityattr, densityattr, densityattr, densityattr, densityattr, densityattr, densityattr, densityattr
                     ];
                 	}
         		}
        }
        else{
        		if (prop['etype'] === 'de'){
        			sql = $sql.getCompareValTimeD[mtype],
                    param = [
                    		densityattr, etable0, densityattr, 
                    		densityattr, etable1, densityattr, 
                    		densityattr, etable2, densityattr, 
                    		densityattr, etable3, densityattr, 
                    		densityattr, etable4, densityattr, 
                    		densityattr, etable5, densityattr
                    ];

                if (mtype === 'ave') {
                    param = [
                    		densityattr, etable0, densityattr, 
                    		densityattr, etable1, densityattr, 
                    		densityattr, etable2, densityattr, 
                    		densityattr, etable3, densityattr, 
                    		densityattr, etable4, densityattr, 
                			densityattr, etable5, densityattr
                    ];
                }
        		}
        		else {
        			sql = $sql.getCompareValTimeE[mtype],
        			 param = [
                  		entropyattr, etable0, entropyattr, densityattr,
                  		entropyattr, etable1, entropyattr, densityattr,
                  		entropyattr, etable2, entropyattr, densityattr,
                  		entropyattr, etable3, entropyattr, densityattr,
                  		entropyattr, etable4, entropyattr, densityattr,
                  		entropyattr, etable5, entropyattr, densityattr
                  ];
        			if (mtype === 'ave') {
                        param = [
                        		entropyattr, densityattr, etable0, entropyattr, densityattr,
                        		entropyattr, densityattr, etable1, entropyattr, densityattr,
                      		entropyattr, densityattr, etable2, entropyattr, densityattr,
                      		entropyattr, densityattr, etable3, entropyattr, densityattr,
                      		entropyattr, densityattr, etable4, entropyattr, densityattr,
                      		entropyattr, densityattr, etable5, entropyattr, densityattr
                        ];
                    }
        		}
        }
        conn.query(sql, param, function(err, result) {
        		//console.log("result" + JSON.stringify(result[0]))
            conn.release();
            
            //console.log("result" + JSON.stringify(sql))
            //console.log("result" + JSON.stringify(param))
            //console.log("result" + JSON.stringify(result))
            
            if (err) {
                reject(err);
            } else {
                let DATA = [],
                    list = result,
                    reslen = list.length
                
                //console.log("dlist:" + JSON.stringify(dlist))
                console.log('Result length', reslen)
                for (let i = list.length - 1; i >= 0; i--) {
                    let id = Number.parseInt(list[i]['id'])
                    
                    //console.log("dilst[j] :" + dlist[1]['dval'])
                    
                    DATA.push({
                        "geometry": {
                            "type": "Polygon"
                        },
                        "type": "Feature",
                        "id": id,
                        "prop": {
                            'v': parseFloat(list[i]['val']),
                            'e': parseFloat(list[i]['val']),
                            'd': parseFloat(list[i]['val'])
                        }
                    })
                }
                console.info("enda")
                
                resolve({
                    'scode': 1,
                    'data': {
                        "type": "FeatureCollection",
                        "features": DATA,
                    }
                })
            }
        })
    })
    return p;
}



function getBoundary(city) {
    let data = require(`./data/${city}`);
    //console.log(data);
    return data;
}

function getClusterBoundary(city) {
	let data = require(`./data/${city}` + `_cluster.json`);
	//let data = require(`./data/${city}`);
    return data;
}

function getClusterBoundaryUpdate(prop) {
	let city = prop['city'],
		s = prop['s'],
		c = prop['c'];
	
	let data = require(`./data/${city}` + `_cluster_` + `${s}` + `_` + `${c}`+ `.json`);
	//let data = require(`./data/${city}`);
    return data;
}

function getDistrictClusterDatasets(prop) {
	let city = prop['city'],
		k = prop['k'];
	
	let data = require(`./data/${city}` + `_district_cluster_` + `${k}` + `.json`);
	
    return data;
}

function getString(objarr){
　　var typeNO = objarr.length;
  　 var tree = "[";
 　　for (var i = 0 ;i < typeNO ; i++){
   　　　tree += "[";
   　　　tree +="'"+ objarr[i][0].toString()+"',";
   　　　tree +="'"+ objarr[i][1].toString()+"'";
  　　　 tree += "]";
  　　　 if(i<typeNO-1){
    　　 　　tree+=",";
 　　　  }
  　 }
  　 tree+="]";
  　 return tree;
}

function getstring(objarr){
	var tree = "['";
	tree += objarr[0].toString() + "','";
	tree += objarr[1].toString() + "']";
	return tree;
}

function removeByValue(arr, val) {  
  for(var i=0; i<arr.length; i++) {  
    if(arr[i] == val) {  
      arr.splice(i, 1);  
      break;  
    }  
  }  
}  

function DFS(line, num , tree, boundary, c, result){
	let visit = {},
		length =1;
	tree.push(num)
	visit[num] = length;
	while(line[num].length > 0){
		for (var each in line[num]){
			each = line[num][each];
			if(tree.indexOf(each) <= -1){
				length += 1;
				tree.push(each);
				visit[each] = length;
			}
			else{
				let begin = visit[each],
					end = length,
					tree1 = [];
				for(var n = begin-1; n < length; n ++){
					tree1.push(eval(tree[n]));
				}
				tree1.push(eval(each));
				tree.splice(begin, length-begin);
				//console.log("tree1.len:   " + tree1.length)
				if(tree1.length > c){
					let end_boundary = boundary,
						pointset = [];
					for(var i in tree1){
						i = tree1[i];
						pointset.push({x:parseFloat(i[0]), y:parseFloat(i[1])})
					}

					var simplified_points = simplify(pointset, 0.001);
					if (simplified_points.length>4){
						pointset = simplified_points;
					}
					simplified_points = null;

					var curve = new sdcurve.SDCurve({
						points: pointset,
						open: false,
						degree: 4,
						resolution: 6
					});
					var curve_line = [];
					var step_size = 1.0/(pointset.length*10);
					for(var u=0.0; u<1.0; u+= step_size){
						var p = curve.pointAt(u).pointOnCurve;
						//console.log("p:"+JSON.stringify(p));
						curve_line.push([p.x, p.y]);
					}
					var last_point = pointset[pointset.length-1]; 
					curve_line.push([last_point.x, last_point.y]);
					//console.log("curve:"+JSON.stringify(curve_line));
					end_boundary['geometry']['coordinates'].push(curve_line);
					result.push(end_boundary);
				}
				for(var i in tree1){
					visit[getstring(tree1[i])] = 0;
				}
				visit[each] = begin;
				length = begin;
			}
			removeByValue(line[each], num);
			removeByValue(line[num], each);
			num = each;
			break;
		}
	}
}

function drawflower(c, data, result, svg_num){
	let boundary = {};
	boundary['type'] = 'Feature';
    boundary['properties'] = {};
    boundary['geometry'] = {};
    boundary['geometry']['type'] = 'Polygon';
    boundary['geometry']['coordinates'] = [];
    let bound = {};
	boundary['properties']['color'] = svg_num;
	
	for(var a = 0; a < data.length; a++){
		let varr = data[a];
		for(var i = 0; i < 4; i++){
			let p1 = [varr[i][0], varr[i][1]],
				p2 = [varr[i+1][0], varr[i+1][1]];
			if(varr[i][0] == varr[i+1][0]){
				if(varr[i][1] < varr[i+1][1]){
					var li = getString([p1,p2]);
				}
				else{
					var li = getString([p2,p1]);
				}
			}
			else{
				if(varr[i][0] < varr[i+1][0]){
					var li = getString([p1,p2]);
				}
				else{
					var li = getString([p2,p1]);
				}
			}
			if(bound.hasOwnProperty(li)){
				bound[li] += 1;
			}
			else{
				bound[li] = 1;
			}
		}
	}
	
	let line = {};
	for(var each in bound){
		if(bound[each] == 1){
			let li = eval(each),
				li_x = getstring(li[0]),
				li_y = getstring(li[1]);
			if(line.hasOwnProperty(li_x)){
				line[li_x].push(li_y);
			}
			else{
				line[li_x] = [];
				line[li_x].push(li_y);
			}
			if(line.hasOwnProperty(li_y)){
				line[li_y].push(li_x);
			}
			else{
				line[li_y] = [];
				line[li_y].push(li_x);
			}
		}
	}
	
	//console.log("line: " + JSON.stringify(line))
	
	for(var each in line){
		let i = 0;
		if(line.length != 0){
			i += 1;
			let tree = [];
			DFS(line, each, tree, boundary, c, result);
		}
	}
}

function DFS_rectangle(link, num, tree, visit, data){
	let nums = [num];
	visit[nums[0]] = 1;
	while(nums.length > 0){
		num = nums[0];
		for(var i in link[num]){
			if(visit[link[num][i]] == 0){
				tree.push(data[link[num][i]]);
				visit[link[num][i]] = 1;
				nums.push(link[num][i]);
			}
		}
		nums.splice(0,1);
	}
}

function drawmap(c, data ,result, svg_num){
	// 用来绘制边界
	// c = 
	// data 所有点的
	let bound = {},
		link = {};
	//console.log("data len"  + data.length)
	for(var a = 0; a < data.length; a++){
		let varr = data[a];
		for(var i = 0; i < 4; i++){
			let p1 = [varr[i][0], varr[i][1]],
				p2 = [varr[i+1][0], varr[i+1][1]];
			if(varr[i][0] == varr[i+1][0]){
				if(varr[i][1] < varr[i+1][1]){
					var li = getString([p1,p2]);
				}
				else{
					var li = getString([p2,p1]);
				}
			}
			else{
				if(varr[i][0] < varr[i+1][0]){
					var li = getString([p1,p2]);
				}
				else{
					var li = getString([p2,p1]);
				}
			}
			if(bound.hasOwnProperty(li)){
				bound[li].push(a);
			}
			else{
				bound[li] = [];
				bound[li].push(a);
			}
		}
	}
	for(var i in bound){
		if(bound[i].length == 2){
			if(link.hasOwnProperty(bound[i][0])){
				link[bound[i][0]].push(bound[i][1]);
			}
			else{
				link[bound[i][0]] = [];
				link[bound[i][0]].push(bound[i][1]);
			}
			if(link.hasOwnProperty(bound[i][1])){
				link[bound[i][1]].push(bound[i][0]);
			}
			else{
				link[bound[i][1]] = [];
				link[bound[i][1]].push(bound[i][0]);
			}
		}
	}
	//console.log(link)
	if(link.length != 0){
		let visit = [];
		for(var i = 0; i < data.length; i++){
			visit.push(0);
		}
		for(var each in link){
			if(visit[each] == 0){
				let tree = [];
				tree.push(data[each])
				DFS_rectangle(link, each, tree, visit, data)
				if (tree.length > 5){
					drawflower(c, tree, result, svg_num);
				}
			}
		}
	}
}

function getBubbleContourData(conn,prop){
	console.log("entropy getBubbleContourData start");

	let typs = getTypeVals(prop['etype'] + '0_0'),
		min_len = prop['min_len'],
		percent = prop['percent'];

	let p = new Promise(function(resolve, reject) {
		let result = require(`./data/bj_cluster_contour_${typs['rtype']}` + `_${percent}` + `_${min_len}` + `.json`)
		console.log("entropy.js getdata")
		console.log(result)
		
		resolve({
		'scode': 1,
		'fdata': {
			'data':result
		}
		}) 
	})
	return p;
}

function getThreetypeview(conn, prop) {
	console.log("entropy getThreetypeview start");
	console.log(prop)

	let typs = getTypeVals(prop['etype'] + '0_0'),
		bound_value_str = prop['bound_value'],
		contour_percent = prop['contour_percent'];
	
	let bound_value = bound_value_str.split(",");


	/**
	 * 这里是新的splatterplot的数据
	 */

	let new_p = new Promise(function(resolve, reject) {
		let result = null;
		try{
			//result = require(`./data/bubble_contour/new_bj_cluster_${typs['rtype']}` + `_${bound_value[0]}-${bound_value[1]}` + `_${contour_percent}` + `.json`);
			console.log(`./splatter_contour_data/bj_V_1.5-3_1.json`)
			result=require(`./splatter_contour_data/splatter_bj_D_1.5-3_3.json`)
			// result = require(`./data/new_bb_contour/bj_splatter_${typs['rtype']}` + `_${bound_value[0]}-${bound_value[1]}` + `_${contour_percent}` + `.json`);
			

		}catch(err){
			result = require(`./splatter_contour_data/splatter_bj_V_1.5-3_1.json`);

			// reject(err)
		}
		
		resolve({
		'scode': 1,
		'fdata': {
			'data':result
		}
		}) 


	})
	return new_p;


	/**
	 * 以下是原有的bubbleset数据
	 */

	// let p = new Promise(function(resolve, reject) {
	// 	let result = null;
	// 	try{
	// 		//result = require(`./data/bubble_contour/new_bj_cluster_${typs['rtype']}` + `_${bound_value[0]}-${bound_value[1]}` + `_${contour_percent}` + `.json`);
	// 		console.log(`./data/new_bb_contour/bj_splatter_${typs['rtype']}` + `_${bound_value[0]}-${bound_value[1]}` + `_${contour_percent}` + `.json`)
	// 		result = require(`./data/new_bb_contour/bj_splatter_${typs['rtype']}` + `_${bound_value[0]}-${bound_value[1]}` + `_${contour_percent}` + `.json`);
			

	// 	}catch(err){
	// 		result = require(`./data/bubble_contour/new_bj_cluster_V` + `_1.5-3` + `_10` + `.json`);

	// 		// reject(err)
	// 	}
		
	// 	resolve({
	// 	'scode': 1,
	// 	'fdata': {
	// 		'data':result
	// 	}
	// 	}) 


	// })
	// return p;

	/** 以下是未改版前的bubble set */

	// city: 城市简称, tj, zjk, ts, bj
    // ftpval: 时间段或者日期类型编号, 0-8
    // entropyattr: 查找的 entropy value 字段
    // densityattr: 查找的 density value 字段
    // etable: 查找的数据表名称
    // mtype: 查询结果的显示类型,统计或者平均值
    // sqldoc: 各个表中字段的最大值
    // eMax: 获得的 entropy 最大值
    // dMax: 获得的 density 最大值
		// let city = prop['city'],
        // ftpval = prop['ftpval'],
        // typs = getTypeVals(prop['etype'] + '0_0'),
        // entropyattr = `${typs['etype']+typs['ctype']}sval`,
        // densityattr = 'wpnumber',
        // etable,
		// mtype = 'sum',
		// sqldoc = iMax[mtype],
		// min_len = prop['min_len'],
		// percent = prop['percent'];
		
		// let etable_0 = `${city}R${typs['rtype']}0mat`,
		// 	etable_1= `${city}R${typs['rtype']}1mat`,
		// 	etable_2 = `${city}R${typs['rtype']}2mat`;
				
		// let max_density = 0, density_set = [sqldoc[etable_0][densityattr], sqldoc[etable_1][densityattr], sqldoc[etable_2][densityattr]];
		
		// for(var i=0; i <3; i++){
		// 	if(density_set[i] > max_density){
		// 		max_density = density_set[i];
		// 	}
		// }
		
		// console.log("max_density:  " + max_density)
		
		// let p = new Promise(function(resolve, reject) {
		// 	//(`./data/${city}` + `_cluster_` + `${s}` + `_` + `${c}`+ `.json`)
		// 	let result = require(`./data/bj_cluster_${typs['rtype']}` + `_${percent}` + `_${min_len}` + `.json`)
			
		// 	let RESULT = [],
		// 		SPLIT = 0.003,
		// 		centerincrement = 0.0015, //.toFixed(4),
		// 		locs = data.getRegionBound(city);
			
		// 	let DATA = [];
			
		// 	let max_density_i = 0;
		// 	for(var svg_num = 0; svg_num < 3; svg_num ++){
		// 		let list = result[svg_num],
		// 			reslen = list.length,
		// 			hdata= [];
				
		// 		//console.log("dlist:" + JSON.stringify(dlist))
		// 		console.log('Result length', reslen)
		// 		for (let i = list.length - 1; i >= 0; i--) {

		// 			// list是一群点的集聚
		// 			if(list[i][2] > max_density_i){
		// 				max_density_i = list[i][2]
		// 			}
					
		// 			let lat = (list[i][0] - centerincrement),
		// 				lng = (list[i][1] - centerincrement),
		// 				lnginc = (lng + SPLIT),
		// 				latinc = (lat + SPLIT),
		// 				lngcen = list[i][1],
		// 				latcen = list[i][0],
		// 				coordsarr = [
		// 					[lng, lat],
		// 					[lnginc, lat],
		// 					[lnginc, latinc],
		// 					[lng, latinc],
		// 					[lng, lat]
		// 				]
					
		// 			DATA.push({
		// 						"geometry": {
		// 							"type": "Polygon",
		// 							"coordinates": [coordsarr]
		// 						},
		// 						"type": "Feature",
		// 						"prop": {
		// 							'v': parseFloat(list[i][2]),
		// 							'e': parseFloat(list[i][2]),
		// 							'd': parseFloat(list[i][2]),
		// 							'c': [lngcen, latcen],
		// 							'num': Number.parseInt(svg_num)// center point
		// 						}
		// 			})
					
		// 			hdata.push(coordsarr);
		// 		}
		// 		// 这里是用来画边界的
		// 		drawmap(4, hdata, RESULT, svg_num);
		// 		console.info("end")
		// 	}
			
		// 	console.log("max_density:  " + max_density_i)
			
		// 	//console.log("result: "+ JSON.stringify(RESULT))
			
		// 	resolve({
		// 	'scode': 1,
		// 	'fdata': {
		// 		'data':{
		// 			  "type": "FeatureCollection",
		// 			  "features": DATA,
		// 			  "prop": {
		// 				  'scales': {
		// 					  'e': parseFloat(max_density_i),
		// 					  'd': parseFloat(max_density_i)
		// 				  }
		// 			  }
		// 		},
		// 		'bound_data':{
		// 			"type": "FeatureCollection",
		// 			"features": RESULT
		// 		}
		// 	}
		// 	})
		// })
		// return p;

		// 上面是从数据文件中直接读取处理好的数据
		// 下面是从数据库中读取源数据的操作，就是正确操作，但是速度比较慢
		
		// // 这里的 max_density 是提前确定好的数值，percent是传进来的数值，也就是那个滑动条的第一个按钮值，default值是0.1 
		// max_density = percent * max_density;

				
		// let p = new Promise(function(resolve, reject) {
	
		// 	let sql = $sql.getOverviewValD[mtype] + $sql.getOverviewValD[mtype] + $sql.getOverviewValD[mtype],
		// 	param = [
		// 		densityattr, etable_0, densityattr, densityattr,
		// 		densityattr, etable_1, densityattr, densityattr,
		// 		densityattr, etable_2, densityattr, densityattr
		// 	];
		
		// 	conn.query(sql, param, function(err, result) {
		// 		conn.release();

		// 		if (err) {
		// 			reject(err);
		// 		} else {
		// 			let RESULT = [],
		// 				SPLIT = 0.003, // 经度划分一个格子的长度
		// 				centerincrement = 0.0015, //.toFixed(4),
		// 				locs = data.getRegionBound(city);
					
		// 			// 分成3类，也就对应着3个不同的表中得到的结果，即etable_0,1,2	
		// 			for(var svg_num = 0; svg_num < 3; svg_num ++){
		// 				let list = result[svg_num],
		// 					reslen = list.length,
		// 					hdata= [];
						
		// 				//console.log("dlist:" + JSON.stringify(dlist))
		// 				console.log('Result length', reslen)

		// 				// 遍历取出来wpnumber大于 0 的所有值对
		// 				for (let i = list.length - 1; i >= 0; i--) {
		// 					if(list[i]['val'] > max_density){
								// let id = Number.parseInt(list[i]['id']), // grid 的id
								// 	LNGNUM = parseInt((locs['east'] - locs['west']) / SPLIT + 1), // 经度划分的格子数
								// 	latind = parseInt(id / LNGNUM), 
								// 	lngind = id - latind * LNGNUM,
								// 	lat = (locs['south'] + latind * SPLIT),
								// 	lng = (locs['west'] + lngind * SPLIT),
								// 	lnginc = (lng + SPLIT),
								// 	latinc = (lat + SPLIT),
								// 	lngcen = (lng + centerincrement),
								// 	latcen = (lat + centerincrement),
		// 							coordsarr = [
		// 								[lng, lat],
		// 								[lnginc, lat],
		// 								[lnginc, latinc],
		// 								[lng, latinc],
		// 								[lng, lat]
		// 							]

		// 						hdata.push(coordsarr);
		// 					}
		// 				}
		// 				drawmap(min_len, hdata, RESULT, svg_num);
		// 				console.info("end")
		// 			}
					
		// 			//console.log("result: "+ JSON.stringify(RESULT))
		// 			resolve({
        //             'scode': 1,
        //             'data': {
        //                 "type": "FeatureCollection",
        //                 "features": RESULT
        //             }
		// 			})
		// 		}
		// 	})
			
		// })
		// return p; 
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
    getCompareview: getCompareview,
    getExtraInfo: getExtraInfo,
    getBoundary: getBoundary,
    getClusterBoundary: getClusterBoundary,
    getClusterBoundaryUpdate: getClusterBoundaryUpdate,
    getDistrictClusterDatasets: getDistrictClusterDatasets,
	getThreetypeview: getThreetypeview,
	getBubbleContourData:getBubbleContourData,
    getAoiNum: getAoiNum,
    getAoiDetails: getAoiDetails,
    getMecStat: getMecStat,
    getAoiDis: getAoiDis
}