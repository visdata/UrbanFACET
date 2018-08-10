#!/usr/bin/env python
# -*- coding: utf-8 -*-
# @Date    : 2017-02-08 18:55:01
# @Author  : Joe Jiang (hijiangtao@gmail.com)
# @Link    : https://hijiangtao.github.io/
# 描述     ： 考虑全时段数据的 people entropy 计算

import os
import time
import logging
import sys
import getopt
import gc
import numpy as np
import scipy.stats as sc
from CommonFunc import getTimePeriod, getCityLocs
from CommonFunc import getCityDisInfo
from CommonFunc import connectMongo
from multiprocessing import Process, Manager, Value, Array, Lock
from ctypes import c_wchar_p
from entropy.grids import getGridsFromMongo

class EntropyMatrixModule(object):
	"""EntropyMatrixModule 类
	
	Attributes:
	    CITY (TYPE): Description
	    CITYDISIND (TYPE): Description
	    CITYDISNUM (TYPE): Description
	    DIRECTORY (TYPE): Description
	    EMATRIX (TYPE): 当前城市全量 ID 的信息数组，每一个元素包含用户 ID 以及 entropy 相关信息
	    FILENUM (TYPE): Description
	    gridsData (TYPE): Description
	    GRIDSNUM (TYPE): Description
	    INDEX (TYPE): Description
	    starttime (TYPE): Description
	    validIDs (TYPE): Description
	"""
	def __init__(self, PROP, DATA):
		super(EntropyMatrixModule, self).__init__()
		self.FILENUM = PROP['FILENUM']
		self.INDEX = PROP['INDEX']
		self.DIRECTORY = PROP['DIRECTORY']
		self.GRIDSNUM = PROP['GRIDSNUM']
		self.CITY = PROP['CITY']
		self.METRIC = PROP['METRIC']
		self.CITYDISNUM = PROP['CITYDISNUM']
		self.CITYDISIND = PROP['CITYDISIND']
		self.UPPER = PROP['UPPER']
		self.LOWER = PROP['LOWER']
		self.COLUMN_INDEX = PROP['COLUMN_INDEX']
		self.starttime = time.time()
		
		# all string in EMATRIX
		self.EMATRIX = [];
		for upper in self.UPPER:
			self.EMATRIX.append(np.array([np.array([x, 0]) for x in xrange(0, PROP['GRIDSNUM'])]))

	def run(self):
		logging.info('TASK-%d running in %s' % (self.INDEX, (time.time()-self.starttime)))
		# print 'TASK-%d running in %s' % (self.INDEX, (time.time()-self.starttime))
		# 输出文件名
		
		userfile = os.path.join(self.DIRECTORY, 'entropy/distribution', self.CITY, 'respeo-%03d' % self.INDEX)
		entropyfiles = []
		for index, upper in enumerate(self.UPPER):
			entropyfiles.append(os.path.join(self.DIRECTORY, 'entropy_range/%s/matrix' % self.METRIC, self.CITY, 'respeo-%02d-%03d' % (index,self.INDEX)))
		
		userEntropyClassDict = {}
		entropyClassSize = len(self.UPPER);
		
		# save user dict of entropy
		with open(userfile, 'rb') as stream:
			for line in stream:
				entrylist = line.strip('\n').split(',')
				if self.COLUMN_INDEX < len(entrylist):
					entropy = float(entrylist[self.COLUMN_INDEX])
					userId = entrylist[0]
					
					if entropy <= self.LOWER[0]:
						continue
					
					classId = 0; 
					for classIndex in range(1, entropyClassSize):
						if entropy > self.LOWER[classIndex]:
							classId = classIndex
					
					userEntropyClassDict[userId] = classId
		
		stream.close()
					
		# 文件遍历 (进程编号： self.INDEX )
		for x in xrange(0, 10000):
			number = self.INDEX + 20 * x
			if number > self.FILENUM:
				break

			ifilename = os.path.join(self.DIRECTORY, 'records/idcollection', self.CITY , 'res-%05d' % number)
			
			logging.info('TASK-%d operates file %s' % (self.INDEX, ifilename))
			
			# 抽取文件,计算每个entropy class grid density
			self.entropy_density(ifilename, userEntropyClassDict)
			
			print 'Finished entropy_density function in %s for file %s' % (time.time()-self.starttime, ifilename)

		print 'Finished entropy_density function in %s for TASK-%d' % (time.time()-self.starttime, self.INDEX)
		
		# 处理完数据，将 EMATRIX 信息写入文件
		
		for entropyClass in range(entropyClassSize):
			with open(entropyfiles[entropyClass], 'wb') as res:
				res.write(self.ematrixToStr(self.EMATRIX[entropyClass]))
			res.close()

		# 打印任务处理结束信息
		print "Task-%s finished in %s" % (str(self.INDEX), time.time()-self.starttime)

	def entropy_density(self, inputfile, userEntropyClassDict):
		"""计算当前文件各个 ID 的 Entropy Class 信息并更新至 EMATRIX
		"""
		
		# 文件读取
		with open(inputfile, 'rb') as stream:
			for line in stream:
				dictlist = line.strip('\n').split(',')
				devid = dictlist[0]				
				devIntGID = int( dictlist[6] )

				if devid not in userEntropyClassDict:
					continue
				
				if devIntGID < 0 or devIntGID >= self.GRIDSNUM:
					continue
				
				entropyClass = 	userEntropyClassDict[devid]
				
				self.EMATRIX[entropyClass][ devIntGID ][1]+=1
		
		stream.close()
		

	def aggregate(self, id, obj):
		"""idInfo 信息聚合成字符串
		
		Args:
		    id (TYPE): Description
		    obj (TYPE): Description
		
		Returns:
		    TYPE: Description
		"""
		valStr = id + ',' + str(obj['t1']['val']) + ',' + str(obj['t2']['val']) + ',' + str(obj['t3']['val']) + ',' + str(obj['t1']['vsum']) + ',' + str(obj['t2']['nsum'])
		tArrStr = ','.join([str(each) for each in obj['t1']['plist']]) + ',' + ','.join([str(each) for each in obj['t2']['nlist']]) + ',' + ','.join([str(each) for each in obj['t3']['nlist']])
		return valStr + ',' + tArrStr + '\n'

	def ematrixToStr(self, data):
		datalen = self.GRIDSNUM
		resStr = []
		for x in xrange(0, datalen):
			resStr.append( ','.join(str(data[x][e]) for e in range(0,2)))

		return '\n'.join(resStr)

def processTask(PROP, DATA):
	task = EntropyMatrixModule(PROP, DATA)
	task.run()

def mergeEntropyFiles(city, GRIDSNUM, directory, classIndex):
	"""合并 CityGrids 信息,分别读取文件,最后需将叠加的信息处理存入一个合并的文件
	
	Args:
	    city (TYPE): Description
	    GRIDSNUM (TYPE): Description
	
	Returns:
	    TYPE: Description
	"""
	ematrix = np.array([np.array([x, 0]) for x in xrange(0, GRIDSNUM)])
	
	for x in xrange(0,20):
		with open(os.path.join(directory, 'respeo-%02d-%03d' % (classIndex, x)), 'rb') as stream:
			for each in stream:
				line = np.array(each.split(','), dtype='d')
				id = int(line[0])
				line[0] = 0
				ematrix[ id ] = np.add(line, ematrix[id])
		stream.close()

	resString = ''
	
	for x in xrange(0,GRIDSNUM):
		linestr = ','.join([str(ematrix[x][e]) for e in range(0,2)]) + '\n'
		resString += linestr

	with open(os.path.join(directory, 'respeo-%02d-xxx' % classIndex), 'wb') as res:
		res.write(resString)
	res.close()

	print "%d lines into matrix respeo-%02d-xxx file" % (GRIDSNUM, classIndex)

def help():
	print "Not Yet."

def main(argv):
	# 输入参数对照列表
	try:
		opts, args = getopt.getopt(argv, "hc:m:d:n:u:l:i", ["help", "city=", 'metric=', 'directory=', 'number=', 'upper=', 'lower=', 'column_index='])
	except getopt.GetoptError as err:
		print str(err)
		help()
		sys.exit(2)

	# 处理输入参数
	city, directory, number = 'beijing', '/enigma/tao.jiang/datasets/JingJinJi', 999
	
	# vibrancy conf
# 	lower = [0,0.7,1.5]
# 	upper = [0.7,1.5,3]
# 	column_index = 1
# 	metric = 'vibrancy'

	# commutation conf
	lower = [0,0.68,1.1]
	upper = [0.68,1.1,3]
	column_index = 3
	metric = 'commutation'
		
	for opt, arg in opts:
		if opt == '-h':
			help()
			sys.exit()
		elif opt in ("-c", "--city"):
			city = arg
		elif opt in ("-m", "--metric"):
			metric = arg
		elif opt in ("-d", "--directory"):
			directory = arg
		elif opt in ('-n', '--number'):
			number = int(arg)
		elif opt in ("-u", "--upper"):
			upper = arg.split(',')
		elif opt in ("-l", "--lower"):
			lower = arg.split(',')
		elif opt in ('-i', '--column_index'):
			column_index = int(arg)

	STARTTIME = time.time()
	print "Start processing at %s" % STARTTIME

	# 连接数据获取网格信息，包括总数，具有有效POI的网格
	conn, db = connectMongo('tdnormal')
	GRIDSNUM = db['newgrids_%s' % city].count()
	gridsData, validIDs = getGridsFromMongo(city, db)
	conn.close()

	# 获取城市起始区划下标，城市行政区划数目
	CITYDISIND, CITYDISNUM = getCityDisInfo(city)

	# @多进程运行程序 START
	manager = Manager()
	jobs = []

	for x in xrange(0,20):
		PROP = {
			'INDEX': x,
			'DIRECTORY': directory,
			'GRIDSNUM': GRIDSNUM,
			'CITY': city,
			'METRIC': metric
			'CITYDISIND': CITYDISIND,
			'CITYDISNUM': CITYDISNUM,
			'FILENUM': number,
			'UPPER': upper,
			'LOWER': lower,
			'COLUMN_INDEX': column_index
		}
		
		DATA = {
			'gridsData': 0,
			'validIDs': 0
		}

		jobs.append( Process(target=processTask, args=(PROP,DATA)) )
		jobs[x].start()

	# 等待所有进程结束
	for job in jobs:
	    job.join()

	# 合并结果文件
	MERGE = time.time()
	print "Start merge at %s" % MERGE
	
	for index, u in enumerate(upper):
		merge_dir = os.path.join(directory, 'entropy_range/%s/matrix'% metric, city)
		mergeEntropyFiles(city, GRIDSNUM, merge_dir, index)
	print "End merge in %s" % str(time.time() - MERGE)

	# 结束
	ENDTIME = time.time()
	print "End processing at %s" % ENDTIME

if __name__ == '__main__':
	logging.basicConfig(filename='logger-entropyrange-matrixcalmodule.log', level=logging.DEBUG)
	main(sys.argv[1:])