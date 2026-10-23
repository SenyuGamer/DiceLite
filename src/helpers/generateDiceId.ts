let counter = 0;

export function generateDiceId(): string {
  counter = (counter + 1) % 1000000;
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${counter}`;
}
