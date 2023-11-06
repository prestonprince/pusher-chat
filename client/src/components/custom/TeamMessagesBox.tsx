import "../../index.css";
import { TMessage } from "@/pages/TeamRoom/TeamRoom";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useEffect, useRef } from "react";
import { Message } from "./Message";

export interface TTeamMessagesBoxProps {
  messages: TMessage[];
  userId: string | null;
}

export const TeamMessagesBox = (props: TTeamMessagesBoxProps) => {
  const { messages } = props;
  const endOfMessagesRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ScrollArea className="rounded-md border flex flex-col gap-2 h-96 w-85">
      {messages.length > 0
        ? messages.map((message) => (
            <Message key={message.id} message={message} userId={props.userId} />
          ))
        : null}
      <div ref={endOfMessagesRef} />
      <ScrollBar />
    </ScrollArea>
  );
};
