import { useState, useEffect } from "react";
import Pusher, { Channel } from "pusher-js";

export function usePusherChannel(pusher: Pusher | null, channelName: string) {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (pusher) {
      const pusherChannel = pusher.subscribe(channelName);

      if (pusherChannel) setChannel(pusherChannel);
    }
  }, [pusher, channelName]);

  return channel;
}
