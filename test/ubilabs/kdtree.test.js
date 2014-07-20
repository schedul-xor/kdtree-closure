require('nclosure').nclosure({additionalDeps:['deps.js']});
expect = require('expect.js');

goog.require('goog.math.Coordinate');
goog.require('ubilabs.KDTree');


describe('ubilabs.KDTree with 2 points',function(){
  var kdtree = new ubilabs.KDTree();

  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,2,4);

  kdtree.insert(point1);
  kdtree.insert(point2);

  it('should have balance factor ',function(){
    expect(kdtree.balanceFactor()).to.be(2);
  });

  it('should return point1 as nearest point of 1,2,2',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,2);
    var foundPoints = kdtree.nearest(approxPoint,1);
    expect(foundPoints.length).to.be(1);
    expect(foundPoints[0]).to.be(point1);
  });

  it('should return point1 as nearest point of 1,2,5',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,5);
    var foundPoints = kdtree.nearest(approxPoint,1);
    expect(foundPoints.length).to.be(1);
    expect(foundPoints[0]).to.be(point2);
  });
});


describe('ubilabs.KDTree with 3 points',function(){
  var kdtree = new ubilabs.KDTree();

  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,3,4);
  var point3 = new goog.math.Coordinate3(1,3,5);

  kdtree.insert(point1);
  kdtree.insert(point2);
  kdtree.insert(point3);

  it('should have balance factor',function(){
    expect(kdtree.balanceFactor()).to.be(1.8927892607143721);
  });
  it('should return point1 as nearest point of 1,2,2',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,2);
    var foundPoints = kdtree.nearest(approxPoint,1);
    expect(foundPoints.length).to.be(1);
    expect(foundPoints[0]).to.be(point1);
  });
  it('should return point3 as nearest point of 1,2,9',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,9);
    var foundPoints = kdtree.nearest(approxPoint,1);
    expect(foundPoints.length).to.be(1);
    expect(foundPoints[0]).to.be(point3);
  });
});


describe('ubilabs.KDTree with 10 points',function(){
  var kdtree = new ubilabs.KDTree();

  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,3,4);
  var point3 = new goog.math.Coordinate3(1,3,5);
  var point4 = new goog.math.Coordinate3(2,2,3);
  var point5 = new goog.math.Coordinate3(2,3,4);
  var point6 = new goog.math.Coordinate3(2,3,5);
  var point7 = new goog.math.Coordinate3(4,3,5);
  var point8 = new goog.math.Coordinate3(4,4,5);
  var point9 = new goog.math.Coordinate3(4,7,5);
  var point10 = new goog.math.Coordinate3(4,3,7);

  kdtree.insert(point1);
  kdtree.insert(point2);
  kdtree.insert(point3);
  kdtree.insert(point4);
  kdtree.insert(point5);
  kdtree.insert(point6);

  kdtree.remove(point1);
  kdtree.remove(point2);

  kdtree.insert(point7);
  kdtree.insert(point8);
  kdtree.insert(point9);
  kdtree.insert(point10);

  it('should have balance factor ',function(){
    expect(kdtree.balanceFactor()).to.be(2.6666666666666665);
  });

  it('should decrease balance factor after balance()',function(){
    kdtree.balance();
    expect(kdtree.balanceFactor()).to.be(1.4248287484320887);
  });

  it('should return all points in range',function(){
    var limits = [1,4,3,3,3,5];
    var resultVessel = [];
    kdtree.allPointsInRange(limits,resultVessel);
  });
});


describe('ubilabs.KDTree chebyshev function',function(){
  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,2,4);
  var point3 = new goog.math.Coordinate3(2,3,3);
  var point4 = new goog.math.Coordinate3(2,3,6);

  it('should return valid chebyshev distance',function(){
    expect(ubilabs.KDTree.chebyshevDistance(point1,point2)).to.be(1); // max = z axis |3-4|=1
    expect(ubilabs.KDTree.chebyshevDistance(point1,point3)).to.be(1); // max = x axis |1-2|=1 and y axis |2-3|=1
    expect(ubilabs.KDTree.chebyshevDistance(point1,point4)).to.be(3); // max = z axis |3-6|=3
  });
});
