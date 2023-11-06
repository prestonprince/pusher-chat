/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { TTeamMember } from "./TeamMembers";
import { usePusherContext } from "@/context/util";

export interface TMemberProps {
  member: TTeamMember;
  userId: string | null;
}

export const Member = (props: TMemberProps) => {
  const [status, setStatus] = useState<string>("offline");
  const { presenceChannel } = usePusherContext();

  useEffect(() => {
    if (presenceChannel) {
      for (const memberId of Object.keys(presenceChannel.members.members)) {
        if (memberId === props.member.userId) {
          setStatus("online");
        }
      }
    }
  }, [presenceChannel, props.member.userId]);

  useEffect(() => {
    if (presenceChannel) {
      presenceChannel.bind("pusher:member_added", (data: any) => {
        if (data.id === props.member.userId) {
          setStatus("online");
        }
      });

      presenceChannel.bind("pusher:member_removed", (data: any) => {
        if (data.id === props.member.userId) {
          setStatus("offline");
        }
      });
    }
  }, [presenceChannel, props.member.userId]);

  return (
    <div>
      {props.member.userId === props.userId ? "me" : props.member.userId} -{" "}
      {status}
    </div>
  );
};
