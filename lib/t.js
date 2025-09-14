const res = await fetch(
  "https://fc3e9f335ac4.ngrok-free.app/api/stream/H4GeS9CH7jM/"
);

console.log(res.status, res.statusText);
const text = await res.text(); // Don't use json()
console.log(text); // <-- This will print the HTML/error page
