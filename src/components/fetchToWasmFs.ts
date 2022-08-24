export const fetchToWasmFs = async (
  url: string,
  wasmFs: any
): Promise<void> => {
  const response = await fetch(url);
  const text = await response.text();
  wasmFs.volume.writeFileSync(`${url.split("/").pop()}`, text);
};
