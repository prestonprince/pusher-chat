/* eslint-disable @typescript-eslint/no-explicit-any */
import { usePusherChannel } from "@/components/hooks/pusherChannel";
import { usePusherContext } from "@/context/util";
import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useEffect } from "react";
import {
  useGetTeamMembers,
  useGetTeamMessages,
  useSendStatusUpdate,
  QUERY_KEYS,
} from "./api";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { ProgressBar } from "@/components/custom/ProgressBar";
import { TeamMessagesBox } from "@/components/custom/TeamMessagesBox";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { SendMessage } from "@/components/custom/SendMessage";
import { TTeamMember, TeamMembers } from "@/components/custom/TeamMembers";

export interface TMessage {
  message: string;
  id: string;
  status: string;
  senderId: string;
  senderName: string;
}

export interface TStatusUpdate {
  status: string;
  senderId: string;
  id: string;
}

export interface TStatusUpdateList {
  updates: TStatusUpdate[];
}

export const TeamRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useKindeAuth();

  const { data: messageData, isLoading: isGettingMessages } =
    useGetTeamMessages(id ?? "");

  const { data: teamMembersData, isLoading: isGettingMembers } =
    useGetTeamMembers(id ?? "");

  const { mutate: sendReadReceipt } = useSendStatusUpdate();

  const teamMessagesQueryKey = useMemo(
    () => [QUERY_KEYS.GET_TEAM_MESSAGES, id],
    [id]
  );
  const teamChannelName = `team-${id}-messages`;

  const { pusher } = usePusherContext();
  const channel = usePusherChannel(pusher, teamChannelName);
  const queryClient = useQueryClient();

  useEffect(() => {
    const updatesArr: Record<string, string>[] = [];
    if (messageData && messageData.data.messages.length > 0) {
      for (const message of messageData.data.messages) {
        // send read receipts for all messages not read
        if (message.senderId !== user?.id && message.status !== "read") {
          updatesArr.push({
            status: "read",
            messageId: message.id,
            senderId: message.senderId,
          });
        }
      }
      sendReadReceipt({ id: id ?? "", statusUpdates: updatesArr });
    }
  }, [messageData, user, id, sendReadReceipt]);

  useEffect(() => {
    const updateMessageData =
      (newMessage: TMessage) => (oldData: AxiosResponse<any, any>) => {
        // Check if the message already exists
        if (
          !oldData.data.messages.some(
            (message: TMessage) => message.id === newMessage.id
          )
        ) {
          return {
            ...oldData,
            data: { messages: [...oldData.data.messages, newMessage] },
          };
        }
        // If the message already exists, return the old data
        return oldData;
      };
    const handleNewMessage = (data: TMessage) => {
      if (data.senderId !== user?.id) {
        queryClient.setQueryData(teamMessagesQueryKey, updateMessageData(data));
        const statusParams = {
          id: id ?? "",
          statusUpdates: [
            { status: "read", messageId: data.id, senderId: data.senderId },
          ],
        };
        sendReadReceipt(statusParams);
      }
    };

    if (channel) {
      channel.bind("new-message", handleNewMessage);

      return () => {
        channel.unbind("new-message");
        channel.unsubscribe();
      };
    }
  }, [channel, user, queryClient, teamMessagesQueryKey, sendReadReceipt, id]);

  if (!user || !isAuthenticated) {
    navigate("/login", { replace: true });

    return (
      <div className="flex h-screen justify-center items-center">
        <ProgressBar />
      </div>
    );
  }

  if (
    !messageData ||
    isGettingMessages ||
    !teamMembersData ||
    isGettingMembers
  ) {
    return (
      <div className="h-screen flex justify-center items-center">
        <ProgressBar />
      </div>
    );
  }

  const teamMembers: TTeamMember[] = teamMembersData.data.teamMembers;
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3">
      <TeamMembers userId={user.id} teamMembers={teamMembers} />
      <TeamMessagesBox userId={user.id} messages={messageData.data.messages} />
      <SendMessage
        teamId={id}
        userId={user.id}
        userName={user.given_name}
        teamMessagesQueryKey={teamMessagesQueryKey}
      />
    </div>
  );
};
