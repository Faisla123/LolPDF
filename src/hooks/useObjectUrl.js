import { useEffect, useState } from 'react';

// Creates a blob URL inside the effect and revokes it in the cleanup. Creating it during render
// (useMemo) breaks under React StrictMode: the cleanup revokes the URL, the memo keeps the dead
// one, and the image shows as broken.
export function useObjectUrl(blob) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) { setUrl(''); return undefined; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function useObjectUrls(blobs) {
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const list = blobs.map((b) => URL.createObjectURL(b));
    setUrls(list);
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, [blobs]);
  return urls;
}
