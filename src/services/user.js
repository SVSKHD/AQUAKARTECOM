import axios from "axios"

const BASE = process.env.NEXT_PUBLIC_API_URL 

const userLoginWithPhone = () =>axios.post(`${BASE}/login/phone`)



const UserServiceOperations={
    userLoginWithPhone
}

export default UserServiceOperations