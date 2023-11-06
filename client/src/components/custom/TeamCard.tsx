import { useEffect, useState } from "react";
import { TTeamObj } from "@/pages/Dash/Dash";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { usePusherContext } from "@/context/util";
import { usePusherChannel } from "../hooks/pusherChannel";
import { TMessage } from "@/pages/TeamRoom/TeamRoom";
import { useSendStatusUpdate } from "@/pages/TeamRoom/api";

export interface TTeamCardProps {
  team: TTeamObj;
  handleTeamClick: (id: string) => void;
}

export const TeamCard = (props: TTeamCardProps) => {
  const { team, handleTeamClick } = props;
  const teamChannelName = `team-${team.teams.id}-messages`;

  const [lastMessage, setLastMessage] = useState<string>("last message");

  const { pusher } = usePusherContext();
  const channel = usePusherChannel(pusher, teamChannelName);
  const { mutate: sendDeliveredReceipt } = useSendStatusUpdate();

  useEffect(() => {
    if (channel) {
      channel.bind("new-message", (data: TMessage) => {
        setLastMessage(data.message);
        const statusParams = {
          id: team.teams.id,
          statusUpdates: [
            {
              status: "delivered",
              messageId: data.id,
              senderId: data.senderId,
            },
          ],
        };
        sendDeliveredReceipt(statusParams);
      });

      return () => {
        channel.unbind("new-message");
        channel.unsubscribe();
      };
    }
  }, [channel, sendDeliveredReceipt, team]);

  return (
    <Card key={team.teams.id}>
      <CardHeader>
        <CardTitle>{team.teams.name}</CardTitle>
        <CardDescription>
          <Button
            onClick={() => handleTeamClick(team.teams.id)}
            className="bg-pink_2 text-white rounded-lg h-5 hover:bg-pink_3"
          >
            Join Chat Room
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{lastMessage}</p>
      </CardContent>
    </Card>
  );
};
