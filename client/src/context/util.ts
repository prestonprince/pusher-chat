import { useContext } from "react";
import { PusherContext } from "./pusherContext";
import { PusherEventContext } from "./pusherEventContext";

export const usePusherContext = () => {
  const pusherContext = useContext(PusherContext);

  if (pusherContext === undefined) {
    throw new Error("hook must be within provider");
  }

  return pusherContext;
};

export const usePusherEventContext = () => {
  const pusherEventContext = useContext(PusherEventContext);

  if (pusherEventContext === undefined) {
    throw new Error("hook must be within provider");
  }

  return pusherEventContext;
};
