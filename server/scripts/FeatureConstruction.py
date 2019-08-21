#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date    : 2016-11-16 22:13:18
# @Author  : Joe Jiang (hijiangtao@gmail.com)
# @Link    : https://hijiangtao.github.io/
# @Version : $Id$

import os, time, pp, logging, sys, getopt, gc
import numpy as np
from CommonFunc import connectMongo, connectMYSQL, getCityLocs, initTimePeriods, judFeatureTP

class UserFeature(object):
	"""docstring for UserFeature"""
	def __init__(self, city, split, citylocs):
		super(UserFeature, self).__init__()
		self.city = city
		self.split = split
		self.citylocs = citylocs
		self.db = {
			'url': '127.0.0.1',
			'port': 27017,
			'dbname': 'tdVC',
			'gridcolname': 'grids_%s' % city,
			'featurecolname': 'features_%s' % city,
			'usercolname': 'users_%s' % city,
			'mysqldb': 'tsu_explore'
		}

	def getUserList(self, subtasknum):
		"""Get user list, sperate it into N sublists, N equals to subtasknum
		
		Args:
			subtasknum (int): Sub task number
		
		Returns:
			array: sperated userlist 
		"""
		db, cur = connectMYSQL(self.db['mysqldb'])
		cur.execute("SELECT id from tdid_link")
		res = []
		for each in cur.fetchall():
			res.append(each[0])
		reslen = len(res)
		userlist = []

		logging.info("%s id has be selected from database." % reslen)

		for x in xrange(0, subtasknum):
			userlist.append( res[int(reslen*x/subtasknum):int(reslen*(x+1)/subtasknum)] )

		cur.close()
		db.close()

		return userlist

	def getGridList(self):
		"""connect to mongoDB and get gridlist results
		
		Args:
			collection (string): collection name that stored city grid set
		
		Returns:
			TYPE: false grid uid list, true grid object collection
		"""
		conn, mdb = connectMongo(self.db['dbname'])
		grid = mdb[self.db['gridcolname']]

		falseuidlist = []
		truegridobj = {}

		gridlists = list( grid.find({}, {"properties.typevalid": 1, "properties.uid": 1, "properties.vec": 1}) )

		for gridlist in gridlists:
			typevalid, uid, vec = gridlist['properties']['typevalid'], str(gridlist['properties']['uid']), gridlist['properties']['vec']

			if typevalid == False:
				falseuidlist.append( uid )
			else:
				truegridobj[ uid ] = vec

		conn.close()
		return falseuidlist, truegridobj

	def matchUserRecords(self, split, jobID, userlist):
		"""Enumerate users with all their records, matching with grid and store them into mongoDB
		
		Args:
			split (float): distance interval of lat and lng, the unit is degree
			jobID (int): Job Number
			userlist (array): userlist is consists of many tdid strings
			colname (string): Collection name in MongoDB
		
		Returns:
			NULL: Description
		"""
		
		# initialize database connections and data structure
		db, cur = connectMYSQL(self.db['mysqldb'])
		conn, mdb = connectMongo(self.db['dbname'])
		users = mdb[self.db['usercolname']]

		userrecords, usernum = [], 0

		# enum user in userlist
		for user in userlist:
			usernum += 1
			# execute the query and get records result
			cur.execute("SELECT dayType, dateID, timeSegID, lat, lng FROM cbeijing WHERE tdid = %s", (user, ))
			res = cur.fetchall()
			tmprecords = []

			# each (tuple) format:
			# 0: dayType
			# 1: dateID
			# 2: timeSegID
			# 3: lat
			# 4: lng
			for each in res:
				# if the record is not in region grid, then we don't consider it as a valid record
				dayType, dateID, timeSegID, lat, lng = each[0], int(each[1]), int(each[2]), float(each[3]), float(each[4])
				if lat < self.citylocs['south'] or lat >= self.citylocs['north'] or lng < self.citylocs['west'] or lng >= self.citylocs['east']:
					continue
				
				lngnum = int((self.citylocs['east'] - self.citylocs['west']) / split + 1)
				latind = int((lat - self.citylocs['south']) / split)
				lngind = int((lng - self.citylocs['west']) / split)
				uid = int(lngind + latind * lngnum)
				tmprecords.append({
					'_id': '%s-%s-%s' % (user, dateID, timeSegID),
					'id': int(user),
					'geometry': {
						'type': 'Point',
						'coordinates': [lng, lat]
					},
					'type': 'Feature',
					'properties': {
						'gridUID': uid,
						'daytype': dayType,
						'dateid': dateID,
						'timesegid': timeSegID
					}
				})

			userrecords.extend(tmprecords)
			
			# insert into mongoDB
			if usernum == 300:
				logging.info("Job %s inserted 300 records into database." % jobID) 
				users.insert(userrecords)
				userrecords = []
				usernum = 0

		# there are still some users in the array
		if usernum != 0:
			users.insert(userrecords)
			
		cur.close()
		db.close()
		conn.close()

	def aggregateVector(self, userlist, invalidlist, validobj):
		"""aggregate user behavior vector, according to given userlist
		
		Args:
			userlist (array): user list
			invalidlist (array): false grid uid list
			validobj (object): true grid object collection
		
		Returns:
			NULL: Description
		"""
		conn, mdb = connectMongo(self.db['dbname'])
		features, users = mdb[self.db['featurecolname']], mdb[self.db['usercolname']]

		userveclist = [] # used to store user vectors

		# enum users, aggreate each user's records in an average strategy
		for user in userlist:
			# used to store current user's unaggreated sub-vector sets
			tpCol = initTimePeriods()
			tmpvecs = tpCol['tpVectors']
			typearr = tpCol['tpNames']

			# user: user ID
			user = int(user)
			reclists = list( users.find({"id": user}, {"properties.gridUID": 1, "properties.timesegid": 1, "properties.daytype": 1}) )

			for x in reclists:
				uid = str(x['properties']['gridUID'])

				# if the grid is invalid, then we just jump over this record
				if uid in invalidlist:
					continue
				else:
					try:
						vec = validobj[ uid ]
						daytype = str(x['properties']['daytype'])
						timesegid = int(x['properties']['timesegid'] / 10)

						# judge which type of feature it is
						vecInd = judFeatureTP(daytype, timesegid)

						for eachvecInd in vecInd:
							tmpvecs[eachvecInd]['num'] += 1
							tmpvecs[eachvecInd]['vec'] = self.vecAdd(tmpvecs[eachvecInd]['vec'], vec)
					except Exception as e:
						raise e
					
					
			# used to be a template for generating one's feature vector 
			vectmpl = { 
				'_id': user,
				'pVec': [],
				'tpNumVec': [],
				'totalNum': len(reclists)
			}

			# aggreate vector
			notallnull = False
			for x in typearr:
				if tmpvecs[x]['num'] != 0:
					notallnull = True
					vectmpl['pVec'].append( [tmpvecs[x]['vec'][i] / float(tmpvecs[x]['num']) for i in xrange(len(tmpvecs[x]['vec'])) ] ) 
					vectmpl['tpNumVec'].append( int(tmpvecs[x]['num']) )
				else:
					vectmpl['pVec'].append( [0] * len(tmpvecs[x]['vec']) )
					vectmpl['tpNumVec'].append(0) 

			if notallnull:
				userveclist.append( vectmpl )

			if len(userveclist) == 300:
				features.insert( userveclist )
				userveclist = []
				gc.collect()

		if len(userveclist) != 0:
			features.insert( userveclist )
		
		conn.close()

	def sepUserTaskes(self, userlist, split):
		"""Seperate all users query and matching work into N subtask, N equals to userlist's length
		
		Args:
			userlist (array): array to store userlist
			usercolname (string): collection name that to store users' records
		
		Returns:
			NULL: Description
		"""
		ppservers = ()
		
		# Creates jobserver with automatically detected number of workers
		job_server = pp.Server(ppservers=ppservers)
		logging.info("pp 可以用的工作核心线程数 %s workers" % job_server.get_ncpus())
		start_time = time.time()
		jobs, index = [], 0
		for sublist in userlist:
			jobs.append( (index, job_server.submit(self.matchUserRecords, (split, index, sublist, ), (connectMongo, connectMYSQL, getCityLocs, initTimePeriods, judFeatureTP), ("os", "time", "pp", "CommonFunc", "numpy", "pymongo", "MySQLdb", "logging", "sys"))) )
			index += 1

		for index, job in jobs:
			job()
		logging.info("多线程下执行耗时: %ss" % str(time.time() - start_time))
		job_server.print_stats()

	def sepFeatureTaskes(self, falseuidlist, truegridobj, userlist):
		"""seperate getting feature work into different subtasks
		
		Args:
			falseuidlist (array): false grid uid list
			truegridobj (object): true grid object collection
			userlist (array): user list
		
		Returns:
			NULL: Description
		"""
		ppservers = ()

		# remove all documents in beijing_features collection
		conn, mdb = connectMongo(self.db['dbname'])
		mdb[self.db['featurecolname']].remove({})
		conn.close()

		job_server = pp.Server(ppservers=ppservers)
		logging.info("pp 可以用的工作核心线程数 %s workers" % job_server.get_ncpus())
		start_time = time.time()
		jobs, index = [], 0
		for sublist in userlist:
			jobs.append( (index, job_server.submit(self.aggregateVector, (sublist, falseuidlist, truegridobj, ), (self.vecAdd, connectMongo, connectMYSQL, getCityLocs, initTimePeriods, judFeatureTP, ), ("os", "time", "pp", "CommonFunc", "numpy", "pymongo", "MySQLdb", "logging", "sys", "gc", ))) )
			index += 1

		for index, job in jobs:
			job()

		logging.info("多线程下执行耗时: %ss" % str(time.time() - start_time))
		job_server.print_stats()

	def vecAdd(self, first, second):
		"""add two array with same length
		
		Args:
			first (array): An array
			second (array): Another array
		
		Returns:
			array: calculated array
		"""
		return [first[i]+second[i] for i in xrange(len(first))]

def usage():
	print 'python FeatureConstruction.py -c <city> -d <work direcotry> -s <split length> -t <tasks number>'

def main(argv):
	try:
		opts, args = getopt.getopt(argv, "hc:d:s:t:", ["help", "city=", "direcotry=", "split=", "tasks="])
	except getopt.GetoptError as err:
		# print help information and exit:
		print str(err)  # will print something like "option -a not recognized"
		usage()
		sys.exit(2)

	city, dic, tasks, split = 'beijing', '/home/taojiang/tools', 22, 0.001
	for opt, arg in opts:
		if opt == '-h':
			usage()
			sys.exit()
		elif opt in ("-c", "--city"):
			city = arg
		elif opt in ("-d", "--direcotry"):
			dic = arg
		elif opt in ("-s", "--split"):
			split = float(arg)
		elif opt in ("-t", "--tasks"):
			tasks = int(arg)
	
	ufeature = UserFeature(city, split, getCityLocs(city))
	# 20 threads to split the whole task
	ulist = ufeature.getUserList(tasks)

	# Enum user records and assign them with region grid UID
	# ufeature.sepUserTaskes(ulist, split)
	
	# Filter out region grid UID list and aggreate user feature vector
	flist, tobj = ufeature.getGridList()
	ufeature.sepFeatureTaskes( flist, tobj, ulist )

if __name__ == "__main__":
	logging.basicConfig(filename='logger-featureconstruction.log', level=logging.DEBUG)
	main(sys.argv[1:])