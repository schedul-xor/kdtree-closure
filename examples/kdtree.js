goog.require('goog.dom');
goog.require('goog.json.Serializer');
goog.require('goog.math.Coordinate');
goog.require('goog.ui.Button');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.Textarea');
goog.require('ubilabs.KDTree');


var kdt = new ubilabs.KDTree();

var inputXyz = new goog.ui.LabelInput('x,y,z');
inputXyz.render(goog.dom.getElement('input_xyz'));

var balanceFactorLabel = new goog.ui.LabelInput('balance_factor');
balanceFactorLabel.render(goog.dom.getElement('balance_factor'));

var jsonTextarea = new goog.ui.Textarea('');
jsonTextarea.render(goog.dom.getElement('json'));

var button = new goog.ui.Button('Insert');
button.render(goog.dom.getElement('insert_into_kdtree'));

var jsonSerializer = new goog.json.Serializer();

goog.events.listen(button,goog.ui.Component.EventType.ACTION, function(e) {
  var xyz = inputXyz.getValue();
  var a = xyz.split(',');
  var x = Number(a[0].trim());
  var y = Number(a[1].trim());
  var z = Number(a[2].trim());
  var point = new goog.math.Coordinate3(x,y,z);

  kdt.insert(point);
  inputXyz.setValue('');

  var balanceFactor = kdt.balanceFactor();
  balanceFactorLabel.setValue(balanceFactor+'');

  jsonTextarea.setValue(jsonSerializer.serialize(kdt.toJSON()));
});
