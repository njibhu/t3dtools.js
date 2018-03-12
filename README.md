# T3DTOOLS.js

## COPYRIGHT: most of the code here is from [github.com/ahom](http://github.com/ahom),  [github.com/RequestTimeout408](http://github.com/RequestTimeout408), the squish library is licensed under MIT license by Simon Brown (si@sjbrown.co.uk) and my code here is public domain.

This is a port of the t3dgw2tools with emscripten.
Node example:

```javascript
const t3dtools = require('./t3dtools.js');
const fs = require('fs');
var test;
fs.readFile('chunk.packed', (err, data) => {
    if(err) throw data;
    test = data;
});
var data = t3dtools.inflate(test, testOutputSize);
```

## This is not some unworking code anymore ! Tested with Node and Firefox. Some changes since last attempt:
* Pepperjs is actually not such a good idea since it is unmaintained and both emscripten and the pepper API evolved.
* I dropped the interface compatibility with the old Nacl module, but it will allow better integration with Tyria3DLib.
* I'm currently working on a fork of Tyria3DLib to integrate it.
* The performance haven't been tested but it should be quite bad compared to the original version. But !
  there is a lot of work and optimizations that can be done which should make it even faster than the original.

## The copyright headers will be added very soon ! Don't yell at me please !
 