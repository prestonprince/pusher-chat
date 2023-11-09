import React, { createContext, useState, useEffect } from "react";
import Pusher, { PresenceChannel, Channel } from "pusher-js";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

interface PusherContextProviderProps {
  children: React.ReactElement;
  pusherKey: string;
}

interface PusherContextProps {
  pusherInstance: Pusher | null;
  presenceChannel: PresenceChannel | null;
  teamChannels: Record<string, Channel> | null;
}

export const PusherContext = createContext<PusherContextProps>({
  pusherInstance: null,
  presenceChannel: null,
  teamChannels: null,
});

export const PusherContextProvider = (
  props: PusherContextProviderProps
): React.ReactElement => {
  const [pusherInstance, setPusher] = useState<Pusher | null>(null);
  const [presenceChannel, setPresenceChannel] =
    useState<PresenceChannel | null>(null);
  const [teamChannels, setTeamChannels] = useState<Record<
    string,
    Channel
  > | null>(null);

  const { user, isLoading, isAuthenticated } = useKindeAuth();

  useEffect(() => {
    if (!isLoading && user && isAuthenticated) {
      const thisInstance = new Pusher(props.pusherKey, {
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

      thisInstance.signin();
      const thisPresenceChannel: PresenceChannel = thisInstance.subscribe(
        "presence-chat"
      ) as PresenceChannel;

      const teamChannels: Record<string, Channel> = {};

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      thisInstance.bind("pusher:signin_success", (data: any) => {
        const payload = JSON.parse(data.user_data);

        setPusher(thisInstance);
        setPresenceChannel(thisPresenceChannel);

        for (const id of payload.user_info.teamIds) {
          const teamChannel = thisInstance.subscribe(`team-${id}-messages`);
          teamChannels[id] = teamChannel;
        }

        setTeamChannels(teamChannels);

        console.log("connected to pusher");
      });

      return () => {
        for (const channel of Object.values(teamChannels)) {
          channel.unsubscribe();
        }
        thisPresenceChannel.disconnect();
        thisInstance.disconnect();

        console.log("pusher disconnected");
      };
    }
  }, [isAuthenticated, isLoading, user, props.pusherKey]);

  return (
    <PusherContext.Provider
      value={{ pusherInstance, presenceChannel, teamChannels }}
    >
      {props.children}
    </PusherContext.Provider>
  );
};
