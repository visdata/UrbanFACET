import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans, DBSCAN
from CommonFunc import connectMongo, connectMYSQL
from Util import func
import json
try:
    import BaseHTTPServer
except:
    import http.server as BaseHTTPServer

HOST_NAME = '0.0.0.0'
PORT_NUMBER = 18263 # best between 9999 ~ 32768
#try: http://127.0.0.1:18263/?add1=25&add2=5&city=0

def kmeans(k, data):
    feature = []
    for each in data:
        feature.append(data[each][1:5])
    features = np.array(feature)
    features = features.reshape((-1, 4))
    features[features < 0] = 0

    result = KMeans(k).fit(features)
    labels = result.labels_

    splited = [[] for i in range(labels.max()+1)]

    for a, each in enumerate(data):
        data[each].append(labels[a])
        splited[labels[a]].append(data[each])

    for i in range(labels.max()+1):
        print i, sum(labels == i)

    return splited

def dbscan(r, data):
    feature = []
    for each in data:
        feature.append(each[6:8])
    features = np.array(feature)
    features = features.reshape((-1, 2))

    print len(features)
    print len(data)

    result = DBSCAN(eps = r, min_samples = 10).fit(features)
    core_samples_mask = np.zeros_like(result.labels_, dtype=bool)
    core_samples_mask[result.core_sample_indices_] = True
    labels = result.labels_

    print len(labels)

    splited = [[] for i in range(labels.max() + 1)]
    print splited

    for a, each in enumerate(data):
        each.append(labels[a])
        splited[labels[a]].append(each)

    for i in range(labels.max()+1):
        print i, sum(labels == i)

    #print splited
    return splited

def drawmap(data):
    boundary = {}
    bound = {}
    boundary['type'] = 'Feature'
    boundary['properties'] = {}
    boundary['geometry'] = {}
    boundary['geometry']['type'] = 'MultiLineString'
    boundary['geometry']['coordinates'] = []

    de_sum = pp_sum = ap_sum = pr_sum = ar_sum = longitude = latitude = 0
    for each in data:
        de_sum += each[0]
        pp_sum += each[1]
        ap_sum += each[2]
        if(de_sum < 0):
            pr_sum += 0
        else:
            pr_sum += each[3]
        ar_sum += each[4]
        longitude += each[6]
        latitude += each[7]
        addr = each[8]
        for i in range(4):
            a = (addr[i][0], addr[i][1])
            b = (addr[i+1][0], addr[i+1][1])
            if bound.has_key((min(a,b), max(a,b))):
                bound[(min(a,b), max(a,b))] += 1
            else:
                bound[(min(a,b), max(a,b))] = 1
    m = 0
    for each in bound:
        if bound[each] == 1:
            '''
            if [each[0][0], each[0][1]] in  boundary['geometry']['coordinates'] and [each[1][0], each[1][1]] in  boundary['geometry']['coordinates']:
                continue
            elif [each[0][0], each[0][1]] not in  boundary['geometry']['coordinates']:
                boundary['geometry']['coordinates'].append([each[0][0], each[0][1]])
            elif [each[1][0], each[1][1]] not in  boundary['geometry']['coordinates']:
                boundary['geometry']['coordinates'].append([each[1][0], each[1][1]])
            else:
                boundary['geometry']['coordinates'].append([each[0][0], each[0][1]])
                boundary['geometry']['coordinates'].append([each[1][0], each[1][1]])
            '''
            coordinates = []
            coordinates.append([each[0][0],each[0][1]])
            coordinates.append([each[1][0], each[1][1]])
            boundary['geometry']['coordinates'].append(coordinates)
        print m
        m += 1
        '''
            if addr[i] < addr[i+1]:
                if  bound.has_key(addr[i]):
                    if bound[addr[i]].has_key(addr[i+1]):
                        bound[addr[i]][addr[i+1]] += 1
                    else:
                        bound[addr[i]][addr[i+1]] = 1
                else:
                    bound[addr[i]] = {}
                    bound[addr[i]][addr[i+1]] = 1
            else:
                if  bound.has_key(addr[i+1]):
                    if bound[addr[i+1]].has_key(addr[i]):
                        bound[addr[i+1]][addr[i]] += 1
                    else:
                        bound[addr[i+1]][addr[i]] = 1
                else:
                    bound[addr[i+1]] = {}
                    bound[addr[i+1]][addr[i]] = 1
    for coodinates in bound:
        for coodinate in coodinates:
            if bound[coodinates][coodinate] == 1:
                boundary['coordinates'].append((coodinates, coodinate))
    '''

    boundary['properties']['ad'] = de_sum / len(data)
    boundary['properties']['pp'] = pp_sum / len(data)
    boundary['properties']['ap'] = ap_sum / len(data)
    boundary['properties']['pr'] = pr_sum / len(data)
    boundary['properties']['ar'] = ar_sum / len(data)
    boundary['properties']['cp'] = [longitude / len(data), latitude / len(data)]

    print boundary
    return boundary

def main(k, r, city):
    '''
    db, cur = connectMYSQL('tdnormal')
    cur.execute("SELECT MAX(wpnumber) AS 'dmax', MAX(ppsval/wpnumber) AS 'amax', MAX(apsval/wpnumber) AS 'cmax', "
                "MAX(prsval/wpnumber) AS 'emax', MAX(arsval/wpnumber) AS 'fmax' from zjkEmatrix WHERE wpnumber > 0; ")
    for each in cur.fetchall():
        maxmatrix = []
        maxmatrix.append(float(each[0]))
        for i in range(4):
            maxmatrix.append(each[i+1])
    #max = np.array(cur.fetchall()).max(0)

    cur.execute("SELECT id, wpnumber  AS 'd', ppsval / wpnumber AS 'a', apsval / wpnumber AS 'c',"
                "prsval / wpnumber AS 'e', arsval / wpnumber AS 'f' from zjkEmatrix WHERE wpnumber > 0;")

    conn, db = func.connectMongo('tdnormal')
    data = {}
    m = 0
    for each in cur.fetchall():
        data[each[0]] = []
        for i in range(5):
            data[each[0]].append(each[i+1] / maxmatrix[i])
        tmp = db.newgrids_zhangjiakou.find({'properties.uid' : each[0]})[0]
        data[each[0]].append(tmp['_id'])
        data[each[0]].append(tmp['properties']['center']['coordinates'][0])
        data[each[0]].append(tmp['properties']['center']['coordinates'][1])
        data[each[0]].append(tmp['geometry']['coordinates'][0])
        print m
        m += 1

    file = open('./zjk_initial_data.json', 'w')
    file.write(json.dumps(data))
    file.close()
    '''

    file = open('./' + city + '_initial_data.json', 'r')
    data = json.load(file)
    file.close()

    result = {}
    result['type'] = 'FeatureCollection'
    result['features'] = []

    splits = kmeans(k, data)
    for split in splits:
        splited = dbscan(r, split)
        for da in splited:
            result['features'].append(drawmap(da))

    file = open('../../conf/data/' + city + '_cluster.json', 'w')
    file.write(json.dumps(result))
    file.close()

def get_result(params):
    add1 = int(params['add1'])
    add2 = int(params['add2'])
    print('add1', add1, 'add2', add2)
    city = ''
    if params['city'] == 1:
        city = 'bj'
    elif params['city'] == 2:
        city = 'tj'
    elif params['city'] == 3:
        city = 'zjk'
    elif params['city'] == 4:
        city = 'ts'
    k = add1
    r = add2/100.0
    main(k, r, city)
    result = {'ans':add1+add2}
    return result


class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    def do_HEAD(s):
        s.send_response(200)
        s.send_header("Content-type", "application/json")
        s.end_headers()

    def do_GET(s):
        """Respond to a GET request."""
        print("#%s#" % s.path)
        try:
            params = {i.split('=')[0]: i.split('=')[1]
                      for i in s.path.split('?')[-1].split('&')}
        except:
            params = {}

        res = get_result(params)

        s.send_response(200)
        s.send_header("Content-type", "application/json")
        s.end_headers()

        s.wfile.write("successCallback(".encode('utf-8'))
        s.wfile.write(json.dumps(res).encode('utf-8'))
        s.wfile.write(")".encode('utf-8'))


if __name__ == '__main__':
    server_class = BaseHTTPServer.HTTPServer
    httpd = server_class((HOST_NAME, PORT_NUMBER), MyHandler)
    print("Server Starts - %s:%s" % (HOST_NAME, PORT_NUMBER))
    print(r"Try to visit http://127.0.0.1:%s/?add1=123&add2=111" %(PORT_NUMBER))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()