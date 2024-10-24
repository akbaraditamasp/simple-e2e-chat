import Alpine from "alpinejs";

Alpine.store("generateRandomPastelColor", () => {
  const r = Math.floor(Math.random() * 128 + 127); // Membatasi nilai ke rentang pastel (127-255)
  const g = Math.floor(Math.random() * 128 + 127);
  const b = Math.floor(Math.random() * 128 + 127);

  return `rgb(${r}, ${g}, ${b})`;
});
