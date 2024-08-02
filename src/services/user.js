import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;

const UserMobileOtp = async (phone) =>
  await axios.post(`${BASE}/phone/login`, phone);
const UserMobileVerify = async (data) =>
  await axios.post(`${BASE}/verify/phone/otp`, data);
const UserEmailOtp = async (email) =>
  await axios.post(`${BASE}/email/login`, email);
const UserEmailVerify = async (data) =>
  await axios.post(`${BASE}/verify/email/otp`, data);
const UserUpdateDetails = async (id, data, token) =>
  await axios.post(`${BASE}/user/update-details/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

const UserServiceOperations = {
  UserMobileOtp,
  UserEmailOtp,
  UserMobileVerify,
  UserEmailVerify,
  UserUpdateDetails,
};
export default UserServiceOperations;
