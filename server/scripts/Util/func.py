#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date    : 2016-11-26 18:47:13
# @Author  : Joe Jiang (hijiangtao@gmail.com)
# @Link    : https://hijiangtao.github.io/
# 描述      : 通用函数

import os, pymongo, math, sys, logging, MySQLdb
import numpy as np
from scipy import stats
from geopy.distance import great_circle  # https://pypi.python.org/pypi/geopy/1.11.0

def connectMongo(dbname):
	"""Connect MongoDB
	
	Returns:
		TYPE: Client, database
	"""
	try:
		conn = pymongo.MongoClient('127.0.0.1', 27017) # 127.0.0.1
		mdb = conn[dbname]
		print "Connected successfully!!!"
	except pymongo.errors.ConnectionFailure, e:
		print "Could not connect to MongoDB: %s" % e

	return conn, mdb

def connectMYSQL(dbname):
	"""Connect MySQL
	
	Returns:
		TYPE: db, cursor
	"""
	db = MySQLdb.connect(host="127.0.0.1",    	# your host, usually localhost
						user="root",         	# your username
						passwd="Vis_2014",  	# your password
						db=dbname)		# name of the data base
	cur = db.cursor()

	return db, cur

def matrixtoarray(origin, row, col):
	"""Change a matrix array to an array (each of the element is an 1D array)
	
	Args:
		origin (array): in the array, each element is one user's behavior feature matrix
	
	Returns:
		array: in the array, each element is one user's behavior feature array
	"""
	originD = np.asarray(origin['data'])
	data = []
	colnum, rownum = len(np.asarray(originD[0][0])), len(originD[0])
	print 'Start to deal with matrix to array converting work.'

	for x in originD:
		tmparray = np.asarray(x).reshape(len(x) * len(x[0]))
		# print tmparray
		data.append( tmparray )

	filterdata = []
	for each in data:
		tmparray = []
		for erow in row:
			for ecol in col:
				tmparray.append( each[erow*colnum + ecol] )
		filterdata.append( tmparray )

	print 'Matrix to array converting work complete!'

	return {
		'id': origin['id'],
		'data': filterdata
	}

def dotstomatrix(data, base, num, interval):
	"""Change 2D space dots to a density based matrix, in which every grid stores the number of dots belonged to thsi grid
	
	Args:
		data (array): Dots array, each of the element is consists of a list (x, y)
		base (int): The base number that should added to current axix location 
		num (int): Number of one axis's grid number
		interval (float): Interval of axis
	
	Returns:
		array: Heatmap matrix
	"""
	result = [[0 for col in xrange(0, num)] for row in xrange(0, num)]

	for each in data:
		# print getMatrixIndex(each[1], base, 1/interval), getMatrixIndex(each[0], base, 1/interval)
		result[ getMatrixIndex(each[1], base, 1/interval) ][ getMatrixIndex(each[0], base, 1/interval) ] += 1.0

	# for x in len(result):
	# 	for each in len(x):
	# 		result[x][each] = math.log(result[x][each]+2, 2 )

	return result

def getMatrixIndex(x, base, num):
	return int(math.floor((base + x) * num))

def matrixtofile(data, filename):
	"""Store density based matrix to csv file
	
	Args:
		data (array): Description
		filename (string): output file name
	
	Returns:
		NULL: Description
	"""
	result = []
	for each in data:
		result.append( ','.join( [str(x) for x in each] ) )

	print '%s lines data are wrote into %s.' % (str(len(result)), filename)

	with open(filename, 'w') as target:
		target.writelines( '\n'.join(result) )
	target.close()

def filetoMatrix(filename):
	result = []
	with open(filename, 'rb') as target:
		for each in target:
			result.append( each.split(',') )

	return result

def frange(x, y, jump):
	while x < y:
		yield x
		x += jump

def getMatrixSumbyDim(data, mode):
	"""Sum results by given dimension name
	
	Args:
		data (MATRIX): Description
		mode (STRING): Description
	
	Returns:
		TYPE: Sum array
	"""
	inputData = np.matrix(data)
	pVecSum = inputData.sum(dtype='float')
	arrayList = []
	if pVecSum == 0.0:
		return -1

	if mode == 'row':
		arrayList = np.sum(inputData, axis=1) 
		# inputData.sum(axis=1, dtype='float')[0]
	elif mode == 'column':
		arrayList = np.sum(inputData, axis=0)  
		# inputData.sum(axis=0, dtype='float')[0]
		# print pVecSum
		
	return np.asarray([each/pVecSum for each in np.nditer(arrayList)])

def getCityLocs(city):
	# 城市边界信息列表
	newCitylocslist = {
		'beijing': {
			'north': 41.055,
			'south': 39.445,
			'west': 115.422,
			'east': 117.515
		},
		'tianjin': {
			'north': 40.254,
			'south': 38.537,
			'west': 116.691,
			'east': 118.087
		},
		'zhangjiakou': {
			'north': 42.139,
			'south': 39.546,
			'west': 113.807,
			'east': 116.400
		},
		'tangshan': {
			'north': 40.457,
			'south': 38.908,
			'west': 117.488,
			'east': 119.306
		}
	}

	return newCitylocslist[city]

def calFeatureType(data):
	"""Calculate feature type and return it's represented index number, 1-11 is available features, 12 is the abandoned type
	
	Args:
		data (Object): One POI's properties
	
	Returns:
		Int: index number
	"""
	amen_sustenance = ['bar', 'bbq', 'biergarten', 'cafe', 'drinking_water', 'fast_food', 'food_court', 'ice_cream', 'pub', 'restaurant' ]
	amen_education = ['college', 'kindergarten', 'library', 'public_bookcase', 'school', 'music_school', 'driving_school', 'language_school', 'university']
	amen_transportation = ['bicycle_parking', 'bicycle_repair_station', 'bicycle_rental', 'boat_sharing', 'bus_station', 'car_rental', 'car_sharing', 'car_wash', 'charging_station', 'ferry_terminal', 'fuel', 'grit_bin', 'motorcycle_parking', 'parking', 'parking_entrance', 'parking_space', 'taxi']
	amen_financial = ['atm', 'bank', 'bureau_de_change']
	amen_healthcare = ['baby_hatch', 'clinic', 'dentist', 'doctors', 'hospital', 'nursing_home', 'pharmacy', 'social_facility', 'veterinary', 'blood_donation']
	amen_eac = ['arts_centre', 'brothel', 'casino', 'cinema', 'community_centre', 'fountain', 'gambling', 'nightclub', 'planetarium', 'social_centre', 'stripclub', 'studio', 'swingerclub', 'theatre']
	build_accommodation = ['apartments', 'farm', 'hotel', 'house', 'detached', 'residential', 'dormitory', 'terrace', 'houseboat', 'bungalow', 'static_caravan']
	build_commercial = ['commercial', 'industrial', 'retail', 'warehouse']
	build_civic = ['cathedral', 'chapel', 'church', 'mosque', 'temple', 'synagogue', 'shrine', 'civic', 'stadium', 'train_station', 'transportation', 'public']
	build_civic_hc = ['hospital']
	build_civic_edu = ['school', 'university']

	datakeyset = data.keys()
	if "amenity" in datakeyset:
		featurekey = data["amenity"]
		if featurekey in amen_sustenance:
			return 1
		elif featurekey in amen_eac:
			return 2
		elif featurekey in amen_education:
			return 3
		elif featurekey in amen_transportation:
			return 4
		elif featurekey in amen_healthcare:
			return 5
		elif featurekey in amen_financial:
			return 6
		else:
			return 12
	elif "building" in datakeyset:
		featurekey = data["building"]
		if featurekey in build_accommodation:
			return 7
		elif featurekey in build_commercial:
			return 6
		elif featurekey in build_civic:
			return 4
		elif featurekey in build_civic_edu:
			return 3
		elif featurekey in build_civic_hc:
			return 5
		else:
			return 12
	elif "emergency" in datakeyset:
		return 5
	elif "office" in datakeyset:
		return 8
	elif "leisure" in datakeyset or "shop" in datakeyset or "tourism" in datakeyset:
		return 2
	elif "natural" in datakeyset:
		return 9
	elif "craft" in datakeyset:
		return 10
	elif "historic" in datakeyset:
		return 11
	
	return 12

def gaussian2D(source, target, sigma):
	"""Gaussian distribution function
	
	Args:
		source (object): A geojson object
		target (object): A geojson object
		sigma (float): sigma parameter
	
	Returns:
		float: Distance between two points
	"""
	# from scipy import stats
	# from geopy.distance import great_circle
	d = great_circle(source, target).meters
	X = stats.norm(loc=0, scale=sigma**2)
	
	return (1-X.cdf(d)) * 2

def sep4Citylocs(citylocs, midLat, midLng, split):
	return [{
		'north': midLat,
		'south': citylocs['south'],
		'west': citylocs['west'],
		'east': midLng
	},{
		'north': midLat,
		'south': citylocs['south'],
		'west': midLng + split,
		'east': citylocs['east']
	},{
		'north': citylocs['north'],
		'south': midLat + split,
		'west': midLng + split,
		'east': citylocs['east']
	},{
		'north': citylocs['north'],
		'south': midLat + split,
		'west': citylocs['west'],
		'east': midLng
	}]

def initTimePeriods():
	tpVectors = { 
		'workdayM': {
			'num': 0,
			'vec': [0]*11
		},
		'workdayF': {
			'num': 0,
			'vec': [0]*11
		},
		'workdayN': {
			'num': 0,
			'vec': [0]*11
		},
		'workdayA': {
			'num': 0,
			'vec': [0]*11
		},
		'workdayE': {
			'num': 0,
			'vec': [0]*11
		},
		'workdayI': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayM': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayF': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayN': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayA': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayE': {
			'num': 0,
			'vec': [0]*11
		},
		'holidayI': {
			'num': 0,
			'vec': [0]*11
		}
	}

	tpNames = ['workdayM', 'workdayF', 'workdayN', 'workdayA', 'workdayE', 'workdayI', 'holidayM', 'holidayF', 'holidayN', 'holidayA', 'holidayE', 'holidayI']

	return {
		'tpVectors': tpVectors,
		'tpNames': tpNames
	}

def judFeatureTP(daytype, timesegid):
	# vector attributes
	# workday, weekend with both morning, forenoon, noon, afternoon, evening, night 6 periods
	# morning: 5:00-9:00
	# forenoon: 8:00-12:00
	# noon: 11:00-14:00
	# afternoon: 13:00-19:00
	# evening: 18:00-24:00
	# night: 23:00-6:00
	vecInd = []
	if daytype == "workday":
		if timesegid >= 5 and timesegid < 9:
			vecInd.append('workdayM')
		if timesegid >= 8 and timesegid < 12:
			vecInd.append('workdayF')
		if timesegid >= 11 and timesegid < 14:
			vecInd.append('workdayN')
		if timesegid >= 13 and timesegid < 19:
			vecInd.append('workdayA')
		if timesegid >= 18:
			vecInd.append('workdayE')
		if timesegid >= 23 or timesegid < 6:
			vecInd.append('workdayI')
	else:
		if timesegid >= 5 and timesegid < 9:
			vecInd.append('holidayM')
		if timesegid >= 8 and timesegid < 12:
			vecInd.append('holidayF')
		if timesegid >= 11 and timesegid < 14:
			vecInd.append('holidayN')
		if timesegid >= 13 and timesegid < 19:
			vecInd.append('holidayA')
		if timesegid >= 18:
			vecInd.append('holidayE')
		if timesegid >= 23 or timesegid < 6:
			vecInd.append('holidayI')

	return vecInd

def getTimePeriod(time):
	"""计算当小时所属时间段
	
	Args:
		time (TYPE): String
	
	Returns:
		TYPE: Int
	"""
	time = int(time)
	if time >= 6 and time < 9:
		return 0
	elif time >= 9 and time < 12:
		return 1
	elif time >= 12 and time < 14:
		return 2
	elif time >= 14 and time < 17:
		return 3
	elif time >= 17 and time < 21:
		return 4
	elif time >= 21:
		return 5

	return 6

def getAdminNumber(admin):
	"""计算当前行政区划所属编号
	
	Args:
		admin (TYPE): String
	
	Returns:
		TYPE: Int
	"""
	districts = {
		# beijing 
		u'东城区': 1,u'西城区':2,u'朝阳区':3,u'丰台区':4,u'石景山区':5,u'海淀区':6,u'门头沟区':7,u'房山区':8,u'通州区':9,u'顺义区':10,u'昌平区':11,u'大兴区':12,u'怀柔区':13,u'平谷区':14,u'密云县':15,u'延庆县':16,

		# tianjin
		u'和平区':17,u'河东区':18,u'河西区':19,u'南开区':20,u'河北区':21,u'红桥区':22,u'东丽区':23,u'西青区':24,u'津南区':25,u'北辰区':26,u'武清区':27,u'宝坻区':28,u'滨海新区':29,u'宁河县':30,u'静海县':31,u'蓟县':32,

		# zhangjiakou
		u'桥东区':33,u'桥西区':34,u'宣化县':35,u'宣化区':35,u'下花园区':36,u'万全县':37,u'崇礼县':38,u'张北县':39,u'康保县':40,u'沽源县':41,u'尚义县':42,u'蔚县':43,u'阳原县':44,u'怀安县':45,u'怀来县':46,u'涿鹿县':47,u'赤城县':48,

		# tangshan
		u'路南区':49,u'路北区':50,u'古冶区':51,u'开平区':52,u'丰南区':53,u'丰润区':54,u'曹妃甸区':55,u'滦县':56,u'滦南县':57,u'乐亭县':58,u'迁西县':59,u'玉田县':60,u'迁安市':61,u'遵化市':62,u'唐海县':63
	}

	admin = admin.decode('utf-8')

	if admin in districts:
		return str( districts[admin] )
	else:
		print admin
		# print 'Unrecognized admin areas %s' % admin
		return '-1'


def calColorbyNum(num):
	numcolormap = [{
		'value': 5,
		'color': '#000000'
	}, {
		'value': 10,
		'color': '#1924B1'
	}, {
		'value': 200,
		'color': '#37B6CE'
	}, {
		'value': 800,
		'color': '#25D500'
	}, {
		'value': 2000,
		'color': '#FFC700'
	}, {
		'value': 4000,
		'color': '#FF8E00'
	}, {
		'value': 8500,
		'color': '#FF1300'
	}]

	for x in xrange(0, len(numcolormap)):
		if num < numcolormap[x]['value']:
			return numcolormap[x]['color']


def addTwoArray(a, b):
	"""Add two array and return array result, and sum result of two arrays' elements
	
	Args:
		a (TYPE): Description
		b (TYPE): Description
	
	Returns:
		TYPE: Description
	"""
	arraylen = len(a)
	arraysum = 0
	for x in xrange(0, arraylen):
		a[x] += b[x]
		arraysum += a[x] + b[x]

	return a, arraysum

def getCityDisInfo(city):
	if city == 'beijing':
		return [1, 16]
	elif city == 'tianjin':
		return [17, 16]
	elif city == 'tangshan':
		return [49, 15]
	elif city == 'zhangjiakou':
		return [33, 16]


def getAbbName(city):
	cases = {
		'beijing': 'bj',
		'tianjin': 'tj',
		'zhangjiakou': 'zjk',
		'tangshan': 'ts'
	}

	return cases[city]

def getDistrictsNum(district):
	cases = {
		u"东城区": 1,
		u"西城区": 2,
		u"丰台区": 3,
		u"海淀区": 4,
		u"石景山区": 5,
		u"门头沟区": 6,
		u"顺义区": 7,
		u"通州区": 8,
		u"朝阳区": 9,
		u"大兴区": 10,
		u"昌平区": 11,
		u"平谷区": 12,
		u"怀柔区": 13,
		u"延庆区": 14,
		u"房山区": 15,
		u"密云区": 16,
		
		u"蓟州区": 17,
		u"和平区": 18,
		u"河西区": 19,
		u"南开区": 20,
		u"河东区": 21,
		u"河北区": 22,
		u"西青区": 23,
		u"津南区": 24,
		u"北辰区": 25,
		u"武清区": 26,
		u"宁河区": 27,
		u"静海区": 28,
		u"宝坻区": 29,
		u"东丽区": 30,
		u"滨海新区": 31,
		u"红桥区": 32,
		
		u"古冶区": 33,
		u"路南区": 34,
		u"开平区": 35,
		u"路北区": 36,
		u"丰润区": 37,
		u"滦南县": 38,
		u"曹妃甸区": 39,
		u"迁西县": 40,
		u"滦县": 41,
		u"乐亭县": 42,
		u"玉田县": 43,
		u"迁安市": 44,
		u"遵化市": 45,
		u"丰南区": 46,
		
		u"崇礼县": 47,
		u"赤城县": 48,
		u"沽源县": 49,
		u"怀安县": 50,
		u"怀来县": 51,
		u"康保县": 52,
		u"桥东区": 53,
		u"桥西区": 54,
		u"尚义县": 55,
		u"万全县": 56,
		u"蔚县": 57,
		u"下花园区": 58,
		u"宣化区": 59,
		u"宣化县": 60,
		u"阳原县": 61,
		u"张北县": 62,
		u"涿鹿县": 63
	}

	return cases[district]

def getCityDistricts(city):
	if city == 'bj':
		return {
			u"东城区": 1,
			u"西城区": 2,
			u"丰台区": 3,
			u"海淀区": 4,
			u"石景山区": 5,
			u"门头沟区": 6,
			u"顺义区": 7,
			u"通州区": 8,
			u"朝阳区": 9,
			u"大兴区": 10,
			u"昌平区": 11,
			u"平谷区": 12,
			u"怀柔区": 13,
			u"延庆区": 14,
			u"房山区": 15,
			u"密云区": 16
		}
	elif city == 'tj':
		return {
			u"蓟州区": 17,
			u"和平区": 18,
			u"河西区": 19,
			u"南开区": 20,
			u"河东区": 21,
			u"河北区": 22,
			u"西青区": 23,
			u"津南区": 24,
			u"北辰区": 25,
			u"武清区": 26,
			u"宁河区": 27,
			u"静海区": 28,
			u"宝坻区": 29,
			u"东丽区": 30,
			u"滨海新区": 31,
			u"红桥区": 32
		}
	elif city == 'ts':
		return {
			u"古冶区": 33,
			u"路南区": 34,
			u"开平区": 35,
			u"路北区": 36,
			u"丰润区": 37,
			u"滦南县": 38,
			u"曹妃甸区": 39,
			u"迁西县": 40,
			u"滦县": 41,
			u"乐亭县": 42,
			u"玉田县": 43,
			u"迁安市": 44,
			u"遵化市": 45,
			u"丰南区": 46
		}
	else:
		return {
			u"崇礼县": 47,
			u"赤城县": 48,
			u"沽源县": 49,
			u"怀安县": 50,
			u"怀来县": 51,
			u"康保县": 52,
			u"桥东区": 53,
			u"桥西区": 54,
			u"尚义县": 55,
			u"万全县": 56,
			u"蔚县": 57,
			u"下花园区": 58,
			u"宣化区": 59,
			u"宣化县": 60,
			u"阳原县": 61,
			u"张北县": 62,
			u"涿鹿县": 63
		}

def getDisIndex(point, geos):
	# index = -1
	for each in geos:
		if each['geo'].contains(point):
			return getDistrictsNum(each['name'])

	return -1