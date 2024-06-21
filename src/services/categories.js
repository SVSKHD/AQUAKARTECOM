import axios from "axios"

const BASE = process.env.NEXT_PUBLIC_API_URL 

const Allcategories = () =>axios.get(`${BASE}/allcategories`)
const CategoryById = (id)=>axios.get(`${BASE}/categtory/${id}`)


const CategoryServiceOperations={
Allcategories,
CategoryById
}
export default CategoryServiceOperations