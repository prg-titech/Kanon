describe('Array', () => {
    describe('#indexOf()', () => {
        it('should return -1 when the value is not present', () => {
            assert.equal(-1, [1,2,3].indexOf(4));
            [1,2,3].indexOf(0).should.equal(-1);
        });
    });
    describe('#push()', () => {
        it('hogehoge', () => {
            var arr = [2,3,4];
            arr.push(5);
            assert.equal(3, arr.indexOf(5));
        });
        it('fugafuga', () => {
            var arr = [2,3,4];
            var arr2 = [2,3,4];
            assert.equal(arr[0], arr2[0]);
            assert.equal(arr[1], arr2[1]);
            assert.equal(arr[2], arr2[2]);
        });
    });
});

describe('')
