import ndarray from 'ndarray';
import tensor from '../src/lib/cspTensor.js';
import assert from 'node:assert/strict';
for (const shape of [[2,3,4],[1,3,2,4],[4,3,1]]) {
 const size=shape.reduce((a,b)=>a*b,1),a=new Float32Array(size),b=new Float32Array(size);
 const ref=ndarray(a,shape), actual=tensor(b,shape);
 const visit=(coords=[])=>{ if(coords.length===shape.length) { const n=coords.reduce((v,x)=>v*7+x,1);ref.set(...coords,n);actual.set(...coords,n);assert.equal(actual.get(...coords),ref.get(...coords));return; }for(let i=0;i<shape[coords.length];i++)visit([...coords,i]); };
 visit();assert.deepEqual(a,b);assert.deepEqual(ref.stride,actual.stride);assert.equal(actual.size,ref.size);
}
console.log('PASS static adapter matches contiguous ndarray get/set/stride for 3D and 4D image tensors');
