import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const AllBlogs = () => axios.get(`${BASE}/all-blogs`);
const blogById = (id) => axios.get(`${BASE}/blog/${id}`);
const blogBySlug = (slug) => axios.get(`${BASE}/blog-slug/${slug}`);
const BlogServiceOperations = {
  AllBlogs,
  blogById,
  blogBySlug,
};

export default BlogServiceOperations;
