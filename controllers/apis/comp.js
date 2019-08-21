/**
 * comp.js apis
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2017-02-12 16:22:08
 * 后端 API 查询的入口
 */

'use strict'
const lib = require('../../conf/lib');
const EP = require('../../conf/entropy');

let apis = {
	'overviewQuery': function(req, res, next) {
		let params = req.query;
		//console.log("params:" + JSON.stringify(params))
		 //console.info('Going to connect MySQL.');
		lib.connectMySQL().then(function(db) {
			console.info('Got data from MySQL.');
			return EP.getOverview(db, params);
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		}).then(function(result) {
			 //console.info('Ready to send back result.');
			res.json(result);
		})
	},
	'compareQuery': function(req, res, next) {
		let params = req.query;
		//console.log("params:" + JSON.stringify(params))
		 //console.info('Going to connect MySQL.');
		lib.connectMySQL().then(function(db) {
			console.info('Got data from MySQL.');
			return EP.getCompareview(db, params);
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		}).then(function(result) {
			 //console.info('Ready to send back result.');
			res.json(result);
		})
	},
	'boundaryQuery': function(req, res, next) {
		let params = req.query,
			city = params.city,
			data = EP.getBoundary(city);

		res.json({
			'scode': 1,
			'data': data
		});
	},
	'ClusterboundaryQuery': function(req, res, next) {
		let params = req.query,
			city = params.city,
			data = EP.getClusterBoundary(city);
		
		res.json({
			'scode': 1,
			'data': data
		});
	},
	'ClusterboundaryQueryUpdate': function(req, res, next) {
		let params = req.query,
			data = EP.getClusterBoundaryUpdate(params);
		
		res.json({
			'scode': 1,
			'data': data
		});
	},
	'DistrictClusterQuery': function(req, res, next) {
		let params = req.query,
			data = EP.getDistrictClusterDatasets(params);

		res.json({
			'scode': 1,
			'data': data
		});
	},	
	'ThreetypeQuery': function(req, res, next) {
		let params = req.query;
		// try{
		// 	return EP.getThreetypeview(null,params);
		// }catch(err){
		// 	console.log(err)
		// }

		lib.connectMySQL().then(function(db) {
			console.info('Got data from MySQL.');
			return EP.getThreetypeview(db, params);
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(err) {
			console.error('error: ', err);
		}).then(function(result) {
			res.json(result);
		})
	},
	'BubbleContourQuery': function(req, res, next) {
		let params = req.query;
		lib.connectMySQL().then(function(db) {
			console.info('Got data from MySQL.');
			return EP.getBubbleContourData(db, params);
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		}).then(function(result) {
			res.json(result);
		})
	},
	'mecStatQuery': function(req, res, next) {
		let params = req.query,
			data = EP.getMecStat(params.city);

		res.json({
			'scode': 1,
			'data': data
		});
	},
	'aoiQuery': function(req, res, next) {
		let params = req.query;

		if (params.type === '0') {
			lib.connectMySQL().then(function(db) {
				return EP.getAoiNum(db, params);
			}, function(err) {
				console.error('error: ', err);
			}).catch(function(error) {
				console.error('error: ', err);
			}).then(function(result) {
				res.json(result);
			});
		} else {
			lib.connectMongo().then(function(db) {
				return EP.getAoiDetails(db, params);
			}, function(err) {
				console.error('error: ', err);
			}).catch(function(error) {
				console.error('error: ', err);
			}).then(function(result) {
				res.json({
					'scode': 1,
					'data': result[0].concat(result[1])
				});
			});
		}
	},
	'aoiDisQuery': function(req, res, next) {
		let params = req.query,
			city = params.city,
			type = params.type;

		res.json({
			'scode': 1,
			'data': EP.getAoiDis(city, type)
		});
	},
	'extrainfoQuery': function(req, res, next) {
		let params = req.query;

		lib.connectMongo().then(function(db) {
			return EP.getExtraInfo(db, params);

		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		});
	},
	/**
	 * eMax.js sum 属性生成函数
	 * @param  {[type]}   req  [description]
	 * @param  {[type]}   res  [description]
	 * @param  {Function} next [description]
	 * @return {[type]}        [description]
	 */
	'getJsonSum': function(req, res, next) {
		let params = req.query,
			table = params.table;

		let sqlstr = "SELECT ? AS 'name', MAX(wpnumber) AS 'wpnumber', MAX(vpnumber) AS 'vpnumber', MAX(wrnumber) AS 'wrnumber', MAX(vrnumber) AS 'vrnumber', MAX(prsval) AS 'prsval', MAX(trsval) AS 'trsval', MAX(arsval) AS 'arsval', MAX(ppsval) AS 'ppsval', MAX(tpsval) AS 'tpsval', MAX(apsval) AS 'apsval' FROM ?? WHERE 1;", sql = "";

		for (let i=0; i<40; i++ ) {
			sql += sqlstr;
		}
		let tablearr = ['bjEmatrix', 'bjEmatrix', 'tjEmatrix', 'tjEmatrix', 'tsEmatrix', 'tsEmatrix', 'zjkEmatrix', 'zjkEmatrix'];
		for (var i = 0; i < 9; i++) {
			tablearr.push(`bjF${i}mat`, `bjF${i}mat`, `tjF${i}mat`, `tjF${i}mat`, `tsF${i}mat`, `tsF${i}mat`, `zjkF${i}mat`, `zjkF${i}mat` );
		}

		lib.connectMySQL().then(function(conn) {
			console.info('Got data from MySQL.');
			conn.query(sql, tablearr, function(err, result) {
				conn.release();

				let size = result.length, response = {};
				for (let i=0; i<size; i++) {
					response[ tablearr[i*2] ] = result[i][0];
				}

				res.json( response );
			});
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		});
	},
	/**
	 * eMax.js ave 属性生成函数
	 * @param  {[type]}   req  [description]
	 * @param  {[type]}   res  [description]
	 * @param  {Function} next [description]
	 * @return {[type]}        [description]
	 */
	'getJsonAve': function(req, res, next) {
		let params = req.query,
			table = params.table;

		let sqlstr = "SELECT ? AS 'name', MAX(wpnumber) AS 'wpnumber', MAX(vpnumber) AS 'vpnumber', MAX(wrnumber) AS 'wrnumber', MAX(vrnumber) AS 'vrnumber', MAX(prsval/vrnumber) AS 'prsval', MAX(trsval/wrnumber) AS 'trsval', MAX(arsval/wrnumber) AS 'arsval', MAX(ppsval/vpnumber) AS 'ppsval', MAX(tpsval/wpnumber) AS 'tpsval', MAX(apsval/wpnumber) AS 'apsval' FROM ?? WHERE 1;", sql='';

		for (let i=0; i<40; i++ ) {
			sql += sqlstr;
		}
		let tablearr = ['bjEmatrix', 'bjEmatrix', 'tjEmatrix', 'tjEmatrix', 'tsEmatrix', 'tsEmatrix', 'zjkEmatrix', 'zjkEmatrix'];
		for (var i = 0; i < 9; i++) {
			tablearr.push(`bjF${i}mat`, `bjF${i}mat`, `tjF${i}mat`, `tjF${i}mat`, `tsF${i}mat`, `tsF${i}mat`, `zjkF${i}mat`, `zjkF${i}mat` );
		}

		lib.connectMySQL().then(function(conn) {
			console.info('Got data from MySQL.');
			conn.query(sql, tablearr, function(err, result) {
				conn.release();

				// console.log(err, result);
				let size = result.length, response = {};
				for (let i=0; i<size; i++) {
					response[ tablearr[i*2] ] = result[i][0];
				}

				res.json( response );
			});
		}, function(err) {
			console.error('error: ', err);
		}).catch(function(error) {
			console.error('error: ', err);
		});
	}
}

module.exports = apis
