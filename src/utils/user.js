const extractAndCapitalize = (word) => {
    // Check if the input is a non-empty string
    if (typeof word !== 'string' || word.length === 0) {
      throw new Error('Input must be a non-empty string');
    }
  
    // Split the word into parts based on uppercase letters
    const parts = word.split(/(?=[A-Z])/);
  
    // Extract the first letter of each part and capitalize it
    const initials = parts.map(part => part[0].toUpperCase()).join('');
  
    return initials;
  }
  

  const userUtils={
    extractAndCapitalize
  }

export default userUtils 