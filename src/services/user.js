import axios from "axios"

const userLoginWithPhone = () =>axios.post(`${BASE}/login/phone`)



const userServiceOperations={
    userLoginWithPhone
}

export default userServiceOperations