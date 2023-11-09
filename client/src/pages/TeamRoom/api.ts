import axios from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface StatusParams {
  messageId: string;
  status: string;
  readerId: string;
  senderId: string;
  teamId: string;
}

export interface NewMessageParams {
  messageContent: string;
  senderId: string;
  senderName: string;
}

export const QUERY_KEYS = {
  GET_TEAM_MESSAGES: "GET_TEAM_MESSAGES",
  GET_TEAM_MEMBERS: "GET_TEAM_MEMBERS",
};

export function useSendStatusUpdate() {
  return useMutation({
    mutationFn: (data: StatusParams) =>
      axios.patch(
        "http://localhost:3000/api/team/:id/messages/:messageId"
          .replace(":id", data.teamId)
          .replace(":messageId", data.messageId),
        {
          status: data.status,
          readerId: data.readerId,
          senderId: data.senderId,
        }
      ),
  });
}

export function useSendNewMessage(teamId: string) {
  return useMutation({
    mutationFn: (data: NewMessageParams) =>
      axios.post(
        "http://localhost:3000/api/team/:id/messages".replace(":id", teamId),
        data
      ),
  });
}

export function useGetTeamMessages(teamId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TEAM_MESSAGES, teamId],

    queryFn: () =>
      axios.get(
        "http://localhost:3000/api/team/:id/messages".replace(":id", teamId)
      ),
  });
}

export function useGetTeamMembers(teamId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TEAM_MEMBERS, teamId],

    queryFn: () =>
      axios.get(
        "http://localhost:3000/api/team/:id/members".replace(":id", teamId)
      ),
  });
}
