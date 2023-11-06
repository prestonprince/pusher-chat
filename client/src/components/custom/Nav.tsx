import { Button } from "../ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import "../../index.css";

export const Nav = () => {
  const { logout } = useKindeAuth();

  return (
    <div className="flex flex-row gap-2 items-center w-screen justify-center mt-1">
      <h1>Pusher Chat</h1>
      <Button
        onClick={logout}
        className="bg-grey_7 hover:bg-black rounded-md h-5 text-white text-xs justify-self-end"
      >
        Logout
      </Button>
    </div>
  );
};
