function SDCurve(params){
	this.init(params);
}

SDCurve.prototype.init = function(params){
	this._points = params.points;
	this._resolution = params.hasOwnProperty("resolution") ? params.resolution : 5;
	this._degree = params.hasOwnProperty("degree") ? Math.max(params.degree,2) : 2;
	this._type = params.hasOwnProperty("type") && this.isAcceptableType(params.type) ? params.type : "bspline";
	this._open = params.hasOwnProperty("open") ? params.open : true;
	this._catmullTension = params.hasOwnProperty("catmullTension") ? params.catmullTension : 0.5;
	
	this.subdivide();
};

SDCurve.prototype.isAcceptableType = function(type) {
	var s = ["bspline","dyn-levin","catmull-rom"];
	return s.includes(type);
}

SDCurve.prototype.points = function(pts) {
	if (pts != null) {
		var same = this._points.length == pts.length;
		this._points = pts;
		if(same)
			this.recalculate();
		else
			this.subdivide();
		this._arcCurve = null;
	}
	return this._points;
}

SDCurve.prototype.adjustPoints = function(ptMap) {
	for(var i in ptMap) {
		this._points[i] = ptMap[i];
	}
	
	function collapseRange(a,b) {
		return {min: Math.min(a.min, b.min), max: Math.max(a.max, b.max)};
	}
	
	var ranges = [];
	for(var i in ptMap) {
		ranges.push(this.indexRanges[i].reduce(collapseRange));
	}
	
	var totalRange = ranges.reduce(collapseRange);
	this.recalculate(totalRange.min, totalRange.max, this._type === "catmull-rom");
}

SDCurve.prototype.resolution = function(newres) {
	if(newres != null && newres != this._resolution) {
		this._resolution = newres;
		this.subdivide();
	}
	return this._resolution;
}

SDCurve.prototype.open = function(newopen) {
	if(newopen != null && newopen != this._open) {
		this._open = newopen;
		this.subdivide();
	}
	return this._open;
}

SDCurve.prototype.type = function(newtype) {
	if(newtype != null && newtype != this._type && this.isAcceptableType(newtype)) {
		this._type = newtype;
		this.subdivide();
	}
	return this._type;
}

SDCurve.prototype.degree = function(newdegree) {
	if(newdegree != null && newdegree != this._degree) {
		this._degree = Math.max(2,newdegree);
		if(this._type === "bspline")
			this.subdivide();
	}
	return this._degree;
}

SDCurve.prototype.catmullTension = function(newtension) {
	if(newtension != null && newtension != this._catmullTension) {
		this._catmullTension = Math.min(Math.max(0, newtension), 1);
		if(this._type === "catmull-rom")
			this.subdivide();
	}
	return this._catmullTension;
}

// returns an object with these fields
// pointOnCurve: the actual point on the curve that is closest to pt
// u: the distance along the arclength curve that matches pointOnCurve (0 <= u <= 1)
// index: the index of the point in the "curve()" array that matches u (closest point before u)
// weights: a map of how pointOnCurve was calculated, giving weights of which points in the points() array
SDCurve.prototype.pointAt = function(u) {
	if(this._arcCurve == null)
		this.computeArclengths();
	
	var info = this._arcCurve.eval(u);
	return {pointOnCurve: info.point,
		u: u,
		index: info.index,
		weights: sdUtil.addWeights(sdUtil.multWeights(1-info.uDelta, this._fine[info.index].weights), sdUtil.multWeights(info.uDelta, this._fine[info.index+1].weights)),
	};
}

SDCurve.prototype.curve = function() {
	return this._fine;
};

SDCurve.prototype.subdivide = function(){
	this._fine = this._points.map(function(d,i) { var map = {}; map[i] = 1; return { point: d, weights: map };});
		
	if(this._fine.length > 2) {
		if(this._type == "dyn-levin") {
			for(var s = 0; s < this._resolution; s++) {
				var newFine = [];
				var len = this._fine.length;

				for(var i=0; i < this._fine.length - (this._open ? 1 : 0); i++) {
					newFine.push(this._fine[i]);
					if(i==0 && this._open) // starting boundary case for open curve
						newFine.push(this.applyWeights([{weight:1/3, fine:this._fine[i]}, {weight:0.9375, fine:this._fine[i+1]}, 
														{weight:-1/3, fine:this._fine[i+2]}, {weight:0.0625, fine:this._fine[i+3]} ]));
					else if(i==this._fine.length-2 && this._open) // ending boundary case for open curve
						newFine.push(this.applyWeights([{weight:1/3, fine:this._fine[i+1]}, {weight:0.9375, fine:this._fine[i]}, 
														{weight:-1/3, fine:this._fine[i-1]}, {weight:0.0625, fine:this._fine[i-2]} ]));
					else // regular case (in the middle of open curve and all the time for closed curve)
						newFine.push(this.applyWeights([{weight:-0.0625, fine:this._fine[(i+len-1)%len]}, {weight:0.5625, fine:this._fine[i]}, 
														{weight:0.5625, fine:this._fine[(i+1)%len]}, {weight:-0.0625, fine:this._fine[(i+2)%len]} ]));
				}
				
				if(this._open) // ending point for open curve has the endpoint of previous level with no extra fine point
					newFine.push(this._fine[this._fine.length-1]);
						
				this._fine = newFine;
			}
		}
		else if(this._type == "bspline") {
			var odd = this._degree % 2 == 1;
			var loops = (this._degree - (odd ? 1 : 2)) / 2;			
					
			for(var s = 0; s < this._resolution; s++) {
				
				var newFine = [];
				var len = this._fine.length;
				var i = this._open ? 1 : 0;
	
				// first, add midpoint to all line segments
				for(var j=0; j<i; j++) {
					newFine.push(this._fine[j]);
				}
				for(var j=i; j<len-(this._open ? 2:0); j++) {
					newFine.push(this._fine[j]);					
					newFine.push(this.applyWeights([{weight:0.5, fine: this._fine[j]}, {weight: 0.5, fine: this._fine[(j+1)%len]} ]));
				}
				if(this._open) {
					newFine.push(this._fine[len-2]);
					newFine.push(this._fine[len-1]);
				}
				
				// if even degree, do an averaging step
				if(!odd) {
					this._fine = newFine;
					newFine = [];
					len = this._fine.length;
					i = this._open ? 1 : 0;
					if(this._open)
						newFine.push(this._fine[0]);
					for(var j=0; j<len-i; j++)
						newFine.push(this.applyWeights([{weight:0.5, fine: this._fine[j]}, {weight: 0.5, fine: this._fine[(j+1)%len]} ]));
					if(this._open)
						newFine.push(this._fine[len-1]);
				}
				// finally, do the 2-step smoothing step "loops" times
				for(var loop=0; loop<loops; loop++) {
					this._fine = newFine;
					newFine = [];
					len = this._fine.length;
					
					if(this._open) {
						newFine.push(this._fine[0]);
						//if(odd)
						newFine.push(this.applyWeights([{weight:0.75, fine: this._fine[0]}, {weight: 0.25, fine: this._fine[1]} ]));
					}
					for(var j=0; j<len-(this._open?2:0); j++)
						newFine.push(this.applyWeights([{weight:0.25, fine: this._fine[j]}, {weight: 0.5, fine: this._fine[(j+1)%len]}, 
														{weight: 0.25, fine: this._fine[(j+2)%len]} ]));
					if(this._open) {
						//if(odd)
						newFine.push(this.applyWeights([{weight:0.25, fine: this._fine[len-2]}, {weight: 0.75, fine: this._fine[len-1]} ]));
						newFine.push(this._fine[len-1]);
					}
				}
				
				this._fine = newFine;				
			}
		}
		else if(this._type == "catmull-rom") {
			if(this._resolution > 0) {
				var _this = this;
				
				var newfine = [];
				if(this._open) {
					// duplicate endpoints
					var newfine = [this._fine[0]];
					Array.prototype.push.apply(newfine,this._fine);
					newfine.push(this._fine[this._fine.length-1]);
					
					this._fine = newfine;
					newfine = [];
				}
				
				for(var crindex=0; crindex<this._fine.length-(this._open ? 3 : 0); crindex++) {
					var npts = Math.pow(2,this._resolution);
					for(var i=(crindex == 0 ? 0 : 1); i<=npts; i++) {
						newfine.push(this.doCatmull(crindex, i/npts,this._fine));						
					}
				}
						
				this._fine = newfine;
			}
		}
		
		if(!this._open) // close the loop if need be
			this._fine.push(this._fine[0]);
	}
		
	this.findIndexRanges();
	this._arcCurve = null;	
};

// an internal function for computing catmull-rom subdivision
SDCurve.prototype.doCatmull = function(startingIndex, tFactor, adjustedPoints) {
	var _this = this;
	function tj(ti, Pi, Pj) {
		var dx = Pj.point.x - Pi.point.x, dy = Pj.point.y - Pi.point.y;
		return Math.pow(Math.sqrt(dx*dx + dy*dy),_this._catmullTension) + ti;
	}
	
	var len = adjustedPoints.length;
	
	var P0 = adjustedPoints[startingIndex], P1 = adjustedPoints[(startingIndex+1)%len];
	var P2 = adjustedPoints[(startingIndex+2)%len], P3 = adjustedPoints[(startingIndex+3)%len];
					
	var t0 = 0;
	var t1 = tj(t0, P0, P1);
	var t2 = tj(t1, P1, P2);
	var t3 = tj(t2, P2, P3);
		
	var t = t1 + (t2-t1) * tFactor;
	var A1 = t1-t0==0 ? P0 : this.applyWeights([{weight:(t1-t)/(t1-t0), fine: P0}, {weight: (t-t0)/(t1-t0), fine: P1} ]);
	var A2 = t2-t1==0 ? P1 : this.applyWeights([{weight:(t2-t)/(t2-t1), fine: P1}, {weight: (t-t1)/(t2-t1), fine: P2} ]);
	var A3 = t3-t2==0 ? P2 : this.applyWeights([{weight:(t3-t)/(t3-t2), fine: P2}, {weight: (t-t2)/(t3-t2), fine: P3} ]);
	
	var B1 = t2-t0==0 ? A1 : this.applyWeights([{weight:(t2-t)/(t2-t0), fine: A1}, {weight: (t-t0)/(t2-t0), fine: A2} ]);
	var B2 = t3-t1==0 ? A2 : this.applyWeights([{weight:(t3-t)/(t3-t1), fine: A2}, {weight: (t-t1)/(t3-t1), fine: A3} ]);
	
	var C = t2-t1==0 ? B1 : this.applyWeights([{weight:(t2-t)/(t2-t1), fine: B1}, {weight: (t-t1)/(t2-t1), fine: B2} ]);
	C.tags = [startingIndex, tFactor];
	return C;	
}

// finds the min and max influence each control point has over the fine curve
SDCurve.prototype.findIndexRanges = function() {
	this.indexRanges = {};
	var _this = this;
	
	function addIndexRange(i, min, max) {
		if(i in _this.indexRanges)
			_this.indexRanges[i].push({min:min, max:max});
		else
			_this.indexRanges[i] = [{min:min, max:max}];
	}
	
	var started = {};
	
	// this loop is O(n)
	for(var i=0; i<this._fine.length; i++) {
		for(var w in this._fine[i].weights)
			if(!(w in started))
				started[w] = i;
		if(i > 0) {
			for(var w in this._fine[i-1].weights)
				if(!(w in this._fine[i].weights)) {
					addIndexRange(w, started[w], i-1);
					delete started[w];
				}
		}
		if(i == this._fine.length-1) {
			for(var w in this._fine[i].weights)
				if(w in started) {
					addIndexRange(w, started[w], i);
					delete started[w];
				}
		}
	}	
}

// recalculate the fine curve between indices min and max
// the control point positions may have changed but the weights have not
SDCurve.prototype.recalculate = function(min, max, redoCatmull) {
	var len = this._fine.length;
	if(min==null || max==null) {
		min=0;	max = len-1;
	}
	for(var i=min; i<=max; i++) {
		var pt; 
		
		// we can't reuse the old weights for catmull-rom, sadly, because they are based on length of line segments
		// so we basically just have to recompute the moving parts from scratch
		if(redoCatmull) {
			var mappedPoints = this._points.map(function(d,i) { var map = {}; map[i] = 1; return { point: d, weights: map };});
			var adjustedPoints = [];
			if(this._open) 
				adjustedPoints.push(mappedPoints[0]);
			Array.prototype.push.apply(adjustedPoints,mappedPoints);
			if(this._open) 
				adjustedPoints.push(mappedPoints[mappedPoints.length-1]);
			
			this._fine[i] = this.doCatmull(this._fine[i].tags[0], this._fine[i].tags[1], adjustedPoints);
		}
		else {
			pt = {x:0, y:0};
			for(var ind in this._fine[i].weights) {
				pt.x += this._fine[(i+len)%len].weights[ind] * this._points[ind].x;
				pt.y += this._fine[(i+len)%len].weights[ind] * this._points[ind].y;
			}
			this._fine[i].point = pt;
		}
	}
	this._arcCurve = null;
}

// given a series of points and weights to apply, multiply and add up these factors until we get the final point and its final weights
SDCurve.prototype.applyWeights = function(wgtArray) {
	var partialPts = wgtArray.map(function(d,i) {
		return sdUtil.mult(d.weight, d.fine.point);
	});
	var finalPt = partialPts.reduce(function(a,b) {
		return sdUtil.add(a,b);
	});
	
	var partialWts = wgtArray.map(function(d) {
		return sdUtil.multWeights(d.weight,d.fine.weights);
	});
	var finalWt = partialWts.reduce(function(a,b) {
		return sdUtil.addWeights(a,b);
	});
	
	return {point: finalPt, weights: finalWt};
}

// returns an object with these fields
// pointOnCurve: the actual point on the curve that is closest to pt
// u: the distance along the arclength curve that matches pointOnCurve (0 <= u <= 1)
// index: the index of the point in the "curve()" array that matches u (closest point before u)
// weights: a map of how pointOnCurve was calculated, giving weights of which points in the points() array
// distance: the distance between pt and pointOnCurve
SDCurve.prototype.getClosestPoint = function(pt) {
	var bestDist = Number.MAX_VALUE;
	var d;
	var bestIndex = -1;
	var temp, bestPt;
	for (var i = 1; i < this._fine.length; i++)
	{
		temp = sdUtil.projectPointOntoLine(this._fine[i - 1].point, this._fine[i].point, pt);
		if (temp.distance < bestDist)
		{
			bestDist = temp.distance;
			bestIndex = i;
			bestPt = temp.point;
		}
	}

	// figure out what U value got actually hit in the middle of the line
	// (hit - endpoint) is some percentage of the total line segment, use that to divide the U value of the segment

	var segLength = Math.sqrt(sdUtil.lengthSqr(sdUtil.minus(bestPt, this._fine[bestIndex - 1].point))); // (bestPt - pts[bestIndex-1]).Length()
	var totalLength = Math.sqrt(sdUtil.lengthSqr(sdUtil.minus(this._fine[bestIndex].point, this._fine[bestIndex - 1].point))); // (pts[bestIndex] - pts[bestIndex-1]).Length()
	var percent = segLength / totalLength;

	if(this._arcCurve == null)
		this.computeArclengths();
	
	return {
		pointOnCurve: bestPt, 
		u: (1 - percent) * this._arcCurve.arclengths[bestIndex - 1] + percent * this._arcCurve.arclengths[bestIndex],
		index: bestIndex-1,
		weights: sdUtil.addWeights(sdUtil.multWeights(1-percent, this._fine[bestIndex-1].weights), sdUtil.multWeights(percent, this._fine[bestIndex].weights)),
		distance: bestDist
	};	
}

SDCurve.prototype.computeArclengths = function() {
	this._arcCurve = new ArclengthCurve(this._fine.map(function(d) { return d.point; }));
}

// moves a given point on the curve by a certain delta
// pointToMove is returned from either pointAt() or getClosestPoint(), you must provide this info as your "point on curve" to move
// delta is a vector for the amount you want to move the above point to
// width (if not provided, width = 1) indicates how much of the curve you want to affect when you move this point
SDCurve.prototype.moveCurve = function(pointToMove, delta, width) {
	if(width == null)
		width = 1;
	var sorted = Object.keys(pointToMove.weights)
	.sort(function (a, b) {
		   return pointToMove.weights[b] - pointToMove.weights[a];
		 });

	var ptsToMove = Math.min(sorted.length, Math.min(width, this._points.length));
	var sum = 0;
	for(var i=0; i<ptsToMove; i++) 
		sum += pointToMove.weights[sorted[i]];
		
	var ptMap = {};
		
	for(var i=0; i<ptsToMove; i++) {
		var ptDelta = sdUtil.mult(1 / sum, delta);
		ptMap[sorted[i]] = sdUtil.add(ptDelta,this._points[sorted[i]]); //pts[sorted[i]];
	}
	
	this.adjustPoints(ptMap);
	return ptMap;
}


function ArclengthCurve(ptList) {
	this.pts = []; // array of objects with x and y keys
	this.arclengths = []; // array of float
	this.length = 0;
		
	if(ptList.length > 1) {
		ptList.forEach(this.addPoint, this);
	}
	else if(pt.List.length == 1){
		this.addPoint(ptList[0]);
		this.addPoint(sdUtil.add(ptList[0], {x:1,y:1})); // a dummy point so our class doesn't mess up
	}
	
	this.setArclengths();
}

ArclengthCurve.prototype.clear = function() {
	this.pts = [];
	this.arclengths = [];
	this.length = 0;
}

// adds a point, making sure it's not a duplicate of the last point added
ArclengthCurve.prototype.addPoint = function(p) {
	if(this.pts.length == 0 || !(p.x === this.pts[this.pts.length-1].x && p.y === this.pts[this.pts.length-1].y))
		this.pts.push(p);
}

// compute the arclengths of our pts array
ArclengthCurve.prototype.setArclengths = function() {
	var total = 0;
	this.arclengths.push(0);
	var tan;
	for(var i=1; i<this.pts.length; i += 1) {
		tan = sdUtil.minus(this.pts[i], this.pts[i-1]);
		total += Math.sqrt(sdUtil.lengthSqr(tan));
		this.arclengths.push(total);
	}
	for(var i=1; i<this.pts.length; i += 1) {
		this.arclengths[i] = this.arclengths[i] / total; // divide by the total length
	}
	
	this.length = total;
}

// returns point on the curve at 0 <= u <= 1
// return object contains:
// point: the actual point on the curve (in practice, you will most likely only use this value)
// index: the closest index (to the left) of the series of fine points before u
// uDelta: the distance between index and index+1 (ie, how far along the small line segment is u)
ArclengthCurve.prototype.eval = function(u) {	
	var index, delta;
	if(u >= 1) {
		index = this.pts.length-2;
		delta = 1;
	}
	else {
		index = this.getUIndex(u);
		delta = (u - this.arclengths[index]) / (this.arclengths[index+1] - this.arclengths[index]);	
	}
	return {point: sdUtil.add(sdUtil.mult(1-delta, this.pts[index]), sdUtil.mult(delta, this.pts[index+1])), 
		index: index,
		uDelta: delta};
}

// does binary search
ArclengthCurve.prototype.getUIndex = function(u) {
	if(u <= 0)
		return 0;
	if(u >= 1)
		return this.arclengths.length-1;
	var imin = 0, imax = this.arclengths.length - 1, imid;
	var res = -1;
	while (imin <= imax && res < 0)
	{
		imid = Math.floor((imin + imax) / 2);
		if (this.arclengths[imid] <= u && this.arclengths[imid + 1] >= u)
			res = imid;
		else if (this.arclengths[imid] > u)
			imax = imid - 1;
		else
			imin = imid + 1;
	}
	return res;
}

var sdUtil = (function () {
	var classmap = {};
	
	classmap.mult = function(constant, pt) {
		return {x: constant * pt.x, y: constant * pt.y};
	}

	// pass in as many points as you like
	classmap.add = function() {
		var x = 0, y = 0;
		for(var i=0; i<arguments.length; i++)
		{ x += arguments[i].x; y += arguments[i].y }
		return {x: x, y: y};
	}
	classmap.minus = function(pt1, pt2) {
		return {x: pt1.x - pt2.x, y:pt1.y - pt2.y};
	}
	classmap.lengthSqr = function(pt) {
		return pt.x*pt.x + pt.y*pt.y;
	}
	classmap.distanceSqr = function(pt1, pt2) {
		return (pt1.x - pt2.x) * (pt1.x - pt2.x) + (pt1.y - pt2.y) * (pt1.y - pt2.y);
	}
	classmap.dot = function(pt1, pt2) {
		return pt1.x * pt2.x + pt1.y * pt2.y;
	}

	classmap.multWeights = function(constant, wt) {
		var newmap = {};
		for(var k in wt)
			newmap[k] = wt[k] * constant;
		return newmap;
	}
	classmap.addWeights = function(a, b) {
		var newmap = {};
		for(var k in a)
			if(k in b)
				newmap[k] = a[k] + b[k];
			else
				newmap[k] = a[k];
		for(var k in b)
			if(!(k in a))
				newmap[k] = b[k];
		return newmap;
	}

	// returns an object with these fields
	// distance: the square of the distance between P and the line segment sA, sB
	// t: the parameter value (0 <= t <= 1) of the closest point to P along sA, sB
	classmap.dist2PointToSegment = function(P, sA, sB) {
		var v = sdUtil.minus(sB, sA);
		var w = sdUtil.minus(P, sA);
		var c1 = sdUtil.dot(w, v);
		var c2 = sdUtil.dot(v, v);
		var t = c1 / c2;

		t = Math.max(0, Math.min(t, 1));
		var dist;
		
		if (t < 0)
			dist = sdUtil.distanceSqr(P, sA);
		else if (t > 1)
			dist = sdUtil.distanceSqr(P, sB);
		else
			dist = sdUtil.distanceSqr(P, sdUtil.add(sA, sdUtil.mult(t,v)));
		return {distance: dist, t: t};
	}

	// returns an object with these fields
	// point: the point of projection for p onto the line segment line1, line2
	// distance: the distance between p and point
	classmap.projectPointOntoLine = function(line1, line2, p)
	{
		var dist = classmap.dist2PointToSegment(p, line1, line2);
		var pt = sdUtil.add(line1, sdUtil.mult(dist.t, sdUtil.minus(line2,line1)));
		return {point: pt, distance: Math.sqrt(dist.distance)};
	}
	
	return classmap;
})();

module.exports = {
	SDCurve :SDCurve,
}
