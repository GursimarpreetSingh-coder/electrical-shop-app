export function getAuthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-credential":
      "Email ya password galat hai. Password yaad nahi? Firebase se reset karo ya naya account banao.",
    "auth/wrong-password": "Password galat hai.",
    "auth/user-not-found":
      "Yeh email registered nahi hai. Neeche 'Create account' dabao.",
    "auth/email-already-in-use":
      "Email pehle se hai — Sign in karo.",
    "auth/weak-password": "Password kam se kam 6 characters hona chahiye.",
    "auth/too-many-requests": "Bahut try ho chuke. 5 minute baad dubara karo.",
    "auth/network-request-failed": "Internet check karo.",
    "auth/invalid-email": "Email format galat hai.",
  };
  return map[code] ?? `Login error: ${code}`;
}

export function parseFirebaseError(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    return getAuthErrorMessage(String((e as { code: string }).code));
  }
  if (e instanceof Error) return e.message;
  return "Login fail — dubara try karo";
}
