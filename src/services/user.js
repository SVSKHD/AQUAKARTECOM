import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const UserLoginWithPhone = (number) =>
  axios.post(`${BASE}/login/phone`, number);
const UserSignpWithPhone = (number) =>
  axios.post(`${BASE}/signup/phone`, number);
const UserLogin = (data) => axios.post(`${BASE}/login`, data);
const UserSignup = (data) => axios.post(`${BASE}/signup`, data);
const UserDetails = (data) => axios.post(`${BASE}/user/update`, data);
const UserForgotPassword = (otp, password) =>
  axios.post(`${BASE}/forgot-password`);

const UserServiceOperations = {
  UserLoginWithPhone,
  UserSignpWithPhone,
  UserLogin,
  UserSignup,
  UserDetails,
  UserForgotPassword,
};

export default UserServiceOperations;
