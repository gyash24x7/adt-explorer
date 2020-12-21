import ReactDOM from "react-dom";
import React from "react";
import { Customizations, initializeIcons } from "@fluentui/react";

import { darkFabricTheme } from "./theme/DarkFabricTheme";
import "./index.scss";
import { AppRoutes } from "./routes";

initializeIcons();
Customizations.applySettings({ theme: darkFabricTheme });

ReactDOM.render(<AppRoutes />, document.getElementById("root"));
