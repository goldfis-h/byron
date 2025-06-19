import SparkMD5 from 'spark-md5';

self.onmessage = (e: MessageEvent<{ file: File; chunkSize: number }>) => {
  const { file, chunkSize } = e.data;
  const fileReader = new FileReader();
  const spark = new SparkMD5.ArrayBuffer();
  let offset = 0;

  const loadNextChunk = () => {
    const fileSlice = file.slice(offset, offset + chunkSize);
    fileReader.readAsArrayBuffer(fileSlice);
  };

  fileReader.onload = (e) => {
    if (e.target?.result) {
      spark.append(e.target.result as ArrayBuffer);
    }
    offset += chunkSize;

    if (offset < file.size) {
      self.postMessage({ progress: Math.floor((offset / file.size) * 100) });
      loadNextChunk();
    } else {
      const hash = spark.end();
      self.postMessage({ hash, progress: 100 });
      self.close();
    }
  };

  fileReader.onerror = () => {
    self.postMessage({ error: fileReader.error?.message || 'Unknown error reading file' });
    self.close();
  };

  loadNextChunk();
};
