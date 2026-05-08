const path = require('path');
const qs = require(path.resolve(__dirname, '../../../workspaces/run-0013/qs'));

function hrtimeToMs(hr) {
  return (hr[0] * 1e3) + (hr[1] / 1e6);
}

function benchParse(iterations, input) {
  const start = process.hrtime();
  for (let i = 0; i < iterations; i++) {
    qs.parse(input);
  }
  const dur = process.hrtime(start);
  return hrtimeToMs(dur);
}

function benchStringify(iterations, input) {
  const start = process.hrtime();
  for (let i = 0; i < iterations; i++) {
    qs.stringify(input);
  }
  const dur = process.hrtime(start);
  return hrtimeToMs(dur);
}

const complexQuery = [];
for (let i = 0; i < 50; i++) {
  complexQuery.push(encodeURIComponent('a[' + i + '][b][c][]') + '=' + encodeURIComponent('value' + i + ',' + i));
}
const queryStr = complexQuery.join('&');

const complexObj = {};
for (let i = 0; i < 50; i++) {
  complexObj['a' + i] = { b: { c: Array.from({ length: 5 }, (_, k) => 'value' + i + '_' + k) } };
}

const iterations = 20000;
console.log('Node version:', process.version);
console.log('Iterations:', iterations);
console.log('Parsing benchmark: calling qs.parse on a complex query string');
const parseMs = benchParse(iterations, queryStr);
console.log('Total parse time (ms):', parseMs.toFixed(3));
console.log('Avg per parse (µs):', (parseMs * 1000 / iterations).toFixed(3));

console.log('\nStringify benchmark: calling qs.stringify on a complex object');
const strMs = benchStringify(iterations, complexObj);
console.log('Total stringify time (ms):', strMs.toFixed(3));
console.log('Avg per stringify (µs):', (strMs * 1000 / iterations).toFixed(3));

console.log('\nFinished benchmark');
