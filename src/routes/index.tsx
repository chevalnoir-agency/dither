import { ToolcraftApp } from "@/toolcraft/runtime/react";
import type { ToolcraftPanelActionHandler } from "@/toolcraft/runtime/react";

import {
  exportAsciiImage,
  exportAsciiSvg,
  exportAsciiVideo,
} from "../app/ascii-export";
import { AsciiPatternRenderer } from "../app/ascii-pattern-renderer";
import { appSchema } from "../app/app-schema";

const handlePanelAction: ToolcraftPanelActionHandler = ({
  action,
  reportProgress,
  state,
}) => {
  if (action.value === "export.svg") {
    return exportAsciiSvg(state, reportProgress);
  }

  if (action.value === "export.png") {
    return exportAsciiImage(state, reportProgress);
  }

  if (action.value === "export.video") {
    return exportAsciiVideo(state, reportProgress);
  }

  return undefined;
};

export function AppHome(): React.JSX.Element {
  return (
    <ToolcraftApp
      canvasContent={<AsciiPatternRenderer />}
      className="h-dvh min-h-dvh"
      onPanelAction={handlePanelAction}
      renderDefaultCanvasMedia={false}
      schema={appSchema}
    />
  );
}
