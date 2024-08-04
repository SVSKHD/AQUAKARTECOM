import React from "react";

const AquaInput = ({
  id,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  label,
  maxLength,
}) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium leading-6 text-gray-900"
      >
        {label}
      </label>
      <div className="mt-2">
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          maxLength={maxLength}
          className="block w-full rounded-md border-0 p-3 py-2 bg-white text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  );
};

export default AquaInput;
