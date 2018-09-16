from __future__ import print_function
import numpy as np
from sklearn.cluster import DBSCAN
from CommonFunc import connectMYSQL
import json
import math
import time

import matplotlib.pyplot as plt



# DBSCAN
def dbscan(eps, min_samples, data):
  X = [v[:2] for v in data]
  sample_weight = [v[2] for v in data]

  labels = DBSCAN(eps, min_samples, n_jobs=3).fit_predict(X, sample_weight=sample_weight)

  results = {}
  for i in range(len(data)):
    label = labels[i]
    if label == -1:
      continue
    if label not in results:
      results[label] = []
    results[label].append(data[i])

  return results

# Compute boundaries of given clusters whose densities are larger than a given threshold
def cluster_bounds(data, avg_density, split, min_len=15):
  results = []
  cnt = 0
  # bounds = {}

  for k in data.keys():
    bounds = {}
    points = {}
    visited = {}
    cluster = data[k]
    if len(cluster) < min_len or sum([v[2] for v in cluster]) / len(cluster) < avg_density:
      continue
    cnt += 1
    for v in cluster:
      c_lat, c_lng = v[:2]
      lats = [0, 0, 0, 0]
      lngs = [0, 0, 0, 0]

      # Anticlockwise
      lats[0], lngs[0] = c_lat - split / 2, c_lng - split / 2
      lats[1], lngs[1] = c_lat - split / 2, c_lng + split / 2
      lats[2], lngs[2] = c_lat + split / 2, c_lng + split / 2
      lats[3], lngs[3] = c_lat + split / 2, c_lng - split / 2

      for i in range(len(lats)):
        lats[i] = round(lats[i], 4)
        lngs[i] = round(lngs[i], 4)

      for l in lats:
        if l not in bounds:
          bounds[l] = {}
      
      for i in range(len(lats)):
        if lngs[i] not in bounds[lats[i]]:
          # each point only consider two lines linked to it
          # |
          # |1
          # * ---- 0
          bounds[lats[i]][lngs[i]] = [False, False]
      
      bounds[lats[0]][lngs[0]][0] = not bounds[lats[0]][lngs[0]][0]
      bounds[lats[0]][lngs[0]][1] = not bounds[lats[0]][lngs[0]][1]
      bounds[lats[1]][lngs[1]][1] = not bounds[lats[1]][lngs[1]][1]
      bounds[lats[3]][lngs[3]][0] = not bounds[lats[3]][lngs[3]][0]
    
    target = (39.907, 116.514)
    for lat in bounds.keys():
      for lng in bounds[lat].keys():
        p0 = (lat, lng)

        for i in range(2):
          if bounds[lat][lng][i]:
            p1 = (lat, lng + split) if i == 0 else (lat + split, lng)
            if p0 == target or p1 == target:
              print(p0, p1)

            if p0 not in points:
              points[p0] = [p1]
            else:
              points[p0].append(p1)

            if p1 not in points:
              points[p1] = [p0]
            else:
              points[p1].append(p0)

            if p0 not in visited:
              visited[p0] = 0
              visited[p1] = 0
            
            visited[p0] += 1
            visited[p1] += 1
    
    # start = visited.keys()[0]
    # tmp = [start]
    # v = start
    # visited[v] = True
    # should_continue = True
    # while should_continue and v in points:
    #   p = points[v]
    #   # print(v, p)

    #   if not visited[p[0]]:
    #     tmp.append(p[0])
    #     visited[p[0]] = True
    #     v = p[0]
    #     continue

    #   if not visited[p[1]]:
    #     tmp.append(p[1])
    #     visited[p[1]] = True
    #     v = p[1]
    #     continue
      
    #   results.append(tmp)
    #   should_continue = False
    #   for v_ in visited.keys():
    #     if not visited[v_]:
    #       v = v_
    #       tmp = [v]
    #       visited[v] = True
    #       should_continue = True
    #       break
    
  for lat in bounds.keys():
    for lng in bounds[lat].keys():
      if bounds[lat][lng][0]:
        results.append([[lat, lng], [lat, lng + split]])
      if bounds[lat][lng][1]:
        results.append([[lat, lng], [lat + split, lng]])

  print('number of cluster:', cnt)

  return results


# Merge all points of clusters into one array
def merge_cluster(data, avg_density, min_len=15):
  results = []
  
  for k in data.keys():
    cluster = data[k]
    if len(cluster) < min_len or sum([v[2] for v in cluster]) / len(cluster) < avg_density:
      continue
    for v in cluster:
      results.append(v)

  return results

# Preprocess the data fetched from database: 
#  - convert id to coordinate
def preprocess(data, boundary, split):
  results = []
  for v in data:
    grid_id = v[0]
    lng_num = int((boundary['east'] - boundary['west']) / split + 1)
    latind = int(grid_id / lng_num)
    lngind = grid_id - latind * lng_num

    # latitude and longitude of the center
    c_lat = boundary['south'] + latind * split + split / 2
    c_lng = boundary['west'] + lngind * split + split / 2
    results.append([c_lat, c_lng, v[1]])
  
  return results

if __name__ == '__main__':
  db, cur = connectMYSQL('tdnormal')
  NUM = 3
  BOUNDARY_BEIJING = { 'north': 41.055, 'south': 39.445, 'west': 115.422, 'east': 117.515 } # boundary of Beijing
  SPLIT = 0.003
  PERCENT = 0.1
  EPS = SPLIT * math.sqrt(2)
  # EPS = SPLIT * 2
  MIN_LEN = 15

  t0 = time.time()

  data = [[] for _ in range(NUM)]

  try:
    sql_1 = "SELECT id, %s AS val FROM %s WHERE %s > 0 ORDER BY %s;" % (
        'wpnumber', 'bjRF0mat', 'wpnumber', 'wpnumber')
    sql_2 = "SELECT id, %s AS val FROM %s WHERE %s > 0 ORDER BY %s;" % (
        'wpnumber', 'bjRF1mat', 'wpnumber', 'wpnumber')
    sql_3 = "SELECT id, %s AS val FROM %s WHERE %s > 0 ORDER BY %s;" % (
        'wpnumber', 'bjRF2mat', 'wpnumber', 'wpnumber')
    cur.execute(sql_1)
    data[0] = cur.fetchall()
    cur.execute(sql_2)
    data[1] = cur.fetchall()
    cur.execute(sql_3)
    data[2] = cur.fetchall()
  finally:
    db.close()
  
  t1 = time.time()

  # results = {
  #     'type': 'FeatureCollection',
  #     'features': []
  # }
  results = []

  for i in range(NUM):
    processed_data = preprocess(data[i], BOUNDARY_BEIJING, SPLIT)
    max_density = max([v[1] for v in data[i]])
    clusters = dbscan(EPS, PERCENT * max_density * 7, processed_data)
    # bounds = cluster_bounds(clusters, PERCENT * max_density, SPLIT, MIN_LEN)
    results.append(merge_cluster(clusters, PERCENT * max_density, MIN_LEN))

    # print('length of raw data', len(data[i]), '; length of bounds:', len(bounds), '; max_density:', max_density)
    
    # results['features'].append({
    #     'type': 'Feature',
    #     'geometry': {
    #         'type': 'Polygon',
    #         'coordinates': bounds
    #     },
    #     'properties': {
    #         'color': i
    #     }
    # })
  
  t2 = time.time()
  
  with open('../../conf/data/bj_cluster_F_' + str(PERCENT) + '_' + str(MIN_LEN) + '.json', 'w') as f:
    f.write(json.dumps(results))

  print('Time of fetching data:', t1 - t0)
  print('Time of processing data:', t2 - t1)
