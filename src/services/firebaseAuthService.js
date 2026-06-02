import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import { firebaseAuth } from "@/config/firebase.config";

/**
 * Register bằng Firebase Email/Password + gửi email verification.
 */
export const firebaseRegister = async ({ email, password, fullName }) => {
  try {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    const firebaseUser = credential.user;

    if (fullName) {
      await updateProfile(firebaseUser, {
        displayName: fullName,
      });
    }

    await sendEmailVerification(firebaseUser);

    const idToken = await firebaseUser.getIdToken(true);

    return {
      firebaseUser,
      idToken,
    };
  } catch (error) {
    console.error("Firebase register error:", error);
    throw error;
  }
};

/**
 * Gửi lại email xác minh cho user hiện tại.
 */
export const resendFirebaseEmailVerification = async () => {
  try {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser) {
      throw new Error("Không tìm thấy Firebase user hiện tại.");
    }

    await sendEmailVerification(currentUser);

    return true;
  } catch (error) {
    console.error("Resend Firebase email verification error:", error);
    throw error;
  }
};

/**
 * Login bằng Firebase Email/Password.
 */
export const firebaseLogin = async (email, password) => {
  try {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );

    const firebaseUser = credential.user;
    const idToken = await firebaseUser.getIdToken(true);

    return {
      firebaseUser,
      idToken,
    };
  } catch (error) {
    console.error("Firebase login error:", error);
    throw error;
  }
};

/**
 * Forgot password bằng Firebase.
 * Firebase sẽ gửi link đặt lại mật khẩu về email.
 */
export const firebaseForgotPassword = async (email) => {
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    return true;
  } catch (error) {
    console.error("Firebase forgot password error:", error);
    throw error;
  }
};

/**
 * Logout Firebase.
 */
export const firebaseLogout = async () => {
  try {
    await signOut(firebaseAuth);
    return true;
  } catch (error) {
    console.error("Firebase logout error:", error);
    throw error;
  }
};

/**
 * Lắng nghe trạng thái login Firebase.
 */
export const listenFirebaseAuthState = (callback) => {
  return onAuthStateChanged(firebaseAuth, callback);
};

/**
 * Lấy token mới từ user hiện tại.
 */
export const getCurrentFirebaseToken = async (forceRefresh = true) => {
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser) {
    return null;
  }

  return await currentUser.getIdToken(forceRefresh);
};