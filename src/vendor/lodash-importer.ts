import sortBy from 'lodash.sortby';
import xor from 'lodash.xor';

const lodash = { xor, sortBy };
declare const require: any;

if (!lodash.xor) {
    lodash.xor = require('lodash.xor');
}

if (!lodash.sortBy) {
    lodash.sortBy = require('lodash.sortby');
}

export default lodash;
