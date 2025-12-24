export function* anionmationLoader() {
  const loader = ["⢿", "⣻", "⣽", "⣾", "⣷", "⣯", "⣟", "⡿"];
  let step = 0;
  while (true) {
    yield loader[step++ % loader.length];
  }
}
