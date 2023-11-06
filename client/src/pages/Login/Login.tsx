import { Button } from "@/components/ui/button";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import "../../index.css";

export const Login = () => {
  const { isLoading, isAuthenticated, login, register } = useKindeAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <Progress value={66} />;
  }

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return <Progress value={66} />;
  }

  return (
    <div className="flex flex-row gap-2 h-screen w-screen justify-center items-center">
      <Button
        className={"text-white bg-primary rounded-md h-7 text-xs"}
        size={"sm"}
        onClick={() => login({})}
      >
        Login
      </Button>
      <Button
        className={"text-white bg-primary rounded-md h-7 text-xs"}
        size={"sm"}
        onClick={() => register({})}
      >
        Register
      </Button>
    </div>
  );
};
