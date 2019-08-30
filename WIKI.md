# UrbanFACET Wiki

以下内容为 UrbanFACET 项目中文 Wiki，其中包含前后端代码功能说明以及数据分析处理脚本介绍。注意，本项目的代码 summer 分支中存储的是改动至2017年9月的代码（TVCG），master 分支以及 vast17 分支中存储的是改动至2017年3月的代码（IEEEVIS），dev 分支与其他分支可不作考虑。

**下载说明**：代码可以通过 SSH 或者 HTTPS 的方式拉取到本地进行开发，也可以整体打包下载，下载地址见 <https://github.com/visdata/UrbanFACET/releases> 描述。

## WIKI 目录

1. [页面 | Pages](#页面) 
2. [绘制与模型 | Visualization and Models](#绘制与模型)
3. [路由 | Routes](#路由)
4. [APIs](#APIs)
5. [数据处理脚本 | Scripts](#数据处理脚本)
6. [数据库信息 | DataBases](#数据库信息)
7. [批处理与数据库信息 | Shell and Databases](#批处理与数据库信息)

## 页面

### EJS 模板（视图）

文件夹 `/views`，存放 HTML 渲染所用到的模板信息，以下为该部分目录结构：

```
├── error.ejs
├── home
│   ├── dynamic.ejs
│   ├── mapcard.ejs
│   └── panel.ejs
└── home.ejs
```

几点说明：

* home: 用于存储组成 home 页面的展示组件，其中 `panel.ejs` 为配置面板展示组件， `dynamic.ejs` 为对比分析展示页面组件， `mapcard.ejs` 为地图信息卡片组件
* error.ejs: 404 页面
* home.ejs: 主界面入口

### 静态资源（图片）

所有页面所涉及到的自定义设计图标文件均存放在 `/public/assets` 文件夹中。

## 绘制与模型

文件夹 `/public/js/`，以下为该部分目录结构：

```
├── components
│   ├── apis.js
│   ├── chartview.js
│   ├── events.js
│   ├── hmap-view.js
│   ├── init.js
│   ├── lib.js
│   ├── map.js
│   └── RadarChart.js
├── dynamic.js
├── home.js
└── lib
    ├── semantic.js
    └── semantic.min.js
```

### 可视化绘制与前台数据处理方法相关

详细说明如下：

* components/
	* apis.js: 对通过 HTTP 请求获取到的数据做进一步处理，以便于将数据传入相应绘制函数执行，例如：阈值调控、绘制对象封装等
	* chartview.js: 可视化表格绘制类，包含折线图、条形图等
	* events.js: 一些事件处理函数，包括监听后的页面变化等，暂时未用到
	* hmap-view.js: 地图类，用于生成地图实例，以及相关 heatmap, gridmap, pointmap, scatterplot 等绘制函数
	* init.js: 存储页面初始化实例所要用到的 data
	* lib.js: 通用函数，暂时为空
	* map.js: 基于 Leaflet.js 抽象的 canvas 绘制部分，用于替换采用 svg 绘制海量点的做法，其他的集成功能包括 selection 等
	* RadarChart.js: Star plot 绘制类，由 radar chart 类改进而来
* home.js: 页面构建与状态管理、实现查询及可视化交互，系统脚本主入口
* dynamic.js: 动态查询页面生成组件
* lib/: 存储已编译好的第三方 UI 库代码文件
	* semantic.js
	* semantic.min.js

### 视图模型与状态管理相关

* 视图模型

## 路由

文件夹 `/routes`，以下为该部分目录结构：

```
├── comp.js
└── index.js
```

几点说明：

* index: 渲染页面路由
* comp: 查询路由 API

## APIs

文件夹 `controllers`，以下为该部分目录结构：

```
└── apis
    ├── comp.js
    └── mysqlMapping.js
```

### 服务端配置

服务端部分服务涉及到的文件与作用说明如下所示：

* data.js: 储存关键的一些 key-value 描述词-对应查询词，通过 getValue 函数传参的形式获取 value 并返回
* db.js: MySQL 配置设置，请根据本地环境或者服务器环境更换相应配置
* entropy.js: entropy 计算相关函数
	* readIdlistMongo:从 Mongodb 读取 idlist
    * readIdlistFile: 从文件读取 idlist
	* connectMongo: 连接 Mongodb 
	* mongoQueries: Mongodb 用户 idlist/records 三段联合查询
* lib.js: 通用函数
* records.js: 定位记录处理相关函数

以下为该部分目录结构：

```
├── data
│   ├── bj.json
│   ├── bj_poidis.json
│   ├── metrics.json
│   ├── poidis.json
│   ├── tj.json
│   ├── tj_poidis.json
│   ├── ts.json
│   ├── ts_poidis.json
│   ├── zjk.json
│   └── zjk_poidis.json
├── data.js
├── db.js
├── eMax.js
├── entropy.js
├── lib.js
└── records.js
```

## 数据处理脚本

### FACET Metric 计算逻辑部分

文件夹 `/server/scripts`，以下为该部分目录结构：

```
├── augmentRawData.py
├── dtEnpMatrixModule.py
├── dtEnpSupCalModule.py
├── entropyMatrixCalModule.py
├── entropySupCalModule.py
├── tpEnpMatrixModule.py
├── tpEnpSupCalModule.py
```

以上文件包含原始数据清洗与扩充、people entropy 计算、record entropy 计算部分，以下为数据计算处理部分脚本的几点说明：

* augmentRawData.py 从原始数据中提取行政区划，时间段等信息并按照用户ID分块文件存储，保证同一用户所有记录存在于一个文件中
* entropyMatrixCalModule.py: 全量 people entropy 计算
* entropySupCalModule.py: 全量 record entropy 计算
* tpEnpMatrixModule.py: 考虑时间段 timeperiod 筛选的 people entropy 计算
* tpEnpSupCalModule.py: 考虑时间段 timeperiod 筛选的 record entropy 计算
* dtEnpMatrixModule.py: 考虑时间段 daytype 筛选的 people entropy 计算
* dtEnpSupCalModule.py: 考虑时间段 daytype 筛选的 record entropy 计算

后四个文件和第二、第三个文件类似，只是加了时间段筛选。

## 数据库信息

### 数据表

| Tables_in_tdnormal |
|--------------------|
| bjCPOI             |
| bjDis              |
| bjEmatrix          |
| bjF0mat            |
| bjF1mat            |
| bjF2mat            |
| bjF3mat            |
| bjF4mat            |
| bjF5mat            |
| bjF6mat            |
| bjF7mat            |
| bjF8mat            |
| tempDis            |
| tjCPOI             |
| tjDis              |
| tjEmatrix          |
| tjF0mat            |
| tjF1mat            |
| tjF2mat            |
| tjF3mat            |
| tjF4mat            |
| tjF5mat            |
| tjF6mat            |
| tjF7mat            |
| tjF8mat            |
| tsCPOI             |
| tsDis              |
| tsEmatrix          |
| tsF0mat            |
| tsF1mat            |
| tsF2mat            |
| tsF3mat            |
| tsF4mat            |
| tsF5mat            |
| tsF6mat            |
| tsF7mat            |
| tsF8mat            |
| validrecs          |
| wbjEmatrix         |
| wbjF0mat           |
| wbjF1mat           |
| wbjF2mat           |
| wbjF3mat           |
| wbjF4mat           |
| wbjF5mat           |
| wbjF6mat           |
| wbjF7mat           |
| wbjF8mat           |
| zjkCPOI            |
| zjkDis             |
| zjkEmatrix         |
| zjkF0mat           |
| zjkF1mat           |
| zjkF2mat           |
| zjkF3mat           |
| zjkF4mat           |
| zjkF5mat           |
| zjkF6mat           |
| zjkF7mat           |
| zjkF8mat           |

### 表结构

| Field    | Type                  | Null | Key | Default | Extra |
|----------|-----------------------|------|-----|---------|-------|
| id       | mediumint(8) unsigned | NO   | PRI | NULL    |       |
| wpnumber | int(10) unsigned      | NO   | MUL | 0       |       |
| vpnumber | int(10) unsigned      | NO   |     | 0       |       |
| wrnumber | int(10) unsigned      | NO   | MUL | 0       |       |
| vrnumber | int(10) unsigned      | NO   |     | 0       |       |
| poinum   | mediumint(8) unsigned | NO   |     | 0       |       |
| prsval   | float                 | NO   |     | -1      |       |
| trsval   | float                 | NO   |     | -1      |       |
| arsval   | float                 | NO   |     | -1      |       |
| ppsval   | float                 | NO   |     | -1      |       |
| tpsval   | float                 | NO   |     | -1      |       |
| apsval   | float                 | NO   |     | -1      |       |
| dis      | tinyint(3) unsigned   | NO   |     | 0       |       |

## 批处理与数据库信息

该部分文件为自定义的脚本代码、可不作考虑，以上内容已经包含实现。

