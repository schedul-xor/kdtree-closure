goog.provide('ubilabs.KDTreeNode');

goog.require('goog.math.Coordinate3');



/**
 * @constructor
 */
ubilabs.KDTreeNode = function() {
  this.point_ = null;
  this.left_ = null;
  this.right_ = null;
  this.parent_ = null;
  this.dimIndex_ = 0;
};


/**
 * @param {?goog.math.Coordinate3} point
 */
ubilabs.KDTreeNode.prototype.setPoint = function(point) {
  this.point_ = point;
};


/**
 * @return {?goog.math.Coordinate3}
 */
ubilabs.KDTreeNode.prototype.getPoint = function() {
  return this.point_;
};


/**
 * @param {?ubilabs.KDTreeNode} parent
 */
ubilabs.KDTreeNode.prototype.setParent = function(parent) {
  this.parent_ = parent;
};


/**
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTreeNode.prototype.getParent = function() {
  return this.parent_;
};


/**
 * @param {!number} dimIndex
 */
ubilabs.KDTreeNode.prototype.setDimIndex = function(dimIndex) {
  this.dimIndex_ = dimIndex;
};


/**
 * @return {!number}
 */
ubilabs.KDTreeNode.prototype.getDimIndex = function() {
  return this.dimIndex_;
};


/**
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTreeNode.prototype.setLeft = function(node) {
  this.left_ = node;
};


/**
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTreeNode.prototype.getLeft = function() {
  return this.left_;
};


/**
 * @param {?ubilabs.KDTreeNode} node
 */
ubilabs.KDTreeNode.prototype.setRight = function(node) {
  this.right_ = node;
};


/**
 * @return {?ubilabs.KDTreeNode}
 */
ubilabs.KDTreeNode.prototype.getRight = function() {
  return this.right_;
};


/**
 * @return {!Object}
 */
ubilabs.KDTreeNode.prototype.toJSON = function() {
  var leftJSON = null;
  if (!goog.isNull(this.left_)) {
    leftJSON = this.left_.toJSON();
  }
  var rightJSON = null;
  if (!goog.isNull(this.right_)) {
    rightJSON = this.right_.toJSON();
  }
  return {
    left: leftJSON,
    right: rightJSON,
    point: [this.point_.x,this.point_.y,this.point_.z],
    dim: this.dimIndex_
  };
};
