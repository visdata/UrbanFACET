/**
 * hmap-view.js
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2017-03-17 22:26:08
 * @version $Id$
 */

'use strict'

import L from './map'
// import HeatmapOverlay from 'heatmap.js/plugins/leaflet-heatmap/leaflet-heatmap.js'
import HeatmapOverlay from '../lib/leaflet-heatmap'
import BubbleSetOverlay from '../lib/bubble-set'
import * as d3 from 'd3'
import {
    legendColor
} from 'd3-svg-legend'
import {
    getSubGrids,
    getLinearNum,
    getRandomCenter,
    getClusterboundaryDatasets,
    outOfRange,
    getPropName,
    extraInfoIndex,
    getMetricsLegendDatasets
} from './apis'
import {
    stats,
    regionRecords,
    smecMax
} from './init'
import * as coordtransform from 'coordtransform';
import {
    RadarChart
} from './RadarChart';

import {
    Metrics_card
} from './Metrics_card';

const SPLIT = 0.003
const mapattr = 'UrbanFACET &copy; 2016-2017'
const mapuid = 'zhichun'
const accessToken = 'pk.eyJ1IjoiemhpY2h1biIsImEiOiJjampzMXE1MG8yMTEwM3JvbnI1bWJ5Z3h4In0.Wg2zDaBAz67uNp8f89lnUw'

class mapview {

    /**
     * LMap class constructor
     * @return {[type]} [description]
     */
    constructor(id, grdleg, ctrleg, disclsld, cltsld, bubblesld, baselyr, city = "bj") {
        let self = this;
        this.ides = {
            'mapid': id,
            'grdleg': grdleg,
            'ctrleg': ctrleg,
            'disclsld': disclsld,
            'cltsld': cltsld,
            'bubblesld': bubblesld,
            'baselyr': baselyr
        };
        this.save_data = {
            'data': null,
            'city': ''
        };
        this.savef_data = {
            'data': null,
            'city': ''
        };
        /**
         * 地图图层
         * @type {Object}
         */
        this.baseLayers = {
            'Road': L.tileLayer(`https://api.mapbox.com/styles/v1/{uid}/cjm2ti28r9k482rl6c83jfe66/tiles/256/{z}/{x}/{y}?access_token=${accessToken}`, {
                attribution: mapattr,
                maxZoom: 18,
                uid: mapuid
            }),
            'Outdoors': L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                id: 'mapbox.outdoors',
                attribution: mapattr,
                uid: mapuid
            }),
            'Streets': L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                id: 'mapbox.streets',
                attribution: mapattr,
                uid: mapuid
            }),
            'Bright': L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                id: 'mapbox.light',
                attribution: mapattr,
                uid: mapuid
            }),
            'Dark': L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                id: 'mapbox.dark',
                attribution: mapattr,
                uid: mapuid
            }),
            'Satellite': L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
                id: 'mapbox.satellite',
                attribution: mapattr,
                uid: mapuid
            }),
        }
        this.heatmapLayer = null;
        this.bubbleSetOverlay = null;
        this.gridmapLayer = null;
        this.areaSelector = null;
        this.aAreaSelector = null;
        this.aoiLayer = null; //canvas method
        this.aoiLayers = null; // svg method
        this.map = new L.map(id, {
            center: L.latLng(regionRecords[city]['center']),
            zoom: 11,
            layers: self.baseLayers['Road'],
            crs: L.CRS.CustomZoom
        });
        this.map.zoomControl.setPosition('topright');
        this.control = L.control.activeLayers(self.baseLayers, null, {
            'position': 'bottomleft'
        });
        this.map.addControl(this.control);
        this.boundData = {};
        this.clusterData = {};
        this.gridData = {};
        this.gridDataType = '';

        this.map.on('zoomend', function (e) {
            console.log('Current Zoom Level', self.map.getZoom());
            if (true) {
                if (d3.selectAll('.leaflet-radarchart')._groups[0].length != 0) {
                    console.log("redrawing")
                    //console.log(JSON.stringify(d3.selectAll('.leaflet-radarchart')._groups[0].length))
                    self.smecDrawing(self.save_data.data, self.save_data.city);
                } else if (d3.selectAll('.leaflet-flower')._groups[0].length != 0) {
                    console.log("redrawflower")
                    //console.log(JSON.stringify(self.savef_data.data))
                    self.flowerDrawing(self.savef_data.data, self.savef_data.city);
                } 
                
                // 待完善
                // 
                // 如果存在contour map 则根据zoom level重绘
                // zoom 9: 2.5
                // 10: 2.25
                // 11: 2
                // 12: 1.75
                // 13: 1.5
                // 14: 1.25
                // 15: 1
            }
        });

        //this.map.on('baselayerchange', function (e) {
        //    let name = self.control.getActiveBaseLayer().name;
        //    document.getElementById(self.ides.baselyr).innerText = name;
        //    console.log(name);
        //});
    }

    invalidateSize() {
        this.map.invalidateSize();
    }

    getBoundData() {
        return this.boundData;
    }

    getClusterBoundData() {
        return this.clusterboundData;
    }

    setBoundData(data) {
        this.boundData = data;
        return this;
    }

    setClusterBoundData(data) {
        this.clusterboundData = data;
        return this;
    }

    setBubbleContourData(data){
        this.bubbleContourData = data;
        return this;
    }

    getBubbleContourData(data){
        return this.bubbleContourData;
    }

    

    getGridData() {
        return this.gridData;
    }

    setGridData(data) {
        this.gridData = data;
        return this;
    }

    getGridDataType() {
        return this.gridDataType;
    }

    setGridDataType(data) {
        this.gridDataType = data;
        return this;
    }

    getMap() {
        return this.map;
    }
    getAreaSelect() {
        return this.areaSelector;
    }

    syncmap(map) {
        console.log(this.map.isSynced());
        // if (!this.map.isSynced()) {
        //     this.map.sync(map);
        // }
        this.map.sync(map);

        return;
    }

    unsyncmap(map) {
        if (this.map.isSynced()) {
            this.map.unsync(map);
        }

        return;
    }

    // areaselect 选择/取消
    optAreaSelector(add) {
        if (add) {
            this.areaSelector = L.areaSelect({
                width: 300,
                height: 200
            });
            this.areaSelector.addTo(this.map);
        } else {
            if (this.areaSelector) {
                // this.map.removeLayer(this.areaSelector);
                this.areaSelector.remove();
            }
        }

    }

    /**
     * areaselect 双向绑定函数
     * @param  {[type]} areaselect [description]
     * @return {[type]}            [description]
     */
    bindAreaSelect(areaselect) {
        let self = this;
        this.aAreaSelector = areaselect;

        this.areaSelector.on("change", function () {
            let w1 = self.areaSelector.getDimensions().width,
                h1 = self.areaSelector.getDimensions().height,
                w2 = self.aAreaSelector.getDimensions().width,
                h2 = self.aAreaSelector.getDimensions().height;

            if (w1 !== w2 && h1 !== h2) {
                self.aAreaSelector.setDimensions(self.areaSelector.getDimensions());
            }

        });
        this.aAreaSelector.on("change", function () {
            let w1 = self.areaSelector.getDimensions().width,
                h1 = self.areaSelector.getDimensions().height,
                w2 = self.aAreaSelector.getDimensions().width,
                h2 = self.aAreaSelector.getDimensions().height;

            if (w1 !== w2 && h1 !== h2) {
                self.areaSelector.setDimensions(self.aAreaSelector.getDimensions());
            }
        });
    }

    updateAreaSelector(dims = 0) {
        if (dims === 0) {
            return this.areaSelector.getDimensions();
        } else {
            this.areaSelector.setDimensions(dims);
        }
    }

    modelDrawing() {
        let self = this,
            overlay = d3.select(self.map.getPanes().overlayPane);

        var svg = overlay.append("svg")
            .attr("class", 'model')
            .style("position", 'absolute')
            .style("top", -1500)
            .style("left", -1500)
            //.style("display", 'none')
            .style("background-color", 'rgba(255, 255, 255, 0.5)')
            //.attr("width", '100%')
            //.attr("height", '100%')
            .attr("width", 6000)
            .attr("height", 6000)
            .style("z-index", 997);
        console.log("map")
    }

    flowerDrawing(initial_data, city) {
        d3.selectAll('.leaflet-flower').remove();
        this.savef_data.data = initial_data;
        this.savef_data.city = city;

        let self = this,
            overlay = d3.select(self.map.getPanes().overlayPane),
            width = 70,
            height = 70,
            ExtraLen = 10,
            max_d = 0,
            max_ad = 0,
            max_ar = 0,
            max_pr = 0,
            max_ap = 0,
            max_pp = 0,
            data = initial_data['features'];

        for (let i = 0; i < data.length; i++) {
            if (data[i]['properties']['d'] > max_d) {
                max_d = data[i]['properties']['d'];
            }
            if (data[i]['properties']['ad'] > max_ad) {
                max_ad = data[i]['properties']['ad'];
            }
            if (data[i]['properties']['ar'] > max_ar) {
                max_ar = data[i]['properties']['ar'];
            }
            if (data[i]['properties']['pr'] > max_pr) {
                max_pr = data[i]['properties']['pr'];
            }
            if (data[i]['properties']['ap'] > max_ap) {
                max_ap = data[i]['properties']['ap'];
            }
            if (data[i]['properties']['pp'] > max_pp) {
                max_pp = data[i]['properties']['pp'];
            }
        }
        
        console.log("data: " + data.length)
        for (let i = 0; i < data.length; i++) {
            let rdata = [
                [{
                    'area': 'Fluidity',
                    'value': data[i]['properties']['ar'],
                    'd': data[i]['properties']['d'],
                    //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                    'name': 'FACET: ',
                    'data': data[i]['properties']
                }, {
                    'area': 'vibrAncy',
                    'value': data[i]['properties']['pp'],
                    'd': data[i]['properties']['d'],
                    //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                    'name': 'FACET: ',
                    'data': data[i]['properties']
                }, {
                    'area': 'Commutation',
                    'value': data[i]['properties']['ap'],
                    'd': data[i]['properties']['d'],
                    //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                    'name': 'FACET: ',
                    'data': data[i]['properties']
                }, {
                    'area': 'divErsity',
                    'value': data[i]['properties']['pr'],
                    'd': data[i]['properties']['d'],
                    //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                    'name': 'FACET: ',
                    'data': data[i]['properties']
                }]
            ],
                prop = {
                    'id': `${city}-radar${i}`,
                    'city': city
                };
            let s = data[i]['properties']['d'] / Number.parseFloat(max_d), //"ad":  总统计点数，"d": 总统计数/面积
                linear = d3.scaleLinear().domain([0, 1]).range([50, 100]),

                speColor = d3.hcl(359, 90, 100),
                speColor1 = d3.hcl(0, 90, 100),
                speColor2 = d3.hcl(90, 90, 100),
                speColor3 = d3.hcl(150, 90, 100),
                speColor4 = d3.hcl(280, 90, 100);
            let mag = 1.0;
            if (this.map.getZoom() > 11) {
                mag = Math.pow(2.0, (this.map.getZoom() - 11));
                //console.log("mag: " + mag)
            } else if (this.map.getZoom() < 11) {
                mag = Math.pow(0.5, (11 - this.map.getZoom()));
                //console.log("mag: " + mag)
            }

            let r = data[i]['properties']['d'] / Number.parseFloat(max_d),
                linear0 = d3.scaleLinear().domain([0, 1]).range([45 * mag, 90 * mag]),
                r0 = linear0(r),
                R0 = Math.sqrt(Math.pow(r0, 1 / 0.7)),
                r_max = Math.sqrt(Math.pow(linear0(1.0), 1 / 0.7));

            let r1 = Math.sqrt(data[i]['properties']['ar'] / Number.parseFloat(max_ar)),
                r2 = Math.sqrt(data[i]['properties']['pp'] / Number.parseFloat(max_pr)),
                r3 = Math.sqrt(data[i]['properties']['ap'] / Number.parseFloat(max_ap)),
                r4 = Math.sqrt(data[i]['properties']['pr'] / Number.parseFloat(max_pp));

            let R5 = data[i]['properties']['d'] / Number.parseFloat(max_d),
                linear1 = d3.scaleLinear().domain([0, 1]).range([0, 2]),
                R = linear1(R5),
                r5 = Math.sqrt(Math.pow(R, 1 / 0.7));

            let svg = overlay.append("svg").attr('id', prop['id'])
                .attr("width", width)
                .attr("height", height)
                .style("z-index", 999),
                config = {
                    w: width,
                    h: height,
                    maxValue: max_pr,
                    levels: 5,
                    speColor: speColor,
                    speColor1: speColor1,
                    speColor2: speColor2,
                    speColor3: speColor3,
                    speColor4: speColor4,
                    R0: R0,
                    r_max: r_max,
                    r1: r1,
                    r2: r2,
                    r3: r3,
                    r4: r4,
                    r5: r5,
                    TranslateX: ExtraLen * 1.8 / 2,
                    TranslateY: ExtraLen / 2,
                    ExtraWidthX: ExtraLen * 1.8,
                    ExtraWidthY: ExtraLen
                }

            RadarChart.draw(`#${prop['id']}`, rdata, config, 'c');

            self.map.on("viewreset", reset);
            reset();

            function reset() {
                let point = self.map.latLngToLayerPoint(new L.LatLng(data[i]['properties']['c'][1], data[i]['properties']['c'][0]));
                svg.style("left", (point.x - width / 2 - ExtraLen / 2) + "px")
                    .style("top", (point.y - height / 2 - ExtraLen / 2) + "px");
            }

        }

    }

    metricsDrawing(){
        d3.selectAll('.leaflet-metrics').remove();
        
        let self = this,
            k_num = 6,
            overlay = d3.select(self.map.getPanes().overlayPane);
        let svg = overlay.append("svg").attr('id', 'metrics_card')
                .attr("width", 500)
                .style("z-index", 10000)
                .style("left", "13px")
                .style("top", "570px");

        // var g = d3.select("#metrics_card")
        //     .append("g")
        //     .attr("transform", "translate(40,40)");

            svg.append("svg:rect")
            .attr("width", 230)
            .attr("height", 200)
            .attr("x", 0)
            .attr("y", 0)
            .attr("fill", "white");

        getMetricsLegendDatasets(k_num).then(function (initial_data) {
            let width = 70,
            height = 70,
            ExtraLen = 10,
            max_d = 0,
            max_ad = 0,
            max_ar = 0,
            max_pr = 0,
            max_ap = 0,
            max_pp = 0,
            data = initial_data['features'];

            for (let i = 0; i < data.length; i++) {
                if (data[i]['properties']['d'] > max_d) {
                    max_d = data[i]['properties']['d'];
                }
                if (data[i]['properties']['ad'] > max_ad) {
                    max_ad = data[i]['properties']['ad'];
                }
                if (data[i]['properties']['ar'] > max_ar) {
                    max_ar = data[i]['properties']['ar'];
                }
                if (data[i]['properties']['pr'] > max_pr) {
                    max_pr = data[i]['properties']['pr'];
                }
                if (data[i]['properties']['ap'] > max_ap) {
                    max_ap = data[i]['properties']['ap'];
                }
                if (data[i]['properties']['pp'] > max_pp) {
                    max_pp = data[i]['properties']['pp'];
                }
            }

            let color = ["rgba(228,26,28,0.6)","rgba(55,126,184,0.6)","rgba(77,175,74,0.6)","rgba(152,78,163,0.6)","rgba(255,127,0,0.5)"],
                initial_y = 20,
                gap = 40;


            console.log("data: " + data.length)
            for (let i = 0; i < data.length; i++) {
                svg.append("svg:rect")
                    .attr("width", 40)
                    .attr("height", 20)
                    .attr("x", 10)
                    .attr("y", function(){
                        return initial_y + gap * i;
                    })
                    .attr("fill", function(){
                        return color[i];
                    });

                let rdata = [
                    [{
                        'area': 'Fluidity',
                        'value': data[i]['properties']['ar'],
                        'd': data[i]['properties']['d'],
                        //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                        'name': 'FACET: ',
                        'data': data[i]['properties']
                    }, {
                        'area': 'vibrAncy',
                        'value': data[i]['properties']['pp'],
                        'd': data[i]['properties']['d'],
                        //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                        'name': 'FACET: ',
                        'data': data[i]['properties']
                    }, {
                        'area': 'Commutation',
                        'value': data[i]['properties']['ap'],
                        'd': data[i]['properties']['d'],
                        //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                        'name': 'FACET: ',
                        'data': data[i]['properties']
                    }, {
                        'area': 'divErsity',
                        'value': data[i]['properties']['pr'],
                        'd': data[i]['properties']['d'],
                        //'name': "k: "+ data[i]['properties']['color'] + "  d: " + data[i]['properties']['db_num'],
                        'name': 'FACET: ',
                        'data': data[i]['properties']
                    }]
                ];
                    // prop = {
                    //     'id': `${city}-radar${i}`,
                    //     'city': city
                    // };
                let s = data[i]['properties']['d'] / Number.parseFloat(max_d), //"ad":  总统计点数，"d": 总统计数/面积
                    linear = d3.scaleLinear().domain([0, 1]).range([50, 100]),

                    speColor = d3.hcl(359, 90, 100),
                    speColor1 = d3.hcl(0, 90, 100),
                    speColor2 = d3.hcl(90, 90, 100),
                    speColor3 = d3.hcl(150, 90, 100),
                    speColor4 = d3.hcl(280, 90, 100);
                let mag = 1.0;
                // if (this.map.getZoom() > 11) {
                //     mag = Math.pow(2.0, (this.map.getZoom() - 11));
                //     //console.log("mag: " + mag)
                // } else if (this.map.getZoom() < 11) {
                //     mag = Math.pow(0.5, (11 - this.map.getZoom()));
                //     //console.log("mag: " + mag)
                // }

                let r = data[i]['properties']['d'] / Number.parseFloat(max_d),
                    linear0 = d3.scaleLinear().domain([0, 1]).range([45 * mag, 90 * mag]),
                    r0 = linear0(r),
                    R0 = Math.sqrt(Math.pow(r0, 1 / 0.7)),
                    r_max = Math.sqrt(Math.pow(linear0(1.0), 1 / 0.7));

                let r1 = Math.sqrt(data[i]['properties']['ar'] / Number.parseFloat(max_ar)),
                    r2 = Math.sqrt(data[i]['properties']['pp'] / Number.parseFloat(max_pr)),
                    r3 = Math.sqrt(data[i]['properties']['ap'] / Number.parseFloat(max_ap)),
                    r4 = Math.sqrt(data[i]['properties']['pr'] / Number.parseFloat(max_pp));

                let R5 = data[i]['properties']['d'] / Number.parseFloat(max_d),
                    linear1 = d3.scaleLinear().domain([0, 1]).range([0, 2]),
                    R = linear1(R5),
                    r5 = Math.sqrt(Math.pow(R, 1 / 0.7));

                svg.append("circle")
                .attr("cx", function(){
                    if(i % 2 == 0){
                        return 120;
                    }
                    else{
                        return 170;
                    }
                })
                .attr("cy", function(){
                    return initial_y + 13 + gap * i;
                })
                .attr('r', 3)
                .style("stroke-width", "1.5px")
                .style('stroke', d3.hcl(359, 60, 40))
                .style("fill-opacity", 0);

                svg.selectAll(".nodes")
                .data([0,1,2,3])
                .enter()
                .append("path")
                .attr("transform", function(){
                    if(i % 2 == 0){
                        return "translate(" + 120 + "," + (initial_y + 13 + gap*i) + ")";
                    }
                    return "translate(" +  170 + "," + (initial_y + 13 + gap*i) + ")";
                })
                .attr("d", function(j,k){
                    var cx = 0, cy = 0,
                        r = 0, s = 0, e = 0, m = 0;
                    if (k == 0){
                            cy = r1 * R0,
                            r = cy,
                            s = {x: 0, y: -r/2}, 
                            e = {x: -r/2, y: 0},
                            m = {x: -Math.sqrt(2) * r / 2 , y: -Math.sqrt(2) * r / 2};
                            //console.log("1s: " + JSON.stringify(m))
                    } 
                    else if(k == 1){
                            cx = r2 * R0,
                            r = cx,
                            s = {x: -r/2, y: 0},
                            e = {x: 0, y: r/2},
                            m = {x: -Math.sqrt(2) * r / 2 , y: Math.sqrt(2) * r / 2};
                            //console.log("2s: " + JSON.stringify(m))
                    }
                    else if(k == 2){
                            cy = r3 * R0,
                            r = cy,
                            s = {x: 0, y: r/2},
                            e = {x: r/2, y: 0},
                            m = {x: Math.sqrt(2) * r / 2 , y: Math.sqrt(2) * r / 2};
                            //console.log("3s: " + JSON.stringify(m))
                    }
                    else if(k == 3){
                            cx = r4 * R0,
                            r = cx,
                            s = {x: r/2, y: 0},
                            e = {x: 0, y: -r/2},
                            m = {x: Math.sqrt(2) * r / 2 , y: -Math.sqrt(2) * r / 2};
                            //console.log("4s: " + JSON.stringify(m))
                    }
                        return "M0,0Q" + s.x + "," + s.y + " " + m.x + "," + m.y + 
                                "M0,0Q" + e.x + "," + e.y + " " + m.x + "," + m.y ;
                })
                .style("stroke", function(j){
                        return d3.hcl(j/ 4 * 360, 60, 40);
                })
                .style("fill", function(j,k){
                        if (k == 0)
                            return speColor1;
                        else if (k == 1)
                            return speColor2;
                        else if (k == 2)
                            return speColor3;
                        else if (k == 3)
                            return speColor4;
                })
                .style("fill-opacity", 0.5);

            }
        }).catch(function (err) {
            console.error("Failed!", err);
        });

            
    }

    smecDrawing(data, city) { //绘制star plot
        d3.selectAll('.leaflet-radarchart').remove();
        this.save_data.data = data;
        this.save_data.city = city;

        for (let i = data.length - 1; i >= 0; i--) {
            let prop = {
                'id': `${city}-radar${i}`,
                'city': city
            }

            //console.log(JSON.stringify(prop))
            let self = this,
                overlay = d3.select(self.map.getPanes().overlayPane),
                width = 70,
                height = 70,
                ExtraLen = 10,
                rdata = [
                    [{
                        'area': 'Fluidity',
                        'value': data[i]['ar'],
                        'name': data[i]['name'],
                        'd': data[i]['d'],
                        'data': data[i]
                    }, {
                        'area': 'vibrAncy',
                        'value': data[i]['pp'],
                        'name': data[i]['name'],
                        'd': data[i]['d'],
                        'data': data[i]
                    }, {
                        'area': 'Commutation',
                        'value': data[i]['ap'],
                        'name': data[i]['name'],
                        'd': data[i]['d'],
                        'data': data[i]
                    }, {
                        'area': 'divErsity',
                        'value': data[i]['pr'],
                        'name': data[i]['name'],
                        'd': data[i]['d'],
                        'data': data[i]
                    }]
                ];

            let s = data[i]['d'] / Number.parseFloat(smecMax[prop['city']]['d']), //"ad":  总统计点数，"d": 总统计数/面积
                linear = d3.scaleLinear().domain([0, 1]).range([50, 100]),
                //speColor = d3.hcl(359, 90, linear(s)),
                speColor = d3.hcl(359, 90, 100),
                speColor1 = d3.hcl(0, 90, 100),
                speColor2 = d3.hcl(90, 90, 100),
                speColor3 = d3.hcl(150, 90, 100),
                speColor4 = d3.hcl(280, 90, 100);
            /*
        let s = data['d']/Number.parseFloat(smecMax[prop['city']]['d']),
        speColor = d3.hcl(359, 90, 100 - s*100),
        speColor1 = d3.hcl(0, 90, 100 - s*100),
        speColor2 = d3.hcl(90, 90, 100 - s*100),
        speColor3 = d3.hcl(180, 90, 100 - s*100),
        speColor4 = d3.hcl(270, 90, 100 - s*100);
        /*let s = data['d']/Number.parseFloat(smecMax[prop['city']]['d']),
            speColor = d3.hsl(359, s, 0.5),
            speColor1 = d3.hsl(0, s, 0.5),
            speColor2 = d3.hsl(90, s, 0.5),
            speColor3 = d3.hsl(120, s, 0.5),
            speColor4 = d3.hsl(270, s, 0.5);*/

            //console.log("speColor", speColor, "val", s);
            //console.log("speColor", speColor4, "val", s);
            // zoom 9: 2.5
            // 10: 2.25
            // 11: 2
            // 12: 1.75
            // 13: 1.5
            // 14: 1.25
            // 15: 1
            let mag = 1.0;
            if (this.map.getZoom() > 11) {
                mag = Math.pow(2.0, (this.map.getZoom() - 11));
            } else if (this.map.getZoom() < 11) {
                mag = Math.pow(0.5, (11 - this.map.getZoom()));
            }


            let r = data[i]['d'] / Number.parseFloat(smecMax[prop['city']]['d']),
                linear0 = d3.scaleLinear().domain([0, 1]).range([90 * mag, 180 * mag]),
                //r0 = linear0(r),
                r0 = 90 * mag,
                R0 = Math.sqrt(Math.pow(r0, 1 / 0.7)),
                r_max = Math.sqrt(Math.pow(linear0(1.0), 1 / 0.7));

            let r1 = data[i]['ar'] / Number.parseFloat(smecMax[prop['city']]['ar']),
                r2 = data[i]['pp'] / Number.parseFloat(smecMax[prop['city']]['pp']),
                r3 = data[i]['ap'] / Number.parseFloat(smecMax[prop['city']]['ap']),
                r4 = data[i]['pr'] / Number.parseFloat(smecMax[prop['city']]['pr']);

            let R5 = data[i]['d'] / Number.parseFloat(smecMax[prop['city']]['d']),
                linear1 = d3.scaleLinear().domain([0, 1]).range([0, 2]),
                R = linear1(R5),
                r5 = Math.sqrt(Math.pow(R, 1 / 0.7));

            let svg = overlay.append("svg").attr('id', prop['id'])
                .attr("width", width)
                .attr("height", height)
                .style("z-index", 999),
                config = {
                    w: width,
                    h: height,
                    maxValue: smecMax[prop['city']]['m'],
                    levels: 5,
                    speColor: speColor,
                    speColor1: speColor1,
                    speColor2: speColor2,
                    speColor3: speColor3,
                    speColor4: speColor4,
                    R0: R0,
                    r_max: r_max,
                    r1: r1,
                    r2: r2,
                    r3: r3,
                    r4: r4,
                    r5: r5,
                    TranslateX: ExtraLen * 1.8 / 2,
                    TranslateY: ExtraLen / 2,
                    ExtraWidthX: ExtraLen * 1.8,
                    ExtraWidthY: ExtraLen
                }

            RadarChart.draw(`#${prop['id']}`, rdata, config, 'd');

            self.map.on("viewreset", reset);
            reset();

            function reset() {
                let point = self.map.latLngToLayerPoint(new L.LatLng(data[i]['c'][1], data[i]['c'][0]));
                svg.style("left", (point.x - width / 2 - ExtraLen / 2) + "px")
                    .style("top", (point.y - height / 2 - ExtraLen / 2) + "px");
            }

        }
    }

    /**
     * AOI 绘制函数（普通）
     * @param  {[type]} data [description]
     * @param  {Object} prop [description]
     * @return {[type]}      [description]
     */
    aoisDrawing(data, prop = {}) {
        let self = this,
            overlay = d3.select(self.map.getPanes().overlayPane),
            Icon = L.Icon.extend({
                options: {
                    iconUrl: './css/images/marker-icon-red.png',
                    // iconSize: [25, 41],
                    shadowUrl: './css/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [18, 41],
                    popupAnchor: [0, -40],
                    shadowSize: [25, 41],
                    shadowAnchor: [12, 40]
                }
            });

        const colorSchema = '#FF0000',
            aoiid = `aoiCanvas${self.ides.mapid}`,
            boundid = `boundSVG${self.ides.mapid}`,
            radius = d3.scaleLinear().domain(d3.extent(data.map((v) => {
                return v['num'];
            }))).range([0, 100]);

        d3.select(`#${boundid}`).remove();
        d3.select(`#${aoiid}`).remove();
        this.aoiRemove();

        if (data.length === 0) {
            alert('No records found!')
            return;
        }

        let svg = overlay.append("svg").attr('id', aoiid),
            g = svg.append("g").attr("class", "leaflet-zoom-hide leaflet-aois-layer"),
            transform = d3.geoTransform({
                point: projectPoint
            }),
            path = d3.geoPath().projection(transform);

        let fdata = [];
        for (let i = data.length - 1; i >= 0; i--) {
            if (radius(data[i]['num']) < prop['thre']) {
                fdata.push({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [data[i]['geo'][1], data[i]['geo'][0]]
                    }
                })
            }
        }
        let pathDatasets = {
            "type": "FeatureCollection",
            "features": fdata
        }

        let feature = g.selectAll('path')
            .data(fdata)
            .enter().append("path")
            .attr('fill', 'red')
            .attr('stroke', 'red');
        self.map.on('moveend', reset);
        reset();

        function reset() {
            let bounds = path.bounds(pathDatasets),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr('width', bottomRight[0] - topLeft[0] + 10)
                .attr('height', bottomRight[1] - topLeft[1] + 10)
                .style('left', (topLeft[0] - 5) + 'px')
                .style('top', (topLeft[1] - 5) + 'px');

            g.attr('transform', 'translate(' + (5 - topLeft[0]) + ',' + (5 - topLeft[1]) + ')');

            feature.attr('d', path)
        };

        function projectPoint(x, y) {
            let point = self.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }


        // Large marker
        self.aoiLayers = new L.FeatureGroup();

        for (let i = data.length - 1; i >= 0; i--) {
            let num = data[i]['num'],
                r = radius(num);
            if (r < prop['thre']) {
                continue;
            }

            let marker = L.marker(new L.LatLng(data[i]['geo'][0], data[i]['geo'][1]), {
                icon: new Icon()
            });
            marker.bindPopup(prop['thre'] > 0 ? `<p>AOI Number: ${data[i]['num']}</p>` : `<p>POI: ${data[i]['name']}</p>`, {
                showOnMouseOver: true
            });

            marker.on('mouseover', function (e) {
                this.openPopup();
            })
            marker.on('mouseout', function (e) {
                this.closePopup();
            })

            self.aoiLayers.addLayer(marker);
        }

        self.map.addLayer(self.aoiLayers);
    }

    /**
     * aois 绘制函数（canvas）
     * @param  {[type]} data   [description]
     * @param  {[type]} idlist [description]
     * @param  {[type]} legend [description]
     * @return {[type]}        [description]
     */
    aoisCDrawing(data, prop = {}) {
        let self = this,
            overlay = d3.select(self.map.getPanes().overlayPane);

        const colorSchema = '#FF0000',
            aoiid = `aoiCanvas${self.ides.mapid}`,
            boundid = `boundSVG${self.ides.mapid}`,
            radius = d3.scaleLinear().domain(d3.extent(data.map((v) => {
                return v['num'];
            }))).range([2, 20]);

        d3.select(`#${boundid}`).remove();
        d3.select(`#${aoiid}`).remove();

        if (data.length === 0) {
            alert('No records found!')
            return;
        }

        // canvas 图层绘制方法
        let countVal = 0;
        let drawingOnCanvas = function (canvasOverlay, params) {
            let ctx = params.canvas.getContext('2d');
            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

            let len = data.length;
            for (let i = 0; i < len; i++) {
                let center = data[i],
                    node = center['geo'];

                countVal += 1;

                if (params.bounds.contains(node)) {
                    let c = canvasOverlay._map.latLngToContainerPoint(node);
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, radius(center['num']), 0, 2 * Math.PI);
                    ctx.fillStyle = "#ff0000";
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }

        self.aoiLayer = L.canvasOverlay()
            .drawing(drawingOnCanvas)
            .addTo(self.map);
    }

    aoiRemove() {
        if (this.aoiLayer) {
            this.map.removeLayer(this.aoiLayer);
            this.aoiLayer = null;
        }
        if (this.aoiLayers) {
            this.map.removeLayer(this.aoiLayers);
            this.aoiLayers = null;
        }
    }

    ClusterboundaryDrawing(data, prop, update = false) {
        
        let self = this,
            city = prop['city'],
            onlyBound = prop['boundary'],
            statsdata = stats[city],
            numid = self.ides.mapid.slice(-1),
            svgid = `boundSVG${self.ides.mapid}`,
            aoiid = `aoiCanvas${self.ides.mapid}`;

        this.switchLegDisplay('cltsld');

        if (!update) {
            console.log("first")
            this.setClusterBoundData(data);
        } else {
            console.log("second")
            data = this.getClusterBoundData();
        }

        this.metricsDrawing()

        // //console.log("data:" + JSON.stringify(data))
        // d3.select(`#${svgid}`).remove();
        // d3.select(`#${aoiid}`).remove();

        // let //color = d3.scaleLinear().domain([0, 14])
        //     //.range([ "rgba(255,255,255,0.9)", "rgba(255, 165, 0, 0.9)"]),
        //     color = ["rgba(255,0,0,0.5)", "rgba(255,69,0,0.5)", "rgba(160,32,240,0.5)", "rgba(255,215,0,0.5)", "rgba(255,255,0,0.5)",
        //         "rgba(154,205,50,0.5)", "rgba(173,255,47,0.5)", "rgba(0,255,0,0.5)", "rgba(139,69,19,0.5)", "rgba(127,255,212,0.5)", "rgba(0,206,209,0.5)", "rgba(0,191,255,0.5)", "rgba(30,144,255,0.5)", "rgba(255,165,0,0.5)", "rgba(255,20,147,0.5)"
        //     ],
        //     svg = d3.select(self.map.getPanes().overlayPane).append("svg").attr('id', svgid).style("z-index", 998),
        //     g = svg.append("g").attr("class", "leaflet-zoom-hide");

        // let transform = d3.geoTransform({
        //     point: projectPoint
        // }),
        //     path = d3.geoPath().projection(transform);

        // let feature = g.selectAll("path")
        //     .data(data.features)
        //     .enter().append("path")
        //     .attr('fill', function (d) {
        //         //console.log("d: " + JSON.stringify(d.properties))
        //         let num = d.properties.color;
        //         //console.log("num : " + num)
        //         return color[num];
        //     })
        //     .attr('stroke', 'gray')
        //     //.style("stroke-dasharray", "4 5")
        //     //.attr('fill', 'red')
        //     .attr("stroke-width", 0.9);

        // self.map.on("viewreset", reset);
        // reset();

        // // Reposition the SVG to cover the features.
        // function reset() {
        //     let bounds = path.bounds(data),
        //         topLeft = bounds[0],
        //         bottomRight = bounds[1];

        //     svg.attr("width", bottomRight[0] - topLeft[0])
        //         .attr("height", bottomRight[1] - topLeft[1])
        //         .style("left", topLeft[0] + "px")
        //         .style("top", topLeft[1] + "px");

        //     g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        //     feature.attr("d", path);
        // }

        // // Use Leaflet to implement a D3 geometric transformation.
        // function projectPoint(x, y) {
        //     let point = self.map.latLngToLayerPoint(new L.LatLng(y, x));
        //     //console.log("x: " + x)
        //     this.stream.point(point.x, point.y);
        // }
    }

    DistrictClusterDrawing(data, prop, update = false) {
        let self = this,
            city = prop['city'],
            onlyBound = prop['boundary'],
            statsdata = stats[city],
            numid = self.ides.mapid.slice(-1),
            svgid = `boundSVG${self.ides.mapid}`,
            aoiid = `aoiCanvas${self.ides.mapid}`;

        this.switchLegDisplay('disclsld');

        //console.log("data:" + JSON.stringify(data))
        d3.select(`#${svgid}`).remove();
        d3.select(`#${aoiid}`).remove();

        let //color = d3.scaleLinear().domain([0, 14])
            //.range([ "rgba(255,255,255,0.9)", "rgba(255, 165, 0, 0.9)"]),
            color = ["rgba(127,255,212,0.4)", "rgba(0,206,209,0.4)", "rgba(255,165,0,0.4)", "rgba(139,69,19,0.4)", "rgba(160,32,240,0.4)", "rgba(255,10,147,0.4)", "rgba(127,255,212,0.5)",
                "rgba(255,0,0,0.5)", "rgba(30,144,255,0.5)", "rgba(255,165,0,0.5)"
            ],
            svg = d3.select(self.map.getPanes().overlayPane).append("svg").attr('id', svgid).style("z-index", 998),
            g = svg.append("g").attr("class", "leaflet-zoom-hide");

        let transform = d3.geoTransform({
            point: projectPoint
        }),
            path = d3.geoPath().projection(transform);

        let feature = g.selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr('fill', function (d) {
                //console.log("d: " + JSON.stringify(d.properties))
                let num = d.properties.color;
                //console.log("num : " + num)
                return color[num];
            })
            .attr('stroke', 'gray')
            //.style("stroke-dasharray", "4 5")
            //.attr('fill', 'red')
            .attr("stroke-width", 0.9);

        let text = g.selectAll('text')
            .data(data.features)
            .enter().append('text')
            .style("font-family", "sans-serif")
            .style("font-size", "1rem")
            .attr("text-anchor", "middle")
            .text(function (d) {
                let name = d['properties']['english'];
                if (name) {
                    return name
                }
                return d['properties']['name'];
            })
            .attr('x', function (d) {
                let p = d['properties']['cp'];
                return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).x;
            })
            .attr('y', function (d) {
                let p = d['properties']['cp'];
                console.log("cp:  " + JSON.stringify(self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y + 40))
                return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y - 20;
            });

        self.map.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            let bounds = path.bounds(data),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

            feature.attr("d", path);

            text.data(data.features)
                .attr('x', function (d) {
                    let p = d['properties']['cp'];
                    return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).x;
                })
                .attr('y', function (d) {
                    let p = d['properties']['cp'];
                    return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y - 30;
                });
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            let point = self.map.latLngToLayerPoint(new L.LatLng(y, x));
            //console.log("x: " + x)
            this.stream.point(point.x, point.y);
        }
    }

    

    BubbleboundaryDrawing(data, prop, color_num, update = false) {
        let self = this,
            city = prop['city'],
            onlyBound = prop['boundary'],
            statsdata = stats[city],
            numid = self.ides.mapid.slice(-1),
            svgid = `boundSVG${self.ides.mapid}`,
            aoiid = `aoiCanvas${self.ides.mapid}`;

        //this.switchLegDisplay('bubblesld');

        if (!update) {
            console.log("first")
            this.setClusterBoundData(data);
        } else {
            console.log("second")
            data = this.getClusterBoundData();
        }

        //console.log("data:" + JSON.stringify(data))
        d3.select(`#${svgid}`).remove();
        d3.select(`#${aoiid}`).remove();

        let color = ["rgba(0,68,27,1)", "rgba(8,48,107,1)", "rgba(103,0,13,1)"],
            svg = d3.select(self.map.getPanes().overlayPane).append("svg").attr('id', svgid).style("z-index", 998),
            g = svg.append("g").attr("class", "leaflet-zoom-hide");

        let transform = d3.geoTransform({
            point: projectPoint
        }),
            path = d3.geoPath().projection(transform);

        let feature = g.selectAll("path")
            .data(data.features.filter(function(d,i){return d.properties.color == color_num;}))
            .enter().append("path")
            .attr('fill', 'rgb(255,255,255,0)')
            .attr('stroke', function (d) {
                let num = d.properties.color;
                return color[num];
            })
            .attr("stroke-width", 0.9);

        self.map.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            let bounds = path.bounds(data),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

            feature.attr("d", path);
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            let point = self.map.latLngToLayerPoint(new L.LatLng(y, x));
            //console.log("x: " + x)
            this.stream.point(point.x, point.y);
        }
    }

    boundaryDrawing(data, prop, update = false) {
        let self = this,
            city = prop['city'],
            type = extraInfoIndex(prop['etype']),
            onlyBound = prop['boundary'],
            statsdata = stats[city],
            numid = self.ides.mapid.slice(-1),
            svgid = `boundSVG${self.ides.mapid}`,
            aoiid = `aoiCanvas${self.ides.mapid}`;

        if (!update) {
            this.setBoundData(data);
        } else {
            data = this.getBoundData();
        }

        d3.select(`#${svgid}`).remove();
        if (onlyBound) {
            d3.select(`#${aoiid}`).remove();
        }

        if (!onlyBound) {
            this.clearLayers();
        }

        let range = d3.extent(Object.values(statsdata).map((val) => {
            return val[type];
        })),
            vmin = range[1] * prop['slider'][0] / 100.0,
            vmax = range[1] * prop['slider'][1] / 100.0,
            color = d3.scaleLinear().domain([vmin, vmax, range[1]])
                .range(["rgba(255,255,255,0.5)", "rgba(255, 0, 0, 0.9)", "rgba(255, 0, 0, 0.9)"]),
            svg = d3.select(self.map.getPanes().overlayPane).append("svg").attr('id', svgid).style("z-index", 998),
            g = svg.append("g").attr("class", "leaflet-zoom-hide");

        console.log('vmin', vmin, 'vmax', vmax);

        let transform = d3.geoTransform({
            point: projectPoint
        }),
            path = d3.geoPath().projection(transform);

        let feature = g.selectAll("path")
            .data(data.features)
            .enter().append("path")
            .attr('fill', function (d) {
                let name = d.properties.name,
                    val = statsdata[name][type];
                return onlyBound || val < vmin ? 'none' : color(val);
            });

        if (prop['revColor']) {
            feature.attr('stroke', 'blue')
                .attr("stroke-width", 1.2);
        } else {
            feature.attr('stroke', 'black')
                .style("stroke-dasharray", "4 5")
                .attr("stroke-width", 1.2);
        }

        if (!onlyBound) {
            feature.on("mouseover", function (d) {
                let name = d.properties.name;

                d3.select(`#carddistrict${numid}`).html(name);
                d3.select(`#cardenps${numid}`).html(statsdata[name][type]);
            })
                .on("mouseout", function (d) {
                    d3.select(`#carddistrict${numid}`).html('Null');
                    d3.select(`#cardenps${numid}`).html('Null');
                });

            self.drawGridLegend(`Content`, color);
        }

        let text = g.selectAll('text')
            .data(data.features)
            .enter().append('text')
            .style("font-family", "sans-serif")
            .style("font-size", "1rem")
            .attr("text-anchor", "middle")
            .text(function (d) {
                let name = d['properties']['english'];
                if (name) {
                    return name
                }
                return d['properties']['name'];
            })
            .attr('x', function (d) {
                let p = d['properties']['cp'];
                return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).x;
            })
            .attr('y', function (d) {
                let p = d['properties']['cp'];
                console.log("cp:  " + JSON.stringify(self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y + 40))
                return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y - 20;
            });

        self.map.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            let bounds = path.bounds(data),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

            feature.attr("d", path);
            text.data(data.features)
                .attr('x', function (d) {
                    let p = d['properties']['cp'];
                    return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).x;
                })
                .attr('y', function (d) {
                    let p = d['properties']['cp'];
                    return self.map.latLngToLayerPoint(new L.LatLng(p[1], p[0])).y;
                });
        }

        // Use Leaflet to implement a D3 geometric transformation.
        function projectPoint(x, y) {
            let point = self.map.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }
    }

    boundaryRemove() {
        console.log("fry hmap.js boundaryRemove")

        this.switchLegDisplay(null)

        // 删除行政边界图层
        let svgid = `boundSVG${this.ides.mapid}`;
        d3.select(`#${svgid}`).remove();

        // 删除 AOI 图层
        if (this.aoiLayers) {
            this.map.removeLayer(this.aoiLayers);
            this.aoiLayers = null;
        }
        d3.selectAll('.leaflet-aois-layer').remove();

        // 删除 radar chart 图层
        d3.selectAll('.leaflet-radarchart').remove();

        d3.selectAll('.leaflet-flower').remove();
        //d3.selectAll('.leaflet-zoom-hide').remove();

        d3.selectAll('.model').remove();
    }

    /**
     * 用 canvas 绘制 gridmap, 提供从本地或者远程获取数据两种绘制方式
     * @param  {[type]} data [description]
     * @param  {[type]} prop [description]
     * @return {[type]}      [description]
     */

    mapgridCDrawing(data, prop, update = false, split = false, random = false) {
        // update为false表示当前执行重绘操作, update为true则从实例中调用历史数据进行绘制
        if (!update) {
            this.setGridData(data);
        } else {
            data = this.getGridData();
        }
        this.setGridDataType(prop['prop']['drawtype']);

        let self = this;
        const drawtype = prop['prop']['drawtype'],
            resprop = data['prop'],
            SPLITNUMBER = 4;

        // updated color scale
        let begVal = 0,
            minVal = prop[drawtype]['min'],
            maxVal = prop[drawtype]['max'],
            //endVal = prop[drawtype]['scales'],
            endVal = prop[drawtype]['max'],
            maxRate = maxVal / endVal,
            minRate = minVal / endVal,
            colordomain = [minVal, maxVal, endVal],
            ledcolordomain = [minRate, maxRate, 1],
            colorrange = ['rgba(255,255,255,0)', 'rgba(255,0,0,1)', 'rgba(255,0,0,1)']

        // 
        if (prop['prop']['maprev']) {
            colorrange = ['rgba(255,0,0,1)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)']
        }

        let color = d3.scaleLinear().domain(colordomain).range(colorrange),
            legColor = d3.scaleLinear().domain(ledcolordomain).range(colorrange);

        this.clearLayers();
        console.log('Begin to draw gridmap based on received data.');
        console.time('DRAWING');

        // canvas 图层绘制方法
        let countVal = 0;
        let drawingOnCanvas = function (canvasOverlay, params) {
            let ctx = params.canvas.getContext('2d');
            ctx.clearRect(0, 0, params.canvas.width, params.canvas.height);

            let len = data.features.length;
            for (let i = 0; i < len; i++) {

                let feature = data.features[i],
                    poly = feature.geometry.coordinates[0],
                    center = feature['prop']['c'], // center
                    evalue = feature['prop']['e'], // entropy value
                    dvalue = feature['prop']['d']; // density value

                // 根据 filter 值及选中类型进行过滤
                if (outOfRange(drawtype, evalue, dvalue, prop['e']['min'], prop['d']['min'])) {
                    continue;
                }
                countVal += 1;

                if (params.bounds.contains([center[1], center[0]])) {
                    if (split) {
                        let subgrids = getSubGrids(poly, center, SPLITNUMBER)

                        for (let subind = SPLITNUMBER - 1; subind >= 0; subind--) {

                            let nw = canvasOverlay._map.latLngToContainerPoint(subgrids[subind]['nw']),
                                se = canvasOverlay._map.latLngToContainerPoint(subgrids[subind]['se']);
                            ctx.fillStyle = color(feature['prop'][drawtype] * (1 + Math.random() * 0.3)),
                                ctx.fillRect(nw.x, nw.y, Math.abs(se.x - nw.x), Math.abs(se.y - nw.y));
                        }
                    } else {
                        let nw = canvasOverlay._map.latLngToContainerPoint([poly[3][1], poly[3][0]]),
                            se = canvasOverlay._map.latLngToContainerPoint([poly[1][1], poly[1][0]]);
                        ctx.fillStyle = color(feature['prop'][drawtype]),
                            ctx.fillRect(nw.x, nw.y, Math.abs(se.x - nw.x), Math.abs(se.y - nw.y));
                    }
                }
            }
        }

        console.log('Gridmap Used Feature Number ', countVal);
        self.drawGridLegend(`Content ${getPropName(drawtype)}`, legColor);

        console.log('Finished gridmap drawing.');
        console.timeEnd('DRAWING');

        self.gridmapLayer = L.canvasOverlay()
            .drawing(drawingOnCanvas)
            .addTo(self.map);
    }

    /**
     * 利用 contour 方式绘制 heatmap,使绘制出的结果较 gridmap 连续
     * @param  {[type]} data [description]
     * @param  {[type]} prop [description]
     * @return {[type]}      [description]
     */
    mapcontourCDrawing(data, prop, update = false) {
        // update为false表示当前执行重绘操作, update为true则从实例中调用历史数据进行绘制
        //console.log("data:" +  JSON.stringify(data.features[0]))
        this.switchLegDisplay('ctrleg');

        if (!update) {
            this.setGridData(data);
        } else {
            data = this.getGridData();
        }
        this.setGridDataType(prop['prop']['drawtype']);

        console.log('Drawtype: ', prop['prop']['drawtype'], 'Update: ', update);

        const drawtype = prop['prop']['drawtype'],
            resprop = data['prop'],
            SPLITNUMBER = 4;

        // updated color scale
        let begVal = 0,
            minVal = prop[drawtype]['min'],
            maxVal = prop[drawtype]['max'],
            endVal = prop[drawtype]['max'],
            //maxRate = maxVal / endVal,
            //minRate = minVal / endVal,
            judRate = Number.parseFloat((maxVal - minVal) / (endVal - minVal));
        //judRate = Number.parseFloat((prop['d']['number'] - prop['e']['number']) / (100 - prop['e']['number']));

        console.log("judRate      : " + JSON.stringify(judRate))

        let len = data.features.length,
            hdata = {
                max: maxVal,
                min: minVal,
                data: []
            };

        this.clearLayers();

        let countVal = 0;
        console.log("len=" + len)

        for (let i = len - 1; i >= 0; i--) {
            let feature = data.features[i],
                evalue = feature['prop']['e'], //网格具体的值
                dvalue = feature['prop']['d'],
                center = data.features[i]['prop']['c'];


            // 根据 filter 值及选中类型进行过滤
            // if (outOfRange(drawtype, evalue, dvalue, prop['e']['min'], prop['d']['min'])) {
            //     continue;
            // }
            countVal += 1;

            // 为 hdata 注入数据
            hdata.data.push({
                'lat': center[1],
                'lng': center[0],
                'c': feature['prop'][drawtype]
            })
            //hdata.data.push({ 'lat': center[1], 'lng': center[0], 'c': len - i }) 
        }

        console.log('Drawtype: ', drawtype, 'Contourmap Used point number', countVal);

        let clr_trans = 'rgba(255,255,255,0)';
        let clr_red = 'rgba(255,0,0,1)';
        let clr_yl = 'rgba(255,255,0,1)';

        let cfg = {
            // radius should be small ONLY if scaleRadius is true (or small radius is intended)
            // if scaleRadius is false it will be the constant radius used in pixels
            "radius": prop['prop']['radius'],
            "maxOpacity": prop['prop']['opacity'],
            "minOpacity": prop['prop']['opacity'],
            // scales the radius based on map zoom
            "scaleRadius": true,
            "gradient": {
                '0': clr_trans
            },
            //   (there will always be a red spot with useLocalExtremas true)
            "useLocalExtrema": prop['prop']['useLocalExtrema'],
            "latField": 'lat',
            "lngField": 'lng',
            "valueField": 'c'
        };

        if (minVal == maxVal) {
            cfg.gradient['1'] = clr_red;
        } else if (prop['prop']['rev']) {
            cfg.gradient['0'] = clr_red;
            cfg.gradient['.3'] = clr_red;
            cfg.gradient['.95'] = clr_yl;
            cfg.gradient['1.0'] = clr_trans;
        } else {
            cfg.gradient['.3'] = clr_yl;
            cfg.gradient['1.0'] = clr_red;
        }

        console.log("gradients   : " + JSON.stringify(cfg.gradient))
        this.heatmapLayer = new HeatmapOverlay(cfg);
        this.map.addLayer(this.heatmapLayer);
        this.heatmapLayer.setData(hdata)

        //this.metricsDrawing()
    }

    mapcontourCDrawing_bubble(data, prop, update = false) {
        // update为false表示当前执行重绘操作, update为true则从实例中调用历史数据进行绘制
        // console.log("data:" +  JSON.stringify(data.features[0]))
        this.switchLegDisplay('ctrleg');

        if (!update) {
            this.setGridData(data);
        } else {
            data = this.getGridData();
        }
        this.setGridDataType(prop['prop']['drawtype']);

        console.log('Drawtype: ', prop['prop']['drawtype'], 'Update: ', update);

        const drawtype = prop['prop']['drawtype'],
            resprop = data['prop'],
            SPLITNUMBER = 4;

        // updated color scale
        let begVal = 0,
            minVal = prop[drawtype]['min'],
            maxVal = prop[drawtype]['max'],
            endVal = prop[drawtype]['max'],
            //maxRate = maxVal / endVal,
            //minRate = minVal / endVal,
            judRate = Number.parseFloat((maxVal - minVal) / (endVal - minVal));
        //judRate = Number.parseFloat((prop['d']['number'] - prop['e']['number']) / (100 - prop['e']['number']));

        console.log("judRate      : " + JSON.stringify(judRate))

        let len = data.features.length

        // Input data for bubble set layer
        let bubbleSetData = {
            max: maxVal,
            min: minVal,
            data: [[], [], []]
        }

        let countVal = 0, bubble_countVal_0 = 0, bubble_countVal_1 = 0, bubble_countVal_2 = 0;

        for (let i = len - 1; i >= 0; i--) {
            let feature = data.features[i],
                evalue = feature['prop']['e'], //网格具体的值
                dvalue = feature['prop']['d'],
                center = data.features[i]['prop']['c'];

            if (feature['prop'][drawtype] > prop['prop']['min_show']) {
                // 根据 filter 值及选中类型进行过滤
                // if (outOfRange(drawtype, evalue, dvalue, prop['e']['min'], prop['d']['min'])) {
                //     continue;
                // }
                countVal += 1;

                // 为 hdata 注入数据
                let idx = feature['prop']['num'];
                if (idx == 0) { bubble_countVal_0 += 1; }
                else if (idx == 1) { bubble_countVal_1 += 1; }
                else if (idx == 2) { bubble_countVal_2 += 1; }
                bubbleSetData['data'][idx].push({
                    'lat': center[1],
                    'lng': center[0],
                    'c': feature['prop'][drawtype]
                })
            }
        }
        console.log("bubble_countVal_0: ", bubble_countVal_0)
        console.log("bubble_countVal_1: ", bubble_countVal_1)
        console.log("bubble_countVal_2: ", bubble_countVal_2)
        console.log('Drawtype: ', drawtype, 'Contourmap Used point number', countVal);

        let cfg = {
            // radius should be small ONLY if scaleRadius is true (or small radius is intended)
            // if scaleRadius is false it will be the constant radius used in pixels
            "radius": prop['prop']['radius'],
            //"maxOpacity": 0.5,//prop['prop']['opacity'],
            //"minOpacity": 0.5,//prop['prop']['opacity'],
            // scales the radius based on map zoom
            "scaleRadius": true,
            // (there will always be a red spot with useLocalExtremas true)
            "useLocalExtrema": prop['prop']['useLocalExtrema'],
            "useGradientOpacity": true,
            "latField": 'lat',
            "lngField": 'lng',
            "valueField": 'c',

            "gradient": [
                {
                    '0': undefined,
                    '1': undefined
                },
                {
                    '0': undefined,
                    '1': undefined
                },
                {
                    '0': undefined,
                    '1': undefined
                }
            ]
        }


        for (var svg_num = 0; svg_num < 3; svg_num++) {
            let clr_trans, clr_red, clr_yl

            if (svg_num == 1) {
                clr_trans = 'rgba(229,245,224,0.5)';
                clr_red = 'rgba(0,68,27,1)';
                clr_yl = 'rgba(65,171,93,1)';
            }
            if (svg_num == 0) {
                clr_trans = 'rgba(222,235,247,0.5)';
                clr_red = 'rgba(8,48,107,0.8)';
                clr_yl = 'rgba(66,146,198,0.8)';
            }
            if (svg_num == 2) {
                clr_trans = 'rgba(254,224,210,0.5)';
                clr_red = 'rgba(103,0,13,0.6)';
                clr_yl = 'rgba(239,59,44,0.6)';
            }

            cfg.gradient[svg_num]['1'] = clr_red;
            cfg.gradient[svg_num]['0'] = clr_trans;

            if (minVal == maxVal) {
                cfg.gradient[svg_num]['1'] = clr_red;
            } else if (prop['prop']['rev']) {
                cfg.gradient[svg_num]['0'] = clr_red;
                cfg.gradient[svg_num]['.3'] = clr_red;
                cfg.gradient[svg_num]['.95'] = clr_yl;
                cfg.gradient[svg_num]['1'] = clr_trans;
            } else {
                cfg.gradient[svg_num]['.3'] = clr_yl;
                cfg.gradient[svg_num]['.7'] = clr_red;
            }
        }

        console.log("gradients   : " + JSON.stringify(cfg.gradient));

        this.bubbleSetOverlay = new BubbleSetOverlay(cfg);
        this.bubbleSetOverlay.setData(bubbleSetData);
        this.map.addLayer(this.bubbleSetOverlay);
    }

    BubbleContourDraw(data,prop,update=false) { 
        console.log("fry BubbleContourDraw")
        console.log(data)
        if (!update) {
            console.log("first")
            this.setBubbleContourData(data);
        } else {
            console.log("second")
            data = this.getBubbleContourData();
        }


        // 加入一层数据
        this.bbcontourLayer_1 = L.geoJson(data.features[0],{style:data.features[0].properties})
        this.map.addLayer(this.bbcontourLayer_1)
    

        this.bbcontourLayer_2 = L.geoJson(data.features[1],{style:data.features[1].properties})
        this.map.addLayer(this.bbcontourLayer_2)

        this.bbcontourLayer_3 = L.geoJson(data.features[2],{style:data.features[2].properties})
        this.map.addLayer(this.bbcontourLayer_3)

        this.bbcontourLayer_4 = L.geoJson(data.features[3],{style:data.features[3].properties})
        this.map.addLayer(this.bbcontourLayer_4)
    

        this.bbcontourLayer_5 = L.geoJson(data.features[4],{style:data.features[4].properties})
        this.map.addLayer(this.bbcontourLayer_5)

        this.bbcontourLayer_6 = L.geoJson(data.features[5],{style:data.features[5].properties})
        this.map.addLayer(this.bbcontourLayer_6)

        this.bbcontourLayer_7 = L.geoJson(data.features[6],{style:data.features[6].properties})
        this.map.addLayer(this.bbcontourLayer_7)

    }

    splatterDraw(data,prop,update=false){
        console.log("fry splatterDraw")
        console.log(data)
        if (!update) {
            console.log("first")
            this.setBubbleContourData(data);
        } else {
            console.log("second")
            data = this.getBubbleContourData();
        }

        // 加入单独的数据层
        layer_0 = L.tileLayer.maskCanvas({
            radius: 5,  // radius in pixels or in meters (see useAbsoluteRadius)
            useAbsoluteRadius: true,  // true: r in meters, false: r in pixels
            color: '#f44',  // the color of the layer
            opacity: 0.5,  // opacity of the not covered area
            noMask: true,  // true results in normal (filled) circled, instead masked circles
            lineColor: '#A00'   // color of the circle outline if noMask is true
        })
        layer_0.setData(data[0])
        this.map.addLayer(layer_0)




    }

    mapcontourCDrawing_bubble_overlap(data, prop, update = false) {
        var _this = this;
        this._bubbleOverlapDrawing(data, prop, update);
        this._createHelper(data, prop);

        this.map.on('zoomend', function (e) {
            _this._createHelper(data, prop);
        });

        this.map.on('moveend', function(e) {
            _this._createHelper(data, prop);
        });
    }

    // Create helper for overlap interaction
    _createHelper(data, prop) {
        // sort function
        var _sortWithIndices = function (toSort) {
            for (var i = 0; i < toSort.length; i++) {
                toSort[i] = [toSort[i], i];
            }
            toSort.sort(function (left, right) {
                return left[0] < right[0] ? -1 : 1;
            });
            toSort.sortIndices = [];
            for (var j = 0; j < toSort.length; j++) {
                toSort.sortIndices.push(toSort[j][1]);
                toSort[j] = toSort[j][0];
            }
            return toSort;
        };

        var leftmost = function (arr, value, min, max) {
            if (min == max) return min;
            let mid = Math.floor((min + max) / 2);

            if (arr[mid] < value) return leftmost(arr, value, mid + 1, max);
            else return leftmost(arr, value, min, mid);
        }

        var rightmost = function (arr, value, min, max) {
            if (min == max) return min;
            let mid = Math.ceil((min + max + 1) / 2);

            if (arr[mid] > value) return rightmost(arr, value, min, mid - 1);
            else return rightmost(arr, value, mid, max);
        }

        // Reset
        d3.select('#helper-container').remove();

        var _this = this;

        const drawtype = prop['prop']['drawtype']
        let radius = prop['prop']['radius'];
        const radiusMultiplier = Math.pow(2, this.map.getZoom());
        radius = radius * radiusMultiplier;

        const bounds = this.map.getBounds();

        const len = data.features.length;
        let helperInfo = new Array();

        for (let i = len - 1; i >= 0; i--) {
            let feature = data.features[i],
                center = data.features[i]['prop']['c'];

            let latlng = new L.LatLng(center[1], center[0]);
            if (feature['prop'][drawtype] > prop['prop']['min_show'] && bounds.contains(latlng)) {
                let point = this.map.latLngToLayerPoint(latlng);
                helperInfo.push([point.x, point.y, feature['prop']['num'], feature['prop'][drawtype]])
            }
        }

        const sortedX = _sortWithIndices(helperInfo.map(function (v) { return v[0] }));
        const sortedY = _sortWithIndices(helperInfo.map(function (v) { return v[1] }));

        const overlayPane = d3.select(this.map.getPanes().overlayPane);
        const helper = overlayPane.append("svg")
            .attr('id', 'helper-container')
            .style("position", "absolute")
            .style('overflow', 'visible')
            .style("z-index", 999);

        // Create transparent helper
        helper.selectAll(".helper")
            .data(helperInfo)
            .enter()
            .append("circle")
            .attr("cx", function (d, i) {
                return d[0];
            })
            .attr("cy", function (d, i) {
                return d[1];
            })
            .attr("r", radius)
            .style("opacity", 0)
            .style("cursor", "pointer")
            .on('click', function (d) {
                let x = d[0],
                    y = d[1];
                let xLeft = leftmost(sortedX, x - radius, 0, sortedX.length - 1);
                let xRight = rightmost(sortedX, x + radius, 0, sortedX.length - 1);
                let yLeft = leftmost(sortedY, y - radius, 0, sortedY.length - 1);
                let yRight = rightmost(sortedY, y + radius, 0, sortedY.length - 1);

                let possibleIndices = sortedX.sortIndices.slice(xLeft, xRight + 1);
                possibleIndices.concat(sortedY.sortIndices.slice(yLeft, yRight + 1));

                let maxValue = -1;
                let maxLayerIdx = undefined;
                for (let i = 0; i < possibleIndices.length; i++) {
                    let idx = possibleIndices[i];
                    let x2 = helperInfo[idx][0];
                    let y2 = helperInfo[idx][1];
                    let layerIdx = helperInfo[idx][2];
                    let value = helperInfo[idx][3];

                    if ((x - x2) * (x - x2) + (y - y2) * (y - y2) <= radius * radius && value > maxValue) {
                        maxValue = value;
                        maxLayerIdx = layerIdx;
                    }
                }

                if (maxLayerIdx == 0) {
                    _this.map.removeLayer(_this.heatmapLayer);
                    _this.map.addLayer(_this.heatmapLayer);
                }
                if (maxLayerIdx == 1) {
                    _this.map.removeLayer(_this.heatmapLayer_1);
                    _this.map.addLayer(_this.heatmapLayer_1);
                }
                if (maxLayerIdx == 2) {
                    _this.map.removeLayer(_this.heatmapLayer_2);
                    _this.map.addLayer(_this.heatmapLayer_2);
                }
				
				_this.boundaryRemove();
				let prop = {
					'city': 'bj',
					'boundary': true
				};
				_this.switchLegDisplay('bubblesld');
				_this.BubbleboundaryDrawing({}, prop, maxLayerIdx, true)
            });
    }

    _bubbleOverlapDrawing(data, prop, update = false) {
        // update为false表示当前执行重绘操作, update为true则从实例中调用历史数据进行绘制
        //console.log("data:" +  JSON.stringify(data.features[0]))

        // data是后台传送回来的grid数据，分别有两个部分：
        // features: 存储了一个若干长的数组，数组中的每个元素代表一个数据点
        // prop: 存储了一些参数信息

        if (!update) {
            this.switchLegDisplay('ctrleg');
            this.setGridData(data);
        } else {
            data = this.getGridData();
        }
        this.setGridDataType(prop['prop']['drawtype']);
        console.log('Drawtype: ', prop['prop']['drawtype'], 'Update: ', update);

        const drawtype = prop['prop']['drawtype'],
            resprop = data['prop'],
            SPLITNUMBER = 4;

        // updated color scale
        let begVal = 0,
            minVal = prop[drawtype]['min'],
            maxVal = prop[drawtype]['max'],
            endVal = prop[drawtype]['max'],
            //maxRate = maxVal / endVal,
            //minRate = minVal / endVal,
            judRate = Number.parseFloat((maxVal - minVal) / (endVal - minVal));
        //judRate = Number.parseFloat((prop['d']['number'] - prop['e']['number']) / (100 - prop['e']['number']));

        console.log("judRate      : " + JSON.stringify(judRate))

        //这里把所有的grid分为 3 类，也就是 高/中/低 三类
        let len = data.features.length,
            data_0 = {
                max: maxVal,
                min: minVal,
                data: []
            },
            data_1 = {
                max: maxVal,
                min: minVal,
                data: []
            },
            data_2 = {
                max: maxVal,
                min: minVal,
                data: []
            };


        let countVal = 0, 
            bubble_countVal_0 = 0, 
            bubble_countVal_1 = 0, 
            bubble_countVal_2 = 0;

        
        // 遍历所有的 grid
        for (let i = len - 1; i >= 0; i--) {

            let feature = data.features[i],
                evalue = feature['prop']['e'], //网格具体的值
                dvalue = feature['prop']['d'],
                center = data.features[i]['prop']['c']; // grid的中间点坐标

            // 根据 filter 值及选中类型进行过滤
            // if (outOfRange(drawtype, evalue, dvalue, prop['e']['min'], prop['d']['min'])) {
            //     continue;
            // }
            countVal += 1;

            // 过滤掉 没达到最小显示标准的数据grid，默认值是0，即全部显示
            if (feature['prop'][drawtype] > prop['prop']['min_show']) {
                // 为 hdata 注入数据
                // 根据feature.prop.num来判断种类，看来num值在后台是一个经过处理的值
                if (feature['prop']['num'] == 0) {
                    bubble_countVal_0 += 1;
                    data_0.data.push({
                        'lat': center[1],
                        'lng': center[0],
                        'c': feature['prop'][drawtype]
                    })
                }
                else if (feature['prop']['num'] == 1) {
                    bubble_countVal_1 += 1;
                    data_1.data.push({
                        'lat': center[1],
                        'lng': center[0],
                        'c': feature['prop'][drawtype]
                    })
                }
                else if (feature['prop']['num'] == 2) {
                    bubble_countVal_2 += 1;
                    data_2.data.push({
                        'lat': center[1],
                        'lng': center[0],
                        'c': feature['prop'][drawtype]
                    })
                }
            }
        }
        console.log("overlap_countVal_0: ", bubble_countVal_0)
        console.log("overlap_countVal_1: ", bubble_countVal_1)
        console.log("overlap_countVal_2: ", bubble_countVal_2)
        console.log('Drawtype: ', drawtype, 'Contourmap Used point number', countVal);


        for (var svg_num = 0; svg_num < 3; svg_num++) {
            let clr_trans = '';
            let clr_red = '';
            let clr_yl = '';

            if (svg_num == 0){
                clr_trans = 'rgba(222,235,247,0.5)';
                clr_red = 'rgba(8,48,107,0.5)';//蓝色
                clr_yl = 'rgba(66,146,198,0.5)';
            }else if (svg_num == 1){
                clr_trans = 'rgba(229,245,224,0.5)';
                clr_red = 'rgba(0,68,27,0.8)';//绿色
                clr_yl = 'rgba(65,171,93,0.8)';
            }else if (svg_num == 2){
                clr_trans = 'rgba(254,224,210,0.5)';
                clr_red = 'rgba(103,0,13,0.5)';//红色
                clr_yl = 'rgba(239,59,44,0.5)';
            }

            let cfg = {
                // radius should be small ONLY if scaleRadius is true (or small radius is intended)
                // if scaleRadius is false it will be the constant radius used in pixels
                "radius": prop['prop']['radius'],
                //"maxOpacity": 0.5,//prop['prop']['opacity'],
                //"minOpacity": 0.5,//prop['prop']['opacity'],
                // scales the radius based on map zoom
                "scaleRadius": true,
                "gradient": {
                    '0': clr_trans,
                    '1': clr_red
                },
                //   (there will always be a red spot with useLocalExtremas true)
                "useLocalExtrema": prop['prop']['useLocalExtrema'],
                "useGradientOpacity": true,
                "opaque": true,
                "latField": 'lat',
                "lngField": 'lng',
                "valueField": 'c'
            };

            if (minVal == maxVal) {
                cfg.gradient['1'] = clr_red;
            } else if (prop['prop']['rev']) {
                cfg.gradient['0'] = clr_red;
                cfg.gradient['.3'] = clr_red;
                cfg.gradient['.95'] = clr_yl;
                cfg.gradient['1.0'] = clr_trans;
            } else {
                cfg.gradient['.3'] = clr_yl;
                cfg.gradient['.7'] = clr_red;
            }

            console.log("gradients   : " + JSON.stringify(cfg.gradient))

            
            if (svg_num == 0) {
                this.heatmapLayer = new HeatmapOverlay(cfg);
                this.map.addLayer(this.heatmapLayer);
                this.heatmapLayer.setData(data_0);
            }
            else if (svg_num == 1) {
                this.heatmapLayer_1 = new HeatmapOverlay(cfg);
                this.map.addLayer(this.heatmapLayer_1);
                this.heatmapLayer_1.setData(data_1);
            }
            else if (svg_num == 2) {
                this.heatmapLayer_2 = new HeatmapOverlay(cfg);
                this.map.addLayer(this.heatmapLayer_2);
                this.heatmapLayer_2.setData(data_2);
            }
        }
    }


    /**
     * 绘制地图中的参考图标(图中指示4个方块）
     * @param  {String} title [description]
     * @param  {Array}  scale [description]
     * @param  {[type]} 100]  [description]
     * @return {[type]}       [description]
     */
    drawGridLegend(title = 'entropy', linear) {
        this.switchLegDisplay('grdleg');

        let id = `#${this.ides.grdleg}`;

        d3.select(id).selectAll('*').remove();
        let svg = d3.select(id).attr('height', 50);

        svg.append("g")
            .attr("class", "legendLinear");

        let legendLinear = legendColor()
            .labelFormat(function (d) {
                console.log("dddddddddd: " + d)
                if (d <= 100) {
                    return `${(d).toFixed(2)}`;
                    //return `${Number.parseInt(d*100)}%`
                } else {
                    return `${(d / 1000.0).toFixed(1)}K`;
                }
            })
            .cells(4)
            .shapeWidth(33)
            .orient('horizontal')
            .scale(linear);

        svg.select(".legendLinear")
            .call(legendLinear);
    }

    /**
     * 根据 contour 的标题以及 scale 定制绘制 legend
     * @param  {[type]} title [description]
     * @param  {[type]} scale [description]
     * @return {[type]}       [description]
     */
    drawContourLegend(title = "Contour Legend", gradientCfg) {
        this.switchLegDisplay('ctrleg');

        let container = document.getElementById(this.ides.ctrleg),
            svg = d3.select(`#${this.ides.ctrleg}`),
            legCanvas = document.createElement('canvas');
        legCanvas.width = 125;
        legCanvas.height = 15;

        svg.selectAll('*').remove();
        let g = svg.append('svg')
            .attr('height', 20);

        g.append('text')
            .attr('y', 13)
            .attr('x', 2)
            .text('0%');
        g.append('text')
            .attr('y', 13)
            .attr('x', 105)
            .text('100%');

        let gradientImg = document.createElement("img"),
            legCtx = legCanvas.getContext('2d'),
            gradient = legCtx.createLinearGradient(0, 0, 100, 1);

        for (let key in gradientCfg) {
            gradient.addColorStop(Number.parseFloat(key), gradientCfg[key]);
        }

        legCtx.fillStyle = gradient;
        legCtx.fillRect(0, 0, 125, 15);

        gradientImg.src = legCanvas.toDataURL();
        container.insertBefore(gradientImg, container.childNodes[0]);
    }

    /**
     * [panTo description]
     * @param  {[lat, lng]} point [description]
     * @return {[type]}       [description]
     */
    panTo(point) {
        this.map.panTo(L.latLng(point[0], point[1]))
    }

    panBy(point) {
        this.map.panBy(L.point(point[0], point[1]))
    }

    setView(lat = 39.914, lng = 116.39, zoom = 11) {
        this.map.setView(L.latLng(lat, lng), zoom)
    }

    /**
     * 删除所有附加可视化图层
     * @return {[type]} [description]
     */
    clearLayers() {
        console.log(this.bubbleSetOverlay)

        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
            this.heatmapLayer = null;
        }
        if (this.heatmapLayer_1) {
            this.map.removeLayer(this.heatmapLayer_1);
            this.heatmapLayer_1 = null;
        }
        if (this.heatmapLayer_2) {
            this.map.removeLayer(this.heatmapLayer_2);
            this.heatmapLayer_2 = null;
        }
        if (this.bubbleSetOverlay) {
            this.map.removeLayer(this.bubbleSetOverlay);
            this.bubbleSetOverlay = null;
        }
        if (this.gridmapLayer) {
            this.map.removeLayer(this.gridmapLayer);
            this.gridmapLayer = null;
        }
        if (this.areaSelector) {
            this.map.removeLayer(this.areaSelector);
            this.areaSelector = null;
        }
        if (this.bbcontourLayer_1) {
            this.map.removeLayer(this.bbcontourLayer_1);
            this.bbcontourLayer_1 = null;
        }
        if (this.bbcontourLayer_2) {
            this.map.removeLayer(this.bbcontourLayer_2);
            this.bbcontourLayer_2 = null;
        }
        if (this.bbcontourLayer_3) {
            this.map.removeLayer(this.bbcontourLayer_3);
            this.bbcontourLayer_3 = null;
        }
        if (this.bbcontourLayer_4) {
            this.map.removeLayer(this.bbcontourLayer_4);
            this.bbcontourLayer_4 = null;
        }
        if (this.bbcontourLayer_5) {
            this.map.removeLayer(this.bbcontourLayer_5);
            this.bbcontourLayer_5 = null;
        }
        if (this.bbcontourLayer_6) {
            this.map.removeLayer(this.bbcontourLayer_6);
            this.bbcontourLayer_6 = null;
        }
        if (this.bbcontourLayer_7) {
            this.map.removeLayer(this.bbcontourLayer_7);
            this.bbcontourLayer_7 = null;
        }
        //  d3.selectAll('.leaflet-zoom-hide').remove();
    }

    /**
     * 切换不同 legend 的图层显示
     * @param  {[type]} cfg [description]
     * @return {[type]}     [description]
     */
    switchLegDisplay(cfg) {
        console.log("fry hmap.js switchLegDisplay cfg=",cfg)

        for (let key in this.ides) {
            console.log("this.ides: " + key)
            if (key === 'mapid' || key === 'baselyr') {
                continue;
            }

            let val = this.ides[key];
            console.log("vals:" + val)
            console.log("cfg:" + cfg)
            if (key !== cfg) {
                let el = document.getElementById(val);
                if (el) {
                    el.style.display = 'none';
                    //el.style.display = 'inline';
                }
            } else {
                let el = document.getElementById(val);
                if (el) {
                    el.style.display = 'inline';
                }
            }
        }
    }

}

export default mapview