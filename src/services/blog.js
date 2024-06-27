import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const AllBlogs = () => axios.get(`${BASE}/all-blogs`);


const BlogServiceOperations = {
    AllBlogs
}

export default BlogServiceOperations