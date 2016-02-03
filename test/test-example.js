var assert = require('assert');
var should = require('should');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(5));
      var a = {'hello': 'world'};
      a.should.have.property('hello', 'world');
      var b = 2;
      a.should.be.ok();
      var c = null;
      should(c).not.be.ok();
      var d = 2;
      d.should.equal(1+1);
    });
  });
});
