// Blog `category` arrives as a populated object ({ _id, title }) from
// /all-blogs but as a bare ObjectId string from /blog-slug and /blog/:id.
// These helpers make sure raw ids are never shown to readers.

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const isObjectId = (value) =>
  typeof value === "string" && OBJECT_ID_PATTERN.test(value.trim());

export const getCategoryId = (category) => {
  if (category && typeof category === "object") return category._id || null;
  return isObjectId(category) ? category.trim() : null;
};

// Human-readable category name, or "" when only an id is available.
export const getCategoryName = (category) => {
  if (!category) return "";
  if (typeof category === "object") {
    return String(category.title || category.name || "").trim();
  }
  if (typeof category === "string" && !isObjectId(category))
    return category.trim();
  return "";
};
