goog.provide('ubilabs.KDTree');

goog.require('goog.asserts');
goog.require('goog.math.Coordinate3');
goog.require('goog.structs.PriorityQueue');
goog.require('ubilabs.KDTreeNode');



/**
 * @constructor
 * @description k-d Tree Javascript
 * @author pricop@ubilabs.net (Mircea Pricop)
 * @author kleppe@ubilabs.net (Martin Kleppe)
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 * @see https://github.com/ubilabs/kd-tree-javascript
 */
ubilabs.KDTree = function() {
  this.metric_ = ubilabs.KDTree.chebyshevDistance;
  this.rootNode_ = null;
  this.resultVessel_ = [];
  this.nodePool_ = [];
  this.balanceBuffer_ = [];
  this.pointSortWorkspace_ = [];
  this.dimension_ = 3;
  this.dim2SortFunction_ = [
    ubilabs.KDTree.xSort,
    ubilabs.KDTree.ySort,
    ubilabs.KDTree.zSort
  ];
};


/**
 * For coordinate p, if i==0 then return coord x, i == 1 then
 * return coord y, i == 2 then return coord z.
 */
ubilabs.KDTree.getC = function(p, i){
  goog.asserts.assertInstanceof(p, goog.math.Coordinate3);
  goog.asserts.assertNumber(i);
  goog.asserts.assert(i >= 0);
  goog.asserts.assert(i < 3);

  switch(i){
  case 0:
    return p.x;
  case 1:
    return p.y;
  case 2:
    return p.z;
  }
  goog.asserts.fail();
};


/**
 * @param {?goog.math.Coordinate3} p1
 * @param {?goog.math.Coordinate3} p2
 * @return {!number}
 */
ubilabs.KDTree.chebyshevDistance = function(p1, p2){
  if (goog.isNull(p1) || goog.isNull(p2)) {return 0;}
  goog.asserts.assertInstanceof(p1, goog.math.Coordinate3);
  goog.asserts.assertInstanceof(p2, goog.math.Coordinate3);
  var max = -1, abs;
  for (var i = 0; i < 3; i++) {
    abs = ubilabs.KDTree.getC(p1,i) - ubilabs.KDTree.getC(p2,i);
    if (abs < 0) {abs = -abs;}
    if (max == -1 || max < abs) {
      max = abs;
    }
  }
  return max;
};


/**
 * @private
 * @return {!ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.allocateNode_ = function() {
  if (this.nodePool_.length === 0) {
    return new ubilabs.KDTreeNode();
  }
  var n = this.nodePool_.pop();
  n.setLeft(null);
  n.setRight(null);
  return n;
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTree.prototype.freeNode_ = function(node) {
  if (goog.isNull(node)) {
    return;
  }
  this.nodePool_.push(/** @type {!ubilabs.KDTreeNode} */ (node));
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTree.prototype.freeNodeWithChildren_ = function(node) {
  if (goog.isNull(node)) {
    return;
  }
  this.freeNode_(/** @type {!ubilabs.KDTreeNode} */ (node));
  if (!goog.isNull(node.getLeft())) {
    this.freeNodeWithChildren_(node.getLeft());
  }
  if (!goog.isNull(node.getRight())) {
    this.freeNodeWithChildren_(node.getRight());
  }
};


/**
 * @private
 * @param {!goog.math.Coordinate3} point
 * @param {?ubilabs.KDTreeNode} node
 * @param {?ubilabs.KDTreeNode} parent
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.innerSearch_ = function(point, node, parent) {
  if (goog.isNull(node)) {
    return parent;
  }

  var dimIndex = node.getDimIndex();
  if (ubilabs.KDTree.getC(point,dimIndex) < ubilabs.KDTree.getC(node.getPoint(),dimIndex)) {
    return this.innerSearch_(point, node.getLeft(), node);
  } else {
    return this.innerSearch_(point, node.getRight(), node);
  }
};


/**
 * @param {?goog.math.Coordinate3} point
 */
ubilabs.KDTree.prototype.insert = function(point) {
  if (goog.isNull(point)) {
    return;
  }

  if (goog.isNull(this.rootNode_)) {
    this.rootNode_ = this.allocateNode_();
    this.rootNode_.setPoint(point);
    this.rootNode_.setDimIndex(0);
    this.rootNode_.setParent(null);
    return;
  }

  var insertNode = this.innerSearch_(point, this.rootNode_, null),
      newNode,dimIndex;

  newNode = this.allocateNode_();
  newNode.setPoint(point);
  newNode.setDimIndex((insertNode.getDimIndex() + 1) % this.dimension_);
  newNode.setParent(insertNode);
  dimIndex = insertNode.getDimIndex();

  if (ubilabs.KDTree.getC(point,dimIndex) < ubilabs.KDTree.getC(insertNode.getPoint(),dimIndex)) {
    insertNode.setLeft(newNode);
  } else {
    insertNode.setRight(newNode);
  }
};


/**
 * @private
 * @param {!goog.math.Coordinate3} point
 * @param {?ubilabs.KDTreeNode} node
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.nodeSearch_ = function(point, node) {
  if (goog.isNull(node)) {
    return null;
  }

  if (node.getPoint() === point) {
    return node;
  }

  var dimIndex = node.getDimIndex();

  if (ubilabs.KDTree.getC(point,dimIndex) < ubilabs.KDTree.getC(node.getPoint(),dimIndex)) {
    return this.nodeSearch_(point, node.getLeft());
  } else {
    return this.nodeSearch_(point, node.getRight());
  }
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 * @param {!number} dimIndex
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.findMax_ = function(node, dimIndex) {
  var own,leftNode,rightNode,maxNode;

  if (goog.isNull(node)) {
    return null;
  }

  if (node.getDimIndex() === dimIndex) {
    if (!goog.isNull(node.getRight())) {
      return this.findMax_(node.getRight(), dimIndex);
    }
    return node;
  }

  own = ubilabs.KDTree.getC(node.getPoint(),dimIndex);
  leftNode = this.findMax_(node.getLeft(), dimIndex);
  rightNode = this.findMax_(node.getRight(), dimIndex);
  maxNode = node;

  if (!goog.isNull(leftNode) && ubilabs.KDTree.getC(leftNode.getPoint(),dimIndex) > own) {
    maxNode = leftNode;
  }

  if (!goog.isNull(rightNode) &&
      ubilabs.KDTree.getC(rightNode.getPoint(),dimIndex) >
      ubilabs.KDTree.getC(maxNode.getPoint(),dimIndex)) {
    maxNode = rightNode;
  }
  return maxNode;
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 * @param {!number} dimIndex
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.findMin_ = function(node, dimIndex) {
  var own, leftNode, rightNode, minNode;

  if (goog.isNull(node)) {
    return null;
  }

  if (node.getDimIndex() === dimIndex) {
    if (!goog.isNull(node.getLeft())) {
      return this.findMin_(node.getLeft(), dimIndex);
    }
    return node;
  }

  own = ubilabs.KDTree.getC(node.getPoint(),dimIndex);
  leftNode = this.findMin_(node.getLeft(), dimIndex);
  rightNode = this.findMin_(node.getRight(), dimIndex);
  minNode = node;

  if (!goog.isNull(leftNode) && ubilabs.KDTree.getC(leftNode.getPoint(),dimIndex) < own) {
    minNode = leftNode;
  }
  if (!goog.isNull(rightNode) &&
      ubilabs.KDTree.getC(rightNode.getPoint(),dimIndex) <
      ubilabs.KDTree.getC(minNode.getPoint(),dimIndex)) {
    minNode = rightNode;
  }
  return minNode;
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTree.prototype.removeNode_ = function(node) {
  if (goog.isNull(node)) { return; }
  var nextNode,nextPoint,parentDimIndex;

  if (goog.isNull(node.getLeft()) && goog.isNull(node.getRight())) {
    if (goog.isNull(node.getParent())) {
      this.freeNode_(this.rootNode_);
      this.rootNode_ = null;
      return;
    }

    parentDimIndex = node.getParent().getDimIndex();

    if (ubilabs.KDTree.getC(node.getPoint(),parentDimIndex) <
        ubilabs.KDTree.getC(node.getParent().getPoint(),parentDimIndex)) {
      this.freeNode_(node.getParent().getLeft());
      node.getParent().setLeft(null);
    } else {
      this.freeNode_(node.getParent().getRight());
      node.getParent().setRight(null);
    }
    return;
  }

  if (!goog.isNull(node.getLeft())) {
    nextNode = this.findMax_(node.getLeft(), node.getDimIndex());
  } else {
    nextNode = this.findMin_(node.getRight(), node.getDimIndex());
  }

  nextPoint = nextNode.getPoint();
  this.removeNode_(nextNode);
  node.setPoint(nextPoint);
};


/**
 * @param {!goog.math.Coordinate3} point
 */
ubilabs.KDTree.prototype.remove = function(point) {
  var node = this.nodeSearch_(point, this.rootNode_);

  if (goog.isNull(node)) { return; }

  this.removeNode_(node);
};


/**
 * @private
 * @param {!ubilabs.KDTreeNode} node
 * @param {!number} distance
 * @param {!goog.structs.PriorityQueue} heap
 * @param {!Object.<number, Array.<ubilabs.KDTreeNode>>} heapMap
 * @param {!number} desiredCount
 */
ubilabs.KDTree.prototype.saveNodeToHeap_ = function(node, distance, heap, heapMap, desiredCount) {
  heap.enqueue(distance,distance);
  if (!goog.object.containsKey(heapMap, distance)) {
    heapMap[distance] = [];
  }
  heapMap[distance].push(node);
};


/**
 * @private
 * @param {!goog.math.Coordinate3} point
 * @param {?ubilabs.KDTreeNode} node
 * @param {!goog.structs.PriorityQueue} heap
 * @param {!Object.<!number, !Array.<!ubilabs.KDTreeNode>>} heapMap
 * @param {!number} desiredCount
 */
ubilabs.KDTree.prototype.nearestSearch_ =function(point, node, heap, heapMap, desiredCount) {
  if (goog.isNull(node)) {return;}

  var bestChild,
      dimIndex = node.getDimIndex(),
      ownDistance = this.metric_(point, node.getPoint()),
      linearPoint, otherChild, i;

  if (i === node.getDimIndex()) {
    linearPoint = point;
  } else {
    linearPoint = node.getPoint();
  }

  var linearDistance = this.metric_(linearPoint, node.getPoint());

  if (goog.isNull(node.getRight()) && goog.isNull(node.getLeft())) {
    if (heap.getCount() < desiredCount || ownDistance < heap.peekKey()) {
      this.saveNodeToHeap_(node, ownDistance, heap, heapMap, desiredCount);
    }
    return;
  }

  if (goog.isNull(node.getRight())) {
    bestChild = node.getLeft();
  } else if (goog.isNull(node.getLeft())) {
    bestChild = node.getRight();
  } else {
    if (ubilabs.KDTree.getC(point,dimIndex) < ubilabs.KDTree.getC(node.getPoint(),dimIndex)) {
      bestChild = node.getLeft();
    } else {
      bestChild = node.getRight();
    }
  }

  this.nearestSearch_(point, bestChild, heap, heapMap, desiredCount);

  if (heap.getCount() < desiredCount || ownDistance < heap.peekKey()) {
    this.saveNodeToHeap_(node, ownDistance, heap, heapMap, desiredCount);
  }

  if (heap.getCount() < desiredCount || Math.abs(linearDistance) < heap.peekKey()) {
    if (bestChild === node.getLeft()) {
      otherChild = node.getRight();
    } else {
      otherChild = node.getLeft();
    }
    if (!goog.isNull(otherChild)) {
      this.nearestSearch_(point, otherChild, heap, heapMap, desiredCount);
    }
  }
};


/**
 * @param {!goog.math.Coordinate3} point
 * @param {!number} desiredCount
 * @return {!Array.<!goog.math.Coordinate3>}
 */
ubilabs.KDTree.prototype.nearest = function(point, desiredCount) {
  var heap = new goog.structs.PriorityQueue();
  var heapMap = {};

  this.nearestSearch_(point, this.rootNode_, heap, heapMap, desiredCount);

  this.resultVessel_.length = 0;
  for (var i = 0; i < desiredCount; i += 1) {
    var distance = heap.dequeue();
    goog.array.forEach(heapMap[distance], function(foundNode, index) {
      var foundPoint = foundNode.getPoint();
      this.resultVessel_.push(foundPoint);
    }, this);
  }
  return this.resultVessel_;
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 * @return {!number}
 */
ubilabs.KDTree.prototype.height_ = function(node) {
  if (goog.isNull(node)) {
    return 0;
  }
  return Math.max(this.height_(node.getLeft()),this.height_(node.getRight())) + 1;
};


/**
 * @private
 * @param {?ubilabs.KDTreeNode} node
 * @return {!number}
 */
ubilabs.KDTree.prototype.count_ = function(node) {
  if (goog.isNull(node)) {
    return 0;
  }
  return this.count_(node.getLeft()) + this.count_(node.getRight()) + 1;
};


/**
 * @return {!number}
 */
ubilabs.KDTree.prototype.balanceFactor = function() {
  return this.height_(this.rootNode_) /
      (Math.log(this.count_(this.rootNode_)) / Math.log(2));
};


/**
 * @private
 * @param {!Array.<goog.math.Coordinate3>} targetPoints
 * @param {!number} offset
 * @param {!number} length
 * @param {!function(ubilabs.KDTreeNode, ubilabs.KDTreeNode):number} compareFunction
 */
ubilabs.KDTree.prototype.partialSort_ =
    function(targetPoints, offset, length, compareFunction) {
  var i;
  this.pointSortWorkspace_.length = 0;
  for (i = 0; i < length; i++) {
    this.pointSortWorkspace_.push(targetPoints[offset + i]);
  }
  this.pointSortWorkspace_.sort(compareFunction);
  for (i = 0; i < length; i++) {
    targetPoints[offset + i] = this.pointSortWorkspace_[i];
  }
};


/**
 * @private
 * @param {!Array.<goog.math.Coordinate3>} points
 * @param {!number} offset
 * @param {!number} length
 * @param {!number} depth
 * @param {?ubilabs.KDTreeNode} parent
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTree.prototype.buildTree_ =function(points, offset, length, depth, parent) {
  var dim = depth % this.dimension_,median, node;

  if (length === 0) {
    return null;
  }
  if (length === 1) {
    node = this.allocateNode_();
    node.setPoint(points[0]);
    node.setDimIndex(dim);
    node.setParent(parent);
    return node;
  }

  this.partialSort_(points, offset, length, this.dim2SortFunction_[dim]);

  median = Math.floor(length / 2);

  node = this.allocateNode_();
  node.setPoint(points[median]);
  node.setDimIndex(dim);
  node.setParent(parent);
  node.setLeft(this.buildTree_(points,0, median, depth + 1, node));
  node.setRight(this.buildTree_(points,median + 1, median - 1, depth + 1, node));

  return node;
};


/**
 * @private
 * @param {!Array.<goog.math.Coordinate3>} savingPoints
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTree.prototype.savePoints_ = function(savingPoints, node) {
  savingPoints.push(node.getPoint());
  if (!goog.isNull(node.getLeft())) {
    this.savePoints_(savingPoints, node.getLeft());
  }
  if (!goog.isNull(node.getRight())) {
    this.savePoints_(savingPoints, node.getRight());
  }
};


/**
 * Re-balance the tree.
 */
ubilabs.KDTree.prototype.balance = function() {
  this.balanceBuffer_.length = 0;
  this.savePoints_(this.balanceBuffer_, this.rootNode_); // Fill the points
  this.freeNodeWithChildren_(this.rootNode_);
  this.rootNode_ = this.buildTree_(this.balanceBuffer_, 0,this.balanceBuffer_.length, 0, null);
};


/**
 * @private
 * @param {!Array.<!number>} limits
 * @param {!Array.<!goog.math.Coordinate3>} resultVessel
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTree.prototype.allPointsInRangeForNode_ =
    function(limits, resultVessel, node) {
  if (goog.isNull(node)) {
    return;
  }
  var dimIndex = node.getDimIndex();
  var min = limits[dimIndex * 2];
  var max = limits[dimIndex * 2 + 1];
  var currentPoint = node.getPoint();
  var current = ubilabs.KDTree.getC(currentPoint,dimIndex);

  // Ignore smaller(left) nodes
  if (current <= max) {
    this.allPointsInRangeForNode_(limits, resultVessel, node.getRight());
  }

  // Ignore bigger(right) nodes
  if (current >= min) {
    this.allPointsInRangeForNode_(limits, resultVessel, node.getLeft());
  }

  var isIncluded = true;
  for (var i = 0; i < this.dimension_; i++) {
    var dmin = limits[i * 2];
    var dmax = limits[i * 2 + 1];
    var dc = ubilabs.KDTree.getC(currentPoint,i);
    if (dc < dmin || dc > dmax) {
      isIncluded = false;
      break;
    }
  }
  if (isIncluded) {
    resultVessel.push(currentPoint);
  }
};


/**
 * @param {!Array.<!number>} limits
 * @param {!Array.<!goog.math.Coordinate3>} resultVessel
 */
ubilabs.KDTree.prototype.allPointsInRange =
    function(limits, resultVessel) {
  goog.asserts.assert(limits.length == this.dimension_ * 2,
                      'Limit length should be ' + this.dimension_ + '*2');
  if (goog.isNull(this.rootNode_)) {
    return;
  }
  this.allPointsInRangeForNode_(limits, resultVessel, this.rootNode_);
};


/**
 * @return {?Object}
 */
ubilabs.KDTree.prototype.toJSON = function() {
  if (!goog.isNull(this.rootNode_)) {
    return this.rootNode_.toJSON();
  }
  return null;
};


/**
 * @param {!goog.math.Coordinate3} p1
 * @param {!goog.math.Coordinate3} p2
 * @return {!number}
 */
ubilabs.KDTree.xSort = function(p1, p2){
  goog.asserts.assertInstanceof(p1, goog.math.Coordinate3);
  goog.asserts.assertInstanceof(p2, goog.math.Coordinate3);

  return p1.x-p2.x;
};


/**
 * @param {!goog.math.Coordinate3} p1
 * @param {!goog.math.Coordinate3} p2
 * @return {!number}
 */
ubilabs.KDTree.ySort = function(p1, p2){
  goog.asserts.assertInstanceof(p1, goog.math.Coordinate3);
  goog.asserts.assertInstanceof(p2, goog.math.Coordinate3);

  return p1.y-p2.y;
};


/**
 * @param {!goog.math.Coordinate3} p1
 * @param {!goog.math.Coordinate3} p2
 * @return {!number}
 */
ubilabs.KDTree.zSort = function(p1, p2){
  goog.asserts.assertInstanceof(p1, goog.math.Coordinate3);
  goog.asserts.assertInstanceof(p2, goog.math.Coordinate3);

  return p1.z-p2.z;
};
