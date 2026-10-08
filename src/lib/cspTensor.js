// Static row-major tensor view for IMG.LY's image decode/resize/inference path.
// This adapter replaces only its bundled ndarray calls during the Vite build.
// It does not implement ndarray's slicing or transpose API, which that path does not use.
export default function cspTensor(data, shape) {
  const stride = new Array(shape.length);
  let size = 1;
  for (let i = shape.length - 1; i >= 0; i--) { stride[i] = size; size *= shape[i]; }
  const index = (indices) => indices.reduce((offset, n, i) => offset + n * stride[i], 0);
  return {
    data, shape: [...shape], stride, offset: 0, size, dimension: shape.length,
    get(...indices) { return data[index(indices)]; },
    set(...args) { const value = args.pop(); data[index(args)] = value; return value; },
  };
}
