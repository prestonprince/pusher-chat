import { useContext } from "react";
import { PusherContext } from "./pusherContext";

export const usePusherContext = () => {
  const pusherContext = useContext(PusherContext);

  if (pusherContext === undefined) {
    throw new Error("hook must be within provider");
  }

  return pusherContext;
};
