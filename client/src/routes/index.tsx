import React from "react";
import { RouteComponentProps, Router } from "@reach/router";
import { Explorer } from "./Explorer";
import { Home } from "./Home";

const HomePage = (_props: RouteComponentProps) => <Home />;

const AdtExplorerPage = (_props: RouteComponentProps) => <Explorer />;

export const AppRoutes = () => {
	return (
		<Router>
			<HomePage path="/" />
			<AdtExplorerPage path="/explorer" />
		</Router>
	);
};
