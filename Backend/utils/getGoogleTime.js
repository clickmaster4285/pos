// utils/getGoogleTime.js
export async function getGoogleTime() {
  try {
    const res = await fetch("https://www.google.com", { method: "HEAD" });
    const dateHeader = res.headers.get("date");

    if (!dateHeader) {
      throw new Error("Date header not found");
    }

    return new Date(dateHeader); // returns a Date object
  } catch (err) {
    console.error("Error fetching Google time:", err);
    return null;
  }
}
