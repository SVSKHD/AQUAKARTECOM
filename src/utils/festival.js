export const getFestivalWish = () => {
  const date = new Date();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const year = date.getFullYear();

  // Helper to check date range
  const isDateInRange = (m, dStart, dEnd) =>
    month === m && day >= dStart && day <= dEnd;

  // New Year (Dec 28 - Jan 5)
  if ((month === 11 && day >= 28) || (month === 0 && day <= 5)) {
    return {
      id: "new-year",
      text: "Happy New Year!",
      subText: `Welcome ${year}`,
      longText: "Wishing you a sparkling Happy New Year! ✨",
      gradient: "from-rose-500 via-purple-500 to-indigo-500",
      icon: "✨",
      animation: "animate-pulse",
    };
  }

  // Makar Sankranti / Pongal (Jan 13 - 17)
  if (isDateInRange(0, 13, 17)) {
    return {
      id: "sankranti",
      text: "Happy Sankranti",
      subText: "Harvest & Joy",
      longText: "Wishing you abundance this Sankranti! 🌾",
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      icon: "🌾",
      animation: "animate-bounce",
    };
  }

  // Republic Day (Jan 24 - 27)
  if (isDateInRange(0, 24, 27)) {
    return {
      id: "republic-day",
      text: "Happy Republic Day",
      subText: "Jai Hind",
      longText: "Celebrating the spirit of India! 🇮🇳",
      gradient: "from-orange-500 via-white to-green-500", // Tricolor hint
      icon: "🇮🇳",
      animation: "animate-pulse",
    };
  }

  // Holi (March 3 - 5, 2026 approx)
  if (isDateInRange(2, 3, 5)) {
    return {
      id: "holi",
      text: "Happy Holi",
      subText: "Festival of Colors",
      longText: "May your life be filled with colors! 🎨",
      gradient: "from-pink-500 via-purple-500 to-yellow-500",
      icon: "🎨",
      animation: "animate-spin-slow",
    };
  }

  // Ugadi (March 18 - 20, 2026 approx)
  if (isDateInRange(2, 18, 20)) {
    return {
      id: "ugadi",
      text: "Happy Ugadi",
      subText: "New Beginnings",
      longText: "Wishing you a prosperous Ugadi! 🌿",
      gradient: "from-green-500 via-emerald-500 to-yellow-500",
      icon: "🌿",
      animation: "animate-bounce",
    };
  }

  // Independence Day (Aug 13 - 16)
  if (isDateInRange(7, 13, 16)) {
    return {
      id: "independence-day",
      text: "Happy Independence Day",
      subText: "Freedom & Pride",
      longText: "Saluting the nation! 🇮🇳",
      gradient: "from-orange-500 via-white to-green-500",
      icon: "🇮🇳",
      animation: "animate-pulse",
    };
  }

  // Ganesh Chaturthi (Sep 13 - 23, 2026 approx)
  if (isDateInRange(8, 13, 23)) {
    return {
      id: "ganesh-chaturthi",
      text: "Ganpati Bappa Morya",
      subText: "Festive Vibes",
      longText: "May Lord Ganesha bless you! 🐘",
      gradient: "from-red-500 via-orange-500 to-yellow-500",
      icon: "🐘",
      animation: "animate-bounce",
    };
  }

  // Dussehra (Oct 18 - 21, 2026 approx)
  if (isDateInRange(9, 18, 21)) {
    return {
      id: "dussehra",
      text: "Happy Dussehra",
      subText: "Victory of Good",
      longText: "Wishing you a joyous Dussehra! 🏹",
      gradient: "from-amber-500 via-orange-600 to-red-600",
      icon: "🏹",
      animation: "animate-pulse",
    };
  }

  // Diwali (Nov 6 - 10, 2026 approx)
  if (isDateInRange(10, 6, 10)) {
    return {
      id: "diwali",
      text: "Happy Diwali",
      subText: "Festival of Lights",
      longText: "Lighting up your life with joy! 🪔",
      gradient: "from-yellow-400 via-orange-500 to-red-500",
      icon: "🪔",
      animation: "animate-pulse",
    };
  }

  // Christmas (Dec 20 - 26)
  if (isDateInRange(11, 20, 26)) {
    return {
      id: "christmas",
      text: "Merry Christmas",
      subText: "Joy to the World",
      longText: "Wishing you a Merry Christmas! 🎄",
      gradient: "from-red-600 via-green-600 to-emerald-600",
      icon: "🎄",
      animation: "animate-bounce",
    };
  }

  return null;
};
