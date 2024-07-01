const formatCurrencyINR = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };
  

  const formatCurrencyINRWithK = (value) => {
    if (value >= 1000) {
      const formattedValue = (value / 1000) 
      return `₹${formattedValue}K`;
    }
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
  };


const useProduct = {
   formatCurrencyINR,
   formatCurrencyINRWithK
}

export default useProduct