import React, { createContext, useState, useEffect } from "react";
import Pusher, { PresenceChannel } from "pusher-js";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

interface PusherContextProviderProps {
  children: React.ReactElement;
  pusherKey: string;
}

interface PusherContextProps {
  pusher: Pusher | null;
  presenceChannel: PresenceChannel | null;
}

export const PusherContext = createContext<PusherContextProps>({
  pusher: null,
  presenceChannel: null,
});

export const PusherContextProvider = (
  props: PusherContextProviderProps
): React.ReactElement => {
  const [pusher, setPusher] = useState<Pusher | null>(null);
  const [presenceChannel, setPresenceChannel] =
    useState<PresenceChannel | null>(null);
  const { user, isLoading, isAuthenticated } = useKindeAuth();

  useEffect(() => {
    if (!isLoading && user && isAuthenticated) {
      const pusherInstance = new Pusher(props.pusherKey, {
        cluster: "mt1",
        userAuthentication: {
          endpoint: "http://localhost:3000/api/pusher/user-auth",
          transport: "ajax",
          params: {
            user: JSON.stringify(user),
          },
        },
        channelAuthorization: {
          endpoint: "http://localhost:3000/api/pusher/auth",
          transport: "ajax",
          params: {
            user: JSON.stringify(user),
          },
        },
      });

      pusherInstance.signin();

      const presenceChannel: PresenceChannel = pusherInstance.subscribe(
        "presence-chat"
      ) as PresenceChannel;

      setPusher(pusherInstance);
      setPresenceChannel(presenceChannel);
      console.log("connected to pusher");

      return () => {
        presenceChannel.disconnect();
        pusherInstance.disconnect();
        console.log("pusher disconnected");
      };
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <PusherContext.Provider value={{ pusher, presenceChannel }}>
      {props.children}
    </PusherContext.Provider>
  );
};
