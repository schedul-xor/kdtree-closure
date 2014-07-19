require('nclosure').nclosure({additionalDeps:['deps.js']});
expect = require('expect.js');

goog.require('goog.math.Coordinate');
goog.require('ubilabs.KDTree');


describe('ubilabs.KDTree with 2 points',function(){
  var kdtree = new ubilabs.KDTree(3);

  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,2,4);

  kdtree.insert(point1);
  kdtree.insert(point2);

  it('should have balance factor ',function(){
    expect(kdtree.balanceFactor(),2);
  });

  it('should return point1 as nearest point of 1,2,2',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,2);
    expect(kdtree.nearest(approxPoint,1),point1);
     });

  it('should return point1 as nearest point of 1,2,5',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,5);
    expect(kdtree.nearest(approxPoint,1),point1);
  });
});


describe('ubilabs.KDTree with 3 points',function(){
  var kdtree = new ubilabs.KDTree(3);

  var point1 = new goog.math.Coordinate3(1,2,3);
  var point2 = new goog.math.Coordinate3(1,3,4);
  var point3 = new goog.math.Coordinate3(1,3,5);

  kdtree.insert(point1);
  kdtree.insert(point2);
  kdtree.insert(point3);

  it('should have balance factor ',function(){
    expect(kdtree.balanceFactor(),1.8927892607143721);
  });
  it('should return point1 as nearest point of 1,2,2',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,2);
    expect(kdtree.nearest(approxPoint,1),point1);
     });
  it('should return point3 as nearest point of 1,2,9',function(){
    var approxPoint = new goog.math.Coordinate3(1,2,9);
    expect(kdtree.nearest(approxPoint,1),point3);
     });
});

describe('ubilabs.KDTree',function(){
  var kdtree = new ubilabs.KDTree(3);

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
    expect(kdtree.balanceFactor(),2.6666666666666665);
  });

  it('should decrease balance factor after balance()',function(){
    kdtree.balance();
    expect(kdtree.balanceFactor(),1.4248287484320887);
     });

  it('should return all points in range',function(){
    var limits = [1,4,3,3,3,5];
       var resultVessel = [];
       kdtree.allPointsInRange(limits,resultVessel);
  });
});
