export const loadImage = async (src: string) => {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (event) => reject(typeof event === "string" ? new Error(event) : new Error());
    image.src = src;
  });
  return image;
};

export const loadJSON = async <Result>(path: string): Promise<Result> => {
  const response = await fetch(path);
  const json: unknown = await response.json();
  return json as never;
};
