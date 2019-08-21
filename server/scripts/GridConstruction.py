#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date    : 2016-11-15 10:15:49
# @Author  : Joe Jiang (hijiangtao@gmail.com)
# @Link    : https://hijiangtao.github.io/
# @Version : $Id$

import os
import math
import sys
import getopt
import logging
import time
import pp 
import pymongo
import gc
import numpy as np
from CommonFunc import connectMongo, getCityLocs, gaussian2D, sep4Citylocs
# from geopy.distance import great_circle

class CityGrid(object):
	"""docstring for CityGrid"""
	def __init__(self, city, citylocs, defaultRadius, IP):
		super(CityGrid, self).__init__()
		self.city = city
		self.citylocs = citylocs
		self.defaultRadius = defaultRadius * 2
		self.maxQRadius = 500
		self.db = {
			'url': IP,
			'port': 27017,
			'dbname': 'tdnormal',
			'gridcolname': 'newgrids_%s' % city,
			'POIcolname': 'pois_%s' % city
		}

		conn, db = connectMongo(self.db['dbname'])
		grid = db[self.db['gridcolname']]
		POIs = db[self.db['POIcolname']]
		try:
			grid.create_index([
				("properties.typevalid", pymongo.ASCENDING),
				("properties.vec", pymongo.ASCENDING)
			])
			grid.create_index([("properties.center", pymongo.GEOSPHERE)])
			POIs.create_index([("properties.center", pymongo.GEOSPHERE)])
		except Exception as e:
			raise e
		conn.close()

	def gridGeneration(self, split, locs={}):
		"""Generate City Grid sets
		
		Args:
		    split (float): distance interval of lat and lng, the unit is degree
		    gridname (string): grid collection name in mongoDB
		    poiname (string): POI collection name in mongoDB
		    locs (dict, optional): city grids' location region, in four directions
		
		Returns:
		    NULL: Description
		"""
		logging.info("CityGrid generation is starting...")

		if locs == {}:
			locs = self.citylocs

		count = 100000
		tmparray = []
		centerincrement = 0.0015 # round(split / 2.0, 4)
		latnum = int((locs['north'] - locs['south']) / split + 1)
		lngnum = int((locs['east'] - locs['west']) / split + 1)

		conn, db = connectMongo(self.db['dbname'])
		grid = db[self.db['gridcolname']]
		POIs = db[self.db['POIcolname']]

		for latind in xrange(0, latnum):
			for lngind in xrange(0, lngnum):
				lat = round(locs['south'] + latind * split, 3)
				lng = round(locs['west'] + lngind * split, 3)
				lnginc = round(lng+split, 3)
				latinc = round(lat+split, 3)
				lngcen = round(lng+centerincrement, 4)
				latcen = round(lat+centerincrement, 4)
				# 一个正方形 geojson 对象，代表当前方块对应的地理边界
				coordsarr = [ [lng, lat], [lnginc, lat], [lnginc, latinc], [lng, latinc], [lng, lat] ]

				featurelistarray = [0]*11
				typevalid = False

				# query all the POIs less than maxQRadius
				nearPOIList = list(POIs.find({
					"properties.center": {
						'$near': {
							'$geometry': { 'type': "Point", 'coordinates': [ lngcen, latcen ] },
							'$minDistance': 0,
							'$maxDistance': self.maxQRadius
						}
					}
				}))
				
				# construct vector with POIs types info
				poilen = len(nearPOIList)
				if poilen != 0:
					typevalid = True
					featurelistsum = 0

					# POI list is not null
					for each in nearPOIList:
						cpoint = each["properties"]["center"]["coordinates"]
						radius = each["properties"]["radius"]
						sigma = self.defaultRadius
						if radius > 0:
							sigma = radius * 2.0
						P = gaussian2D([lngcen, latcen], cpoint, sigma )
						featurelistsum += P
						
						curPInd = each["properties"]["ftype"] - 1
						featurelistarray[ curPInd ] += P

					# update feature vector
					if featurelistsum:
						featurelistarray = [each/featurelistsum for each in featurelistarray]
					else:
						typevalid = False
						print featurelistsum

				# single feature format
				# uid: to locate grid index according to it's lat and lng
				# vec: feature type
				# center: center position of current feature
				tmparray.append({
					"type": "Feature",
					"_id": "%s-%s-%s" % (self.city, str(lat), str(lng)),
					"properties": {
						"id": "%s-%s-%s" % (self.city, str(lat), str(lng)),
						"type": "Polygon",
						"vecvalid": typevalid,
						"center": {"type": "Point", "coordinates": [lngcen, latcen]},
						"uid": int(lngind + latind * lngnum),
						"vec": featurelistarray,
						'poinum': poilen
					},
					"geometry": {
						"type": "Polygon",
						"coordinates": [ coordsarr ]
					}
				})

				if len( tmparray ) == 100000:
					grid.insert( tmparray )
					tmparray = []
					gc.collect()
					logging.debug("100000 features has been inserted into mongoDB.")

		if len( tmparray ) != 0:
			grid.insert( tmparray )

		logging.info("Grid generation complete!")
		conn.close()

def usage():
	print 'python GridCOnstruction.py -c <city> -r <default radius> -s <split length>'

def main(argv):
	try:
		opts, args = getopt.getopt(argv, "hc:r:s:", ["help", "city=", "radius=", "split="])
	except getopt.GetoptError as err:
		# print help information and exit:
		print str(err)  # will print something like "option -a not recognized"
		usage()
		sys.exit(2)

	city, r, split, IP = 'beijing', 10, 0.003, 'localhost' # another IP in ISCAS should be '127.0.0.1'
	for opt, arg in opts:
		if opt == '-h':
			usage()
			sys.exit()
		elif opt in ("-c", "--city"):
			city = arg
		elif opt in ("-r", "--radius"):
			r = arg
		elif opt in ("-s", "--split"):
			split = float(arg)
		
	start_time = time.time()
	citylocs = getCityLocs(city)

	cityGrid = CityGrid(city, citylocs, r, IP)
	# midLat, midLng = round((citylocs['south'] +citylocs['north']) / 2.0, 3), round((citylocs['west'] + citylocs['east']) / 2.0, 3)
	# sepcitylocs = sep4Citylocs(citylocs, midLat, midLng, split)

	# ppservers = ()
	# job_server = pp.Server(ppservers=ppservers)
	# print "The number of working kernel threads that can be used is %s." % job_server.get_ncpus()
	# jobs, index = [], 0
	# for sublocs in sepcitylocs:
	# 	jobs.append( (index, job_server.submit(cityGrid.gridGeneration, (split, sublocs, ), (connectMongo, getCityLocs, gaussian2D, sep4Citylocs,), ('os', 'math', 'sys', 'getopt', 'logging', 'time', 'numpy', 'scipy', 'pymongo', 'MySQLdb', 'geopy.distance', 'CommonFunc' ))) )
	# 	index += 1

	# for index, job in jobs:
	#     job()
	# job_server.print_stats()
	# 
	cityGrid.gridGeneration(split, citylocs)

	logging.info("City grid construction consumption: %s s" % str(time.time() - start_time))

if __name__ == "__main__":
	logging.basicConfig(filename='logger-gridconstruction.log', level=logging.DEBUG)
	main(sys.argv[1:])
