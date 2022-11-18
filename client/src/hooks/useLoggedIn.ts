import { useEffect } from "react";
import axios from "axios";
import userStore from "../store/user.store";

export default function useLoggedIn() {
  const { isLoggedIn, userId, setUser } = userStore();

  useEffect(() => {
    axios.get("/auth/check").then((res) => {
      const { logined, user } = res.data;
      if (logined) {
        setUser(user);
      }
    });
  }, []);

  return [isLoggedIn, userId] as const;
}
