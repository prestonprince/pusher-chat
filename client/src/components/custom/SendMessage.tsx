import { useSendNewMessage } from "@/pages/TeamRoom/api";
import { useToast } from "../ui/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TMessage } from "@/pages/TeamRoom/TeamRoom";
import { AxiosResponse } from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TSendMessageProps {
  teamId: string | undefined;
  userId: string | null;
  userName: string | null;
  teamMessagesQueryKey: (string | undefined)[];
}

export const SendMessage = (props: TSendMessageProps) => {
  const { teamId, userId, teamMessagesQueryKey } = props;
  const { mutate: sendMessage } = useSendNewMessage(teamId ?? "");
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState<string>("");
  const queryClient = useQueryClient();

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newMessage === "")
      return toast({
        title: "Message Error",
        description: "Cannot send an empty message",
      });

    sendMessage(
      {
        senderId: userId ?? "",
        messageContent: newMessage,
        senderName: props.userName ?? "",
      },
      {
        onSuccess: (response) => {
          setNewMessage("");
          const data: TMessage = response.data.message;
          queryClient.setQueryData(
            teamMessagesQueryKey,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (oldData: AxiosResponse<any, any>) => {
              return {
                ...oldData,
                data: { messages: [...oldData.data.messages, data] },
              };
            }
          );
        },
      }
    );
  };

  return (
    <form onSubmit={handleSendMessage}>
      <Input
        type="text"
        placeholder="Message"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <Button
        type="submit"
        className="bg-pink_2 hover:bg-pink_3 text-white rounded-md h-5"
      >
        Send
      </Button>
    </form>
  );
};
