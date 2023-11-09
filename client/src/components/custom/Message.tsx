import { TMessage, TStatusUpdate } from "@/pages/TeamRoom/TeamRoom";
import { usePusherContext } from "@/context/util";
import { usePusherChannel } from "../hooks/pusherChannel";
import { useEffect, useState } from "react";
import "../../index.css";

export interface TMessageProps {
  message: TMessage;
  userId: string | null;
}

export const Message = (props: TMessageProps) => {
  const { message } = props;
  const [status, setStatus] = useState<string>(message.status);
  const { pusherInstance } = usePusherContext();
  const channel = usePusherChannel(pusherInstance, `message-${message.id}`);

  useEffect(() => {
    if (channel) {
      channel.bind("status-update", (data: TStatusUpdate) => {
        setStatus(data.status);
      });

      return () => {
        channel.unbind("status-update");
        channel.unsubscribe();
      };
    }
  }, [channel]);

  return (
    <div
      className={`${
        message.senderId === props.userId
          ? "bg-blue_3 border-b w-80"
          : "bg-error border-b w-80"
      }`}
    >
      <p>
        {message.senderId !== props.userId
          ? `${message.senderName}: `
          : "You: "}
      </p>
      <p>
        {message.message}
        {message.senderId === props.userId ? " -" + status : null}
      </p>
    </div>
  );
};
