#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date    : 2016-11-09 20:13:28
# @Author  : Joe Jiang (hijiangtao@gmail.com)
# @Link    : https://hijiangtao.github.io/
# @Version : $Id$

import os, json, csv, math, sys, getopt, logging
from area import area
import pymongo
import numpy as np
from geojson_utils import centroid
from CommonFunc import getCityLocs, calFeatureType, connectMongo

class POICollection(object):
	"""docstring for POICollection"""
	def __init__(self, city, citylocs, datatype, baseurl):
		"""Initialization
		
		Args:
			city (String): City code, such as "BJ"
			citylocs (Object): Store the four direction locations of current city (region)
			type (String): Define the processed data type, "POI"
			baseurl (String): the basic path of POI files
		"""
		super(POICollection, self).__init__()
		self.city = city
		self.citylocs = citylocs
		self.type = datatype
		self.baseurl = baseurl
		self.defaultarea = math.pi * 100
		self.db = {
			'url': '127.0.0.1',
			'port': 27017,
			'dbname': 'tdnormal'
		}
		
	def readFiletoJson(self, name):
		"""Read file and return the POIs object (not null or way objects)
		
		Args:
			name (String): File name
		
		Returns:
			Object: POI Collection
		"""
		with open(os.path.join(self.baseurl, name)) as f:
			# 
			count = {}
			typelist = list()
			landusecount = 0

			data = json.load(f)
			if data["type"] == "FeatureCollection":
				feaColObj = list()
				for each in data["features"]:
					# if name is not null and geometry type is not Way
					if "id" in each.keys() and "name" in each["properties"].keys() and each["geometry"]["type"] != "LineString":
						feaColObj.append(each)

						# count type
						poitype = each["geometry"]["type"]
						if poitype in typelist:
							count[poitype] += 1
						else:
							typelist.append(poitype)
							count[poitype] = 1

						# Statistics landuse POI's number in total
						# if "landuse" in each["properties"]:
						# 	landusecount += 1

				logging.info("POI list has been constructed, contains %d objects from file: %s" % (len(feaColObj), name))
				for key, value in count.items():
					logging.info("POI type: %s, number: %d" % (key, value))

				# logging.info("Landuse Feature Number: %d" % landusecount)

				return feaColObj
			else:
				return {}

	def formatPOI(self, name):
		"""Read POI file and transfer it into POI list, ABANDONED
		
		Args:
			name (String): File name
		
		Returns:
			List: POI list
		"""
		# store POI list
		data = list()
		# options for transfer GEO-ID to id in geojson object
		options = { "N": "node/", "W": "way/", "R": "relation/" }
		count = { "N": 0, "R": 0 }

		with open(os.path.join(self.baseurl, name)) as f:
			spamreader = f.readlines()
			print "Total POI number is %d" % len(spamreader)

			for row in spamreader:
				row = row.split(',')
				rawid = row[1]
				ptype = rawid[0:1]
				if ptype != "W":
					data.append(options[ptype] + rawid[1:])
					count[ptype] += 1

		logging.info("Extract %d Nodes and %d Relations from results." % (count["N"], count["R"]))
		return data

	def filterObj(self, filterlist, objset):
		"""Filter object according to given list, ABANDONED
		
		Args:
			filterlist (List): Description
			objset (Object): Description
		
		Returns:
			List: Filtered POI list
		"""
		data = list()
		for x in objset:
			if x['id'] in filterlist:
				data.append(x)
		return data

	def writeFile(self, data, name):
		"""Write object to json file
		
		Args:
			data (Object): Description
			name (String): Description
		
		Returns:
			NULL: Description
		"""
		with open(os.path.join(self.baseurl, name), 'wb') as outfile:
			json.dump(data, outfile)
		outfile.close()

	def appendAttr(self, data):
		"""Append feature attributes, input and output are both featurecollection
		
		Args:
			data (Object): POI Collection Object
		
		Returns:
			Object: POI Collection Object with attributes' appended into each of single POI
		"""
		logging.info("Atrributes appending starting...")
		result = []

		featurelen = len(data)
		for i in xrange(featurelen):
			# 当前 POI 对象
			currentObj = data[i]
			# 当前 POI 类型
			geotype = currentObj['geometry']['type']
			# 当前 POI 对应面积与半径
			areaval = self.calArea(currentObj["geometry"])
			radius = math.sqrt(areaval / math.pi)

			featureType = calFeatureType(currentObj["properties"])

			if featureType != 12:
				currentObj["properties"]["area"] = areaval
				currentObj["properties"]["radius"] = radius
				currentObj["properties"]["ftype"] = featureType
				
				if geotype == 'Point':
					currentObj["properties"]["center"] = currentObj["geometry"]
				elif geotype == 'Polygon':
					currentObj["properties"]["center"] = centroid( currentObj["geometry"] )
				else:
					continue
					# currentObj['properties']['center'] = { "type": "Point", "coordinates": [0,0] }

				result.append(currentObj)
			
		logging.info("Atrributes appending complete!")
		return result

	def calArea(self, data):
		"""Calculate feature area and return it
		
		Args:
			data (Object): Geojson object
		
		Returns:
			Float: area value
		"""
		areaval = area(data)
		if areaval <= 0.00000001:
			return self.defaultarea

		return areaval

	def extractLanduse(self, data, name):
		"""Extract features of landuse type and write the data into csv file, ADANDONED
		
		Args:
			data (Object): FeatureCollection
			name (String): File name
		
		Returns:
			NULL: Description
		"""
		with open(os.path.join(self.baseurl, name), 'wb') as outfile:
			outfile.write('ID,NAME,LANDUSE-TYPE,GEO-TYPE\n')
			for each in data["features"]:
				if "landuse" in each["properties"].keys():
					item = each["properties"]
					outfile.write('%s,%s,%s,%s\n' % (item["id"].encode('utf-8'), item["name"].encode('utf-8'), item["landuse"].encode('utf-8'), each["geometry"]["type"].encode('utf-8')))

		outfile.close()

def usage():
	print 'python POIExtraction.py -c <city> -d <work direcotry>'

def main(argv):
	try:
		opts, args = getopt.getopt(argv, "hc:d:", ["help", "city=", "direcotry="])
	except getopt.GetoptError as err:
		# print help information and exit:
		print str(err)  # will print something like "option -a not recognized"
		usage()
		sys.exit(2)

	city, dic = 'beijing', '/home/taojiang/datasets/pois/beijing'
	for opt, arg in opts:
		if opt == '-h':
			usage()
			sys.exit()
		elif opt in ("-c", "--city"):
			city = arg
		elif opt in ("-d", "--direcotry"):
			dic = arg + '/' + city

	cityins = POICollection(city, getCityLocs(city), 'POI', dic)
	# 建立 POI 列表
	pois = cityins.readFiletoJson("%s.fPOI.geojson" % city)
	# 向 POI 完善附加信息并存入文件
	cityins.writeFile(cityins.appendAttr(pois), "%s.aPOI.geojson" % city)

if __name__ == "__main__":
	logging.basicConfig(filename='logger-poiextraction.log', level=logging.DEBUG)
	# 抽取 POI 并添加半径、面积、中心点等信息，存入文件
	main(sys.argv[1:])