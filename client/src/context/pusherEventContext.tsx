import { TMessage } from "@/pages/TeamRoom/TeamRoom";
import React, { createContext, useState, useEffect } from "react";
import { usePusherContext } from "./util";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

interface PusherEventContextProviderProps {
  children: React.ReactElement;
}

interface PusherEventContextProps {
  newMessage: TMessage | null;
}

export const PusherEventContext = createContext<PusherEventContextProps>({
  newMessage: null,
});

export const PusherEventContextProvider = (
  props: PusherEventContextProviderProps
) => {
  const [newMessage, setNewMessage] = useState<TMessage | null>(null);
  const { pusherInstance, teamChannels } = usePusherContext();

  const { isLoading, isAuthenticated, user } = useKindeAuth();

  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      if (pusherInstance && teamChannels) {
        for (const channel of Object.values(teamChannels)) {
          channel.bind("new-message", (data: TMessage) => {
            if (data.senderId !== user.id) setNewMessage(data);
          });
        }
      }
    }
  }, [pusherInstance, teamChannels, isAuthenticated, user, isLoading]);

  return (
    <PusherEventContext.Provider value={{ newMessage }}>
      {props.children}
    </PusherEventContext.Provider>
  );
};
