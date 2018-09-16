/**
 * init.js
 * @authors Joe Jiang (hijiangtao@gmail.com)
 * @date    2017-03-05 16:10:49
 * @version $Id$
 */

'use strict'

const settings = {
    // 'whiteToRed': '-webkit-gradient(linear, 0 0, 100% 0, from(white), to(red))'
    // 与实际设置不同,因为有遮挡所以微调过
    //'whiteToRed': '-webkit-linear-gradient(left, #ffffff 0%,#0000ff 25%,#00ff00 45%,#ffff00 70%,#ff0000 100%)' //白、蓝、绿、黄、红滑动条
    //'whiteToRed': '-webkit-linear-gradient(left, #ffffff 0%,#00ff00 30%,#ffff00 55%,#ff0000 100%)'//白、绿、黄、红滑动条
    'whiteToRed': '-webkit-linear-gradient(left, #ffffff 0%, #ffff00 40%,#ff0000 100%)' //白黄红滑动条
}

/**
 * 储存四个城市图标及属性信息
 * @type {Array}
 */
const regions = [{
        'name': 'Beijing',
        'val': 'bj',
        'aurl': '/assets/bj-aicon.png',
        'nurl': '/assets/bj-icon.png'
    },
    {
        'name': 'Tianjin',
        'val': 'tj',
        'aurl': '/assets/tj-aicon.png',
        'nurl': '/assets/tj-icon.png'
    },
    {
        'name': 'Zhangjiakou',
        'val': 'zjk',
        'aurl': '/assets/zjk-aicon.png',
        'nurl': '/assets/zjk-icon.png'
    },
    {
        'name': 'Tangshan',
        'val': 'ts',
        'aurl': '/assets/ts-aicon.png',
        'nurl': '/assets/ts-icon.png'
    }
]

let home = {
    'params': {
        /**
         * region object
         */
        'regions': regions,
        /**
         * entropy types
         */
        'etypes': [{
                'name': 'Fluidity',
                'val': 'rd'
            },
            {
                'name': 'vibrAncy',
                'val': 'pp'
            },
            {
                'name': 'Commutation',
                'val': 'pd'
            },
            {
                'name': 'divErsity',
                'val': 'rp'
            },
            {
                'name': 'densiTy',
                'val': 'de'
            },
			{
				'name': 'Total GDP',
				'val': 'tg'
			},
            {
                'name': 'Per Capita GDP',
                'val': 'ag'
            },
            {
                'name': 'Population',
                'val': 'po'
            },
            {
                'name': 'House Price',
                'val': 'hp'
            }
        ],
        'otypes': [{
                'name': 'Empty',
                'val': 'e'
            },
            {
                'name': 'POI',
                'val': 'p'
            },
            {
                'name': 'District',
                'val': 'd'
            },
            {
                'name': 'District-Extra',
                'val': 'de'
            },
            {
                'name': 'FACET-District',
                'val': 'f'
            },
            {
                'name': 'FACET-Cluster',
                'val': 'c'
            }
        ],
        /**
         * timeblock filters object
         */
        'tpfilters': [{
                'name': 'Allday',
                'val': '9',
                'aurl': '/assets/tp9-aicon.png',
                'nurl': '/assets/tp9-icon.png'
            },
            {
                'name': 'Morning',
                'val': '0',
                'aurl': '/assets/tp0-aicon.png',
                'nurl': '/assets/tp0-icon.png'
            },
            {
                'name': 'Forenoon',
                'val': '1',
                'aurl': '/assets/tp1-aicon.png',
                'nurl': '/assets/tp1-icon.png'
            },
            {
                'name': 'Noon',
                'val': '2',
                'aurl': '/assets/tp2-aicon.png',
                'nurl': '/assets/tp2-icon.png'
            },
            {
                'name': 'Afternoon',
                'val': '3',
                'aurl': '/assets/tp3-aicon.png',
                'nurl': '/assets/tp3-icon.png'
            },
            {
                'name': 'Evening',
                'val': '4',
                'aurl': '/assets/tp4-aicon.png',
                'nurl': '/assets/tp4-icon.png'
            },
            {
                'name': 'Night',
                'val': '5',
                'aurl': '/assets/tp5-aicon.png',
                'nurl': '/assets/tp5-icon.png'
            }
        ],
        'tpfilters2': [{
                'name': 'Allday',
                'val': '10',
                'aurl': '/assets/tp10-aicon.png',
                'nurl': '/assets/tp10-icon.png'
            },
            {
                'name': 'Weekday',
                'val': '7',
                'aurl': '/assets/tp7-aicon.png',
                'nurl': '/assets/tp7-icon.png'
            },
            {
                'name': 'Weekend',
                'val': '8',
                'aurl': '/assets/tp8-aicon.png',
                'nurl': '/assets/tp8-icon.png'
            }
        ],
        'pois': [{
                'name': 'All',
                'val': 0
            },
            {
                'name': 'Food&Supply',
                'val': 1
            },
            {
                'name': 'Entertainment&Leisure',
                'val': 2
            },
            {
                'name': 'Education',
                'val': 3
            },
            {
                'name': 'Transportation',
                'val': 4
            },
            {
                'name': 'Healthcare&Emergency',
                'val': 5
            },
            {
                'name': 'Financial&Bank',
                'val': 6
            },
            {
                'name': 'Accommodation',
                'val': 7
            },
            {
                'name': 'Office&Commercial',
                'val': 8
            },
            {
                'name': 'Natural Landscape',
                'val': 9
            },
            {
                'name': 'Factory&Manufacturer',
                'val': 10
            }
        ],
        'scales': [{
                'name': 'City',
                'val': 0
            },
            {
                'name': 'Division',
                'val': 1
            },
            {
                'name': 'Region',
                'val': 2
            },
            {
                'name': 'Street',
                'val': 3
            }
        ]
    },
    /**
     * objs: 面板对象,每个面板承载一个分析对象
     * city: 选中的城市
     * etype: 选中的 entropy 主题
     * dtype: 可视化展示的数据类型
     * ctrmap: 是否展示 contour map, 否则展示 gridmap
     * ctrsets: contour map 相关参数设置
     * maprev: 可视化结果值域映射是否翻转
     * ftpon: 是否开启 timeblocks 过滤功能
     * ftpval: 选中的 ftp value
     * 
     */
    'sels': {
        'objs': [{
            'city': 'bj',
            'etype': 'de',
            'ftpval': '9',
            'ftpval2': '10',
            'reverse': false,
            'scales': {
                'e': 1,
                'd': 100
            },
            'id': {
                'card': 'card0',
                'map': 'map0',
                'tab': 'tab0'
            },
            'slider': {
                // width: 140,
                tooltip: 'hover',
                value: [0, 100],
                dotSize: 13,
                min: 0,
                max: 100,
                clickable: false,
                formatter: function (value) {
                    //console.log("value" + (value + 1))
                    return (100 / Math.log(101) * Math.log(value + 1)).toFixed(2) + "%"
                },
                interval: 0.5,
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000",
                    "Opacity": 0.6
                },
                bgStyle: {
                    'background': settings['whiteToRed']
                },
                processStyle: {
                    'background': settings['whiteToRed']
                }
            },
            /*
            'slider1': {
                // width: 140,
                tooltip: 'hover',
                value: 50,
                min: 0,
                max: 100,
                clickable: false,
                interval: 1,
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000"
                },
                bgStyle: null,
                processStyle: {
                    'background': "orange"
                }
            },
            */
            'slider3': {
                tooltip: 'hover',
                value: '2',
                dotSize: 13,
                piecewise: true,
                piecewiseLabel: true,
                clickable: false,
                style: {
                    "marginLeft": "0%"
                },
                data: [
                    "2",
                    "3",
                    "4",
                    "5",
                    "6"
                ],
                piecewiseStyle: {
                    "backgroundColor": "orange",
                    "visibility": "visible",
                    "width": "6px",
                    "height": "6px"
                },
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000",
                    "opacity": 0.6
                },
                piecewiseActiveStyle: {
                    "backgroundColor": "orange"
                },
                labelActiveStyle: {
                    "color": "orange"
                },
                processStyle: {
                    'background': "orange"
                }
            },
            'slider1': {
                // width: 140,
                tooltip: 'hover',
                value: '20',
                dotSize: 13,
                piecewise: true,
                piecewiseLabel: true,
                clickable: false,
                style: {
                    "marginLeft": "0%"
                },
                data: [
                    "10",
                    "20",
                    "30",
                    "40",
                    "50"
                ],
                formatter: function (value) {
                    return value + "%"
                },
                piecewiseStyle: {
                    "backgroundColor": "orange",
                    "visibility": "visible",
                    "width": "6px",
                    "height": "6px"
                },
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000",
                    "opacity": 0.6
                },
                piecewiseActiveStyle: {
                    "backgroundColor": "orange"
                },
                labelActiveStyle: {
                    "color": "orange"
                },
                processStyle: {
                    'background': "orange"
                }
            },
            'slider2': {
                // width: 140,
                tooltip: 'hover',
                value: '100',
                dotSize: 13,
                piecewise: true,
                piecewiseLabel: true,
                clickable: false,
                style: {
                    "marginLeft": "0%"
                },
                data: [
                    "50",
                    "75",
                    "100",
                    "150",
                    "200"
                ],
                piecewiseStyle: {
                    "backgroundColor": "orange",
                    "visibility": "visible",
                    "width": "6px",
                    "height": "6px"
                },
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000",
                    "opacity": 0.6
                },
                piecewiseActiveStyle: {
                    "backgroundColor": "orange"
                },
                labelActiveStyle: {
                    "color": "orange"
                },
                processStyle: {
                    'background': "orange"
                }
            },
             'slider4': {
                tooltip: 'hover',
                value: '15',
                dotSize: 13,
                piecewise: true,
                piecewiseLabel: true,
                clickable: false,
                style: {
                    "marginLeft": "0%"
                },
                data: [
					"15",
					"30",
                    "50",
                    "75",
                    "100",
                    "150",
                    "200"
                ],
                formatter: function (value) {
                    return value
                },
				bgStyle:{
					'backgroundColor': "orange"
				},
                tooltipStyle: {
                    "backgroundColor": "#000",
                    "borderColor": "#000",
                    "opacity": 0.6
                },
                labelActiveStyle: {
                    "color": "lightgray"
                },
                processStyle: {
                    'background': "lightgray"
                }
            },
            'data': {
                'smec': {
                    "ap": 0.349552064745511,
                    "ar": 0.349529453722475,
                    "pp": 1.10768395047002,
                    "pr": 1.13533312941438,
                    "c": [116.3907, 39.9120],
                    "d": 512286.68,
                    "s": 16412,
                    "ad": 8407648917,
                    "name": "Beijing",
                    "disnum": 16
                }
            }
        }],
        'otype': 'e', //overlay type
        'ptype': 0, //pois type
        'stype': 0, //scales type
        'areaselect': false, //是否选中区域
        'ctrsets': {
            'useLocalExtrema': false,
            'opacity': 0.5,
            'radius': 2
        },
        'lstnum': 1, // 页面在本次操作之前存在的标签个数(包括额外overlay图层)
        'lstindex': 0, // 存储上次操作的页面标签
        'dynamic': false
    },
    'components': {
        'eSlider': {
            tooltip: 'hover',
            value: [0, 100],
            clickable: false,
            tooltipStyle: {
                "backgroundColor": "#000",
                "borderColor": "#000"
            },
            bgStyle: {
                'background': settings['whiteToRed']
            },
            processStyle: {
                'background': settings['whiteToRed']
            }
        },
        'hrSlider': {
            width: "auto",
            tooltip: 'hover',
            min: 1,
            max: 2.6,
            interval: 0.01,
            disabled: false,
            clickable: false,
            tooltipStyle: {
                "backgroundColor": "#000",
                "borderColor": "#000"
            }
        }
    },
    'cals': {
        'cities': {
            'bj': 'Beijing',
            'tj': 'Tianjin',
            'zjk': 'Zhangjiakou',
            'ts': 'Tangshan'
        },
        'enps': {
            'pp': 'Vibrancy',
            'vd': 'Vibrancy',
            'pd': 'Commutation',
            'cd': 'Commutation',
            'rp': 'Diversity',
            'rd': 'Fluidity',
            'de': 'Density',
            'dd': 'Density',
            'tg': 'Total GDP',
            'ag': 'Per Capita GDP',
            'po': 'Population',
            'hp': 'House Price',
			'rdb': 'Fluidity',
			'rdbo': 'Fluidity',
			'rdbb': 'Fluidity',
			'ppb': 'Vibrancy',
			'ppbo': 'Vibrancy',
			'ppbb': 'Vibrancy',
			'pdb': 'Commutation',
			'pdbo': 'Commutation',
			'pdbb': 'Commutation',
			'rpb': 'Diversity',
			'rpbo': 'Diversity',
			'rpbb': 'Diversity'
        },
        'ops': {
            'e': 'Empty',
            'p': 'POI',
            'd': 'District',
            'f': 'FACET-District',
            'c': 'FACET-Cluster'
        },
        'pois': ['All', 'Food&Supply', 'Entertainment&Leisure', 'Education', 'Transportation', 'Healthcare&Emergency', 'Financial&Bank', 'Accommodation', 'Office&Commercial', 'Natural Landscape', 'Factory&Manufacturer'],
        'scales': ['City', 'Division', 'Region', 'Street'],
        'cimgs': {
            'bj': {
                'aurl': '/assets/bj-aicon.png',
                'nurl': '/assets/bj-icon.png'
            },
            'tj': {
                'aurl': '/assets/tj-aicon.png',
                'nurl': '/assets/tj-icon.png'
            },
            'zjk': {
                'aurl': '/assets/zjk-aicon.png',
                'nurl': '/assets/zjk-icon.png'
            },
            'ts': {
                'aurl': '/assets/ts-aicon.png',
                'nurl': '/assets/ts-icon.png'
            }
        }
    }
};

const regionRecords = {
    'bj': {
        'center': [39.9120, 116.3907]
    },
    'tj': {
        'center': [39.1311, 117.1857]
    },
    'ts': {
        'center': [39.6512, 118.1648]
    },
    'zjk': {
        'center': [40.7915, 114.8875]
    }
};

const stats = {
    /**
     * [TotalGDP, Population, Area, AveGDP, HousePrice，Density, Commutation, Vibrancy]
     */
    'bj': {
        "东城区": [1857.8, 90.5, 42, 205282, 90807, 3932365.05, 0.5098208237393245, 1.3295073420089694],
        "西城区": [3270.40, 129.80, 51, 251957, 107297, 3874272.94, 0.4917419805387299, 1.1889573331773262],
        "丰台区": [1169.9, 232.4, 306, 50340, 50576, 1123416.75, 0.3934156081076796, 0.9480338547628635 ],
        "海淀区": [4613.50, 369.4, 431, 124892, 75902, 1185430.84, 0.3624047931886339, 1.2398648740070755],
        "石景山区": [430.2, 65.2, 84, 65982, 48387, 1016305.02, 0.4030370121039125, 1.023184786129462],
        "门头沟区": [144.5, 30.8, 1451, 46916, 34046, 25512.87, 0.3587561231269324, 0.8731228560373752],
        "顺义区": [1440.9, 102.0, 1020, 141265, 33008, 135184.43, 0.276135817710448, 1.0142233690753077],
        "通州区": [594.5, 137.8, 906, 43142, 39507, 230496.45, 0.30461523002770513, 0.9088079289713398],
        "朝阳区": [4640.2, 395.5, 455, 117325, 62235, 1837805.39, 0.32161525641741656, 1.208647406266496],
        "大兴区": [1591.6, 156.2, 1026, 101895, 36091, 219861.79, 0.30841780126040685, 0.962936407308986],
        "昌平区": [657.3, 196.3, 1344, 33484, 30583, 200086.63, 0.3429382347156302, 1.0344222336651125],
        "平谷区": [196.2, 42.3, 950, 46383, 17873, 30668.70, 0.19802808129940952, 0.794483937911173],
        "怀柔区": [234.2, 38.4, 2123, 60990, 23268, 15728.24, 0.24224482258269062, 1.0142178766155967],
        "延庆区": [107.35, 31.4, 1994, 34188, 20894, 12994.30, 0, 0.7074310813177896],
        "房山区": [554.7, 104.6, 1990, 53031, 21976, 56248.13, 0.2549548678706803, 0.8282301335161484],
        "密云区": [226.7, 47.9, 2229, 47328, 20437, 15767.04, 0.20696186898611307, 0.7854971384998083]
    },
    'tj': {
        "蓟州区": [409.00, 90.71, 1593.0, 45089.0, 8200, 54394.93, 0.10927206560704104, 0.2892562374072184],
        "和平区": [784.93, 37.81, 10.0, 207599.0, 30244, 9722587.50, 0.6009201665708845, 0.9942442406506006],
        "河西区": [780.0, 101.52, 37.0, 76832.0, 19697, 5497289.49, 0.4691212856374581, 0.7220234512848843],
        "南开区": [586.7, 16.91, 39.0, 50184.0, 19308, 6053418.41, 0.4658748222670971, 0.6927022586376834],
        "河东区": [310.0, 98.85, 39.0, 31361.0, 16087, 5190000.90, 0.4608027805439008, 0.6420686559919898],
        "河北区": [416.0, 90.84, 27.0, 45795.0, 15112, 5406414.93, 0.45943844405643347, 0.6468298550242318],
        "西青区": [1010.40, 84.24, 545.0, 119943, 12205, 560866.09, 0.34376870289636147, 0.6637320047952152],
        "津南区": [808.3, 70.89, 401.0, 114022.0, 9153, 440581.15, 0.28602226177385026, 0.49876735650495946],
        "北辰区": [960.0, 80.85, 478.0, 118738.0, 11369, 392599.27, 0.322113954165561, 0.5569932991175987],
        "武清区": [1090.0, 113.43, 1570.0, 96095.0, 7123, 102683.50, 0.13286558048192354, 0.4764005983264367],
        "宁河区": [551.17, 47.46, 1414.0, 116134.0, 8874, 38912.54, 0.1705981896799577, 0.3293881112169066],
        "静海区": [650.0, 76.67, 1476.0, 84779.0, 7210, 74591.19, 0.12445349655287441, 0.3796486995272194],
        "宝坻区": [630.0, 90.04, 1523.0, 69969.0, 6779, 50536.30, 0.13490554453590484, 0.2944662787232909],
        "东丽区": [905.56, 71.70, 460.0, 126298.0, 10095, 495526.99, 0.3379284717356014, 0.567417759010253],
        "滨海新区": [9270.31, 297.01, 2270.0, 312121.0, 9693, 215569.95, 0.1299322293952447, 0.41971236053720845],
        "红桥区": [196.0, 58.76, 21.0, 33356.0, 15717, 4536264.14, 0.48317721876762026, 0.6070961173273169]
    },
    'ts': {
        "古冶区": [],
        "路南区": [],
        "开平区": [],
        "路北区": [],
        "丰润区": [],
        "滦南县": [],
        "曹妃甸区": [],
        "迁西县": [],
        "滦县": [],
        "乐亭县": [],
        "玉田县": [],
        "迁安市": [],
        "遵化市": [],
        "丰南区": []
    },
    'zjk': {
        "崇礼县": [],
        "赤城县": [],
        "沽源县": [],
        "怀安县": [],
        "怀来县": [],
        "康保县": [],
        "桥东区": [],
        "桥西区": [],
        "尚义县": [],
        "万全县": [],
        "蔚县": [],
        "下花园区": [],
        "宣化区": [],
        "宣化县": [],
        "阳原县": [],
        "张北县": [],
        "涿鹿县": []
    }
};

/**
 * 存储各城市 metric 以及 density 的最大值
 * @type {Object}
 */
let smecMax = {
    'bj': {
        'm': 1.4111167395551567,
        'ar': 0.6848672333841485,
        'pr': 1.4111167395551567,
        'ap': 0.5098208237393245,
        'pp': 1.3295073420089694,
        'ad': 836201452,
        'd': 3932365.05
    },
    'tj': {
        'm': 1.1312344388511115,
        'ar': 0.8342429523005064,
        'pr': 1.1312344388511115,
        'ap': 0.6009201665708845,
        'pp': 0.9942442406506006,
        'ad': 489343792,
        'd': 9722587.50
    },
    'ts': {
        'm': 1.017137606550299,
        'ar': 0.38290799370368955,
        'pr': 1.017137606550299,
        'ap': 0.31198632035024615,
        'pp': 0.9860402259432911,
        'ad': 161914965,
        'd': 2416641.27
    },
    'zjk': {
        'm': 0.617922305906725,
        'ar': 0.23833027811436472,
        'pr': 0.24725760901509997,
        'ap': 0.5098208237393245,
        'pp': 0.617922305906725,
        'ad': 63151878,
        'd': 556894.87
    }
}

let smecAve = {
    'bj': {
        "ap": 0.349552064745511,
        "ar": 0.349529453722475,
        "pp": 1.10768395047002,
        "pr": 1.13533312941438,
        "c": [116.3907, 39.9120],
        "d": 512286.68,
        "s": 16412,
        "ad": 8407648917,
        "name": "Beijing",
        "disnum": 16
    },
    'tj': {
        "ap": 0.311879437094161,
        "ar": 0.311942440535186,
        "pp": 0.588935561107274,
        "pr": 0.563593511139423,
        "c": [117.1857, 39.1311],
        "d": 240155.92,
        "s": 11903,
        "ad": 2858575880,
        "name": "Tianjin",
        "disnum": 16
    },
    'ts': {
        "ap": 0.142242470183699,
        "ar": 0.142227779896852,
        "pp": 0.655545897603267,
        "pr": 0.671277817559785,
        "c": [118.1648, 39.6512],
        "d": 68316.84,
        "s": 13472,
        "ad": 920364499,
        "name": "Tangshan",
        "disnum": 14
    },
    'zjk': {
        "ap": 0.145383924656692,
        "ar": 0.14534363999775,
        "pp": 0.44685112708024,
        "pr": 0.372831640047352,
        "c": [114.8875, 40.7915],
        "d": 8618.99,
        "s": 36808.5,
        "ad": 317252149,
        "name": "Zhangjiakou",
        "disnum": 17
    }
}

let getRealProp = function (prop) {
    let arr = {
        'pp': 'pp',
        'pd': 'ap',
        'rp': 'pr',
        'rd': 'ar',
        'de': 'd'
    }

    return arr[prop];
}

export {
    regionRecords,
    home,
    regions,
    stats,
    smecMax,
    smecAve,
    getRealProp
}