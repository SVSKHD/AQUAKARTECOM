import UserServiceOperations from "@/services/user";
import useDialog from "@/utils/dialog";
import { useState } from "react";
import { useDispatch } from "react-redux";

const AquaAuthMobileForm = ({ signup }) => {
  const [phone, setPhone] = useState("");
  const [otpShow, setOtpShow] = useState(false);
<<<<<<< Updated upstream
  const [otp, setOtp] = useState("");
  const { closeDialog } = useDialog();
=======
  const [otp, setOtp] = useState('');
  const {closeAuthDialog} = useDialog()
>>>>>>> Stashed changes
  const dispatch = useDispatch();

  const handleSubmit = (event) => {
    event.preventDefault();
    const phoneFormat = Number(phone);
    const otpFormat = Number(otp);
    const data = { phone: phoneFormat, otp: otpFormat };
    console.log(data);
    UserServiceOperations.UserMobileVerify(data)
      .then((res) => {
        console.log(res.data);
        dispatch({
          type: "SHOW_NOTIFICATION",
          payload: {
            message: "Verification successful",
            messageType: "success",
          },
        });
        dispatch({
<<<<<<< Updated upstream
          type: "LOGGED_IN_USER",
          payload: res,
        });
        closeDialog();
=======
          type:"LOGGED_IN_USER",
          payload:res
        })
        closeAuthDialog()
>>>>>>> Stashed changes
      })
      .catch((err) => {
        console.log(err);
        dispatch({
          type: "SHOW_NOTIFICATION",
          payload: {
            message: "Verification failed",
            messageType: "error",
          },
        });
      });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    if (value.length === 10) {
      UserServiceOperations.UserMobileOtp({ phone: value })
        .then((res) => {
          setOtpShow(true);
          dispatch({
            type: "SHOW_NOTIFICATION",
            payload: {
              message: "Successfully sent OTP",
              messageType: "success",
            },
          });
          dispatch({
            type: "SET_AUTH_STATUS_VISIBLE",
            payload: !res.data.userExist,
          });
        })
        .catch((err) => {
          console.log(err);
          setOtpShow(false);
          dispatch({
            type: "SHOW_NOTIFICATION",
            payload: {
              message: "Failed to send OTP",
              messageType: "error",
            },
          });
          dispatch({
            type: "SET_AUTH_STATUS_VISIBLE",
            payload: false,
          });
        });
    } else {
      setOtpShow(false);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Aquakart"
          src="https://res.cloudinary.com/aquakartproducts/image/upload/v1695408027/android-chrome-384x384_ijvo24.png"
          className="mx-auto h-20 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {signup ? "Sign up with phone" : "Sign in with phone"}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="phone-number"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Phone No
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                id="phone-number"
                name="phone-number"
                maxLength="10"
                type="number"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="000-00-00000"
                className="block w-full p-4 rounded-md border-0 py-1.5 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            {otpShow && (
              <div className="relative mt-2 rounded-md shadow-sm">
                <input
                  id="otp"
                  name="otp"
                  maxLength="6"
                  type="number"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="block w-full p-4 rounded-md border-0 py-1.5 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Please ensure your phone number is associated with WhatsApp.
            </p>
          </div>

          <div>
            <button
              type="submit"
              className={`mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                !otpShow
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
              disabled={!otpShow}
            >
              {signup ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AquaAuthMobileForm;
