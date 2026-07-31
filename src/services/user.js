import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

const getServerMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.msg ||
  error?.message;

const isAuthFailure = (error) => {
  const status = error?.response?.status;
  const message = `${getServerMessage(error) || ""}`.toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    message.includes("token is not valid") ||
    message.includes("invalid token") ||
    message.includes("jwt")
  );
};

const throwAuthError = (error) => {
  throw {
    message: SESSION_EXPIRED_MESSAGE,
    authError: true,
    status: error?.response?.status,
  };
};

const UserMobileOtp = async (phone) =>
  await axios.post(`${BASE}/phone/login`, phone);
const UserMobileVerify = async (data) =>
  await axios.post(`${BASE}/verify/phone/otp`, data);
const UserEmailOtp = async (email) =>
  await axios.post(`${BASE}/email/login`, email);
const UserEmailVerify = async (data) =>
  await axios.post(`${BASE}/verify/email/otp`, data);
const UserUpdateDetails = async (id, data, token) => {
  try {
    return await axios.post(`${BASE}/user/update-details/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    if (isAuthFailure(error)) {
      throwAuthError(error);
    }

    throw error;
  }
};

const UserServiceOperations = {
  UserMobileOtp,
  UserEmailOtp,
  UserMobileVerify,
  UserEmailVerify,
  UserUpdateDetails,
};
export default UserServiceOperations;
