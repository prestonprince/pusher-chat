import React from "react";
import { Progress } from "../ui/progress";

export const ProgressBar = () => {
  const [progress, setProgress] = React.useState<number>(0);

  React.useEffect(() => {
    const timer = setInterval(
      () =>
        setProgress((prev) => {
          switch (prev) {
            case 0:
              return 55;
            case 55:
              return 75;
            case 75:
              return 99;
            default:
              return 0;
          }
        }),
      500
    );
    return () => clearInterval(timer);
  }, []);

  return <Progress value={progress} className="w-[60%]" />;
};
