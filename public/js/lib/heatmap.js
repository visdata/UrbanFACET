/*
 * heatmap.js v2.0.5 | JavaScript Heatmap Library
 *
 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license 
 *
 * :: 2018-09-07 17:00
 */
; (function (name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

})("h337", this, function () {

  // Heatmap Config stores default values and will be merged with instance config
  var HeatmapConfig = {
    defaultRadius: 40,
    defaultRenderer: 'canvas2d',
    defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)" },
    defaultMaxOpacity: 1,
    defaultMinOpacity: 0,
    defaultBlur: .85,
    defaultXField: 'x',
    defaultYField: 'y',
    defaultValueField: 'value',
    plugins: {}
  };
  var Store = (function StoreClosure() {

    var Store = function Store(config) {
      this._coordinator = {};
      this._data = [];
      this._radi = [];
      this._min = 10;
      this._max = 1;
      this._xField = config['xField'] || config.defaultXField;
      this._yField = config['yField'] || config.defaultYField;
      this._valueField = config['valueField'] || config.defaultValueField;

      if (config["radius"]) {
        this._cfgRadius = config["radius"];
      }
    };

    var defaultRadius = HeatmapConfig.defaultRadius;

    Store.prototype = {
      // when forceRender = false -> called from setData, omits renderall event
      _organiseData: function (dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }
        var storedVal = store[x][y];

        if (storedVal > max) {
          if (!forceRender) {
            this._max = storedVal;
          } else {
            this.setDataMax(storedVal);
          }
          return false;
        } else if (storedVal < min) {
          if (!forceRender) {
            this._min = storedVal;
          } else {
            this.setDataMin(storedVal);
          }
          return false;
        } else {
          return {
            x: x,
            y: y,
            value: value,
            radius: radius,
            min: min,
            max: max
          };
        }
      },
      /* Store data points in this._data and update max and min values
       * - dataPoint: x - Number, y - Number, c (namely value) - Number, radius - Number
       * - num_layer: number of layers
       * - idx: index of layer of the data point
       * - forceRender: Whether or not to rerender when updating max or min value
       */
      _organiseMultiLayerData: function (dataPoint, num_layer, idx, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = [];
          radi[x][y] = [];
        }

        if (!store[x][y][idx]) {
          store[x][y][idx] = value
          radi[x][y][idx] = radius
        } else {
          store[x][y][idx] += value;
        }
        var storedVal = store[x][y][idx];

        if (storedVal > max) {
          if (!forceRender) {
            this._max = storedVal;
          } else {
            this.setDataMax(storedVal);
          }
          return false;
        } else if (storedVal < min) {
          if (!forceRender) {
            this._min = storedVal;
          } else {
            this.setDataMin(storedVal);
          }
          return false;
        } else {
          return {
            x: x,
            y: y,
            value: value,
            radius: radius,
            min: min,
            max: max
          };
        }
      },
      _unOrganizeData: function () {
        var unorganizedData = [];
        var data = this._data;
        var radi = this._radi;

        for (var x in data) {
          for (var y in data[x]) {

            unorganizedData.push({
              x: x,
              y: y,
              radius: radi[x][y],
              value: data[x][y]
            });

          }
        }
        return {
          min: this._min,
          max: this._max,
          data: unorganizedData
        };
      },
      _onExtremaChange: function () {
        this._coordinator.emit('extremachange', {
          min: this._min,
          max: this._max
        });
      },
      addData: function () {
        if (arguments[0].length > 0) {
          var dataArr = arguments[0];
          var dataLen = dataArr.length;
          while (dataLen--) {
            this.addData.call(this, dataArr[dataLen]);
          }
        } else {
          // add to store  
          var organisedEntry = this._organiseData(arguments[0], true);
          if (organisedEntry) {
            // if it's the first datapoint initialize the extremas with it
            if (this._data.length === 0) {
              this._min = this._max = organisedEntry.value;
            }
            this._coordinator.emit('renderpartial', {
              min: this._min,
              max: this._max,
              data: [organisedEntry]
            });
          }
        }
        return this;
      },
      setData: function (data) {
        var dataPoints = data.data;
        var pointsLen = dataPoints.length;


        // reset data arrays
        this._data = [];
        this._radi = [];

        for (var i = 0; i < pointsLen; i++) {
          this._organiseData(dataPoints[i], false);
        }
        this._max = data.max;
        this._min = data.min || 0;

        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      setMultiLayerData: function (data) {
        // Input data: { min: Number, max: Number, data: [[x: Number, y: Number, c: Number, radius: Number]] }
        var dataPoints = data.data
        var num_layer = dataPoints.length

        // reset data arrays
        this._data = [];
        this._radi = [];

        for (var i = 0; i < num_layer; i++) {
          for (var j = 0; j < dataPoints[i].length; j++) {
            this._organiseMultiLayerData(dataPoints[i][j], num_layer, i, false)
          }
        }
        this._max = data.max;
        this._min = data.min || 0;

        this._onExtremaChange();
        this._coordinator.emit('renderMultiLayer', this._getInternalData());
        return this;
      },
      removeData: function () {
        // TODO: implement
      },
      setDataMax: function (max) {
        this._max = max;
        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      setDataMin: function (min) {
        this._min = min;
        this._onExtremaChange();
        this._coordinator.emit('renderall', this._getInternalData());
        return this;
      },
      setCoordinator: function (coordinator) {
        this._coordinator = coordinator;
      },
      _getInternalData: function () {
        return {
          max: this._max,
          min: this._min,
          data: this._data,
          radi: this._radi
        };
      },
      getData: function () {
        return this._unOrganizeData();
      }/*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              } 
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
    };


    return Store;
  })();

  var Canvas2dRenderer = (function Canvas2dRendererClosure() {

    var _getColorPaletteBasic = function (gradientConfig) {
      var paletteCanvas = document.createElement('canvas');
      var paletteCtx = paletteCanvas.getContext('2d');

      paletteCanvas.width = 256;
      paletteCanvas.height = 1;

      var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
      for (var key in gradientConfig) {
        gradient.addColorStop(key, gradientConfig[key]);
      }

      paletteCtx.fillStyle = gradient;
      paletteCtx.fillRect(0, 0, 256, 1);

      return paletteCtx.getImageData(0, 0, 256, 1).data;
    };

    var _getColorPalette = function (config) {
      if (config.gradient == undefined) {
        return _getColorPaletteBasic(config.defaultGradient)
      } else if (Array.isArray(config.gradient)) {
        // Multiple layers (e.g. bubble set)
        return config.gradient.map(function (g) {
          if (g != null) return _getColorPaletteBasic(g);
        })
      } else {
        return _getColorPaletteBasic(config.gradient)
      }
    }

    var _getPointTemplate = function (radius, blurFactor) {
      var tplCanvas = document.createElement('canvas');
      var tplCtx = tplCanvas.getContext('2d');
      var x = radius;
      var y = radius;
      tplCanvas.width = tplCanvas.height = radius * 2;

      if (blurFactor == 1) {
        tplCtx.beginPath();
        tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
        tplCtx.fillStyle = 'rgba(0,0,0,1)';
        tplCtx.fill();
      } else {
        var gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        tplCtx.fillStyle = gradient;
        tplCtx.fillRect(0, 0, 2 * radius, 2 * radius);
      }



      return tplCanvas;
    };

    var _prepareData = function (data) {
      var renderData = [];
      var min = data.min;
      var max = data.max;
      var radi = data.radi;
      var data = data.data;

      var xValues = Object.keys(data);
      var xValuesLen = xValues.length;

      while (xValuesLen--) {
        var xValue = xValues[xValuesLen];
        var yValues = Object.keys(data[xValue]);
        var yValuesLen = yValues.length;
        while (yValuesLen--) {
          var yValue = yValues[yValuesLen];
          var value = data[xValue][yValue];
          var radius = radi[xValue][yValue];
          renderData.push({
            x: xValue,
            y: yValue,
            value: value,
            radius: radius
          });
        }
      }

      return {
        min: min,
        max: max,
        data: renderData
      };
    };

    var _prepareMultiLayerData = function (data) {
      var renderData = [];
      var min = data.min;
      var max = data.max;
      var radi = data.radi;

      // data[x][y][z]: x - xAxis, y - yAxis, z - index of layer
      var data = data.data;

      var xValues = Object.keys(data);
      var xValuesLen = xValues.length;

      while (xValuesLen--) {
        var xValue = xValues[xValuesLen];
        var yValues = Object.keys(data[xValue]);
        var yValuesLen = yValues.length;
        while (yValuesLen--) {
          var yValue = yValues[yValuesLen];
          var zValues = Object.keys(data[xValue][yValue]);
          var zValuesLen = zValues.length;

          while (zValuesLen--) {
            var zValue = zValues[zValuesLen];
            var value = data[xValue][yValue][zValue];
            var radius = radi[xValue][yValue][zValue];
            renderData.push({
              x: xValue,
              y: yValue,
              z: zValue,
              value: value,
              radius: radius
            });
          }
        }
      }

      return {
        min: min,
        max: max,
        data: renderData
      };
    };

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

    var _alphaBlending = function (src, dst) {
      for (var i = 0; i < 4; i++) {
        src[i] = src[i] / 255;
        dst[i] = dst[i] / 255;
      }

      outA = src[3] + dst[3] * (1 - src[3]);
      outR = (src[0] * src[3] + dst[0] * dst[3] * (1 - src[3])) / outA;
      outG = (src[1] * src[3] + dst[1] * dst[3] * (1 - src[3])) / outA;
      outB = (src[2] * src[3] + dst[2] * dst[3] * (1 - src[3])) / outA;

      outR = parseInt(outR * 255);
      outG = parseInt(outG * 255);
      outB = parseInt(outB * 255);
      outA = parseInt(outA * 255);

      return [outR, outG, outB, outA];
    };


    function Canvas2dRenderer(config) {
      var container = config.container;
      var computed = getComputedStyle(config.container) || {};

      if (Array.isArray(config.gradient)) {
        // We have to store canvas elements in dictionary if we want to manipulate the element in the future
        this.shadowCanvas = {};
        this.shadowCtx = {};
        for (var i = 0; i < config.gradient.length; i++) {
          var c = document.createElement('canvas')
          c.width = config.width || +(computed.width.replace(/px/, ''));
          c.height = config.height || +(computed.height.replace(/px/, ''));
          c.style.cssText = 'position:absolute;left:0;top:0;';
          this.shadowCanvas[i] = c;
          this.shadowCtx[i] = c.getContext('2d');
        }
      } else {
        var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = config.width || +(computed.width.replace(/px/, ''));
        shadowCanvas.height = config.height || +(computed.height.replace(/px/, ''));
        shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';
        this.shadowCtx = shadowCanvas.getContext('2d');
      }

      var canvas = this.canvas = config.canvas || document.createElement('canvas');
      canvas.className = 'heatmap-canvas';
      var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

      this._width = canvas.width = config.width || +(computed.width.replace(/px/, ''));
      this._height = canvas.height = config.height || +(computed.height.replace(/px/, ''));

      this.ctx = canvas.getContext('2d');

      // @TODO:
      // conditional wrapper

      canvas.style.cssText = 'position:absolute;left:0;top:0;';

      container.style.position = 'absolute';
      container.appendChild(canvas);

      this._palette = _getColorPalette(config);
      this._config = config;
      this._templates = {};

      this._setStyles(config);
    };

    Canvas2dRenderer.prototype = {
      renderPartial: function (data) {
        if (data.data.length > 0) {
          this._drawAlpha(data);
          this._colorize();
        }
      },
      renderAll: function (data) {
        // reset render boundaries
        this._clear();
        if (data.data.length > 0) {
          this._drawAlpha(_prepareData(data));
          this._colorize();
        }
      },
      renderMultiLayer: function (data) {
        // reset render boundaries
        this._clear();
        if (data.data.length > 0) {
          this._drawMultiLayerAlpha(_prepareMultiLayerData(data));
          this._colorizeMultiLayer();
        }
      },
      _updateGradient: function (config) {
        this._palette = _getColorPalette(config);
      },
      updateConfig: function (config) {
        if (config['gradient']) {
          this._updateGradient(config);
        }
        this._setStyles(config);
      },
      setDimensions: function (width, height) {
        this._width = width;
        this._height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        if (Object.keys(this.shadowCanvas).length > 0) {
          var indexs = Object.keys(this.shadowCanvas);
          var indexLens = indexs.length;
          while (indexLens--) {
            var indexValue = indexs[indexLens]
            this.shadowCanvas[indexValue].width = width;
            this.shadowCanvas[indexValue].height = height;
          }
        } else {
          this.shadowCanvas.width = width;
          this.shadowCanvas.height = height;
        }
      },
      _clear: function () {
        if (Object.keys(this.shadowCtx).length > 0) {
          var indexs = Object.keys(this.shadowCtx)
          var indexLens = indexs.length
          while (indexLens--) {
            var indexValue = indexs[indexLens]
            this.shadowCtx[indexValue].clearRect(0, 0, this._width, this._height);
          }
        } else {
          this.shadowCtx.clearRect(0, 0, this._width, this._height);
        }
        this.ctx.clearRect(0, 0, this._width, this._height);
      },
      _setStyles: function (config) {
        this._blur = (config.blur == 0) ? 0 : (config.blur || config.defaultBlur);

        if (config.backgroundColor) {
          this.canvas.style.backgroundColor = config.backgroundColor;
        }

        this._width = this.canvas.width = config.width || this._width;
        this._height = this.canvas.height = config.height || this._height;
        if (Object.keys(this.shadowCanvas).length > 0) {
          var indexs = Object.keys(this.shadowCanvas)
          var indexLens = indexs.length
          while (indexLens--) {
            var indexValue = indexs[indexLens]
            this.shadowCanvas[indexValue].width = this._width;
            this.shadowCanvas[indexValue].height = this._height;
          }
        } else {
          this.shadowCanvas.width = this._width;
          this.shadowCanvas.height = this._height;
        }


        this._opacity = (config.opacity || 0) * 255;
        this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
        this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
        this._useGradientOpacity = !!config.useGradientOpacity;
        this._opaque = !!config.opaque;
      },
      _drawAlpha: function (data) {
        var min = this._min = data.min;
        var max = this._max = data.max;
        var data = data.data || [];
        var dataLen = data.length;
        // on a point basis?
        var blur = 1 - this._blur;

        while (dataLen--) {
          var point = data[dataLen];

          var x = point.x;
          var y = point.y;
          var radius = point.radius;
          // if value is bigger than max
          // use max as value
          var value = Math.min(point.value, max);
          var rectX = x - radius;
          var rectY = y - radius;
          var shadowCtx = this.shadowCtx;




          var tpl;
          if (!this._templates[radius]) {
            this._templates[radius] = tpl = _getPointTemplate(radius, blur);
          } else {
            tpl = this._templates[radius];
          }
          // value from minimum / value range
          // => [0, 1]
          var templateAlpha = (value - min) / (max - min);
          // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
          shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;

          shadowCtx.drawImage(tpl, rectX, rectY);

          // update renderBoundaries
          if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          }
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2 * radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2 * radius;
          }
          if (rectY + 2 * radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2 * radius;
          }

        }
      },
      _colorize: function () {
        var x = this._renderBoundaries[0];
        var y = this._renderBoundaries[1];
        var width = this._renderBoundaries[2] - x;
        var height = this._renderBoundaries[3] - y;
        var maxWidth = this._width;
        var maxHeight = this._height;
        var opacity = this._opacity;
        var maxOpacity = this._maxOpacity;
        var minOpacity = this._minOpacity;
        var useGradientOpacity = this._useGradientOpacity;
        var opaque = this._opaque;

        if (x < 0) {
          x = 0;
        }
        if (y < 0) {
          y = 0;
        }
        if (x + width > maxWidth) {
          width = maxWidth - x;
        }
        if (y + height > maxHeight) {
          height = maxHeight - y;
        }

        var img = this.shadowCtx.getImageData(x, y, width, height);
        var imgData = img.data;
        var len = imgData.length;
        var palette = this._palette;


        for (var i = 3; i < len; i += 4) {
          var alpha = imgData[i];
          var offset = alpha * 4;


          if (!offset) {
            continue;
          }

          var finalAlpha;
          if (opacity > 0) {
            finalAlpha = opacity;
          } else {
            if (alpha < maxOpacity) {
              if (alpha < minOpacity) {
                finalAlpha = minOpacity;
              } else {
                finalAlpha = alpha;
              }
            } else {
              finalAlpha = maxOpacity;
            }
          }

          imgData[i - 3] = palette[offset];
          imgData[i - 2] = palette[offset + 1];
          imgData[i - 1] = palette[offset + 2];
          imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

          if (opaque) imgData[i] = 255;

        }

        img.data = imgData;
        this.ctx.putImageData(img, x, y);

        this._renderBoundaries = [1000, 1000, 0, 0];

      },
      _drawMultiLayerAlpha: function (data) {
        var min = this._min = data.min;
        var max = this._max = data.max;
        var data = data.data || [];
        var dataLen = data.length;
        // on a point basis?
        var blur = 1 - this._blur;

        this._pointsValue = new Array(Object.keys(this.shadowCtx).length)
        for (var z = 0; z < this._pointsValue.length; z++) {
          this._pointsValue[z] = []
        }

        while (dataLen--) {
          var point = data[dataLen];

          var x = parseInt(point.x);
          var y = parseInt(point.y);
          var z = point.z;
          var radius = point.radius;
          // if value is bigger than max
          // use max as value
          var value = Math.min(point.value, max);
          var rectX = Math.round(x - radius);
          var rectY = Math.round(y - radius);
          var shadowCtx = this.shadowCtx[z];

          var tpl;
          if (!this._templates[radius]) {
            this._templates[radius] = tpl = _getPointTemplate(radius, blur);
          } else {
            tpl = this._templates[radius];
          }

          var tplData = tpl.getContext('2d').getImageData(0, 0, 2 * radius, 2 * radius).data;

          var width = Math.floor(2 * radius);
          var height = width;
          for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
              if (tplData[4 * (width * j + i) + 3]) {
                if (!this._pointsValue[z][rectY + j]) {
                  this._pointsValue[z][rectY + j] = []
                }
                if (!this._pointsValue[z][rectY + j][rectX + i] || (this._pointsValue[z][rectY + j][rectX + i] < value)) {
                  this._pointsValue[z][rectY + j][rectX + i] = value;
                }
              }
            }
          }

          // value from minimum / value range
          // => [0, 1]
          var templateAlpha = (value - min) / (max - min);
          // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
          shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;

          shadowCtx.drawImage(tpl, rectX, rectY);

          // update renderBoundaries
          if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          }
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2 * radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2 * radius;
          }
          if (rectY + 2 * radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2 * radius;
          }
        }
      },
      _colorizeMultiLayer: function () {
        var x = Math.floor(this._renderBoundaries[0]);
        var y = Math.floor(this._renderBoundaries[1]);
        var width = Math.ceil(this._renderBoundaries[2] - x);
        var height = Math.ceil(this._renderBoundaries[3] - y);
        var maxWidth = this._width;
        var maxHeight = this._height;

        if (x < 0) {
          x = 0;
        }
        if (y < 0) {
          y = 0;
        }
        if (x + width > maxWidth) {
          width = Math.floor(maxWidth - x);
        }
        if (y + height > maxHeight) {
          height = Math.floor(maxHeight - y);
        }

        var palette = this._palette;
        var imgs = {}
        var indexs = Object.keys(this.shadowCtx);
        var indexLens = indexs.length;
        while (indexLens--) {
          var indexValue = indexs[indexLens];
          imgs[indexValue] = this.shadowCtx[indexValue].getImageData(x, y, width, height);
        }


        var blendingCanvas = document.createElement('canvas');
        var blendingCtx = blendingCanvas.getContext('2d');
        var blendingImg = blendingCtx.createImageData(width, height);

        // Compute final blending image data
        for (var i = 3; i < imgs[0].data.length; i += 4) {
          var alphas = [],
            offsets = [],
            values = [],
            imgData = [];

          var corY = y + Math.floor(i / 4 / width);
          var corX = x + Math.floor(i / 4 % width);

          for (var j = 0; j < Object.keys(imgs).length; j++) {
            var alpha = imgs[j].data[i]
            var offset = 4 * alpha

            if (!offset) continue;

            var value = this._pointsValue[j][corY][corX];

            alphas.push(alpha);
            offsets.push(offset);
            values.push(value);
            imgData.push([palette[j][offset], palette[j][offset + 1], palette[j][offset + 2], palette[j][offset + 3]]);
          }

          if (alphas.length == 0) {
            continue;
          }

          // Alpha Blending
          var sortIndices = _sortWithIndices(values).sortIndices;

          var tmp = imgData[sortIndices[0]]

          if (sortIndices.length > 1) {
            for (var j = 1; j < sortIndices.length; j++) {
              tmp = _alphaBlending(imgData[sortIndices[j]], tmp);
            }
          }

          blendingImg.data[i - 3] = tmp[0];
          blendingImg.data[i - 2] = tmp[1];
          blendingImg.data[i - 1] = tmp[2];
          blendingImg.data[i] = tmp[3];
        }


        this.ctx.putImageData(blendingImg, x, y);

        this._renderBoundaries = [1000, 1000, 0, 0];
      },
      getValueAt: function (point) {
        var value;
        var shadowCtx = this.shadowCtx;
        var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
        var data = img.data[3];
        var max = this._max;
        var min = this._min;

        value = (Math.abs(max - min) * (data / 255)) >> 0;

        return value;
      },
      getDataURL: function () {
        return this.canvas.toDataURL();
      }
    };


    return Canvas2dRenderer;
  })();


  var Renderer = (function RendererClosure() {

    var rendererFn = false;

    if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
      rendererFn = Canvas2dRenderer;
    }

    return rendererFn;
  })();


  var Util = {
    merge: function () {
      var merged = {};
      var argsLen = arguments.length;
      for (var i = 0; i < argsLen; i++) {
        var obj = arguments[i]
        for (var key in obj) {
          merged[key] = obj[key];
        }
      }
      return merged;
    }
  };
  // Heatmap Constructor
  var Heatmap = (function HeatmapClosure() {

    var Coordinator = (function CoordinatorClosure() {

      function Coordinator() {
        this.cStore = {};
      };

      Coordinator.prototype = {
        on: function (evtName, callback, scope) {
          var cStore = this.cStore;

          if (!cStore[evtName]) {
            cStore[evtName] = [];
          }
          cStore[evtName].push((function (data) {
            return callback.call(scope, data);
          }));
        },
        emit: function (evtName, data) {
          var cStore = this.cStore;
          if (cStore[evtName]) {
            var len = cStore[evtName].length;
            for (var i = 0; i < len; i++) {
              var callback = cStore[evtName][i];
              callback(data);
            }
          }
        }
      };

      return Coordinator;
    })();


    var _connect = function (scope) {
      var renderer = scope._renderer;
      var coordinator = scope._coordinator;
      var store = scope._store;

      coordinator.on('renderpartial', renderer.renderPartial, renderer);
      coordinator.on('renderall', renderer.renderAll, renderer);
      coordinator.on('renderMultiLayer', renderer.renderMultiLayer, renderer)
      coordinator.on('extremachange', function (data) {
        scope._config.onExtremaChange &&
          scope._config.onExtremaChange({
            min: data.min,
            max: data.max,
            gradient: scope._config['gradient'] || scope._config['defaultGradient']
          });
      });
      store.setCoordinator(coordinator);
    };


    function Heatmap() {
      var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
      this._coordinator = new Coordinator();
      if (config['plugin']) {
        var pluginToLoad = config['plugin'];
        if (!HeatmapConfig.plugins[pluginToLoad]) {
          throw new Error('Plugin \'' + pluginToLoad + '\' not found. Maybe it was not registered.');
        } else {
          var plugin = HeatmapConfig.plugins[pluginToLoad];
          // set plugin renderer and store
          this._renderer = new plugin.renderer(config);
          this._store = new plugin.store(config);
        }
      } else {
        this._renderer = new Renderer(config);
        this._store = new Store(config);
      }
      _connect(this);
    };

    // @TODO:
    // add API documentation
    Heatmap.prototype = {
      addData: function () {
        this._store.addData.apply(this._store, arguments);
        return this;
      },
      removeData: function () {
        this._store.removeData && this._store.removeData.apply(this._store, arguments);
        return this;
      },
      setData: function () {
        this._store.setData.apply(this._store, arguments);
        return this;
      },
      setMultiLayerData: function () {
        this._store.setMultiLayerData.apply(this._store, arguments);
        return this;
      },
      setDataMax: function () {
        this._store.setDataMax.apply(this._store, arguments);
        return this;
      },
      setDataMin: function () {
        this._store.setDataMin.apply(this._store, arguments);
        return this;
      },
      configure: function (config) {
        this._config = Util.merge(this._config, config);
        this._renderer.updateConfig(this._config);
        this._coordinator.emit('renderall', this._store._getInternalData());
        return this;
      },
      repaint: function () {
        this._coordinator.emit('renderall', this._store._getInternalData());
        return this;
      },
      getData: function () {
        return this._store.getData();
      },
      getDataURL: function () {
        return this._renderer.getDataURL();
      },
      getValueAt: function (point) {

        if (this._store.getValueAt) {
          return this._store.getValueAt(point);
        } else if (this._renderer.getValueAt) {
          return this._renderer.getValueAt(point);
        } else {
          return null;
        }
      }
    };

    return Heatmap;

  })();


  // core
  var heatmapFactory = {
    create: function (config) {
      return new Heatmap(config);
    },
    register: function (pluginKey, plugin) {
      HeatmapConfig.plugins[pluginKey] = plugin;
    }
  };

  return heatmapFactory;


});