import { ObjectId, type Collection, type Document, type Filter } from "mongodb";

export const MANAGER_EMAIL = "aditya.tambe.professional31@gmail.com";
export const TENANT_EMAIL = "tambeaditya22@gmail.com";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function authUserFilterById(userId: string): Filter<Document> {
  const filters: Filter<Document>[] = [{ id: userId }];
  if (ObjectId.isValid(userId)) filters.push({ _id: new ObjectId(userId) });
  return filters.length === 1 ? filters[0] : { $or: filters };
}

export async function findAuthUserById(
  users: Collection<Document>,
  userId: string,
) {
  return users.findOne(authUserFilterById(userId));
}

export function authUserId(user: Document): string {
  if (typeof user.id === "string" && user.id) return user.id;
  return String(user._id);
}
