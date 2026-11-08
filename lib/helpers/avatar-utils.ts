/**
 * Generates a consistent color for a user based on their ID
 * Returns a gradient color pair for beautiful avatar backgrounds
 */
export function getUserAvatarColor(userId: string): {
  from: string;
  to: string;
} {
  // Hash the user ID to get a consistent number
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Define color spectrum pairs (from, to) for gradients
  const colorPairs = [
    { from: "from-blue-500", to: "to-purple-600" },
    { from: "from-purple-500", to: "to-pink-600" },
    { from: "from-pink-500", to: "to-rose-600" },
    { from: "from-rose-500", to: "to-orange-600" },
    { from: "from-orange-500", to: "to-amber-600" },
    { from: "from-amber-500", to: "to-yellow-600" },
    { from: "from-yellow-500", to: "to-lime-600" },
    { from: "from-lime-500", to: "to-green-600" },
    { from: "from-green-500", to: "to-emerald-600" },
    { from: "from-emerald-500", to: "to-teal-600" },
    { from: "from-teal-500", to: "to-cyan-600" },
    { from: "from-cyan-500", to: "to-sky-600" },
    { from: "from-sky-500", to: "to-blue-600" },
    { from: "from-indigo-500", to: "to-violet-600" },
    { from: "from-violet-500", to: "to-purple-600" },
    { from: "from-fuchsia-500", to: "to-pink-600" },
  ];

  // Use hash to select a color pair
  const index = Math.abs(hash) % colorPairs.length;
  return colorPairs[index];
}

/**
 * Gets user initials from name or email
 */
export function getUserInitials(
  name?: string | null,
  email?: string | null
): string {
  if (name && name.trim()) {
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    }
    return name[0].toUpperCase() + (name[1]?.toUpperCase() || "");
  }

  if (email) {
    const emailName = email.split("@")[0];
    return emailName[0].toUpperCase() + (emailName[1]?.toUpperCase() || "");
  }

  return "U";
}

/**
 * Gets display name from user data
 */
export function getUserDisplayName(
  name?: string | null,
  email?: string | null
): string {
  if (name && name.trim()) {
    return name;
  }
  if (email) {
    return email.split("@")[0];
  }
  return "User";
}
