export function sum(data: Uint8Array): i32 {
  let total: i32 = 0;

  for (let i = 0; i < data.length; i++) {
    total += data[i];
  }

  return total;
}
