import { useState } from 'react';

const AquaAuthMobileForm = ({ signup }) => {
  const [phone, setPhone] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    // Add your signup/signin logic here
    if (signup) {
      console.log('Signing Up with phone:', phone);
    } else {
      console.log('Signing In with phone:', phone);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {signup ? 'Sign up with phone' : 'Sign in with phone'}
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone-number" className="block text-sm font-medium leading-6 text-gray-900">
              Phone No
            </label>
            <div className="relative mt-2 rounded-md shadow-sm">
              <input
                id="phone-number"
                name="phone-number"
                maxLength="10"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="000-00-0000"
                className="block w-full rounded-md border-0 py-1.5 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {signup ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AquaAuthMobileForm;
